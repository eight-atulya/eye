FROM prom/prometheus:v2.55.1

COPY prometheus.yml /etc/prometheus.yml

# Optional: default command can be overridden by compose
CMD ["--config.file=/etc/prometheus.yml", "--storage.tsdb.retention.time=2d"]
