# Career Mode

Gamify your deep work with FIFA Manager Career Mode mechanics. Every Pomodoro session is a match. Every skill you practice is a player on your squad.

## Deploy in ~5 minutes (free)

### 1. Create a free Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (any name, choose the region closest to you)
3. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Push the database schema

```bash
npm install
DATABASE_URL="your-neon-connection-string" npx prisma migrate dev --name init
```

### 3. Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Add these environment variables in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate one |
| `NEXTAUTH_URL` | Your Vercel URL, e.g. `https://career-mode.vercel.app` |

4. Click **Deploy**

Visit your Vercel URL, create an account, and start playing.

---

## Run locally

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL and NEXTAUTH_SECRET in .env
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 — JWT sessions, email + password |
| Hosting | Vercel |
