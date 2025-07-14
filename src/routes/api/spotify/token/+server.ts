import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies }) => {
  const accessToken = cookies.get("spotify_access_token");

  if (!accessToken) {
    return json({ error: "No access token available" }, { status: 401 });
  }

  return json({ access_token: accessToken });
};
