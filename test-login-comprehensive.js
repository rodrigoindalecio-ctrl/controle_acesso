// Test login endpoint
async function testLogin() {
  console.log('\n📝 Test 1: Valid Credentials\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@controleacesso.com',
        password: 'Admin@123'
      })
    });

    console.log('Status Code:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.success) {
      console.log('\n✅ SUCCESS: Login works! User authenticated.');
      console.log('User:', data.user);
    } else {
      console.log('\n❌ FAIL: Unexpected response');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Empty body
  console.log('\n\n📝 Test 2: Empty Request Body\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: ''
    });

    console.log('Status Code:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log('\n✅ PASS: Empty body handled correctly');
    } else {
      console.log('\n❌ FAIL: Should return 400');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Invalid JSON
  console.log('\n\n📝 Test 3: Invalid JSON\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{invalid json}'
    });

    console.log('Status Code:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log('\n✅ PASS: Invalid JSON handled correctly');
    } else {
      console.log('\n❌ FAIL: Should return 400');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Wrong Content-Type
  console.log('\n\n📝 Test 4: Wrong Content-Type (text/plain)\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        email: 'admin@controleacesso.com',
        password: 'Admin@123'
      })
    });

    console.log('Status Code:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 400) {
      console.log('\n✅ PASS: Wrong Content-Type rejected');
    } else {
      console.log('\n❌ FAIL: Should return 400');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
