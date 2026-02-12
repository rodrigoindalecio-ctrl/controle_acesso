const http = require('http');

const data = JSON.stringify({
  email: 'admin@controleacesso.com',
  password: 'Admin@123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('\n✓ Test 1: Valid Credentials');
  console.log('Status Code:', res.statusCode);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200 && response.success) {
        console.log('✅ LOGIN SUCCESS - User authenticated');
        console.log('User:', response.user);
      } else {
        console.log('❌ Login failed');
      }
    } catch (e) {
      console.log('Response (raw):', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(data);
req.end();
