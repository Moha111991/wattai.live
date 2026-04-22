"""
ISO 21434-Compliant Message Signing for MQTT Payloads
Prevents message tampering and replay attacks
"""

import hmac
import hashlib
import json
import time
import os
from typing import Dict, Any


class MessageSigner:
    """
    HMAC-SHA256 message signing for MQTT communications
    Ensures message integrity and authenticity
    """
    
    def __init__(self, secret_key: str = None):
        if secret_key is None:
            secret_key = os.getenv("MQTT_SIGNING_KEY")
            
            # FAIL FAST if key not set in production
            if secret_key is None:
                import logging
                logging.error(
                    "CRITICAL SECURITY ERROR: MQTT_SIGNING_KEY environment variable not set! "
                    "Message signing is INSECURE without a strong secret key. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
                raise RuntimeError(
                    "MQTT_SIGNING_KEY not configured - refusing to start with insecure default. "
                    "Set environment variable MQTT_SIGNING_KEY to a strong random value."
                )
        
        self.secret_key = secret_key.encode()
    
    def sign_message(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sign MQTT message payload with HMAC-SHA256
        
        Args:
            payload: Original message data
        
        Returns:
            Signed payload with signature and timestamp
        """
        # Add timestamp for replay protection
        payload["timestamp"] = int(time.time())
        
        # Canonical JSON (sorted keys for consistent hashing)
        canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        # Compute HMAC signature
        signature = hmac.new(
            self.secret_key,
            canonical_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Add signature to payload
        signed_payload = payload.copy()
        signed_payload["_signature"] = signature
        
        return signed_payload
    
    def verify_message(self, signed_payload: Dict[str, Any], max_age_seconds: int = 300) -> bool:
        """
        Verify MQTT message signature
        
        Args:
            signed_payload: Message with signature
            max_age_seconds: Maximum message age (replay protection, default 5 min)
        
        Returns:
            True if signature valid and message fresh
        """
        # Extract signature
        if "_signature" not in signed_payload:
            return False
        
        # Make a copy to avoid modifying original
        payload_copy = signed_payload.copy()
        received_signature = payload_copy.pop("_signature")
        
        # Check timestamp (replay protection)
        if "timestamp" not in payload_copy:
            return False
        
        message_age = int(time.time()) - payload_copy["timestamp"]
        if message_age > max_age_seconds:
            return False  # Message too old, potential replay attack
        
        # Recompute signature
        canonical_json = json.dumps(payload_copy, sort_keys=True, separators=(',', ':'))
        expected_signature = hmac.new(
            self.secret_key,
            canonical_json.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Constant-time comparison (timing attack protection)
        return hmac.compare_digest(received_signature, expected_signature)


# Singleton instance
_global_signer = None

def get_message_signer() -> MessageSigner:
    """Get global MessageSigner instance"""
    global _global_signer
    if _global_signer is None:
        _global_signer = MessageSigner()
    return _global_signer
