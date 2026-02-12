const http = require('http');

function makeRequest(data, description) {
  return new Promise((resolve) => {
    console.log(`\n📝 ${description}\n`);
    
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          console.log('Status:', res.statusCode);
          console.log('Response:', JSON.stringify(parsed, null, 2));
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log('Status:', res.statusCode);
          console.log('Response (raw):', responseBody);
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request Error:', error.message);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 COMPREHENSIVE LOGIN TESTS\n');
  console.log('═'.repeat(50));

  // Test 1
  const test1 = await makeRequest(
    { email: 'admin@controleacesso.com', password: 'Admin@123' },
    'Test 1: Valid Credentials'
  );
  if (test1 && test1.status === 200 && test1.data.success) {
    console.log('✅ PASS - Login successful\n');
  } else {
    console.log('❌ FAIL\n');
  }

  // Test 2
  setTimeout(() => {}, 500);
  const test2 = await makeRequest(
    { email: 'admin@controleacesso.com' },
    'Test 2: Missing Password'
  );
  if (test2 && test2.status === 400) {
    console.log('✅ PASS - Missing field validation works\n');
  } else {
    console.log('❌ FAIL\n');
  }

  // Test 3: wrong credentials
  setTimeout(() => {}, 500);
  const test3 = await makeRequest(
    { email: 'admin@controleacesso.com', password: 'WrongPassword' },
    'Test 3: Wrong Password'
  );
  if (test3 && test3.status === 401) {
    console.log('✅ PASS - Invalid credentials rejected\n');
  } else {
    console.log('❌ FAIL\n');
  }

  console.log('═'.repeat(50));
  console.log('\n✅ All tests completed\n');
}

runTests();
