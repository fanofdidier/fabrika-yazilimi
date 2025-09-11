// Network utilities for mobile app
export const getBackendUrl = async () => {
  // Check if running in Capacitor (mobile app)
  if (window.Capacitor) {
    try {
      // Try to get device IP address
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      
      if (status.connected && status.connectionType === 'wifi') {
        // If connected to WiFi, try to detect the network
        // For now, use the configured IP
        return process.env.REACT_APP_API_URL || 'http://192.168.1.101:5001/api';
      }
    } catch (error) {
      console.log('Network detection failed, using fallback URL');
    }
    
    // Fallback to configured URL
    return process.env.REACT_APP_API_URL || 'http://192.168.1.101:5001/api';
  }
  
  // For web browser, use localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
};

export const getSocketUrl = async () => {
  // Check if running in Capacitor (mobile app)
  if (window.Capacitor) {
    try {
      // Try to get device IP address
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      
      if (status.connected && status.connectionType === 'wifi') {
        // If connected to WiFi, try to detect the network
        // For now, use the configured IP
        return process.env.REACT_APP_SOCKET_URL || 'http://192.168.1.101:5001';
      }
    } catch (error) {
      console.log('Network detection failed, using fallback URL');
    }
    
    // Fallback to configured URL
    return process.env.REACT_APP_SOCKET_URL || 'http://192.168.1.101:5001';
  }
  
  // For web browser, use localhost
  return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
};

// Test connection to backend
export const testBackendConnection = async (url) => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.log('Backend connection test failed:', error);
    return false;
  }
};

// Auto-detect backend URL
export const autoDetectBackendUrl = async () => {
  const possibleUrls = [
    'http://192.168.1.101:5001/api',
    'http://10.0.2.2:5001/api', // Android emulator
    'http://localhost:5001/api',
    'http://127.0.0.1:5001/api'
  ];
  
  for (const url of possibleUrls) {
    console.log(`Testing backend URL: ${url}`);
    const isConnected = await testBackendConnection(url);
    if (isConnected) {
      console.log(`✅ Backend found at: ${url}`);
      return url;
    }
  }
  
  console.log('❌ No backend found, using fallback');
  return possibleUrls[0]; // Return first URL as fallback
};
