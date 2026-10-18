# ReachInbox - Production-Grade Full-Stack Email Job Scheduler

A production-grade, highly reliable email scheduler service and dashboard built for **ReachInbox.ai** using **TypeScript, Express.js, PostgreSQL (Prisma), Redis, BullMQ, Elasticsearch, Next.js, and Tailwind CSS**.

---

## 🌟 Key Features & Requirements Compliance

| Requirement | Implementation & Tech Stack |
| :--- | :--- |
| **Backend Framework** | Node.js + TypeScript + Express.js |
| **Scheduler Engine** | **BullMQ + Redis delayed jobs** (Strictly **NO CRON JOBS**) |
| **Database** | **PostgreSQL** with **Prisma ORM** |
| **SMTP Delivery** | **Ethereal Email** (fake SMTP with live web preview URLs) |
| **Multi-Sender Support** | Per-user multiple sender identities, custom SMTP support |
| **Server Restart Survival** | PostgreSQL source of truth + automatic queue reconciliation on startup |
| **Concurrency** | Configurable BullMQ worker concurrency (`WORKER_CONCURRENCY`) |
| **Inter-Email Delay** | **Minimum 2 seconds (2000ms)** delay between emails (`INTER_EMAIL_DELAY_MS`) via atomic Redis slot reservations |
| **Hourly Rate Limiting** | Configurable per-sender hourly limit (`MAX_EMAILS_PER_HOUR=200`) using Redis atomic counters; auto-reschedules without dropping jobs |
| **Slack Live Alert on Limit** | Real OAuth + Incoming Webhook flow; live Slack alert triggered the exact moment a sender hits the hourly limit |
| **Elasticsearch Search** | Emails indexed in **Elasticsearch 8.x** with full-text search across subject, body, and recipient with resilient DB fallback |
| **Live Queue Dashboard** | **Bull-Board UI** exposed live at `/admin/queues` |
| **Frontend Framework** | **Next.js 14 (App Router) + TypeScript + Tailwind CSS** matching Figma |
| **Google Authentication** | Real Google OAuth popup with account switcher, profile avatar & logout |

---

## 🏗 System Architecture

```text
               +----------------------------------------+
               |        Next.js Frontend (Port 3000)     |
               |  (Google OAuth, Figma UI, Slack Modal) |
               +-------------------+--------------------+
                                   |
                                   v  REST API
               +-------------------+--------------------+
               |       Express.js Backend (Port 5000)   |
               +---------+---------+----------+---------+
                         |         |          |
         +---------------+         |          +----------------+
         v                         v                           v
+-----------------+      +-------------------+       +--------------------+
|   PostgreSQL    |      |   Redis (BullMQ)  |       |   Elasticsearch    |
| (Source of Truth|      | (Delayed Queue &  |       | (Full-text search  |
|  & Persistence) |      |   Rate Limiting)  |       |   & email indexing)|
+-----------------+      +---------+---------+       +--------------------+
                                   |
                                   v
                         +-------------------+
                         |   BullMQ Worker   |
                         |  (Concurrency=50) |
                         +---------+---------+
                                   |
                         +---------+---------+
                         |                   |
                         v                   v
              +--------------------+  +--------------------+
              |   Ethereal SMTP    |  |    Slack Alerts    |
              | (Fake Email & URL) |  | (Rate-limit Alerts)|
              +--------------------+  +--------------------+
```

---

## 🚀 Quick Start Guide

### 1. Infrastructure (Docker or Local)

You can launch PostgreSQL, Redis, and Elasticsearch using the included `docker-compose.yml`:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16**: `localhost:5432` (db: `reachinbox_db`, user: `reachinbox`, pass: `reachinbox_password`)
- **Redis 7**: `localhost:6379`
- **Elasticsearch 8.13**: `localhost:9200`

*(If you already have PostgreSQL and Redis installed locally, they will connect seamlessly using standard ports.)*

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Push database schema to PostgreSQL
npx prisma db push

# Build TypeScript code
npm run build

