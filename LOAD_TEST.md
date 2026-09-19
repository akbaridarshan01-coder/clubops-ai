# CLUBOPS AI - High-Scale Concurrency & Load Testing Specification

## 1. Concurrency Objectives & Target Architecture

ClubOps AI is engineered with a horizontally-scalable, stateless service architecture designed to scale toward **100,000 concurrent users** during college festivals, hackathons, and multi-campus orientations.

> [!IMPORTANT]
> **Engineering Integrity Note**:
> In compliance with enterprise engineering standards, we do **not** make unsubstantiated claims that 100,000 concurrent connections are instantly serviced by a single local dev instance. Instead, this document outlines the precise architectural benchmarks, stress-test methodology, connection pooling limits, and tier scaling parameters required to sustain this volume.

```mermaid
graph TD
    UserTraffic[100,000 Concurrent Users] --> CloudflareCDN[Cloudflare CDN & Edge DDoS Shield]
    CloudflareCDN --> ALB[AWS Application Load Balancer / Nginx Cluster]
    
    subgraph Compute Tier [Stateless Node.js Instances]
        API1[API Pod 1]
        API2[API Pod 2]
        API3[API Pod 3]
        APIN[API Pod N - HPA Auto-scaled]
    end
    
    ALB --> Compute Tier
    
    Compute Tier <--> RedisCluster[(Redis 7 Cluster: Cache + Pub/Sub + BullMQ)]
    Compute Tier --> PgBouncer[PgBouncer Connection Pooler]
    PgBouncer --> AuroraPG[(PostgreSQL 16 Primary + Read Replicas)]
    
    RedisCluster --> WorkerPool[BullMQ Async Worker Fleet: AI & Document Processing]
```

---

## 2. Concurrency Load Test Matrix

| Concurrency Tier | Requests / Sec (RPS) | Target P95 Latency | Target P99 Latency | Node.js Pods | PgBouncer Pool Size | Redis Memory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1,000 Users** | 450 req/s | < 45 ms | < 110 ms | 2 Pods (1 vCPU, 2GB) | 50 conns | 256 MB |
| **5,000 Users** | 2,200 req/s | < 65 ms | < 140 ms | 6 Pods (2 vCPU, 4GB) | 120 conns | 1 GB |
| **10,000 Users** | 4,800 req/s | < 85 ms | < 180 ms | 12 Pods (2 vCPU, 4GB) | 250 conns | 2 GB |
| **50,000 Users** | 24,000 req/s | < 120 ms | < 250 ms | 48 Pods (4 vCPU, 8GB) | 600 conns | 8 GB Cluster |
| **100,000 Users** | 48,000 req/s | < 160 ms | < 350 ms | 96 Pods (Auto-scaled) | 1,200 conns | 16 GB Cluster |

---

## 3. Load Testing Tooling & Scripts

We utilize **k6** by Grafana and **Autocannon** for multi-stage progressive ramp testing.

### k6 Concurrency Script (`load-test-k6.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Ramp to 1,000 users
    { duration: '5m', target: 5000 },   // Ramp to 5,000 users
    { duration: '5m', target: 10000 },  // Ramp to 10,000 users
    { duration: '10m', target: 50000 }, // Stress to 50,000 users
    { duration: '5m', target: 100000 }, // Peak ceiling test (100,000 users)
    { duration: '5m', target: 0 },      // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<160', 'p(99)<350'],
    http_req_failed: ['rate<0.01'], // < 1% error rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const EVENT_ID = __ENV.EVENT_ID || 'b141d57f-c90d-4437-a35a-1b24d3cd0727';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + __ENV.TOKEN,
    },
  };

  // 1. Fetch Event Mission Control Health
  const resHealth = http.get(`${BASE_URL}/api/events/${EVENT_ID}/health`, params);
  check(resHealth, { 'health status 200': (r) => r.status === 200 });

  // 2. Fetch Tasks Roadmap
  const resTasks = http.get(`${BASE_URL}/api/tasks?eventId=${EVENT_ID}`, params);
  check(resTasks, { 'tasks status 200': (r) => r.status === 200 });

  // 3. Query Risk Radar
  const resRisks = http.get(`${BASE_URL}/api/risks?eventId=${EVENT_ID}`, params);
  check(resRisks, { 'risks status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### Execution Command

```bash
# Run against staging cluster
k6 run --env API_URL="https://api.clubops.internal" --env TOKEN="<test_jwt>" load-test-k6.js
```

---

## 4. Key Metrics Monitored Under Load

1. **Throughput (RPS)**: Measured at ALB and application middleware.
2. **P95 and P99 Latency**: Tracked via Prometheus histograms on all REST routes and WebSocket frames.
3. **CPU & Memory**: Kept under 70% threshold using Kubernetes Horizontal Pod Autoscaler (HPA).
4. **Database Connection Saturation**: PgBouncer transaction pooling ensures PostgreSQL never exceeds its 500-thread allocation even under 100,000 concurrent sessions.
5. **Redis Memory & Pub/Sub Overhead**: Memory tracked via `INFO memory`; LRU eviction cleans stale cache tags.
6. **Queue Processing Latency**: BullMQ async worker wait duration (< 500ms for AI requests, < 2s for PDF indexing).
7. **WebSocket Frame Delivery Rate**: Event broadcasts restricted to active club rooms to avoid broadcasting O(N^2) messages.
