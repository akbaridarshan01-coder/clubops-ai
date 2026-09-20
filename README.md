# ClubOps AI

> **Your AI Operating System for College Events**  
> Plan. Coordinate. Predict. Execute.

ClubOps AI is a full-stack, AI-powered event management platform built for college clubs, university tech fests, hackathons, and student-run conferences. It replaces fragmented WhatsApp groups, scattered spreadsheets, and manual coordination with a unified, intelligent operating system — complete with a real-time AI Copilot that proposes actions and executes them with human approval.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database & Seed Data](#database--seed-data)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Production Deployment](#production-deployment)
- [Demo Credentials](#demo-credentials)

---

## Features

| Feature | Description |
|---|---|
| **Event Mission Control** | Live dashboard with real-time Health Score (0–100), critical bottlenecks, volunteer load, and upcoming milestones |
| **Event Digital Twin** | Interactive React Flow canvas mapping tasks, teams, dependencies, deadlines, and critical paths with per-node AI explanations |
| **AI Copilot** | Proactively suggests concrete actions (`Notify Owners`, `Reassign Tasks`, `Create Follow-ups`) and executes real database mutations after human approval |
| **AI War Room** | Crisis mode for the final 48 hours — detects registration bottlenecks, volunteer shortages, and enables 1-click reallocation |
| **What-If Simulator** | Tests hypothetical shocks (venue delay, sponsor withdrawal, volunteer dropout) and shows a side-by-side impact delta without touching live data |
| **Meeting Intelligence** | Parses meeting transcripts (PDF/DOCX/TXT or paste), extracts action items with owners and deadlines, and creates all tasks in one click |
| **Smart Volunteer Matching** | Ranks volunteers by skill overlap, experience rating, and current workload to prevent burnout |
| **Predictive Risk Radar** | Continuously audits unassigned critical tasks, overdue prerequisites, and deadline conflicts; provides automated mitigation playbooks |
| **Club Brain (RAG)** | Institutional memory that stores past event post-mortems and budgets, and answers queries with cited source references |
| **Multi-Channel Announcements** | Generates tailored notices for WhatsApp, Email, Instagram, and campus notice boards |
| **WhatsApp Dispatch Engine** | Direct and broadcast messaging via WhatsApp Web.js integration |
| **Analytics & Reports** | Post-event reports, task velocity charts, volunteer performance, and health score history |
| **Real-time Updates** | WebSocket hub broadcasts live changes across all connected clients |

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Data Fetching | TanStack React Query v5 |
| Graph/Canvas | `@xyflow/react` (React Flow) |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js + TypeScript |
| ORM | Prisma 5 |
| Database (dev) | SQLite (`dev.db`) — zero config |
| Database (prod) | PostgreSQL 16 |
| Cache / Pub-Sub | Redis 7 (falls back to in-memory) |
| Background Jobs | BullMQ + Redis |
| Auth | JWT + bcryptjs |
| OTP | Email (Nodemailer/Gmail SMTP) + SMS (Fast2SMS) |
| AI | Google Gemini AI (`@google/generative-ai`) |
| WhatsApp | whatsapp-web.js |
| File Upload | Multer |
| PDF Parsing | pdf-parse |
| Validation | Zod |
| Real-time | WebSocket (`ws`) |
| QR Codes | qrcode |

---

## Project Structure

```
clubops-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 20+ data models (User, Club, Event, Task, ...)
│   │   └── dev.db                 # SQLite dev database (auto-created)
│   ├── src/
│   │   ├── modules/               # Feature modules (auth, events, tasks, ai, ...)
│   │   │   ├── admin/
│   │   │   ├── ai/                # Copilot, What-If, Brain RAG, announcements
│   │   │   ├── analytics/
│   │   │   ├── announcements/
│   │   │   ├── auth/              # Register, OTP verify, login, JWT
│   │   │   ├── clubs/
│   │   │   ├── decisions/
│   │   │   ├── documents/
│   │   │   ├── events/            # Health score engine
│   │   │   ├── meetings/          # Transcript parsing & task extraction
│   │   │   ├── notifications/
│   │   │   ├── risks/             # Risk analysis & mitigation
│   │   │   ├── tasks/             # Dependencies, assignments, critical path
│   │   │   ├── volunteers/        # Smart matching engine
│   │   │   └── whatsapp/          # WhatsApp Web.js integration
│   │   ├── cache/                 # Redis / in-memory cache
│   │   ├── config/                # Env validation
│   │   ├── db/                    # Prisma client singleton
│   │   ├── realtime/              # WebSocket hub
│   │   ├── seed/                  # Demo data seed script
│   │   └── server.ts              # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, Copilot drawer, modals, etc.
│   │   ├── context/               # AuthContext, EventContext, ThemeContext
│   │   ├── pages/                 # One file per route (13 pages)
│   │   ├── services/
│   │   │   └── api.ts             # Typed fetch wrapper for all API calls
│   │   ├── types/                 # Shared TypeScript interfaces
│   │   └── App.tsx                # Router + layout definition
│   └── package.json
│
├── docker-compose.yml             # PostgreSQL + Redis + API + Frontend (Nginx)
├── run_app.bat                    # Windows one-click launcher
└── .gitignore
```

---

## Local Development

### Prerequisites
- Node.js v18+ (tested on v20 and v24)
- npm v9+
- Git

### 1. Clone the repo

```bash
git clone https://github.com/akbaridarshan01-coder/clubops-ai.git
cd clubops-ai
```

### 2. Configure the backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your keys (see [Environment Variables](#environment-variables) below). For a quick local start, only `GEMINI_API_KEY` is required — all others have sensible defaults.

### 3. Start the backend

```bash
cd backend
npm install
npx prisma db push       # creates dev.db and applies schema
npm run seed             # seeds TechFest 2026 with full demo data
npm run dev              # starts API on http://localhost:5000
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev              # starts Vite dev server on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).

### Windows — One-click launch

Double-click `run_app.bat` in the project root. It opens two terminal windows (backend + frontend) and auto-opens the browser.

---

## Environment Variables

All variables live in `backend/.env`. Copy `backend/.env.example` as a starting point.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Backend server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DATABASE_URL` | No | `file:./prisma/dev.db` | SQLite path (dev) or PostgreSQL URL (prod) |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens |
| `REDIS_URL` | No | In-memory fallback | Redis connection URL |
| `SMTP_HOST` | No | — | Gmail SMTP host (`smtp.gmail.com`) |
| `SMTP_PORT` | No | — | `465` for SSL |
| `SMTP_SECURE` | No | — | `true` for SSL |
| `SMTP_USER` | No | — | Gmail address |
| `SMTP_PASS` | No | — | Gmail App Password (not your regular password) |
| `SMTP_FROM` | No | — | Sender display name and address |
| `FAST2SMS_API_KEY` | No | — | [Fast2SMS](https://www.fast2sms.com/) key for mobile OTP |
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key — powers all AI features |
| `UPLOAD_DIR` | No | `./uploads` | Directory for uploaded documents |
| `MAX_FILE_SIZE_MB` | No | `10` | Max upload size in MB |

> **Note:** If `SMTP_*` variables are not set, OTP emails are logged to the console (dev mode). If `REDIS_URL` is not set, the app uses an in-memory fallback automatically.

---

## Database & Seed Data

The backend uses **Prisma ORM** with:
- **SQLite** for local development (zero config, auto-created at `backend/prisma/dev.db`)
- **PostgreSQL 16** for production (set via `DATABASE_URL`)

### Data Models

`User` · `OtpVerification` · `Club` · `ClubMember` · `Team` · `Event` · `Task` · `TaskDependency` · `Volunteer` · `VolunteerSkill` · `Meeting` · `MeetingActionItem` · `Risk` · `Document` · `DocumentChunk` · `Announcement` · `Notification` · `ActivityLog` · `AiAction` · `AiConversation` · `AiMessage` · `EventMetric`

### Seed Script

```bash
npm run seed
```

Seeds a complete, realistic **TechFest 2026** workspace:

- 1 Club: **Tech Innovators Club** (Join Code: `TECH-2026`)
- 1 Event: **TechFest 2026**
- **52 tasks** across 6 teams with inter-task dependencies and critical path
- **30 volunteers** with skill profiles, ratings, and workload data
- **10 risks** (venue, budget, volunteer, technical) with mitigation plans
- **5 meetings** with extracted action items
- **10 documents** (budgets, guidelines, schedules)

---

## API Reference

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/verify-otp` | Verify email/mobile OTP |
| `POST` | `/auth/send-email-otp` | Send login OTP to email or mobile |
| `POST` | `/auth/login` | Login with password |
| `GET` | `/auth/me` | Get current authenticated user |

### Clubs — `/api/clubs`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/clubs` | Create a new club |
| `GET` | `/clubs/my` | List clubs owned by current user |
| `GET` | `/clubs/:id` | Get club details |
| `POST` | `/clubs/join` | Join a club via join code |

### Events — `/api/events`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/events` | Create a new event |
| `GET` | `/events?clubId=` | List events for a club |
| `GET` | `/events/:id` | Get event details |
| `PATCH` | `/events/:id` | Update event |
| `GET` | `/events/:id/health` | Get real-time event health score |

### Tasks — `/api/tasks`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks?eventId=` | List tasks (filterable by status, priority, team) |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `POST` | `/tasks/:id/assign` | Assign/unassign a volunteer |
| `POST` | `/tasks/:id/dependency` | Add a task dependency |
| `DELETE` | `/tasks/:id/dependency/:depId` | Remove a task dependency |

### Volunteers — `/api/volunteers`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/volunteers?clubId=` | List volunteers (filterable by event, team) |
| `POST` | `/volunteers` | Add a volunteer |
| `PUT` | `/volunteers/:id` | Update volunteer profile |
| `DELETE` | `/volunteers/:id` | Remove a volunteer |
| `GET` | `/volunteers/match/:taskId` | Smart-match ranked volunteers for a task |

### Meetings — `/api/meetings`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/meetings/process` | Parse transcript and extract action items (AI) |
| `GET` | `/meetings?eventId=` | List meetings for an event |
| `GET` | `/meetings/:id` | Get meeting with action items |
| `POST` | `/meetings/convert-item` | Convert a single action item to a task |
| `POST` | `/meetings/:id/convert-all` | Convert all action items to tasks |
| `POST` | `/meetings/:id/execute-all-actions` | Execute all meeting-generated actions |

### Risks — `/api/risks`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/risks?eventId=` | List risks (filterable by severity) |
| `POST` | `/risks` | Create a risk |
| `PATCH` | `/risks/:id/status` | Update risk status and mitigation notes |
| `POST` | `/risks/analyze` | Run AI risk analysis on an event |

### AI — `/api/ai`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/copilot` | Query the AI Copilot with an event context |
| `POST` | `/ai/action` | Approve and execute an AI-proposed action |
| `POST` | `/ai/what-if` | Run a what-if scenario simulation |
| `POST` | `/ai/announcement` | Generate multi-channel announcement copy |
| `POST` | `/ai/brain` | Query Club Brain (RAG over club documents) |

### Announcements — `/api/announcements`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/announcements?eventId=` | List announcements |
| `POST` | `/announcements` | Create an announcement |
| `PATCH` | `/announcements/:id` | Update announcement |
| `DELETE` | `/announcements/:id` | Delete announcement |

### WhatsApp — `/api/whatsapp`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/whatsapp/status` | Get WhatsApp connection status |
| `POST` | `/whatsapp/connect` | Initiate WhatsApp Web.js connection (generates QR) |
| `POST` | `/whatsapp/disconnect` | Disconnect WhatsApp session |
| `POST` | `/whatsapp/send-direct` | Send a direct message to a phone number |
| `POST` | `/whatsapp/send-broadcast` | Broadcast a message to multiple numbers |

### Other Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | List user notifications |
| `PATCH` | `/notifications/:id/read` | Mark notification as read |
| `POST` | `/notifications/mark-all-read` | Mark all notifications as read |
| `GET` | `/analytics/:eventId` | Get event analytics |
| `GET` | `/analytics/:eventId/report` | Get post-event summary report |
| `GET/POST/PATCH/DELETE` | `/decisions` | Manage event decisions log |
| `POST` | `/documents/upload` | Upload a document (PDF/DOCX/TXT) |
| `GET` | `/documents?clubId=` | List club documents |
| `DELETE` | `/documents/:id` | Delete a document |
| `GET` | `/` | Backend admin dashboard (HTML, server stats) |

### WebSocket
Connect to `ws://localhost:5000/ws` for real-time event updates (task changes, health score recalculations, AI action completions).

---

## Frontend Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Product overview with live Digital Twin hero simulation |
| `/auth` | Auth Page | Multi-step organizer onboarding (register, OTP verify, login) |
| `/mission-control` | Mission Control | Live event dashboard — health score, risks, task velocity |
| `/digital-twin` | Digital Twin | Interactive React Flow canvas of all tasks and dependencies |
| `/tasks` | Tasks | Full task board with filters, assignments, and dependency management |
| `/war-room` | AI War Room | Crisis mode dashboard for final 48 hours before event |
| `/simulator` | What-If Simulator | Side-by-side scenario impact comparison |
| `/meetings` | Meeting Intelligence | Transcript upload, AI extraction, 1-click task creation |
| `/volunteers` | Volunteers | Volunteer roster, skill profiles, workload view |
| `/risks` | Risk Radar | Risk register with AI analysis and mitigation tracking |
| `/brain` | Club Brain | RAG-powered Q&A over club documents and post-mortems |
| `/announcements` | Announcements | Multi-channel announcement generator and history |
| `/analytics` | Analytics | Charts, task velocity, volunteer performance, health history |

**Global UI:** Command Palette (`Ctrl+K`), AI Copilot drawer, Notification drawer, dark/light theme toggle.

---

## Production Deployment

### Docker Compose (recommended)

Spins up PostgreSQL 16, Redis 7, the Node.js API, and an Nginx-served frontend in one command:

```bash
docker-compose up --build
```

| Service | Port | Description |
|---|---|---|
| `clubops-postgres` | 5432 | PostgreSQL 16 database |
| `clubops-redis` | 6379 | Redis 7 cache and queue broker |
| `clubops-api` | 5000 | Node.js Express API |
| `clubops-frontend` | 3000 | React app served via Nginx |

> **Important:** Before deploying to production, change `JWT_SECRET` in `docker-compose.yml` and set your `GEMINI_API_KEY`. The default password in the compose file is for local testing only.

### Manual Production Build

```bash
# Backend
cd backend
npm install
npm run build          # compiles TypeScript to dist/
npm start              # runs dist/server.js

# Frontend
cd frontend
npm install
npm run build          # outputs to dist/ (serve with Nginx or any static host)
```

---

## Demo Credentials

After running `npm run seed` in the backend:

| Field | Value |
|---|---|
| **Email** | `alex.rivera@techclub.org` |
| **Password** | `password123` |
| **OTP (any prompt)** | `123456` |
| **Club Join Code** | `TECH-2026` |

The seeded workspace includes TechFest 2026 with 52 tasks, 30 volunteers, 10 risks, 5 meetings, 10 documents, and full task dependency chains.

---

## License

MIT
