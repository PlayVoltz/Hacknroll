# Setting Up Supabase for Vercel Deployment

## Step 1: Create Supabase Account & Project

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign in"** (if you already have an account)
3. Sign in with GitHub (recommended) or email
4. Once logged in, click **"New project"**
5. Fill in the form:
   - **Name**: `hacknroll` (or any name you like)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., `US East (N. Virginia)` for best performance)
   - **Pricing Plan**: Free tier is fine for starting out
6. Click **"Create new project"**
7. Wait 1-2 minutes for the database to be provisioned

## Step 2: Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** (gear icon in left sidebar)
2. Click **Database** (under Project Settings)
3. Scroll down to **"Connection string"** section
4. Make sure **"URI"** tab is selected
5. Copy the **connection string** (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
   **⚠️ Important:** Replace `[YOUR-PASSWORD]` with the database password you created in Step 1.

   **Full example:**
   ```
   postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

## Step 3: Use Connection String in Vercel

1. Go to your **backend Vercel project** dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your connection string (with the password replaced)
   - **Environment**: Select **Production** (and optionally Preview/Development too)
4. Click **Save**

## Step 4: Run Migrations Locally (One-Time Setup)

Run these commands on your local machine to create the database tables:

```bash
cd backend
npm install

# Replace with your actual Supabase connection string
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres" npx prisma migrate deploy

# Seed the database with demo users
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres" npm run seed
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with your actual Supabase database password
- Replace `db.xxxxx.supabase.co` with your actual Supabase host
- This creates all the tables and adds demo users (`alex@example.com` / `sam@example.com`)

## Step 5: Verify It Works

1. Go back to Supabase dashboard → **Table Editor**
2. You should see tables like:
   - `User`
   - `Group`
   - `GroupMember`
   - `Wallet`
   - `Transaction`
   - etc.

3. Check the `User` table - you should see 2 demo users

## Troubleshooting

**Connection refused?**
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- Check that your Supabase project is fully provisioned (should show green checkmark)

**Can't find connection string?**
- Make sure you're in **Settings** → **Database** (not just Settings)
- Look for **"Connection string"** section (scroll down if needed)

**Migrations fail?**
- Double-check your connection string format
- Make sure your database password doesn't have special characters that need URL encoding
- If password has special chars, you may need to URL-encode them (e.g., `@` becomes `%40`)

## Alternative: Use Supabase Connection Pooler (Recommended for Serverless)

For better performance with Vercel serverless functions, use the **Connection Pooler** string instead:

1. In Supabase → **Settings** → **Database**
2. Look for **"Connection pooling"** section
3. Copy the **"Transaction mode"** connection string (starts with `postgresql://postgres.xxxxx`)
4. Use this in Vercel instead of the regular connection string

This helps avoid connection limits in serverless environments.