# Start the server (includes BullMQ worker, Bull-Board, and APIs)
npm run dev
# OR for production:
npm start
```

Backend will run on:
- **API URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **BullMQ Live Queue Dashboard**: `http://localhost:5000/admin/queues`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Frontend will run on:
- **Web Dashboard**: `http://localhost:3000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# PostgreSQL Connection
DATABASE_URL="postgresql://reachinbox:reachinbox_password@127.0.0.1:5432/reachinbox_db?schema=public"

# Redis Connection
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Queue & Concurrency Controls
WORKER_CONCURRENCY=50
INTER_EMAIL_DELAY_MS=2000
DEFAULT_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200
PROCESSING_TIMEOUT_MS=120000

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Slack OAuth & Webhook Integration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback

# JWT & Session
JWT_SECRET="reachinbox_super_secret_jwt_key_2026"

# Ethereal SMTP (Leave blank to automatically generate ephemeral test credentials)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASSWORD=""
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 📬 Ethereal Email Setup & Verification

- The backend integrates with **Ethereal Email** via Nodemailer.
- If `SMTP_USER` and `SMTP_PASSWORD` are not specified, Nodemailer automatically invokes `nodemailer.createTestAccount()` on demand and logs the generated credentials.
- Every email sent returns a **Live Ethereal Preview URL** (e.g. `https://ethereal.email/message/atJtLKfttlACJVh6...`).
- In the frontend dashboard (under **Sent Emails** or in the email detail drawer), click **"Preview Email ↗"** to open the real rendered HTML message in Ethereal.

---

## 🧠 Deep Dive: Scheduling, Concurrency, and Rate Limiting

### 1. Persistent Scheduling Without Cron Jobs
- **Strictly No Cron**: No OS cron, `node-cron`, or polling loops.
- **BullMQ Delayed Jobs**: Each email is registered with `jobId = emailJobId` and `delay = Math.max(0, scheduledAt.getTime() - Date.now())`.
- **Deterministic Job IDs**: Prevents duplicate job creation and maintains strict idempotency.

### 2. Resilience and Persistence Across Server Restarts
- **PostgreSQL Source of Truth**: All campaigns and email jobs persist in PostgreSQL with state machine: `SCHEDULED` → `PROCESSING` → `SENT` / `FAILED`.
- **Startup Reconciliation**: When the server boots up, `reconcileQueuedJobs()` checks PostgreSQL for all `SCHEDULED` jobs and verifies their existence in Redis. If any job was lost or evicted, it is re-enqueued with the remaining delay.
- **Stale Processing Recovery**: If a server crashes mid-flight, `recoverStaleProcessingJobs()` resets jobs where `lockedUntil < NOW()` back to `SCHEDULED`.

