import os
import json
import importlib

import pytest


class FakeKmsClient:
    def __init__(self, data_key=None):
        # 32-byte AES-256 key
        self._data_key = (data_key if data_key is not None else b"\x01" * 32)
        self._cipher_blob = b"fake-cipher-blob"

    def generate_data_key(self, KeyId=None, KeySpec=None):
        return {"Plaintext": self._data_key, "CiphertextBlob": self._cipher_blob}

    def decrypt(self, CiphertextBlob=None):
        # Return the same plaintext when asked to decrypt the fake blob
        return {"Plaintext": self._data_key}


class FakeBoto3:
    def client(self, service_name, *args, **kwargs):
        if service_name == "kms":
            return FakeKmsClient()
        raise RuntimeError("Unexpected service")


def test_aws_kms_envelope_roundtrip(monkeypatch):
    # Ensure we import fresh with provider configured
    monkeypatch.setenv("SECRETS_PROVIDER", "aws_kms")
    monkeypatch.setenv("AWS_KMS_KEY_ID", "alias/test-key")

    # Import the module under test
    secrets = importlib.import_module("backend.secrets")

    # Replace boto3 with our fake implementation
    monkeypatch.setattr(secrets, "boto3", FakeBoto3())

    plaintext = "super-secret-value-123"
    token = secrets.encrypt_value(plaintext)

    # token should be a JSON string with expected keys
    obj = json.loads(token)
    assert "v" in obj and "dk" in obj and "kid" in obj and "alg" in obj

    # Decrypt
    out = secrets.decrypt_value(token)
    assert out == plaintext


if __name__ == "__main__":
    pytest.main(["-q", os.path.dirname(__file__)])
