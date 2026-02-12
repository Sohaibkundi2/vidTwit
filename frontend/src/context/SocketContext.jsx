import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./authContext";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace('/api/v1', '') || 'http://localhost:3000';

    let socketInstance = null;

    if (user && token) {
      socketInstance = io(backendUrl, {
        auth: {
          token: token,
        },
        withCredentials: true,
      });

      socketInstance.on("connect", () => {
        console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
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
