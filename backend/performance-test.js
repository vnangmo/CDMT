/**
 * Performance Test Script for CDMT API
 * Tests response times against requirements:
 * - Page display: < 2 seconds
 * - Automatic calculations: < 5 seconds
 * - Report generation: < 10 seconds
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTM3NWY0Ny1kMTEwLTQ1NzctYWU2OS0zNmIxMzRkMDA1YzIiLCJlbWFpbCI6ImFkbWluQGZpbmFuY2VzLmRqIiwicm9sZUlkIjoiODliZGRiMDUtYzRmZC00MTE1LThiNDQtYTJmMjhjZDM5MmE3IiwiaWF0IjoxNzY3NjMwNDQ1LCJleHAiOjE3Njc3MTY4NDV9.Qs0wBn8HSOtZLINP6zKM8B6Jr3DA1R8COJvypIXq3Do';
const BASE_URL = 'http://localhost:5000/api/v1';

const endpoints = {
  // Page display endpoints (< 2s)
  pageDisplay: [
    { name: 'Health Check', url: '/health', base: 'http://localhost:5000' },
    { name: 'Dashboard Stats', url: '/dashboard/stats' },
    { name: 'Dashboard Alerts', url: '/dashboard/alerts' },
    { name: 'Dashboard Activities', url: '/dashboard/activities' },
    { name: 'Roles List', url: '/roles' },
    { name: 'Roles Statistics', url: '/roles/statistics' },
    { name: 'Ministries List', url: '/ministries' },
    { name: 'Action Plans List', url: '/action-plans' },
    { name: 'Users List', url: '/users/me' },
    { name: 'Notifications', url: '/notifications' },
  ],

  // Calculation endpoints (< 5s)
  calculations: [
    { name: 'Access Matrix', url: '/roles/access-matrix' },
    { name: 'Permissions by Module', url: '/roles/permissions/by-module' },
    { name: 'Dashboard Trends', url: '/dashboard/trends' },
    { name: 'Dashboard Ministries', url: '/dashboard/ministries' },
  ],

  // Report generation endpoints (< 10s)
  reports: [
    { name: 'Export Entity Types', url: '/export/entity-types' },
  ]
};

const thresholds = {
  pageDisplay: 2000,    // 2 seconds
  calculations: 5000,   // 5 seconds
  reports: 10000        // 10 seconds
};

async function testEndpoint(endpoint, category) {
  const url = endpoint.base ? `${endpoint.base}${endpoint.url}` : `${BASE_URL}${endpoint.url}`;
  const threshold = thresholds[category];

  const start = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const elapsed = Date.now() - start;
    const status = response.status;
    const pass = elapsed < threshold;

    return {
      name: endpoint.name,
      url: endpoint.url,
      status,
      elapsed,
      threshold,
      pass,
      category
    };
  } catch (error) {
    const elapsed = Date.now() - start;
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: 'ERROR',
      elapsed,
      threshold,
      pass: false,
      error: error.message,
      category
    };
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('CDMT API Performance Test');
  console.log('='.repeat(70));
  console.log('');
  console.log('Requirements:');
  console.log('  - Page display: < 2 seconds');
  console.log('  - Calculations: < 5 seconds');
  console.log('  - Reports: < 10 seconds');
  console.log('');

  const results = {
    pageDisplay: [],
    calculations: [],
    reports: []
  };

  // Test page display endpoints
  console.log('-'.repeat(70));
  console.log('1. PAGE DISPLAY ENDPOINTS (< 2s)');
  console.log('-'.repeat(70));

  for (const endpoint of endpoints.pageDisplay) {
    const result = await testEndpoint(endpoint, 'pageDisplay');
    results.pageDisplay.push(result);
    const icon = result.pass ? '✓' : '✗';
    const statusText = result.status === 'ERROR' ? 'ERR' : result.status;
    console.log(`  ${icon} ${result.name.padEnd(25)} ${result.elapsed.toString().padStart(5)}ms [${statusText}] ${result.pass ? 'PASS' : 'FAIL'}`);
  }

  // Test calculation endpoints
  console.log('');
  console.log('-'.repeat(70));
  console.log('2. CALCULATION ENDPOINTS (< 5s)');
  console.log('-'.repeat(70));

  for (const endpoint of endpoints.calculations) {
    const result = await testEndpoint(endpoint, 'calculations');
    results.calculations.push(result);
    const icon = result.pass ? '✓' : '✗';
    const statusText = result.status === 'ERROR' ? 'ERR' : result.status;
    console.log(`  ${icon} ${result.name.padEnd(25)} ${result.elapsed.toString().padStart(5)}ms [${statusText}] ${result.pass ? 'PASS' : 'FAIL'}`);
  }

  // Test report endpoints
  console.log('');
  console.log('-'.repeat(70));
  console.log('3. REPORT GENERATION ENDPOINTS (< 10s)');
  console.log('-'.repeat(70));

  for (const endpoint of endpoints.reports) {
    const result = await testEndpoint(endpoint, 'reports');
    results.reports.push(result);
    const icon = result.pass ? '✓' : '✗';
    const statusText = result.status === 'ERROR' ? 'ERR' : result.status;
    console.log(`  ${icon} ${result.name.padEnd(25)} ${result.elapsed.toString().padStart(5)}ms [${statusText}] ${result.pass ? 'PASS' : 'FAIL'}`);
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const allResults = [...results.pageDisplay, ...results.calculations, ...results.reports];
  const passed = allResults.filter(r => r.pass).length;
  const failed = allResults.filter(r => !r.pass).length;
  const total = allResults.length;

  console.log(`  Total tests: ${total}`);
  console.log(`  Passed: ${passed} (${Math.round(passed/total*100)}%)`);
  console.log(`  Failed: ${failed} (${Math.round(failed/total*100)}%)`);
  console.log('');

  // Calculate averages
  const avgPageDisplay = results.pageDisplay.reduce((sum, r) => sum + r.elapsed, 0) / results.pageDisplay.length;
  const avgCalculations = results.calculations.reduce((sum, r) => sum + r.elapsed, 0) / results.calculations.length;
  const avgReports = results.reports.reduce((sum, r) => sum + r.elapsed, 0) / results.reports.length;

  console.log('  Average response times:');
  console.log(`    Page display:  ${Math.round(avgPageDisplay)}ms (threshold: ${thresholds.pageDisplay}ms)`);
  console.log(`    Calculations:  ${Math.round(avgCalculations)}ms (threshold: ${thresholds.calculations}ms)`);
  console.log(`    Reports:       ${Math.round(avgReports)}ms (threshold: ${thresholds.reports}ms)`);
  console.log('');

  // List failures
  const failures = allResults.filter(r => !r.pass);
  if (failures.length > 0) {
    console.log('  Failed endpoints:');
    failures.forEach(f => {
      console.log(`    - ${f.name}: ${f.elapsed}ms (max: ${f.threshold}ms)`);
    });
  }

  console.log('='.repeat(70));

  return { passed, failed, total, results };
}

runTests().catch(console.error);
