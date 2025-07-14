import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
  // Clear Spotify authentication cookies
  cookies.delete("spotify_access_token", { path: "/" });
  cookies.delete("spotify_refresh_token", { path: "/" });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
