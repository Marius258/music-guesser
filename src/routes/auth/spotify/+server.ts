import { redirect } from "@sveltejs/kit";
import { spotifyService } from "$lib/server/spotify.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const redirectUri = `${url.origin}/auth/spotify/callback`;
  const state = crypto.randomUUID(); // Generate random state for security

  // Store state in session/cookie if needed for validation
  const authUrl = spotifyService.generateAuthUrl(redirectUri, state);

  throw redirect(302, authUrl);
};
