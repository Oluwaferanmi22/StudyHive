const http = require('http');

// Test the health endpoint
const testHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('✅ Health Check Response:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
    });
  });

  req.on('error', (error) => {
    console.error('❌ Health Check Error:', error.message);
  });

  req.end();
};

// Test user registration
const testRegister = () => {
  const userData = JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    studySubjects: ['Math', 'Science'],
    studyGoals: ['Exam Prep']
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(userData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n✅ Registration Test Response:');
      console.log('Status Code:', res.statusCode);
      try {
        const response = JSON.parse(data);
        console.log('Success:', response.success);
        console.log('Message:', response.message);
        if (response.user) {
          console.log('User ID:', response.user.id);
          console.log('Username:', response.user.username);
        }
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Registration Error:', error.message);
  });

  req.write(userData);
  req.end();
};

console.log('🧪 Testing StudyHive API...\n');

// Run tests with delays
setTimeout(() => {
  testHealth();
}, 1000);

setTimeout(() => {
  testRegister();
}, 2000);

setTimeout(() => {
  console.log('\n✨ API Tests Complete!');
  process.exit(0);
}, 5000);