### 3. Concurrency & Inter-Email Delay
- **Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` (default: 50 concurrent jobs).
- **Inter-Email Delay (Minimum 2 Seconds)**:
  - We enforce a minimum delay of **2000ms (2 seconds)** between emails from the same sender to mimic ISP provider throttling.
  - Implemented using an **atomic Lua script in Redis** (`reserveSendSlot`), reserving monotonically increasing send slots per sender. Even under high concurrency across multiple worker threads, jobs from the same sender are guaranteed to space out by at least 2 seconds.

### 4. Hourly Rate Limiting & Non-Dropping Rescheduling
- **Per-Sender Hourly Limit**: Configurable via `MAX_EMAILS_PER_HOUR` (default: 200 emails/hour).
- **Atomic Counter**: Keyed by `email-rate:{senderId}:{hourWindow}` in Redis with 1-hour TTL.
- **Rescheduling Behavior**:
  - If a sender reaches their hourly limit, **jobs are NOT dropped or permanently failed**.
  - The job is automatically postponed and re-enqueued for the start of the next hour window (`getNextHourWindowStart()`).
  - Queue order is preserved.

### 5. Live Slack Alerts on Rate Limit Hit
- **Connecting Slack**:
  - In the dashboard, click **"Connect Slack"** in the top header.
  - Users can authorize via real **Slack OAuth** or enter a **Slack Incoming Webhook URL**.
  - Includes a **"Send Live Test Alert"** button to verify delivery instantly in the demo.
- **Live Trigger**: The moment a sender hits the hourly limit during job execution, `sendRateLimitSlackNotification()` dispatches a rich Slack card to the user's channel with sender details, limit, and next window timestamp.
- **Graceful Handling**: If Slack is not connected, rate limits are silently enforced without crashing. When connected later, alerts begin delivering immediately without requiring a restart.
- **Anti-Spam Deduplication**: Uses a Redis cooldown key so that 1000 burst emails don't spam Slack 1000 times in the same hour window.

### 6. Elasticsearch Search Integration
- Sent and scheduled emails are automatically indexed into Elasticsearch (`reachinbox_emails` index).
- Multi-field full-text search across `subject^3`, `recipient^2`, `recipientName^2`, `body`, and `senderEmail`.
- Dedicated endpoints:
  - `GET /api/emails/elasticsearch/search?q=...&status=...`
  - `POST /api/emails/elasticsearch/sync`
- Transparent fallback to PostgreSQL full-text `contains` if Elasticsearch is offline, ensuring zero UI downtime.

---

## 🖥 Frontend Walkthrough & Figma Fidelity

1. **Google Login Page (`/login`)**:
   - Clean authentication interface with Google Sign-In and account selector.
   - Redirects to `/dashboard/scheduled` on successful sign-in.
2. **Main Dashboard Header (`Header.tsx`)**:
   - Displays user avatar, user name, and email.
   - **Logout** button.
   - **"Connect Slack"** modal trigger with live status indicator.
   - **"BullMQ Queue"** link pointing to `/admin/queues`.
   - Global search input (powered by Elasticsearch).
3. **Scheduled Emails (`/dashboard/scheduled`)**:
   - Tab switcher between Scheduled and Sent emails matching Figma design.
   - Primary **"+ Compose New Email"** button.
   - Clean table view with Recipient, Subject, Scheduled Time, and Status badges.
   - Loading skeleton states and empty state illustrations.
4. **Sent Emails (`/dashboard/sent`)**:
   - Displays delivered messages with Sent timestamp and status (`sent` / `failed`).
   - One-click **"Preview Email ↗"** button opening the message in Ethereal Email.
5. **Compose Campaign (`/dashboard/compose`)**:
   - Sender selection and display.
   - Recipient input with multi-chip support.
   - **CSV/Text Lead Importer** with validation and lead count detection.
   - Subject line and Rich Text Editor for email body.
   - **Schedule Panel**: Date, Time picker, Quick presets, Delay between emails (seconds), and Hourly Limit.
   - Immediate Send or Scheduled Queue dispatch.

---

## 🧪 Demo Video Script (5 Minutes)

1. **Login & Dashboard**:
   - Open `http://localhost:3000`.
   - Sign in with Google; show user name, email, and avatar in the header.
2. **Compose & Schedule Email**:
   - Click **"+ Compose New Email"**.
   - Upload sample CSV or type recipient email.
   - Set Subject, Body, and Schedule time.
   - Click **Schedule**; show it appear in the **Scheduled Emails** tab.
3. **Inspect Live BullMQ Dashboard**:
   - Click **"BullMQ Queue"** in the header or visit `http://localhost:5000/admin/queues`.
   - Show the delayed job in Redis with delay timer counting down.
4. **Email Delivery & Ethereal Preview**:
   - Wait for or trigger dispatch; verify it moves to **Sent Emails**.
   - Click **"Preview Email ↗"** to show the live rendered message on Ethereal.
5. **Server Restart Survival**:
   - Schedule an email 5 minutes in the future.
   - Stop backend server (`Ctrl+C` or kill task).
   - Start backend server again (`node dist/index.js` or `npm run dev`).
   - Query `/api/health` and show `queueDepth: 1` — job is preserved and sends at the exact scheduled time!
6. **Slack Rate Limit Notification**:
   - Open **"Connect Slack"** modal in header; enter webhook URL.
   - Click **"Send Live Test Alert"** to demonstrate verifiable Slack message delivery.
   - Demonstrate automatic postponement into next hour window when limit is reached.
7. **Elasticsearch Search**:
   - Type a query in the search bar; show filtered matching emails instantly.

---

## 🛡 Assumptions & Trade-Offs

1. **Elasticsearch Fallback**: For developers running without Docker or in environments where Elasticsearch is not running, searches seamlessly fall back to PostgreSQL `contains` mode so the platform never crashes.
2. **Slack Webhook + OAuth Dual Mode**: While full OAuth is implemented, an Incoming Webhook input was also provided in the modal to allow immediate end-to-end testing without having to register a public ngrok domain for local Slack OAuth callbacks.
3. **Spam & Anti-Abuse**: In addition to hourly rate limiting, an unsubscribe link and list-unsubscribe header are injected into every outgoing message to conform with CAN-SPAM and RFC standards.
