import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // We need the user to know which School Room to join

  useEffect(() => {
    // Only connect if we have a user logged in
    if (user) {
      const newSocket = io(`${import.meta.env.VITE_BACKEND_URL}`); // Your Backend URL
      setSocket(newSocket);
      console.log(`${import.meta.env.VITE_BACKEND_URL}`);

      // 1. Join the School's "Room" immediately
      newSocket.emit('join_school', user.schoolId);

      // 2. Global Alert Listener (Runs in background for everyone)
      newSocket.on('receive_alert', (data) => {
        // Play a sound (Optional but recommended for alerts)
        const audio = new Audio('/alert-sound.mp3'); // You'll need to add this file later
        audio.play().catch(e => console.log("Audio play failed", e));

        // Show a visual popup
        toast.error(
          <div className="flex flex-col">
            <span className="font-bold text-lg">EMERGENCY: {data.type}</span>
            <span>{data.message}</span>
          </div>,
          { duration: 10000, position: 'top-center' } // Stay visible for 10s
        );
      });

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};