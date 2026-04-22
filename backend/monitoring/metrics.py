from prometheus_client import Counter, Gauge, Histogram

REQUEST_COUNT = Counter(
    "efh_http_requests_total",
    "HTTP requests total",
    ["method", "endpoint", "http_status"],
)
REQUEST_LATENCY = Histogram(
    "efh_http_request_latency_seconds",
    "HTTP request latency seconds",
    ["endpoint"],
)

EV_CHARGING_CYCLES = Counter("efh_ev_charging_cycles_total", "Total EV charging cycles")
ENERGY_GRID_EXPORT = Gauge("efh_energy_grid_export_watts", "Grid export power watts")
AI_DECISION_TIME = Histogram("efh_ai_decision_time_seconds", "AI decision latency seconds")
ADAPTER_REQUEST_FAILURES = Counter(
    "efh_adapter_request_failures_total",
    "Adapter request failures",
    ["adapter"],
)

def record_request(method: str, endpoint: str, status: int, latency: float):
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, http_status=str(status)).inc()
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)