import os

import uvicorn


def _resolve_port() -> int:
    raw_port = os.getenv("PORT", "10000").strip()
    try:
        return int(raw_port)
    except ValueError:
        # Railway (or any platform) should provide an integer PORT.
        # Fall back to 10000 to avoid startup crash loops on malformed values.
        return 10000


def main() -> None:
    uvicorn.run("backend.main:app", host="0.0.0.0", port=_resolve_port())


if __name__ == "__main__":
    main()
