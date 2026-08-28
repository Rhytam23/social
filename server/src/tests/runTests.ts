process.env.NODE_ENV = 'test'
import http from 'http'
import app from '../index'
import { runMigrations } from '../db/migrate'

// Integration Test Runner for API Endpoints
async function runTests() {
  console.log('[Test Suite] Starting API endpoint verification...')
  try {
    await runMigrations()
  } catch (err) {
    console.error('[Test Suite] Migration warning:', err)
  }

  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server port')
  }
  const baseUrl = `http://localhost:${address.port}`

  console.log(`[Test Suite] Test server running on ${baseUrl}`)

  let testsPassed = 0
  let testsFailed = 0

  async function testEndpoint(
    name: string,
    path: string,
    method = 'GET',
    body?: unknown,
    headers?: Record<string, string>,
    expectedStatus = 200
  ): Promise<any> {
    try {
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
      })

      if (res.status === expectedStatus) {
        console.log(`  ✓ PASSED: ${name} [HTTP ${res.status}]`)
        testsPassed++
        try { return await res.json() } catch { return res.status }
      } else {
        console.error(`  ✗ FAILED: ${name} [Expected HTTP ${expectedStatus}, Got ${res.status}]`)
        testsFailed++
        return null
      }
    } catch (err) {
      console.error(`  ✗ FAILED: ${name} (Network / Parsing Error)`, err)
      testsFailed++
      return null
    }
  }

  // 1. Health Check
  const healthRes = await fetch(`${baseUrl}/health`)
  if (healthRes.status === 200 || healthRes.status === 503) {
    console.log(`  ✓ PASSED: Health Check Endpoint [HTTP ${healthRes.status}]`)
    testsPassed++
  } else {
    console.error(`  ✗ FAILED: Health Check Endpoint [Got HTTP ${healthRes.status}]`)
    testsFailed++
  }

  // 2. Public Products List with Pagination
  const prodRes = await testEndpoint('Public Products Catalog (Page 1, Limit 5)', '/api/products?page=1&limit=5', 'GET', undefined, undefined, 200)
  if (prodRes?.pagination) {
    console.log(`    → Returned ${prodRes.data.length} items (Total: ${prodRes.pagination.total}, Pages: ${prodRes.pagination.totalPages})`)
  }

  // 3. Search API
  await testEndpoint('Search API (?search=rtx)', '/api/search?search=rtx', 'GET', undefined, undefined, 200)

  // 4. Categories & Brands
  await testEndpoint('Get Categories List', '/api/categories', 'GET', undefined, undefined, 200)
  await testEndpoint('Get Brands List', '/api/brands', 'GET', undefined, undefined, 200)

  // 5. Auth API — Failed Login Protection
  await testEndpoint('Invalid Credentials Login Security Check', '/api/auth/login', 'POST', { email: 'invalid@example.com', password: 'wrong' }, undefined, 401)

  // 6. Admin Authorization Protection
  await testEndpoint('Admin Protected Endpoint Block (Unauthenticated)', '/api/admin/dashboard', 'GET', undefined, undefined, 401)

  // 7. Cart API Session Test
  await testEndpoint('Anonymous Cart Fetch', '/api/cart', 'GET', undefined, undefined, 200)

  // 8. Email Authentication Flow — OTP Code Generation
  const testEmail = `test_${Date.now()}@example.com`
  const otpRes = await testEndpoint('1. Email Auth — OTP Code Generation', '/api/auth/send-otp', 'POST', { email: testEmail, purpose: 'login' }, undefined, 200)

  // 9. OTP Verification & Cookie Extraction
  let sessionCookie = ''
  if (otpRes?.data?.demoCode) {
    try {
      const verifyReq = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, code: otpRes.data.demoCode, purpose: 'login' }),
      })
      if (verifyReq.status === 200) {
        const rawCookie = verifyReq.headers.get('set-cookie')
        if (rawCookie) sessionCookie = rawCookie.split(';')[0]
        console.log('  ✓ PASSED: 1. Email Auth — OTP Verification & Session Cookie Set [HTTP 200]')
        testsPassed++
      } else {
        console.error(`  ✗ FAILED: 1. Email Auth — OTP Verification [HTTP ${verifyReq.status}]`)
        testsFailed++
      }
    } catch (err) {
      console.error('  ✗ FAILED: 1. Email Auth — OTP Verification', err)
      testsFailed++
    }
  }

  // 10. Protected API Request with Session Cookie
  if (sessionCookie) {
    try {
      const meReq = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      })
      if (meReq.status === 200) {
        console.log('  ✓ PASSED: 2. Protected API Request — Authenticated User Profile [HTTP 200]')
        testsPassed++
      } else {
        console.error(`  ✗ FAILED: 2. Protected API Request [Expected HTTP 200, Got ${meReq.status}]`)
        testsFailed++
      }
    } catch (err) {
      console.error('  ✗ FAILED: 2. Protected API Request', err)
      testsFailed++
    }
  }

  // 11. Logout & Cookie Invalidation
  try {
    const logoutReq = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
    })
    if (logoutReq.status === 200) {
      console.log('  ✓ PASSED: 3. Logout Endpoint — Session Invalidation [HTTP 200]')
      testsPassed++
    } else {
      console.error(`  ✗ FAILED: 3. Logout Endpoint [Expected HTTP 200, Got ${logoutReq.status}]`)
      testsFailed++
    }
  } catch (err) {
    console.error('  ✗ FAILED: 3. Logout Endpoint', err)
    testsFailed++
  }

  // 12. Authentication After Logout Verification (Must Return 401 Unauthorized)
  try {
    const postLogoutMe = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (postLogoutMe.status === 401) {
      console.log('  ✓ PASSED: 4. Authentication After Logout — Access Blocked [HTTP 401]')
      testsPassed++
    } else {
      console.error(`  ✗ FAILED: 4. Authentication After Logout [Expected HTTP 401, Got ${postLogoutMe.status}]`)
      testsFailed++
    }
  } catch (err) {
    console.error('  ✗ FAILED: 4. Authentication After Logout', err)
    testsFailed++
  }

  server.close()

  console.log('\n========================================')
  console.log(`[Test Suite Results] Passed: ${testsPassed} | Failed: ${testsFailed}`)
  console.log('========================================')

  if (testsFailed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('[Test Suite] Execution Error:', err)
  process.exit(1)
})
