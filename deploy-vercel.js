#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.stdout || error.message}`);
  }
}

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', ...options });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function main() {
  console.log('\n🚀 Vercel Deployment Automation for Hacknroll');
  console.log('==============================================\n');

  // Check Vercel CLI
  try {
    exec('vercel --version');
  } catch {
    console.log('❌ Vercel CLI not found. Installing...');
    exec('npm install -g vercel@latest');
  }
  console.log('✅ Vercel CLI ready\n');

  // Check login
  try {
    const user = exec('vercel whoami').trim();
    console.log(`✅ Logged in as: ${user}\n`);
  } catch {
    console.log('⚠️  Not logged in. Please log in...');
    console.log('This will open a browser for authentication...\n');
    await spawnAsync('vercel', ['login']);
    const user = exec('vercel whoami').trim();
    console.log(`✅ Logged in as: ${user}\n`);
  }

  // Get Postgres URL
  console.log('📊 Postgres Database Setup');
  console.log('You need a Postgres database. Options:');
  console.log('  1. Vercel Postgres (recommended)');
  console.log('  2. Neon (https://neon.tech)');
  console.log('  3. Supabase (https://supabase.com)');
  console.log('  4. Other\n');
  
  const databaseUrl = await question('Enter your Postgres connection string (postgresql://...): ');
  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    console.error('❌ Invalid database URL');
    process.exit(1);
  }
  console.log('✅ Database URL received\n');

  // Generate JWT secret
  const jwtSecret = exec('openssl rand -hex 32').trim();
  console.log('✅ Generated JWT_SECRET\n');

  // Step 1: Setup database
  console.log('📦 Setting up database...');
  const backendDir = path.join(__dirname, 'backend');
  process.chdir(backendDir);
  exec('npm install', { stdio: 'inherit' });

  console.log('Running Prisma migrations...');
  exec(`DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`, { stdio: 'inherit' });

  console.log('Seeding database...');
  exec(`DATABASE_URL="${databaseUrl}" npm run seed`, { stdio: 'inherit' });
  console.log('✅ Database setup complete\n');

  // Step 2: Deploy backend
  console.log('🚀 Deploying backend...');
  
  // Create .vercelignore if needed
  const vercelIgnore = path.join(backendDir, '.vercelignore');
  if (!fs.existsSync(vercelIgnore)) {
    fs.writeFileSync(vercelIgnore, 'node_modules\n*.db\n*.log\n.env\n');
  }

  // Deploy backend (will prompt for project name if new)
  console.log('\n📝 Backend deployment:');
  console.log('   - If asked for project name, use: hacknroll-backend');
  console.log('   - If asked to link to existing project, choose "No" (unless you want to link)');
  console.log('   - If asked about settings, accept defaults\n');
  
  const backendOutput = exec('vercel --prod --yes', { encoding: 'utf8', stdio: 'pipe' });
  const backendUrlMatch = backendOutput.match(/https:\/\/[^\s]+\.vercel\.app/);
  let backendUrl = backendUrlMatch ? backendUrlMatch[0] : null;

  if (!backendUrl) {
    backendUrl = await question('\nEnter your backend Vercel URL (e.g., https://hacknroll-backend.vercel.app): ');
  }

  console.log(`✅ Backend deployed: ${backendUrl}\n`);

  // Set backend environment variables via Vercel CLI
  console.log('Setting backend environment variables...');
  try {
    // Note: Vercel CLI env commands require interactive input, so we'll use a workaround
    console.log('\n⚠️  Manual step required:');
    console.log(`   1. Go to: https://vercel.com/dashboard`);
    console.log(`   2. Find project: hacknroll-backend (or check your deployment URL)`);
    console.log(`   3. Go to Settings → Environment Variables`);
    console.log(`   4. Add these variables for "Production":`);
    console.log(`      DATABASE_URL = ${databaseUrl}`);
    console.log(`      JWT_SECRET = ${jwtSecret}`);
    console.log(`      CLIENT_ORIGIN = (we'll set this after frontend deploys)`);
    console.log(`\n   Or run these commands manually:`);
    console.log(`   cd backend`);
    console.log(`   vercel env add DATABASE_URL production`);
    console.log(`   vercel env add JWT_SECRET production`);
    
    const continueDeploy = await question('\nPress Enter after you\'ve set the environment variables...');
  } catch (error) {
    console.log('Note: Environment variables may need to be set manually in Vercel dashboard');
  }

  // Step 3: Deploy frontend
  console.log('\n🚀 Deploying frontend...');
  const frontendDir = path.join(__dirname, 'frontend');
  process.chdir(frontendDir);
  exec('npm install', { stdio: 'inherit' });

  console.log('\n📝 Frontend deployment:');
  console.log('   - If asked for project name, use: hacknroll-frontend');
  console.log('   - If asked to link to existing project, choose "No"');
  console.log('   - If asked about settings, accept defaults\n');

  const frontendOutput = exec('vercel --prod --yes', { encoding: 'utf8', stdio: 'pipe' });
  const frontendUrlMatch = frontendOutput.match(/https:\/\/[^\s]+\.vercel\.app/);
  let frontendUrl = frontendUrlMatch ? frontendUrlMatch[0] : null;

  if (!frontendUrl) {
    frontendUrl = await question('\nEnter your frontend Vercel URL (e.g., https://hacknroll-frontend.vercel.app): ');
  }

  console.log(`✅ Frontend deployed: ${frontendUrl}\n`);

  // Set frontend environment variable
  console.log('Setting frontend environment variable...');
  console.log('\n⚠️  Manual step required:');
  console.log(`   1. Go to: https://vercel.com/dashboard`);
  console.log(`   2. Find project: hacknroll-frontend`);
  console.log(`   3. Go to Settings → Environment Variables`);
  console.log(`   4. Add for "Production": BACKEND_ORIGIN = ${backendUrl}`);
  console.log(`\n   Or run:`);
  console.log(`   cd frontend`);
  console.log(`   vercel env add BACKEND_ORIGIN production`);
  
  const continueFinal = await question('\nPress Enter after setting BACKEND_ORIGIN...');

  // Step 4: Update backend CLIENT_ORIGIN
  console.log('\n🔄 Updating backend CLIENT_ORIGIN...');
  console.log(`\n⚠️  Manual step required:`);
  console.log(`   1. Go to: https://vercel.com/dashboard`);
  console.log(`   2. Find project: hacknroll-backend`);
  console.log(`   3. Go to Settings → Environment Variables`);
  console.log(`   4. Add/Update CLIENT_ORIGIN = ${frontendUrl}`);
  console.log(`   5. Redeploy the backend project`);
  console.log(`\n   Or run:`);
  console.log(`   cd backend`);
  console.log(`   vercel env add CLIENT_ORIGIN production`);
  console.log(`   vercel --prod`);

  const finalStep = await question('\nPress Enter after updating CLIENT_ORIGIN and redeploying backend...');

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('✅ Deployment Setup Complete!');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log(`Frontend: ${frontendUrl}`);
  console.log(`Backend:  ${backendUrl}`);
  console.log('');
  console.log('Demo Accounts:');
  console.log('  Email: alex@example.com');
  console.log('  Password: password123');
  console.log('');
  console.log(`Health Check: ${backendUrl}/health`);
  console.log('');
  console.log('🎉 Your app should be live!');
  console.log('');
  console.log('⚠️  Remember: If you set env vars manually, redeploy both projects!');
  console.log('   (Go to Vercel dashboard → Deployments → Redeploy)');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
