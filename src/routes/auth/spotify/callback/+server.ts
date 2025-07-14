import { redirect } from "@sveltejs/kit";
import { spotifyService } from "$lib/server/spotify.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Spotify auth error:", error);
    throw redirect(302, "/?error=spotify_auth_failed");
  }

  if (!code) {
    console.error("No authorization code received");
    throw redirect(302, "/?error=no_auth_code");
  }

  try {
    const redirectUri = `${url.origin}/auth/spotify/callback`;
    const tokenData = await spotifyService.exchangeCodeForToken(code, redirectUri);

    // Store tokens securely (you might want to use sessions or encrypted cookies)
    cookies.set("spotify_access_token", tokenData.access_token, {
      path: "/",
      maxAge: tokenData.expires_in,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    if (tokenData.refresh_token) {
      cookies.set("spotify_refresh_token", tokenData.refresh_token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
    }

    // Redirect back to the app with success
    throw redirect(302, "/?spotify_auth=success");
  } catch (err) {
    // Don't catch redirect errors - they are intended behavior
    if (err && typeof err === "object" && "status" in err && err.status === 302) {
      throw err; // Re-throw redirects
    }

    console.error("Failed to exchange code for tokens:", err);
    throw redirect(302, "/?error=token_exchange_failed");
  }
};
