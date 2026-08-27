process.env.NODE_ENV = 'test'
import http from 'http'
import app from '../index'

// Integration Test Runner for API Endpoints
async function runTests() {
  console.log('[Test Suite] Starting API endpoint verification...')

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
      })

      const data = (await res.json()) as any
      if (res.status === expectedStatus && data.success !== undefined) {
        console.log(`  ✓ PASSED: ${name} [HTTP ${res.status}]`)
        testsPassed++
        return data
      } else {
        console.error(`  ✗ FAILED: ${name} [Expected HTTP ${expectedStatus}, Got ${res.status}]`, data)
        testsFailed++
        return data
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
