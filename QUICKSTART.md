# EYE Quick Start Guide


### Prerequisites
- Docker Desktop installed and running

### Step 1: Clone and Setup
```bash
git clone this repository
cd EYE
python scripts/generate-config.py
```

### Step 2: Start All Services
```bash
docker-compose up -d --build
```

### Step 3: Wait for Services (2-3 minutes)
```bash
# Check status
docker-compose ps

# Watch logs
docker-compose logs -f
```

### Step 4: Access the System
- **Main Dashboard**: http://localhost:3003
- **EYE AI**: http://localhost:3003/eye-ai
- **API Docs**: http://localhost:8001/docs #todo

### Step 5: Test EYE AI
```bash
# Test API
python scripts/test_ollama_api.py

# Test direct inference
docker-compose exec ollama ollama run gemma3:12b "Hello!"
```

## ✅ Verification Checklist

- [ ] All containers running (`docker-compose ps`)
- [ ] Frontend accessible at http://localhost:3003
- [ ] Backend API responding at http://localhost:8001/health
- [ ] EYE AI working at http://localhost:3003/eye-ai
- [ ] GPU detected (if available): `docker-compose logs ollama | grep GPU`

## 🆘 Quick Troubleshooting

**Port conflicts?**
```bash
# Kill processes on ports
sudo kill -9 $(lsof -t -i:8001) $(lsof -t -i:3003)
```

**Services not starting?**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
```

**EYE AI not working?**
```bash
# Check GPU
docker-compose logs ollama | grep -i gpu
# Re-download model
docker-compose exec ollama ollama pull gemma3:12b
```

## 🎯 Next Steps

1. **Explore the UI**: Navigate to http://localhost:3003
2. **Try EYE AI**: Go to http://localhost:3003/eye-ai
3. **Read the full README**: See complete documentation
4. **Join the community**: GitHub Discussions

---

**Need help?** #todo
