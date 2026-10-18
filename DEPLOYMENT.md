# 🚀 Step-by-Step Guide: How to Host ReachInbox for 100% Free

This guide walks you through deploying the complete **ReachInbox Full-Stack Email Job Scheduler** to the cloud completely free — **no credit card required, zero trial expiration traps, and no surprise bills**.

---

## 🏛️ Free Cloud Architecture Overview

| Component | Cloud Provider | Free Tier Specifications | Credit Card Required? |
| :--- | :--- | :--- | :---: |
| **Frontend UI** | **Vercel** | Next.js 14 edge CDN, automated GitHub CI/CD, SSL | **NO** |
| **Backend & Worker** | **Render.com** | Web Service, 750 free hours/month, auto Git deploys | **NO** |
| **PostgreSQL Database** | **Neon.tech** | 0.5 GB Serverless Postgres, compute autoscaling | **NO** |
| **Redis (BullMQ Queue)** | **Upstash** or **Redis Cloud** | 10,000 free commands/day, TLS, persistent storage | **NO** |
| **Fake SMTP Server** | **Ethereal Email** | Unlimited fake SMTP testing with live preview URLs | **NO** |

---

## 📋 Pre-requisites
1. A **GitHub account** with this project pushed to a repository:
   - Contains `/frontend` and `/backend` directories.
