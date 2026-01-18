#!/bin/bash
set -e

echo "🚀 Vercel Deployment Automation for Hacknroll"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel@latest
fi

echo -e "${GREEN}✅ Vercel CLI installed${NC}"
echo ""

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo -e "${BLUE}Please log in (this will open a browser)...${NC}"
    vercel login
fi

VERCEL_USER=$(vercel whoami)
echo -e "${GREEN}✅ Logged in as: ${VERCEL_USER}${NC}"
echo ""

# Get Postgres connection string
echo -e "${YELLOW}📊 Postgres Database Setup${NC}"
echo "You need a Postgres database. Options:"
echo "  1. Vercel Postgres (recommended - easiest)"
echo "  2. Neon (https://neon.tech - free tier available)"
echo "  3. Supabase (https://supabase.com - free tier available)"
echo "  4. Other Postgres provider"
echo ""
read -p "Enter your Postgres connection string (postgresql://...): " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Database URL is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database URL received${NC}"
echo ""

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}✅ Generated JWT_SECRET${NC}"
fi

# Step 1: Setup database
echo -e "${BLUE}📦 Setting up database...${NC}"
cd backend
npm install

echo -e "${BLUE}Running Prisma migrations...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

echo -e "${BLUE}Seeding database...${NC}"
DATABASE_URL="$DATABASE_URL" npm run seed

echo -e "${GREEN}✅ Database setup complete${NC}"
cd ..
echo ""

# Step 2: Deploy backend
echo -e "${BLUE}🚀 Deploying backend...${NC}"
cd backend

# Check if project already exists
BACKEND_PROJECT_NAME="hacknroll-backend"
BACKEND_EXISTS=$(vercel ls 2>/dev/null | grep -q "$BACKEND_PROJECT_NAME" && echo "yes" || echo "no")

if [ "$BACKEND_EXISTS" = "no" ]; then
    echo -e "${YELLOW}Creating new backend project...${NC}"
    # Create project (non-interactive)
    vercel --yes --name "$BACKEND_PROJECT_NAME" 2>/dev/null || true
fi

# Set environment variables
echo -e "${BLUE}Setting environment variables...${NC}"
vercel env add DATABASE_URL production <<< "$DATABASE_URL" 2>/dev/null || \
    vercel env rm DATABASE_URL production --yes 2>/dev/null; \
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"

vercel env add JWT_SECRET production <<< "$JWT_SECRET" 2>/dev/null || \
    vercel env rm JWT_SECRET production --yes 2>/dev/null; \
    vercel env add JWT_SECRET production <<< "$JWT_SECRET"

# We'll update CLIENT_ORIGIN after frontend deploys
echo -e "${YELLOW}Note: CLIENT_ORIGIN will be set after frontend deployment${NC}"

# Deploy
echo -e "${BLUE}Deploying...${NC}"
BACKEND_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}Could not extract backend URL from output. Please check Vercel dashboard.${NC}"
    read -p "Enter your backend Vercel URL (e.g., https://hacknroll-backend.vercel.app): " BACKEND_URL
fi

echo -e "${GREEN}✅ Backend deployed: ${BACKEND_URL}${NC}"
cd ..
echo ""

# Step 3: Deploy frontend
echo -e "${BLUE}🚀 Deploying frontend...${NC}"
cd frontend
npm install

# Check if project already exists
FRONTEND_PROJECT_NAME="hacknroll-frontend"
FRONTEND_EXISTS=$(vercel ls 2>/dev/null | grep -q "$FRONTEND_PROJECT_NAME" && echo "yes" || echo "no")

if [ "$FRONTEND_EXISTS" = "no" ]; then
    echo -e "${YELLOW}Creating new frontend project...${NC}"
    vercel --yes --name "$FRONTEND_PROJECT_NAME" 2>/dev/null || true
fi

# Set environment variable
echo -e "${BLUE}Setting environment variables...${NC}"
vercel env add BACKEND_ORIGIN production <<< "$BACKEND_URL" 2>/dev/null || \
    vercel env rm BACKEND_ORIGIN production --yes 2>/dev/null; \
    vercel env add BACKEND_ORIGIN production <<< "$BACKEND_URL"

# Deploy
echo -e "${BLUE}Deploying...${NC}"
FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}Could not extract frontend URL from output. Please check Vercel dashboard.${NC}"
    read -p "Enter your frontend Vercel URL (e.g., https://hacknroll-frontend.vercel.app): " FRONTEND_URL
fi

echo -e "${GREEN}✅ Frontend deployed: ${FRONTEND_URL}${NC}"
cd ..
echo ""

# Step 4: Update backend CLIENT_ORIGIN
echo -e "${BLUE}🔄 Updating backend CLIENT_ORIGIN...${NC}"
cd backend
vercel env add CLIENT_ORIGIN production <<< "$FRONTEND_URL" 2>/dev/null || \
    vercel env rm CLIENT_ORIGIN production --yes 2>/dev/null; \
    vercel env add CLIENT_ORIGIN production <<< "$FRONTEND_URL"

echo -e "${BLUE}Redeploying backend with updated CLIENT_ORIGIN...${NC}"
vercel --prod --yes > /dev/null 2>&1
cd ..
echo ""

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} ${FRONTEND_URL}"
echo -e "${BLUE}Backend:${NC}  ${BACKEND_URL}"
echo ""
echo -e "${YELLOW}Demo Accounts:${NC}"
echo "  Email: alex@example.com"
echo "  Password: password123"
echo ""
echo -e "${BLUE}Health Check:${NC} ${BACKEND_URL}/health"
echo ""
echo -e "${GREEN}🎉 Your app is live!${NC}"
