"""
Small helper to load the project's config using backend.config_service.load_config()
and print the resulting structure as JSON. Useful to verify whether encrypted
fields are being decrypted at runtime. This script will print stack traces and
helpful messages if the SECRETS environment variables are not set.
"""
import json
import traceback


def main():
    try:
        from backend.config_service import load_config
    except Exception as e:
        print("Failed to import backend.config_service:", e)
        traceback.print_exc()
        return

    try:
        cfg = load_config()
        print("Loaded config (JSON):")
        print(json.dumps(cfg, indent=2))
    except Exception as e:
        print("Error loading config:", e)
        traceback.print_exc()


if __name__ == "__main__":
    main()
