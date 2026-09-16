import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const serverDir = path.resolve(rootDir, 'server')

console.log('\n========================================')
console.log('    CAFÉ SYSTEM CONFIGURATION CHECK    ')
console.log('========================================\n')

let passCount = 0
let warnCount = 0

// Check Root .env
const rootEnvPath = path.join(rootDir, '.env')
if (fs.existsSync(rootEnvPath)) {
  console.log('✓ Root .env file present')
  passCount++
} else {
  console.log('⚠️ Root .env file missing (Run `npm run setup`)')
  warnCount++
}

// Check Server .env
const serverEnvPath = path.join(serverDir, '.env')
if (fs.existsSync(serverEnvPath)) {
  console.log('✓ Server .env file present')
  passCount++
} else {
  console.log('⚠️ Server .env file missing (Run `npm run setup`)')
  warnCount++
}

// Check Crucial Assets
const heroAssetPath = path.join(rootDir, 'public/assets/hero.jpg')
const storyAssetPath = path.join(rootDir, 'public/assets/story.jpg')

if (fs.existsSync(heroAssetPath) && fs.existsSync(storyAssetPath)) {
  console.log('✓ Café imagery assets verified (hero.jpg, story.jpg)')
  passCount++
} else {
  console.log('⚠️ Café image assets missing in public/assets/')
  warnCount++
}

// Check Client Documentation
const clientDocPath = path.join(rootDir, 'CLIENT_SETUP.md')
if (fs.existsSync(clientDocPath)) {
  console.log('✓ CLIENT_SETUP.md documentation present')
  passCount++
} else {
  console.log('⚠️ CLIENT_SETUP.md missing')
  warnCount++
}

console.log('\n----------------------------------------')
console.log(`Verification Summary: ${passCount} Checks Passed, ${warnCount} Warnings`)
console.log('----------------------------------------\n')
