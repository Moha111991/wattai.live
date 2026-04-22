"""
ISO 21434-Compliant Tamper-Proof Audit Logging
Production-grade implementation with SQLAlchemy connection pooling
"""

import hashlib
import json
import threading
from datetime import datetime
from typing import Dict, Any, Optional
import logging
import os

try:
    from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text  # Index entfernt
    from sqlalchemy.orm import declarative_base, sessionmaker, Session
    from sqlalchemy.pool import QueuePool
    from sqlalchemy.exc import SQLAlchemyError
    SQLALCHEMY_AVAILABLE = True
except Exception:
    # SQLAlchemy is optional for local/dev runs. Provide a file-backed
    # fallback so audit logging still works when SQLAlchemy isn't installed.
    SQLALCHEMY_AVAILABLE = False
    create_engine = None
    declarative_base = None
    sessionmaker = None
    Session = None
    QueuePool = None
    SQLAlchemyError = Exception

# Configure standard Python logger
logger = logging.getLogger(__name__)

if SQLALCHEMY_AVAILABLE:
    Base = declarative_base()


    class AuditLogModel(Base):
        """SQLAlchemy model for audit_logs table"""
        __tablename__ = 'audit_logs'
        
        id = Column(Integer, primary_key=True)
        timestamp = Column(DateTime, nullable=False)
        event_type = Column(String(50), nullable=False, index=True)
        user_id = Column(String(255), nullable=False, index=True)
        action = Column(String(255), nullable=False)
        details = Column(Text, nullable=True)
        ip_address = Column(String(45), nullable=False)
        previous_hash = Column(String(64), nullable=False)
        hash = Column(String(64), nullable=False, unique=True)
        created_at = Column(DateTime, default=datetime.utcnow)
else:
    # Fallback: write JSON lines to a file under data/audit_logs.jsonl
    AUDIT_FALLBACK_FILE = os.path.join(os.path.dirname(__file__), "../data/audit_logs.jsonl")
    # Ensure directory exists
    try:
        os.makedirs(os.path.dirname(AUDIT_FALLBACK_FILE), exist_ok=True)
    except Exception:
        pass


class AuditLogEntry:
    """
    Tamper-proof audit log entry
    Each entry contains hash of previous entry (blockchain-style)
    """
    
    def __init__(
        self,
        event_type: str,
        user_id: str,
        action: str,
        details: Dict[str, Any],
        ip_address: str,
        previous_hash: str = "0" * 64,
        timestamp: Optional[datetime] = None
    ):
        # Use provided timestamp or current time
        self.timestamp = timestamp if timestamp is not None else datetime.utcnow()
        self.event_type = event_type
        self.user_id = user_id
        self.action = action
        self.details = details
        self.ip_address = ip_address
        self.previous_hash = previous_hash
        
        # Compute hash of this entry (AFTER all fields set)
        self.hash = self._compute_hash()
    
    def _compute_hash(self) -> str:
        """
        Compute SHA-256 hash of log entry
        Includes previous_hash to create chain
        """
        entry_data = {
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type,
            "user_id": self.user_id,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "previous_hash": self.previous_hash
        }
        
        canonical_json = json.dumps(entry_data, sort_keys=True)
        return hashlib.sha256(canonical_json.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type,
            "user_id": self.user_id,
            "action": self.action,
            "details": self.details,
            "ip_address": self.ip_address,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }


