# EYE System Port Mapping Guide

## Current Port Configuration

| Service | Port | Alternative Ports | Description |
|---------|------|------------------|-------------|
| **Frontend** | 3003 | 3001, 3002, 5173 | Next.js development server |
| **Backend** | 8001 | 8002, 8003, 8080 | FastAPI application server |
| **Database** | 5433 | 5434, 5435 | PostgreSQL database |
| **Redis** | 6380 | 6381, 6382 | Redis cache server |
| **MinIO API** | 9002 | 9004, 9005 | MinIO S3-compatible storage API |
| **MinIO Console** | 9003 | 9006, 9007 | MinIO web console |
| **Prometheus** | 9090 | 9091, 9092 | Prometheus monitoring server |
| **CVAT** | 8080 | 8081, 8082 | CVAT annotation tool |

## Port Conflict Resolution

### Common Port Conflicts and Solutions

1. **Port 9000 (MinIO API)** - Changed to 9002
2. **Port 9001 (MinIO Console)** - Changed to 9003
3. **Port 8080 (CVAT)** - Can be changed to 8081 if needed

### How to Change Ports

1. Edit `config/eye.yaml`:
```yaml
services:
  minio:
    port: 9004  # Change from 9002 to 9004
    console_port: 9005  # Change from 9003 to 9005
```

2. Regenerate configuration:
```bash
python scripts/generate-config.py
```

3. Restart services:
```bash
docker-compose down
docker-compose up -d --build
```

## Port Range Recommendations

### Development Environment
- Frontend: 3000-3009
- Backend: 8000-8009
- Database: 5432-5439
- Storage: 9000-9009
- Monitoring: 9090-9099

### Production Environment
- Frontend: 80, 443 (with reverse proxy)
- Backend: 8000-8009
- Database: 5432 (internal only)
- Storage: 9000-9009
- Monitoring: 9090-9099

## Checking Port Availability

### Windows (PowerShell)
```powershell
# Check if port is in use
netstat -an | findstr :9000

# Check all listening ports
netstat -an | findstr LISTENING
```

### Linux/macOS
```bash
# Check if port is in use
lsof -i :9000

# Check all listening ports
netstat -tuln | grep LISTEN
```

## Service URLs After Port Changes

After changing ports to avoid conflicts:
- **Frontend**: http://localhost:3003
- **Backend**: http://localhost:8001
- **MinIO API**: http://localhost:9002
- **MinIO Console**: http://localhost:9003
- **Prometheus**: http://localhost:9090
- **Database**: localhost:5433 (internal access only)
- **Redis**: localhost:6380 (internal access only)

## Environment Variables

The following environment variables are automatically updated when you change ports:

### Backend (.env)
- `EYE_MINIO_PORT`: Updated MinIO API port
- `EYE_MINIO_HOST`: MinIO hostname

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL with correct port

## Troubleshooting

### Port Already in Use
1. Identify the process using the port
2. Either stop the conflicting service or change the port
3. Regenerate configuration files
4. Restart Docker services

### Service Not Accessible
1. Verify port mapping in docker-compose.yml
2. Check firewall settings
3. Ensure service is running: `docker-compose ps`
4. Check logs: `docker-compose logs [service-name]`

## Industrial Standards

For production deployment, consider:
- Using reverse proxy (nginx/traefik) for port 80/443
- Internal-only database ports
- SSL/TLS termination at proxy level
- Load balancer configuration for high availability
