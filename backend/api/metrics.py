from fastapi import APIRouter, Response
from prometheus_client import CollectorRegistry, CONTENT_TYPE_LATEST, generate_latest, Gauge

router = APIRouter()

_registry = CollectorRegistry()
HEALTH_GAUGE = Gauge('eye_health', 'Health status of EYE components', ['component'], registry=_registry)

@router.get('/v1/metrics')
def metrics():
    HEALTH_GAUGE.labels(component='backend').set(1)
    data = generate_latest(_registry)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