2. Free accounts on:
   - [Neon.tech](https://neon.tech)
   - [Upstash.com](https://upstash.com)
   - [Render.com](https://render.com)
   - [Vercel.com](https://vercel.com)

---

## Step 1: Create a Free PostgreSQL Database (Neon.tech)

1. Go to **[https://neon.tech](https://neon.tech)** and click **Sign Up** (use your GitHub or Google account).
2. Click **Create Project**:
   - **Project Name**: `reachinbox-db`
   - **Postgres version**: `16` (default)
   - **Region**: Choose the region closest to you (e.g., `US East (Ohio)` or `Europe (Frankfurt)`).
3. Click **Create Project**.
4. In the Neon dashboard under **Connection Details**:
   - Ensure **Pooled connection** is selected.
   - Copy the connection string. It will look like:
     ```text
     postgresql://reachinbox_owner:ab1234cde@ep-bold-moon-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Save this URL — this is your `DATABASE_URL`.

---

## Step 2: Create a Free Redis Database (Upstash)

BullMQ requires Redis for delayed job scheduling, worker concurrency, and rate limiting.

1. Go to **[https://upstash.com](https://upstash.com)** and sign in with GitHub.
2. In the console, click **Create Database**:
   - **Name**: `reachinbox-redis`
   - **Type**: `Regional`
   - **Region**: Choose the same or closest region as your Neon database.
   - **Eviction**: Leave disabled (so delayed jobs remain persistent).
3. Click **Create**.
4. Under the database **Details** tab, scroll to **Node.js (ioredis)**:
   - Copy the `UPSTASH_REDIS_REST_URL` or standard Redis connection URL.
   - Look for the **Redis URL** (starts with `rediss://...`):
     ```text
     rediss://default:your_upstash_password@your-endpoint.upstash.io:6379
     ```
   - Save this URL — this is your `REDIS_URL`.

*(Alternative: You can also use [Redis Cloud by Redis.com](https://redis.com/try-free/) which provides a permanent 30MB free database).*

---

## Step 3: Deploy the Backend API & BullMQ Worker (Render.com)

Render allows you to run Express.js and BullMQ worker processes on their free tier.

1. Go to **[https://render.com](https://render.com)** and sign in with GitHub.
2. Click **New +** in the top navigation bar and select **Web Service**.
3. Select your GitHub repository (`project_email` or your repo name) and click **Connect**.
4. Fill in the service configuration:
   - **Name**: `reachinbox-backend-105` *(or `reachinbox-backend-<yourname>` — Render requires this name to be globally unique because it becomes your URL: `https://<name>.onrender.com`)*
   - **Region**: Same region as your database (e.g. `Ohio (US East)` or `Frankfurt (EU Central)`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && npm run build
     ```
     *(This automatically installs dependencies, synchronizes the database tables with Neon, and builds the TypeScript files)*
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: Select **Free** ($0/month).

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Recommended Value | Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render assigns port 10000 by default |
| `DATABASE_URL` | *(Your Neon.tech connection string)* | From Step 1 |
| `REDIS_URL` | *(Your Upstash Redis connection string)* | From Step 2 (`rediss://...`) |
| `WORKER_CONCURRENCY` | `50` | BullMQ worker concurrency |
| `INTER_EMAIL_DELAY_MS` | `2000` | 2 seconds minimum delay between emails |
| `MAX_EMAILS_PER_HOUR` | `200` | Rate limiting threshold |
| `JWT_SECRET` | `generate_any_secure_random_string_32_chars` | Used to sign auth tokens |
| `BACKEND_URL` | `https://reachinbox-backend.onrender.com` | (Your Render service URL once generated) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | (We will update this after Step 4) |

6. Click **Create Web Service**.
7. Render will begin building. Wait 2-3 minutes. Once the build finishes, you will see:
   ```text
   ==> Your service is live 🎉 at https://reachinbox-backend.onrender.com
   ```
8. **Verify Backend Health**:
   Open `https://your-backend.onrender.com/api/health` in your browser. You should receive:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-...",
     "database": "connected",
     "redis": "connected",
     "queueDepth": 0
   }
   ```
9. **Verify Bull-Board Queue Dashboard**:
   Open `https://your-backend.onrender.com/admin/queues` in your browser. You will see the live BullMQ monitoring dashboard showing your queue (`reachinbox-email-queue`).

> [!NOTE]
> **Render Free Tier Sleep Mode**:
> Free web services on Render go to sleep after 15 minutes of inactivity. When a new request arrives, it takes ~30–45 seconds to spin back up. The frontend has an automatic 60-second timeout to handle this gracefully.

---

## Step 4: Deploy the Frontend Dashboard (Vercel)

Vercel provides native, high-performance hosting for Next.js 14 with global edge caching and zero configuration.

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the project configuration screen:
   - **Project Name**: `reachinbox-dashboard`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend`.
5. Expand **Environment Variables** and add:

| Key | Value | Note |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://reachinbox-backend.onrender.com/api` | Point to your Render backend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(Optional, your Google OAuth Client ID)* | For Google Sign-in |

6. Click **Deploy**.
7. In ~60 seconds, your deployment will complete and provide your live URL (e.g., `https://reachinbox-dashboard.vercel.app`).
8. **Sync Backend FRONTEND_URL**:
   - Go back to **Render.com** → your backend service → **Environment**.
   - Update `FRONTEND_URL` to your actual Vercel URL (e.g. `https://reachinbox-dashboard.vercel.app`).
   - Click **Save Changes** (Render will redeploy with zero downtime).

---

## Step 5: (Optional) Free Google OAuth Setup

To enable one-click Google Sign-in on your live hosted app:

1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Navigate to **APIs & Services** → **Credentials**.
3. Click your OAuth 2.0 Client ID (or click **Create Credentials** → **OAuth client ID**).
4. Under **Authorized JavaScript origins**, add:
   - `https://your-dashboard.vercel.app`
   - `http://localhost:3000` (for local development)
5. Under **Authorized redirect URIs**, add:
   - `https://your-dashboard.vercel.app`
   - `https://your-backend.onrender.com/api/auth/google/callback`
6. Click **Save**.
7. Copy your `Client ID` and paste it into:
   - Vercel Environment Variables: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Render Environment Variables: `GOOGLE_CLIENT_ID`
8. Redeploy frontend and backend on Vercel and Render.

*(Note: If you don't configure Google OAuth, you can still sign in using standard email/password or click "Quick Demo Login" in the dashboard).*

---

## Step 6: Verify Everything Is Working

1. Open your live frontend: `https://your-dashboard.vercel.app`
2. **Log In**:
   - Enter your email/password or use Google Sign-in.
3. **Verify Pre-loaded Data**:
   - The system automatically seeds sample scheduled and sent emails so your dashboard looks populated right away.
4. **Schedule a Test Email**:
   - Click the green **Compose** button.
   - Enter a test recipient (e.g. `lead@example.com`).
   - Write a subject and body.
   - Click the clock icon (**Send Later**) and choose a future time or send immediately.
   - Click **Schedule / Send**.
5. **Inspect the Sent Email**:
   - Switch to the **Sent** tab.
   - Click on the email row to see the details, headers, delivery status, and click **Preview Email (Ethereal)** to view the live rendered email!
6. **Inspect the BullMQ Queue**:
   - Visit `https://your-backend.onrender.com/admin/queues` to inspect live active jobs, completed jobs, and delayed queues.

---

## 🎯 Summary of URLs to Submit

Once deployed, you will have:

- **Live Frontend App**: `https://<your-project>.vercel.app`
- **Live Backend API**: `https://<your-backend>.onrender.com/api`
- **Live Bull-Board Dashboard**: `https://<your-backend>.onrender.com/admin/queues`
- **API Health Check**: `https://<your-backend>.onrender.com/api/health`

You now have a 100% production-ready, fully hosted cold email scheduling system running in the cloud with zero hosting costs!

