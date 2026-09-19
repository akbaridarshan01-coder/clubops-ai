# CLUBOPS AI

> **"Your AI Operating System for College Events."**  
> *"Plan. Coordinate. Predict. Execute."*

CLUBOPS AI is an enterprise-grade, high-scale AI operating system engineered specifically for college clubs, university technical fests, hackathons, and student-run conferences.

Traditional college events rely on fragmented WhatsApp groups, disjointed spreadsheets, scattered Google Docs, and manual follow-up panic. ClubOps AI unifies event operations into a single predictive platform powered by an autonomous, action-capable AI engine with human-in-the-loop approvals.

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client Tier [Frontend - React + Vite + TypeScript]
        Landing[Landing Page & Hero Simulation]
        AuthUI[Multi-Step Organizer Onboarding]
        Dashboard[Event Mission Control]
        TwinUI[Event Digital Twin - React Flow]
        WarRoomUI[AI War Room & Emergency Triage]
        SimulatorUI[What-If Simulator]
        PaletteUI[Global Command Palette Ctrl+K]
    end

    subgraph API & Gateway Tier [Express.js + TypeScript]
        AuthSvc[Auth & Multi-Method OTP Engine]
        RBAC[Multi-Tenant Club Isolation & RBAC]
        WSHub[Real-time WebSocket Hub]
        RestAPI[REST API Gateways]
    end

    subgraph Service & AI Intelligence Layer
        HealthEngine[Event Health Calculation Engine]
        AICopilot[AI Copilot & Action Recommender]
        TwinEngine[Dependency & Topological Engine]
        RiskEngine[Predictive Risk Radar]
        VolunteerMatcher[Smart Volunteer Matching Engine]
        MeetingPipeline[Meeting Intelligence & Parser]
        BrainRAG[Club Brain & Memory Bank]
    end

    subgraph Persistence & Infrastructure Tier
        PrismaORM[Prisma ORM Client]
        PostgresDB[(PostgreSQL 16 / SQLite dev.db)]
        RedisCache[(Redis 7 / In-Memory Fallback)]
        JobQueue[BullMQ / Async Job Workers]
    end

    Client Tier <-->|REST & WebSocket| API & Gateway Tier
    API & Gateway Tier --> Service & AI Intelligence Layer
    Service & AI Intelligence Layer --> Persistence & Infrastructure Tier
