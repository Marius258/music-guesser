import { createWebSocketServer, closeWebSocketServer, getWebSocketServer } from "$lib/server/websocket.js";
import type { Handle } from "@sveltejs/kit";

// Initialize WebSocket server once globally
let wsServer: any = null;
let wsInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize WebSocket server only once
  if (!wsInitialized) {
    try {
      // Check if there's already a server running
      const existingServer = getWebSocketServer();
      if (!existingServer) {
        wsServer = createWebSocketServer();
        console.log("WebSocket server initialized");
      } else {
        wsServer = existingServer;
        console.log("WebSocket server already exists, reusing");
      }
      wsInitialized = true;
    } catch (error) {
      console.error("Failed to initialize WebSocket server:", error);
    }
  }

  const response = await resolve(event);
  return response;
};
