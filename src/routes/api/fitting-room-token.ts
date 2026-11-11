import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/fitting-room-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.DECART_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI fitting is not configured yet. Add DECART_API_KEY to the server environment." }, { status: 503 });
        }

        try {
          const { createDecartClient } = await import("@decartai/sdk");
          const client = createDecartClient({ apiKey });
          const origin = new URL(request.url).origin;
          const token = await client.tokens.create({
            allowedModels: ["lucy-vton-3.6"],
            allowedOrigins: [origin],
            expiresIn: 300,
            constraints: { realtime: { maxSessionDuration: 300 } },
          });
          return Response.json(token);
        } catch (error) {
          console.error("Could not create Decart fitting token:", error);
          return Response.json({ error: "Could not connect to the AI fitting service. Check the Decart API key and model access." }, { status: 502 });
        }
      },
    },
  },
});
