const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let hiveId = '';

// Test data
const testUser = {
  username: 'testuser123',
  email: 'test@studyhive.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

const testHive = {
  name: 'Mathematics Study Group',
  description: 'A group for studying advanced mathematics topics',
  subject: 'Mathematics',
  tags: ['calculus', 'algebra', 'geometry'],
  settings: {
    isPrivate: false,
    requireApproval: false,
    maxMembers: 20
  }
};

async function testRegisterUser() {
  try {
    console.log('🚀 Testing user registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.data.success) {
      token = response.data.token;
      userId = response.data.user.id;
      console.log('✅ User registered successfully');
      console.log(`👤 User ID: ${userId}`);
      return true;
    }
  } catch (error) {
    if (error.response?.data?.message?.includes('already exists')) {
      // Try to login instead
      return await testLoginUser();
    }
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLoginUser() {
  try {
    console.log('🔑 Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      login: testUser.username,
      password: testUser.password
    });
    
    if (response.data.success) {
      token = response.data.token;
      userId = response.data.user.id;
      console.log('✅ User logged in successfully');
      console.log(`👤 User ID: ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateHive() {
  try {
    console.log('🏠 Testing hive creation...');
    const response = await axios.post(`${BASE_URL}/hives`, testHive, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      hiveId = response.data.data._id;
      console.log('✅ Hive created successfully');
      console.log(`🏠 Hive ID: ${hiveId}`);
      console.log(`📝 Hive Name: ${response.data.data.name}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Hive creation failed:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data);
    return false;
  }
}

async function testGetHives() {
  try {
    console.log('📋 Testing get hives...');
    const response = await axios.get(`${BASE_URL}/hives`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Retrieved hives successfully');
      console.log(`📊 Found ${response.data.data.length} hives`);
      return true;
    }
  } catch (error) {
    console.error('❌ Get hives failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSendMessage() {
  try {
    console.log('💬 Testing send message...');
    const messageData = {
      content: 'Hello everyone! Welcome to our Mathematics Study Group!',
      hiveId: hiveId,
      messageType: 'text'
    };

    const response = await axios.post(`${BASE_URL}/messages`, messageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Message sent successfully');
      console.log(`💬 Message ID: ${response.data.data._id}`);
      return response.data.data._id;
    }
  } catch (error) {
    console.error('❌ Send message failed:', error.response?.data?.message || error.message);
    console.error('Error details:', error.response?.data);
    return false;
  }
}

async function testGetMessages() {
  try {
    console.log('📨 Testing get messages...');
    const response = await axios.get(`${BASE_URL}/messages/hive/${hiveId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Retrieved messages successfully');
      console.log(`📊 Found ${response.data.data.length} messages`);
      return true;
    }
  } catch (error) {
    console.error('❌ Get messages failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSocketConnection() {
  return new Promise((resolve) => {
    console.log('🔌 Testing Socket.IO connection...');
    
    const socket = io('http://localhost:5000', {
      auth: { token: token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log(`🔌 Socket ID: ${socket.id}`);
      
      // Test joining hive
      socket.emit('join_hive', { hiveId: hiveId });
    });

    socket.on('hive_joined', (data) => {
      console.log('✅ Successfully joined hive via socket');
      console.log(`🏠 Joined hive: ${data.hiveName}`);
      
      // Test sending a message via socket
      socket.emit('send_message', {
        content: 'This is a real-time message via Socket.IO!',
        hiveId: hiveId,
        messageType: 'text'
      });
    });

    socket.on('message_sent', (data) => {
      console.log('✅ Message sent via socket successfully');
      console.log(`💬 Socket message ID: ${data.message._id}`);
      
      socket.disconnect();
      resolve(true);
    });

    socket.on('new_message', (data) => {
      console.log('📨 Received new message via socket');
      console.log(`💬 Message: ${data.message.content}`);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection failed:', error.message);
      resolve(false);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error.message);
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Socket test timeout');
      socket.disconnect();
      resolve(false);
    }, 10000);
  });
}

async function runTests() {
  console.log('🧪 Starting StudyHive API Tests...\n');

  try {
    // Test 1: User Registration/Login
    const authSuccess = await testRegisterUser();
    if (!authSuccess) {
      console.log('❌ Authentication failed. Stopping tests.');
      return;
    }
    console.log('');

    // Test 2: Create Hive
    const hiveSuccess = await testCreateHive();
    if (!hiveSuccess) {
      console.log('❌ Hive creation failed. Stopping tests.');
      return;
    }
    console.log('');

    // Test 3: Get Hives
    await testGetHives();
    console.log('');

    // Test 4: Send Message
    const messageId = await testSendMessage();
    if (!messageId) {
      console.log('❌ Message sending failed. Skipping message tests.');
    } else {
      console.log('');
      
      // Test 5: Get Messages
      await testGetMessages();
      console.log('');
    }

    // Test 6: Socket.IO Real-time Chat
    const socketSuccess = await testSocketConnection();
    console.log('');

    // Summary
    console.log('🎉 Test Summary:');
    console.log(`✅ User Authentication: ${authSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Hive Creation: ${hiveSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Message System: ${messageId ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Real-time Chat: ${socketSuccess ? 'PASS' : 'FAIL'}`);

    if (authSuccess && hiveSuccess && messageId && socketSuccess) {
      console.log('\n🎊 All tests passed! StudyHive group creation and chat system is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Install axios if it's not already installed
async function installDependencies() {
  try {
    require('axios');
    require('socket.io-client');
    return true;
  } catch (error) {
    console.log('📦 Installing test dependencies...');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npm install axios socket.io-client', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to install dependencies:', error);
          reject(error);
        } else {
          console.log('✅ Dependencies installed successfully');
          resolve(true);
        }
      });
    });
  }
}

// Main execution
async function main() {
  try {
    const depsInstalled = await installDependencies();
    if (!depsInstalled) return;
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await runTests();
  } catch (error) {
    console.error('❌ Failed to run tests:', error);
  }
}

if (require.main === module) {
  main();
}
