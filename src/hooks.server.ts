import { createWebSocketServer, closeWebSocketServer } from "$lib/server/websocket.js";
import type { Handle } from "@sveltejs/kit";

// Initialize WebSocket server
let wsServer: any = null;

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize WebSocket server on first request (will reuse existing if already created)
  if (!wsServer) {
    try {
      wsServer = createWebSocketServer();
      console.log("WebSocket server initialized");
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
    }
  }

  const response = await resolve(event);
  return response;
};
