const http = require('http');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTM3NWY0Ny1kMTEwLTQ1NzctYWU2OS0zNmIxMzRkMDA1YzIiLCJlbWFpbCI6ImFkbWluQGZpbmFuY2VzLmRqIiwicm9sZUlkIjoiYTZhMGNmNjItY2QyNS00MDZmLWFjNmEtYzY1Y2UxOWRkYjkyIiwiaWF0IjoxNzY3NDQyMDA3LCJleHAiOjE3Njc1Mjg0MDd9.fxeqRtc7BGKsw-OEddu14NJL29WTzkON5jvxF2e6JLE";

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('Testing Sprint 5.3 API Endpoints');
  console.log('=================================\n');

  // Test 1: GET Sectoral Measures
  console.log('1. GET /api/v1/sectoral-measures');
  try {
    const result = await testEndpoint('/api/v1/sectoral-measures');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  console.log('');

  // Test 2: GET Action Plans
  console.log('2. GET /api/v1/action-plans');
  try {
    const result = await testEndpoint('/api/v1/action-plans');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }
  console.log('');

  // Test 3: Test without auth token
  console.log('3. GET /api/v1/sectoral-measures (without auth)');
  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/sectoral-measures',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 150)}...`);
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  console.log('\n=================================');
  console.log('API Tests Complete');
}

runTests();