class SecureAuditLogger:
    """
    Production-grade tamper-proof audit logging system
    
    Features:
    - SQLAlchemy connection pooling (thread-safe)
    - Only updates hash chain after successful DB commit
    - Automatic reconnection handling
    - Thread-safe singleton pattern
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._hash_lock = threading.Lock()
        self._last_hash = "0" * 64
        self._engine = None
        self._session_maker = None
        
        self._initialize_db()
    
    def _initialize_db(self):
        """Initialize SQLAlchemy engine with connection pooling"""
        database_url = os.getenv("DATABASE_URL")
        # If SQLAlchemy is unavailable, use a file-backed fallback so the
        # module doesn't crash at import time and auditing still works.
        if not SQLALCHEMY_AVAILABLE:
            # initialize file fallback
            try:
                self._use_file = True
                self._audit_file = AUDIT_FALLBACK_FILE
                # ensure file exists
                open(self._audit_file, "a").close()
                self._last_hash = self._get_last_hash_from_db()
                logger.info(f"Audit logging initialized in file-fallback mode (last_hash: {self._last_hash[:16]}...)")
            except Exception as e:
                logger.error(f"Failed to initialize file-backed audit logging: {e}")
                self._use_file = False
            return

        # If SQLAlchemy is available, prefer DATABASE_URL, but default to a
        # local SQLite file so DB-backed mode works out-of-the-box for dev.
        if not database_url:
            # Use a local SQLite DB file by default so developers don't need
            # to configure an external DB immediately. For production, set
            # DATABASE_URL to a durable Postgres/Managed DB and secure access.
            db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/audit_logs.db"))
            try:
                os.makedirs(os.path.dirname(db_file), exist_ok=True)
            except Exception:
                pass
            database_url = f"sqlite:///{db_file}"
            logger.info(
                f"DATABASE_URL not set - falling back to SQLite DB at {db_file!r} for audit logging."
            )

        try:
            # Create engine with connection pool
            # QueuePool: Thread-safe connection pooling
            self._engine = create_engine(
                database_url,
                poolclass=QueuePool,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,  # Verify connections before using
                pool_recycle=3600,   # Recycle connections after 1 hour
                echo=False
            )
            
            # Create session maker
            self._session_maker = sessionmaker(bind=self._engine)
            
            # Create tables if not exist
            Base.metadata.create_all(self._engine)
            # Remember the database URL used (for diagnostics)
            self._database_url = database_url

            # If a JSONL fallback exists and DB is empty, import entries
            try:
                self._import_jsonl_to_db()
            except Exception as e:
                logger.exception(f"Audit JSONL -> DB import failed: {e}")

            # Get last hash from database after any import
            self._last_hash = self._get_last_hash_from_db()

            logger.info(
                f"Audit logging initialized with SQLAlchemy pool "
                f"(last_hash: {self._last_hash[:16]}..., db={self._mask_database_url(self._database_url)})"
            )
        
        except Exception as e:
            logger.error(f"Failed to initialize audit logging: {e}")
            self._engine = None
            self._session_maker = None
    
    def _get_last_hash_from_db(self) -> str:
        """Retrieve the last hash from database (thread-safe)"""
        # File-backed fallback
        if getattr(self, "_use_file", False):
            try:
                if not os.path.exists(AUDIT_FALLBACK_FILE):
                    return "0" * 64
                # read last non-empty line
                last = None
                with open(AUDIT_FALLBACK_FILE, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        last = line
                if not last:
                    return "0" * 64
                obj = json.loads(last)
                return obj.get("hash", "0" * 64)
            except Exception as e:
                logger.error(f"Failed to read fallback audit file: {e}")
                return "0" * 64

        # DB-backed retrieval
        if not self._session_maker:
            return "0" * 64

        try:
            session: Any = self._session_maker()
            try:
                last_entry = session.query(AuditLogModel).order_by(
                    AuditLogModel.id.desc()
                ).first()
                
                if last_entry:
                    return str(last_entry.hash)
                return "0" * 64
            finally:
                session.close()
        
        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve last hash: {e}")
            return "0" * 64

    def _mask_database_url(self, url: str) -> str:
        """Return a masked version of the database URL for logging.

        - For sqlite return the URL as-is (it's a local file path).
        - For URLs with credentials (user:pass@host) mask the password.
        """
        try:
            if not url:
                return "(none)"
            if url.startswith("sqlite"):
                # Show sqlite path (it's local), keep as-is
                return url
            # Generic masking: hide password if present
            if "://" in url:
                scheme, rest = url.split("://", 1)
                if "@" in rest:
                    creds, hostpart = rest.split("@", 1)
                    if ":" in creds:
                        user, _pwd = creds.split(":", 1)
                        creds_mask = f"{user}:***"
                    else:
                        creds_mask = "***"
                    return f"{scheme}://{creds_mask}@{hostpart}"
            return url
        except Exception:
            return "(masked)"

    def _import_jsonl_to_db(self) -> None:
        """Idempotent import of legacy JSONL audit file into DB.

        Only runs if the fallback JSONL exists and the DB table is empty.
        After a successful import the JSONL file is archived (renamed).
        """
        # Only proceed if fallback file exists
        try:
            fallback = AUDIT_FALLBACK_FILE if 'AUDIT_FALLBACK_FILE' in globals() else None
            if not fallback or not os.path.exists(fallback):
                return

            # Ensure DB session maker exists
            if not self._session_maker:
                return

            session: Any = self._session_maker()
            try:
                count = session.query(AuditLogModel).count()
                if count > 0:
                    logger.info("Audit DB already contains entries; skipping JSONL import.")
                    return

                logger.info("Legacy audit JSONL found - importing into DB...")

                imported = 0
                with open(fallback, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                        except Exception:
                            logger.warning("Skipping malformed audit JSONL line during import")
                            continue

                        # Parse timestamp
                        ts = obj.get('timestamp')
                        try:
                            timestamp = datetime.fromisoformat(ts) if ts else datetime.utcnow()
                        except Exception:
                            timestamp = datetime.utcnow()

                        details = obj.get('details')
                        try:
                            db_entry = AuditLogModel(
                                timestamp=timestamp,
                                event_type=str(obj.get('event_type') or 'UNKNOWN'),
                                user_id=str(obj.get('user_id') or 'unknown'),
                                action=str(obj.get('action') or ''),
                                details=json.dumps(details) if details is not None else None,
                                ip_address=str(obj.get('ip_address') or 'unknown'),
                                previous_hash=str(obj.get('previous_hash') or ('0'*64)),
                                hash=str(obj.get('hash') or ('0'*64)),
                            )
                            session.add(db_entry)
                            session.commit()
                            imported += 1
                        except SQLAlchemyError as e:
                            try:
                                session.rollback()
                            except Exception:
                                pass
                            logger.error(f"Failed to import audit entry (hash={obj.get('hash')[:16]}...): {e}")
                            # continue with next entry
                            continue

                # Archive the fallback file to avoid re-import
                try:
                    archive = f"{fallback}.imported.{int(datetime.utcnow().timestamp())}"
                    os.rename(fallback, archive)
                    logger.info(f"Imported {imported} audit entries into DB, archived JSONL to {archive}")
                except Exception as e:
                    logger.warning(f"Imported {imported} entries but failed to archive JSONL: {e}")

            finally:
                session.close()

        except Exception as e:
            logger.error(f"Unexpected error during JSONL import: {e}")
    
    def log_event(
        self,
        event_type: str,
        user_id: str,
        action: str,
        details: Dict[str, Any],
        ip_address: str = "unknown"
    ) -> Optional[AuditLogEntry]:
        """
        Create immutable audit log entry
        
        CRITICAL: Only updates _last_hash after successful DB commit
        
        Event Types:
        - AUTH: Authentication events (login, logout, failed attempts)
        - API_ACCESS: API endpoint access
        - CONFIG_CHANGE: Configuration modifications
        - ISO15118_SESSION: V2G charging sessions
        - DATA_ACCESS: Database queries
        - SECURITY_ALERT: Security-related alerts
        """
        # Thread-safe hash chain update
        with self._hash_lock:
            # Create entry with current chain state
            entry = AuditLogEntry(
                event_type=event_type,
                user_id=user_id,
                action=action,
                details=details,
                ip_address=ip_address,
                previous_hash=self._last_hash
            )

            # File-backed fallback persistence
            if getattr(self, "_use_file", False):
                try:
                    with open(self._audit_file, "a") as f:
                        f.write(json.dumps(entry.to_dict()))
                        f.write("\n")
                        f.flush()
                    self._last_hash = entry.hash
                    logger.info(f"[{event_type}] {action} | User: {user_id} | IP: {ip_address} | Hash: {entry.hash[:16]}...")
                    return entry
                except Exception as e:
                    logger.error(f"Failed to persist audit entry to file: {e}")
                    return None

            # DB-backed persistence
            if not self._session_maker:
                logger.warning(
                    f"Audit log event NOT persisted (DB unavailable): "
                    f"[{event_type}] {action} by {user_id}"
                )
                return None

            session: Any = self._session_maker()
            try:
                # Create DB model
                db_entry = AuditLogModel(
                    timestamp=entry.timestamp,
                    event_type=entry.event_type,
                    user_id=entry.user_id,
                    action=entry.action,
                    details=json.dumps(entry.details),
                    ip_address=entry.ip_address,
                    previous_hash=entry.previous_hash,
                    hash=entry.hash
                )
                
                session.add(db_entry)
                session.commit()
                
                # CRITICAL: Only update hash chain AFTER successful commit
                self._last_hash = entry.hash
                
                # Log success
                logger.info(
                    f"[{event_type}] {action} | User: {user_id} | "
                    f"IP: {ip_address} | Hash: {entry.hash[:16]}..."
                )
                
                return entry
            
            except SQLAlchemyError as e:
                try:
                    session.rollback()
                except Exception:
                    pass
                logger.error(
                    f"CRITICAL: Failed to persist audit log (hash chain NOT advanced): {e}"
                )
                # DO NOT update _last_hash - preserve chain integrity
                return None
            
            finally:
                try:
                    session.close()
                except Exception:
                    pass
    
    def log_auth_attempt(
        self, 
        user_id: str, 
        success: bool, 
        ip_address: str, 
        method: str = "api_key"
    ):
        """Helper for authentication events"""
        action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
        self.log_event(
            event_type="AUTH",
            user_id=user_id,
            action=action,
            details={"method": method, "success": success},
            ip_address=ip_address
        )
    
    def log_api_access(
        self, 
        user_id: str, 
        endpoint: str, 
        method: str, 
        ip_address: str
    ):
        """Helper for API access logging"""
        self.log_event(
            event_type="API_ACCESS",
            user_id=user_id,
            action=f"{method} {endpoint}",
            details={"endpoint": endpoint, "method": method},
            ip_address=ip_address
        )
    
    def log_iso15118_session(
        self,
        ev_id: str,
        evse_id: str,
        action: str,
        details: Dict[str, Any],
        ip_address: str = "vehicle"
    ):
        """Helper for ISO 15118 V2G session logging"""
        self.log_event(
            event_type="ISO15118_SESSION",
            user_id=ev_id,
            action=action,
            details={**details, "evse_id": evse_id},
            ip_address=ip_address
        )
    
    def verify_chain_integrity(self, limit: int = 100) -> bool:
        """
        Verify audit log chain integrity
        
        Args:
            limit: Number of recent entries to verify (default 100)
        
        Returns:
            True if chain is valid, False if tampering detected
        """
        if not self._session_maker:
            logger.warning("Cannot verify chain - database not available")
            return False
        
        session: Any = self._session_maker()
        try:
            entries = session.query(AuditLogModel).order_by(
                AuditLogModel.id
            ).limit(limit).all()
            
            previous_hash = "0" * 64
            for db_entry in entries:
                # Extract values from SQLAlchemy model
                details_str = str(db_entry.details) if db_entry.details is not None else None
                details_dict = json.loads(details_str) if details_str else {}
                
                # Reconstruct entry with original timestamp (critical for hash verification)
                entry_timestamp = db_entry.timestamp  # type: ignore
                entry = AuditLogEntry(
                    event_type=str(db_entry.event_type),
                    user_id=str(db_entry.user_id),
                    action=str(db_entry.action),
                    details=details_dict,
                    ip_address=str(db_entry.ip_address),
                    previous_hash=previous_hash,
                    timestamp=entry_timestamp
                )
                
                # Verify hash
                db_hash = str(db_entry.hash)
                if entry.hash != db_hash:
                    logger.error(f"Chain integrity violation: Entry ID {db_entry.id} hash mismatch")
                    return False
                
                # Verify chain link
                db_prev_hash = str(db_entry.previous_hash)
                if db_prev_hash != previous_hash:
                    logger.error(f"Chain integrity violation: Entry ID {db_entry.id} chain broken")
                    return False
                
                previous_hash = db_hash
            
            logger.info(f"Chain integrity verified: {len(entries)} entries OK")
            return True
        
        except Exception as e:
            logger.error(f"Chain verification failed: {e}")
            return False
        
        finally:
            session.close()


# Global singleton instance
def get_audit_logger() -> SecureAuditLogger:
    """Get global SecureAuditLogger instance (thread-safe)"""
    return SecureAuditLogger()
