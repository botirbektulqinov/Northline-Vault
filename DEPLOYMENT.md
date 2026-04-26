# 🚀 Northline Vault — Vercel Deployment Guide

## Prerequisites

- GitHub repository: `https://github.com/botirbektulqinov/Northline-Vault`
- A [Vercel](https://vercel.com) account (free, sign in with GitHub)
- A [Neon](https://neon.tech) account (free PostgreSQL database)

---

## Step 1: Create a Free PostgreSQL Database (Neon)

1. Go to [https://neon.tech](https://neon.tech) and sign up (GitHub login available)
2. Click **"New Project"**
3. Name it `northline-vault`
4. Select region closest to you
5. Click **"Create Project"**
6. Copy the **connection string** — it looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Deploy to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select **`botirbektulqinov/Northline-Vault`** from the list
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `prisma generate && prisma db push && next build`
   - **Output Directory**: leave default (`.next`)
5. Open **"Environment Variables"** section and add:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | *(paste your Neon connection string from Step 1)* |
6. Click **"Deploy"** 🎉

---

## Step 3: Done! 

After deployment completes (~2-3 minutes), your app will be live at:

```
https://northline-vault.vercel.app
```

> ⚡ **Auto CI/CD**: Every time you `git push` to the `main` branch, Vercel automatically rebuilds and deploys your app!

---

## Custom Domain (Optional)

1. Go to your Vercel project → **Settings** → **Domains**
2. Add your custom domain (e.g., `vault.yourdomain.com`)
3. Follow the DNS configuration instructions

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |

---

## Useful Commands

```bash
# Run locally with PostgreSQL
DATABASE_URL="your-neon-url" npm run dev

# Push schema to database
DATABASE_URL="your-neon-url" npx prisma db push

# View database in browser
DATABASE_URL="your-neon-url" npx prisma studio
```

---

## Troubleshooting

### Build fails with Prisma error
Make sure `DATABASE_URL` is set in Vercel environment variables.

### Database connection error
- Check that your Neon database is active (not paused)
- Verify the connection string includes `?sslmode=require`

### Changes not deploying
- Ensure you're pushing to the `main` branch
- Check Vercel dashboard for build logs
