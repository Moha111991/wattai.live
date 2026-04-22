import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from .monitoring.metrics import record_request

logger = logging.getLogger("efh.middleware")

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        try:
            response = await call_next(request)
            status = response.status_code
        except Exception:
            status = 500
            logger.exception("unhandled_exception")
            raise
        finally:
            latency = time.time() - start
            record_request(request.method, request.url.path, status, latency)
            logger.info(
                "http_request",
                extra={"method": request.method, "path": request.url.path, "status": status, "latency_s": latency},
            )
        return response