import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: `Bearer ${localStorage.getItem('authToken')}` },
  autoConnect: false,
});

export default socket;