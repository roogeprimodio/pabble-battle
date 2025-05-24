import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// This is a VERY basic placeholder for a signaling server.
// A real signaling server would need to manage rooms and relay messages (offers, answers, candidates)
// between clients in the same room, likely using WebSockets or a temporary store.

interface SignalingMessage {
  type: string;
  roomId: string;
  payload?: any;
  sender?: string; // Could be a temporary client ID
}

const rooms = new Map<string, Set<any>>(); // In-memory store for clients in rooms (very naive)

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") { // GET for potential WebSocket upgrade
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // For a real WebSocket signaling server, you'd handle WebSocket connections here.
  // For a simple HTTP-based relay (less ideal but simpler for a placeholder):
  if (event.httpMethod === "POST") {
    try {
      const message = JSON.parse(event.body || "{}") as SignalingMessage;

      // Example: Log the message
      console.log(`Received signaling message for room ${message.roomId}:`, message);

      // TODO: Implement actual message relaying logic for WebRTC signaling.
      // This would involve:
      // 1. Storing client connections per room.
      // 2. When a message arrives for a room, broadcast it to other clients in that room.
      // This placeholder does NOT do that.

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Signal received by placeholder server" }),
      };
    } catch (error) {
      console.error("Signaling error:", error);
      return { statusCode: 500, body: "Internal Server Error" };
    }
  }

  return {
    statusCode: 200,
    body: "Signaling server placeholder is active. Use POST for messages.",
  };
};

export { handler };
