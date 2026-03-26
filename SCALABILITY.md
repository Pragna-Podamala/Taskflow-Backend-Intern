# 📈 Scalability & Architecture Notes

## Current Architecture

```
Client (React) → Nginx → Express API → MongoDB
                              ↓
                           Redis (cache)
```

---

## 1. Horizontal Scaling (Stateless Design)

The API is **stateless by design** — JWT tokens carry all session state, so any number of API instances can serve any request without shared memory.

```
                    ┌─────────────────┐
                    │  Load Balancer  │  (Nginx / AWS ALB)
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
         ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
         │  API #1 │    │  API #2 │    │  API #3 │
         └────┬────┘    └────┬────┘    └────┬────┘
              └──────────────┼──────────────┘
                    ┌────────▼────────┐
                    │    MongoDB      │  (Replica Set)
                    └─────────────────┘
```

**To scale**: `docker-compose up --scale backend=3`

---

## 2. Database Scaling

### Indexes (already implemented)
```js
// User model
userSchema.index({ email: 1 });           // login lookup
userSchema.index({ role: 1 });            // admin filtering

// Task model
taskSchema.index({ owner: 1, status: 1 });   // user's tasks by status
taskSchema.index({ owner: 1, priority: 1 }); // user's tasks by priority
taskSchema.index({ dueDate: 1 });            // due date queries
taskSchema.index({ tags: 1 });               // tag filtering
```

### MongoDB Replica Set
For production, run a 3-node replica set for high availability:
- 1 Primary (reads + writes)
- 2 Secondaries (read replicas, automatic failover)

```
MONGODB_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017/taskmanager?replicaSet=rs0
```

### Future: MongoDB Atlas
- Auto-sharding for collections exceeding 100GB+
- Global clusters for geographic distribution
- Built-in backups and point-in-time recovery

---

## 3. Caching Strategy (Redis)

Redis is already configured in `docker-compose.yml`. Integration points:

```js
// Cache frequently-read, rarely-changing data
// e.g., task stats, admin dashboard counts

const cacheMiddleware = (ttl) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}:${req.user._id}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));

  res.sendResponse = res.json;
  res.json = (body) => {
    redis.setex(key, ttl, JSON.stringify(body));
    res.sendResponse(body);
  };
  next();
};

// Apply to stats endpoint (cache for 60s)
router.get('/stats', protect, cacheMiddleware(60), getTaskStats);
```

**Cache invalidation**: On task create/update/delete, flush user-specific cache keys.

---

## 4. Microservices Decomposition (Future Path)

Current monolith can be split along domain boundaries:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Auth Service  │  │  Task Service   │  │  Admin Service  │
│  /api/v1/auth   │  │  /api/v1/tasks  │  │  /api/v1/admin  │
│   Port: 5001    │  │   Port: 5002    │  │   Port: 5003    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         └───────────────────┬┘                     │
                    ┌────────▼────────┐              │
                    │   API Gateway   │◄─────────────┘
                    │ (Kong / Nginx)  │
                    └─────────────────┘
```

Each service:
- Has its own database/collection
- Communicates via REST or message queue (RabbitMQ / Kafka)
- Scales independently based on load
- Can be deployed separately

---

## 5. Message Queue (Event-Driven)

For async operations (email notifications, audit logs, webhooks):

```
Task completed → Publish event → RabbitMQ → Email Worker
                                          → Audit Log Worker
                                          → Analytics Worker
```

This decouples slow I/O from the request cycle and prevents cascading failures.

---

## 6. Rate Limiting & DDoS Protection

Currently implemented with `express-rate-limit`:
- **Global**: 100 req / 15 min per IP
- **Auth routes**: 20 req / 15 min per IP

**Production upgrade path**:
- Move rate limiting to Redis (`rate-limit-redis`) so limits are shared across all API instances
- Add Cloudflare or AWS WAF for L7 DDoS protection
- Implement per-user rate limits (not just per-IP)

---

## 7. Logging & Observability

Current: Winston logs to files + console.

**Production stack**:
```
Winston → Filebeat → Elasticsearch → Kibana (ELK Stack)
       → CloudWatch (AWS)
       → Datadog / New Relic (APM)
```

Add distributed tracing (OpenTelemetry) for microservices to trace requests across services.

---

## 8. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml (example)
on: push (main branch)
jobs:
  test → lint → build Docker image → push to ECR → deploy to ECS/K8s
```

**Zero-downtime deployment**: Rolling updates via Kubernetes or ECS with health checks (`GET /health`).

---

## 9. Infrastructure as Code

```
Kubernetes (K8s) Deployment:
- backend: Deployment (3 replicas) + HPA (auto-scale 3→20 based on CPU)
- frontend: Deployment (2 replicas)
- mongodb: StatefulSet with PersistentVolumeClaims
- redis: Deployment + Service
- Ingress: Nginx Ingress Controller with TLS termination
```

---

## 10. Scalability Checklist

| Feature | Status |
|---------|--------|
| Stateless JWT (horizontal scale ready) | ✅ Implemented |
| MongoDB indexes on query fields | ✅ Implemented |
| Pagination on all list endpoints | ✅ Implemented |
| Gzip compression | ✅ Implemented |
| Docker containerization | ✅ Implemented |
| Health check endpoint `/health` | ✅ Implemented |
| Graceful shutdown | ✅ Implemented |
| Redis service configured | ✅ Ready to use |
| Redis caching middleware | 🔲 Plug-in ready |
| MongoDB Replica Set | 🔲 Config ready |
| Load balancer config (Nginx) | ✅ Implemented |
| Rate limiting (Redis-backed) | 🔲 Upgrade path |
| Message queue | 🔲 Future phase |
| Kubernetes manifests | 🔲 Future phase |
| CI/CD pipeline | 🔲 Future phase |
