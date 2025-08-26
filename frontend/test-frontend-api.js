// Simple test to check if frontend can connect to backend
import { authAPI } from './src/services/apiService.js';

console.log('🧪 Testing Frontend API Connection...');
console.log('Backend URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

// Test login
const testLogin = async () => {
  try {
    console.log('📡 Testing login...');
    const result = await authAPI.login('frontendtest@example.com', 'password123');
    console.log('✅ Login successful:', result.success);
    if (result.token) {
      console.log('🔑 Token received:', result.token.substring(0, 20) + '...');
      return result;
    }
    return null;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
};

// Test health endpoint
const testHealth = async () => {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  await testHealth();
  await testLogin();
  console.log('🎉 API connection tests completed!');
};

export { runTests, testLogin, testHealth };