```

---

## 2. Key Product Highlights

| Signature Feature | Operational Capability |
| :--- | :--- |
| **Event Mission Control** | Live dashboard featuring real-time Health Score (0–100), critical bottlenecks, volunteer loads, and upcoming actions. |
| **Event Digital Twin** | Interactive React Flow canvas mapping tasks, teams, dependencies, deadlines, and critical paths with "Explain this Node" AI. |
| **AI War Room** | Crisis mode designed for the final 48 hours. Detects registration bottlenecks, volunteer shortages, and performs 1-click reallocations. |
| **What-If Scenario Simulator** | Tests hypothetical shocks (venue delay by 3 days, sponsor withdrawal, volunteer shortages) and renders a side-by-side impact delta without corrupting live data. |
| **Meeting Intelligence** | Parses transcripts (PDF/DOCX/TXT/Paste), extracts action items, owners, deadlines, and priorities, and creates all tasks with a single click. |
| **Smart Volunteer Matching** | Algorithmically ranks volunteers based on skill overlap, historical ratings, and current workload to prevent burnout. |
| **Predictive Risk Radar** | Continuously audits unassigned critical tasks, overdue prerequisites, and deadline conflicts, providing automated mitigation playbooks. |
| **Club Brain** | Institutional memory repository storing past event post-mortems and budgets, delivering answers with verified source citations. |
| **Action-Oriented Copilot** | Proactively suggests concrete operational interventions (`[Notify Owners]`, `[Reassign Tasks]`, `[Create Follow-ups]`) and executes real backend mutations upon human approval. |
| **Multi-Channel Announcements** | Instantly generates tailored notices for WhatsApp, Email, Instagram captions, and official campus notice boards. |

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), Recharts, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.js, TypeScript, REST API, WebSocket (`ws`).
- **Database & Cache**: PostgreSQL 16 (production), SQLite `dev.db` (zero-config local dev), Prisma ORM, Redis 7 (caching & pub/sub).
- **Background Workers**: BullMQ + Redis for asynchronous job processing with in-memory fallback.
- **Security & Multi-Tenancy**: Strict `club_id` isolation, Role-Based Access Control (`OWNER`, `ADMIN`, `LEAD`, `VOLUNTEER`), hashed OTP verification with attempt limits & cooldowns, JWT token rotation.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm v9+

### 1. Start the Backend API & Database

```bash
cd backend
npm install
npx prisma db push
npm run seed       # Seeds TechFest 2026 with 52 tasks, 30 volunteers, 10 risks, 5 meetings, and 10 documents
npm run dev        # Starts API on http://localhost:5000 (ws://localhost:5000/ws)
```

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Pre-Seeded Demo Credentials

The seed script automatically initializes a complete, realistic festival workspace:
- **Organizer Email**: `alex.rivera@techclub.org`
- **Password**: `password123`
- **Default OTP**: `123456`
- **Club**: Tech Innovators Club (Code: `TECH-2026`)
- **Event**: TechFest 2026 (ID: `b141d57f-c90d-4437-a35a-1b24d3cd0727`)
- **Operational Data**: 52 Tasks, 30 Volunteers, 10 Risks, 5 Meetings, 10 Documents, and Critical Path Dependencies.

---

## 6. 5-Minute Hackathon Judge Demo Script

1. **Landing Page (`/`)**:
   - Inspect the live **Event Digital Twin Hero Simulation**.
   - Click **"Simulate: Venue Delayed 3 Days"** to witness cascading node highlights across 7 tasks, 3 teams, and the automated backup recommendation.
2. **Organizer Onboarding (`/auth`)**:
   - Click **"Launch Your Event"**.
   - Select **"I'm an Event Organizer"** -> Enter credentials -> Choose **Email/Mobile OTP**.
   - Enter the 6-digit OTP (`123456`) -> Create Club -> Generate **TechFest 2026** workspace.
   - *(Or click "Fill Demo" on the sign-in tab to instantly enter the pre-seeded account)*.
3. **Event Mission Control (`/mission-control`)**:
   - Review the live **Event Health Score (82/100)** with breakdown metrics.
   - Examine the **Critical Risks**, **Task Velocity**, and **Digital Twin preview**.
4. **AI Copilot (`Ask AI Copilot`)**:
   - Click **"Today's priorities"** in the Copilot drawer.
   - Review proposed action: **"Notify Task Owners of Overdue Deadlines"**.
   - Click **"Notify Owners"** -> Review human-in-the-loop impact modal -> Click **"Approve & Execute"**.
   - Verify the database is updated and health recalculated.
5. **Meeting Intelligence (`/meetings`)**:
   - Click **"Load Sample Meeting Transcript"** -> Click **"Process Transcript & Extract Tasks"**.
   - Review the 7 extracted action items with suggested owners and deadlines.
   - Click **"1-Click Create All Tasks"** and observe them seamlessly integrated into the roadmap.
6. **Event Digital Twin (`/digital-twin`)**:
   - Explore the full interactive React Flow canvas.
   - Click on the **"Auditorium Booking"** node.
   - Click **"Explain this Node with AI"** to analyze its critical path weight.
7. **What-If Simulator (`/simulator`)**:
   - Select **"Venue Delayed 3 Days"** -> Click **"Run Simulation"**.
   - Compare the side-by-side **Current vs Simulated State** showing a 28-point health drop.
8. **AI War Room (`/war-room`)**:
   - Notice the high-alert volunteer deficit banner.
   - Review the recommendation: *"Move 3 volunteers from Marketing to Registration."*
   - Click **"Approve & Dispatch"** to execute the live database transaction.

---

## 7. Production Deployment & Load Testing

- **Docker Compose**: `docker-compose up --build` launches PostgreSQL 16, Redis 7, Backend API, and Frontend Nginx.
- **High Concurrency Roadmap**: Refer to [`LOAD_TEST.md`](LOAD_TEST.md) for the 1,000 to 100,000 concurrent user scaling specification and k6 scripts.
