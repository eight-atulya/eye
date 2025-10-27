from prometheus_client import Gauge, start_http_server
import time

HEALTH_GAUGE = Gauge('eye_health', 'Health status of EYE components', ['component'])

if __name__ == '__main__':
    start_http_server(9100)
    while True:
        HEALTH_GAUGE.labels(component='backend').set(1)
        HEALTH_GAUGE.labels(component='orchestrator').set(1)
        time.sleep(5)
