import io from 'socket.io-client';

// Initialize Socket.IO client with auto-reconnect settings
const socket = io('http://localhost:5000', {
  auth: { token: `Bearer ${localStorage.getItem('authToken')}` },
  autoConnect: true,            // Enable auto-connection on initialization
  reconnection: true,            // Enable auto-reconnection
  reconnectionDelay: 500,       // Delay between reconnection attempts (500ms)
  reconnectionDelayMax: 2000,   // Maximum delay between reconnection attempts (2s)
  reconnectionAttempts: Infinity, // Unlimited reconnection attempts
  timeout: 10000,               // Connection timeout (10s)
});

export default socket;