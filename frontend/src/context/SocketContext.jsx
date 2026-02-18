import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./authContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user && token) {
      // Use VITE_API_URL instead of VITE_BACKEND_URL
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('🔌 Initializing socket connection to:', backendUrl);

      socketInstance = io(backendUrl, {
        auth: {
          token: token,
        },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance.id);
      });

      socketInstance.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err.message);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
      });

      // Listen for notifications
      socketInstance.on("notification", (data) => {
        console.log("🔔 New notification:", data);
        // You can add custom notification handling here
      });

      setSocket(socketInstance);
    }

    // Cleanup on unmount or when user/token changes
    return () => {
      if (socketInstance) {
        console.log("🔌 Disconnecting socket...");
        socketInstance.disconnect();
        setSocket(null);
      }
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};