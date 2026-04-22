"""
ISO 21434-Compliant Device Provisioning
Secure onboarding for EVs, Wallboxes, and other IoT devices
"""

import hashlib
import secrets
import os
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from datetime import datetime, timedelta
from typing import Dict, Tuple


class DeviceProvisioning:
    """
    Certificate-based device provisioning with X.509 PKI
    Compliant with ISO 21434 secure onboarding requirements
    """
    
    @staticmethod
    def generate_device_certificate(device_id: str, device_type: str) -> Tuple[bytes, bytes]:
        """
        Generate X.509 certificate for device (EV, Wallbox, etc.)
        
        Args:
            device_id: Unique device identifier
            device_type: Type of device (ev, wallbox, battery, etc.)
        
        Returns:
            Tuple of (private_key_pem, certificate_pem)
        """
        # Generate RSA-4096 private key (automotive-grade security)
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096
        )
        
        # Build certificate subject
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "DE"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Bavaria"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "EMS-Provider"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "IoT-Devices"),
            x509.NameAttribute(NameOID.COMMON_NAME, f"{device_type}-{device_id}"),
        ])
        
        # Build certificate
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)  # 1 year validity
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(f"{device_id}.devices.ems.local"),
                x509.DNSName(f"{device_type}-{device_id}.ems.local"),
            ]),
            critical=False,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=True,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Serialize to PEM format
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        cert_pem = cert.public_bytes(serialization.Encoding.PEM)
        
        return (private_pem, cert_pem)
    
    @staticmethod
    def generate_api_key() -> Tuple[str, str]:
        """
        Generate secure API key with hash
        
        Returns:
            Tuple of (api_key, api_key_hash)
        """
        api_key = secrets.token_urlsafe(32)
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        return (api_key, api_key_hash)
    
    @staticmethod
    def provision_device(device_id: str, device_type: str) -> Dict[str, str]:
        """
        Complete device provisioning workflow
        
        Args:
            device_id: Unique device identifier
            device_type: Type (ev, wallbox, battery, heatpump)
        
        Returns:
            Provisioning credentials (show only once!)
        """
        # Generate X.509 certificate
        private_key, certificate = DeviceProvisioning.generate_device_certificate(
            device_id, device_type
        )
        
        # Generate API key (fallback authentication)
        api_key, api_key_hash = DeviceProvisioning.generate_api_key()
        
        # In production: Store in database
        # db.devices.insert({
        #     "device_id": device_id,
        #     "device_type": device_type,
        #     "certificate": certificate.decode(),
        #     "api_key_hash": api_key_hash,
        #     "provisioned_at": datetime.utcnow(),
        #     "status": "active"
        # })
        
        mqtt_broker = os.getenv("MQTT_BROKER", "mqtts://test.mosquitto.org:8883")
        
        return {
            "device_id": device_id,
            "device_type": device_type,
            "certificate": certificate.decode(),
            "private_key": private_key.decode(),
            "api_key": api_key,  # Show only once!
            "mqtt_broker": mqtt_broker,
            "mqtt_topic_prefix": f"devices/{device_type}/{device_id}/",
            "mqtt_username": f"{device_type}_{device_id}",
            "provisioned_at": datetime.utcnow().isoformat()
        }


# CLI usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python device_provisioning.py <device_id> <device_type>")
        print("Example: python device_provisioning.py VW-ID4-12345 ev")
        sys.exit(1)
    
    device_id = sys.argv[1]
    device_type = sys.argv[2]
    
    provisioning = DeviceProvisioning()
    credentials = provisioning.provision_device(device_id, device_type)
    
    print("\n" + "="*80)
    print("🔐 DEVICE PROVISIONED SUCCESSFULLY")
    print("="*80)
    print(f"\nDevice ID: {credentials['device_id']}")
    print(f"Device Type: {credentials['device_type']}")
    print(f"\nMQTT Broker: {credentials['mqtt_broker']}")
    print(f"MQTT Topic: {credentials['mqtt_topic_prefix']}*")
    print("MQTT Username: " + credentials['mqtt_username'])
    print("\nAPI Key (SAVE THIS - shown only once):")
    print("  " + credentials['api_key'])
    print("\nCertificate (PEM):")
    print(credentials['certificate'])
    print("\nPrivate Key (PEM - KEEP SECURE):")
    print(credentials['private_key'])
    print("="*80)
