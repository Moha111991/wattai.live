from fastapi import APIRouter
from config_service import load_config
router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/metrics", include_in_schema=False)
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@router.post("/admin/reload-config")
def reload_config(app_state: dict = None):
    cfg = load_config()
    if app_state is not None:
        app_state["config"] = cfg
    return {"status": "ok", "config_keys": list(cfg.keys())}