// Socket.IO removed for Vercel compatibility (serverless doesn't support WebSockets)
// TODO: Replace with polling-based approach
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  // Return a mock socket that won't crash but won't work
  // Frontend should be updated to use polling endpoints instead
  if (!socket) {
    try {
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
        withCredentials: true,
        transports: ["polling"], // Force polling instead of websocket
        reconnection: false, // Don't try to reconnect
        timeout: 5000, // Quick timeout
      });
      
      // Suppress connection errors
      socket.on("connect_error", () => {});
      socket.on("disconnect", () => {});
    } catch (error) {
      // Return a mock socket if initialization fails
      return {
        emit: () => {},
        on: () => {},
        off: () => {},
        disconnect: () => {},
        connected: false,
      } as Socket;
    }
  }
  return socket;
}
