# 🐳 Docker Guide — Nexora Website

Complete guide and reference for running, building, stopping, and managing the Nexora Next.js container using **Docker Compose** and the **Docker CLI**.

---

## ⚡ Quick Start (Recommended: Docker Compose)

The easiest way to run the project is using Docker Compose.

### 1. Build and Start the Container (in background)
```bash
docker compose up --build -d
```
> The application will be available at: **http://localhost:3000**

### 2. View Live Logs
```bash
docker compose logs -f
```

### 3. Stop and Remove the Container
```bash
docker compose down
```

---

## 📋 Docker Compose Commands Reference

| Action | Command |
| :--- | :--- |
| **Build & Run (Detached)** | `docker compose up --build -d` |
| **Run in Foreground** (shows logs directly) | `docker compose up` |
| **Stop and Remove Containers** | `docker compose down` |
| **Stop without Removing** | `docker compose stop` |
| **Start Stopped Containers** | `docker compose start` |
| **Restart Container** | `docker compose restart` |
| **Check Container Status** | `docker compose ps` |
| **Follow Live Logs** | `docker compose logs -f` |
| **Follow Logs for Web Service only** | `docker compose logs -f web` |
| **Rebuild without Cache** | `docker compose build --no-cache` |
| **Open Shell Inside Container** | `docker compose exec web sh` |

---

## 🛠️ Direct Docker CLI Commands

If you prefer to run raw `docker` commands without Docker Compose:

### 1. Build the Docker Image
```bash
docker build -t nexora-website .
```

*Build without cache:*
```bash
docker build --no-cache -t nexora-website .
```

### 2. Run the Container
```bash
docker run -d \
  --name nexora-website \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  nexora-website
```

### 3. View Logs
```bash
docker logs -f nexora-website
```

### 4. Stop the Container
```bash
docker stop nexora-website
```

### 5. Start an Existing Stopped Container
```bash
docker start nexora-website
```

### 6. Restart the Container
```bash
docker restart nexora-website
```

### 7. Remove the Container
```bash
# Stop first, then remove
docker stop nexora-website
docker rm nexora-website

# Or force remove immediately:
docker rm -f nexora-website
```

---

## 🔍 Useful Debugging & Inspection Commands

### Check Running Containers
```bash
docker ps
```

### Check All Containers (including stopped)
```bash
docker ps -a
```

### Inspect Container Resource Usage (CPU, Memory)
```bash
docker stats nexora-website
```

### Execute a Shell Inside the Container
```bash
docker exec -it nexora-website sh
```

---

## 🧹 Cleanup & Pruning

If you need to free up disk space from old images and stopped containers:

```bash
# Remove dangling images
docker image prune -f

# Clean up unused Docker resources
docker system prune -f
```

