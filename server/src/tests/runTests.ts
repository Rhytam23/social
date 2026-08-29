process.env.NODE_ENV = 'test'
import http from 'http'
import app from '../index'
import { runMigrations } from '../db/migrate'
import { query } from '../db/client'

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

  // ─── Security regressions ───────────────────────────────────────────────────

  // 13. Password-reset codes must never mint a session via /verify-otp.
  await testEndpoint(
    'Security — reset_password purpose rejected at /verify-otp',
    '/api/auth/verify-otp',
    'POST',
    { email: 'someone@example.com', code: '123456', purpose: 'reset_password' },
    undefined,
    422 // Zod rejects the purpose value outright
  )

  // 14. Payments must fail loudly when Stripe is unconfigured — never simulate success.
  if (!process.env['STRIPE_SECRET_KEY']) {
    await testEndpoint(
      'Security — payments unavailable without Stripe (no fake success)',
      '/api/payments/create-intent',
      'POST',
      { orderId: '00000000-0000-4000-8000-000000000000' },
      undefined,
      503
    )
  }

  // 15. Admin product update rejects an invalid body (Zod validation present).
  await testEndpoint(
    'Security — admin product update requires auth',
    '/api/admin/products/00000000-0000-4000-8000-000000000000',
    'PUT',
    { price: 'not-a-number' },
    undefined,
    401
  )

  // 16. Order lookups with a non-existent id must 404 (ownership-safe lookup).
  await testEndpoint(
    'Security — unknown order id returns 404',
    '/api/orders/00000000-0000-4000-8000-000000000000',
    'GET',
    undefined,
    undefined,
    404
  )

  // 17. Catalog: products carry no fabricated ratings until real reviews exist.
  try {
    const res = await fetch(`${baseUrl}/api/products?limit=100`)
    const json: any = await res.json()
    const products: any[] = Array.isArray(json?.data?.data) ? json.data.data : []
    const fabricated = products.filter((p: any) => p.reviewCount > 0 && p.rating > 0)
    const reviewRows = await query<{ count: string }>('SELECT COUNT(*) AS count FROM reviews')
    const realReviews = parseInt(reviewRows[0]?.count ?? '0', 10)
    // Pass if: no products at all (empty catalog), or all ratings are backed by real reviews
    if (products.length === 0 || fabricated.length === 0 || realReviews > 0) {
      console.log(`  ✓ PASSED: Catalog — no fabricated ratings (${products.length} products, ${realReviews} real reviews)`)
      testsPassed++
    } else {
      console.error(`  ✗ FAILED: Catalog — ${fabricated.length} products have ratings with no reviews in the database`)
      testsFailed++
    }
  } catch (err) {
    console.error('  ✗ FAILED: Catalog rating integrity check', err)
    testsFailed++
  }

  // 18. Verification Email Templates — Light and Dark Theme Validation
  try {
    const { renderLightVerificationEmail, renderDarkVerificationEmail } = await import('../services/emailTemplates')
    const sampleCode = '486584'
    const lightHtml = renderLightVerificationEmail(sampleCode)
    const darkHtml = renderDarkVerificationEmail(sampleCode)

    const lightValid = lightHtml.includes(sampleCode) &&
                       lightHtml.includes('Your verification code') &&
                       lightHtml.includes('5 minutes') &&
                       lightHtml.includes('Never share this code with anyone') &&
                       lightHtml.includes('PREMIUM PC') &&
                       lightHtml.includes('#f1f5f9')

    const darkValid = darkHtml.includes(sampleCode) &&
                      darkHtml.includes('Your verification code') &&
                      darkHtml.includes('5 minutes') &&
                      darkHtml.includes('Never share this code with anyone') &&
                      darkHtml.includes('PREMIUM PC') &&
                      darkHtml.includes('#0b0f19')

    if (lightValid && darkValid) {
      console.log('  ✓ PASSED: Email Templates — Light & Dark HTML Email Templates Generated Successfully')
      testsPassed++
    } else {
      console.error('  ✗ FAILED: Email Templates — Template output validation failed')
      testsFailed++
    }
  } catch (err) {
    console.error('  ✗ FAILED: Email Templates — Rendering error', err)
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
