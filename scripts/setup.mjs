import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const serverDir = path.resolve(rootDir, 'server')

console.log('\n========================================')
console.log('       CAFÉ WEBSITE SETUP SYSTEM        ')
console.log('========================================\n')

// 1. Check Node.js Version
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10)
console.log(`✓ Node.js detected: ${nodeVersion}`)

if (majorVersion < 18) {
  console.warn('⚠️ Warning: Node.js 18+ is recommended for optimal performance.\n')
}

// 2. Check npm Availability
try {
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim()
  console.log(`✓ npm detected: v${npmVersion}`)
} catch (e) {
  console.error('❌ Error: npm is not available in environment path.\n')
  process.exit(1)
}

// 3. Prepare Root .env
const rootEnvPath = path.join(rootDir, '.env')
const rootEnvExamplePath = path.join(rootDir, '.env.example')

if (!fs.existsSync(rootEnvPath)) {
  if (fs.existsSync(rootEnvExamplePath)) {
    fs.copyFileSync(rootEnvExamplePath, rootEnvPath)
    console.log('✓ Created root .env from .env.example')
  } else {
    fs.writeFileSync(rootEnvPath, 'VITE_APP_TITLE="Café - Coffee & Kitchen"\nVITE_API_URL="http://localhost:3001"\nVITE_API_TIMEOUT=10000\n')
    console.log('✓ Created default root .env')
  }
} else {
  console.log('✓ Root .env already exists (preserved)')
}

// 4. Prepare Server .env
const serverEnvPath = path.join(serverDir, '.env')
const serverEnvExamplePath = path.join(serverDir, '.env.example')

if (!fs.existsSync(serverEnvPath)) {
  if (fs.existsSync(serverEnvExamplePath)) {
    fs.copyFileSync(serverEnvExamplePath, serverEnvPath)
    console.log('✓ Created server/.env from server/.env.example')
  } else {
    fs.writeFileSync(serverEnvPath, 'NODE_ENV=development\nPORT=3001\nCORS_ORIGIN=http://localhost:5173\nAPI_BASE_URL=http://localhost:3001\nFRONTEND_URL=http://localhost:5173\n')
    console.log('✓ Created default server/.env')
  }
} else {
  console.log('✓ Server .env already exists (preserved)')
}

// 5. Environment Audit & Validation
console.log('\n----------------------------------------')
console.log('Environment Configuration Audit:')
console.log('----------------------------------------')

const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8')
const serverEnvContent = fs.existsSync(serverEnvPath) ? fs.readFileSync(serverEnvPath, 'utf8') : ''

const hasResendKey = serverEnvContent.includes('RESEND_API_KEY=re_') || serverEnvContent.includes('RESEND_API_KEY=') && !serverEnvContent.includes('RESEND_API_KEY=""') && !serverEnvContent.includes('RESEND_API_KEY=placeholder')

console.log(`- Frontend VITE_API_URL: ${rootEnvContent.includes('VITE_API_URL') ? '✓ Configured' : '⚠️ Missing'}`)
console.log(`- Backend PORT: ${serverEnvContent.includes('PORT=') ? '✓ Configured' : '⚠️ Missing'}`)
console.log(`- Resend Email API Key: ${hasResendKey ? '✓ Configured' : 'ℹ️ Optional (Contact form works in console mode without API key)'}`)

console.log('\n========================================')
console.log('         SETUP COMPLETE                ')
console.log('========================================')
console.log('To start development:')
console.log('  npm run dev')
console.log('\nTo build for production:')
console.log('  npm run build')
console.log('========================================\n')
