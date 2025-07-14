import { json } from "@sveltejs/kit";
import { spotifyService } from "$lib/server/spotify.js";

export const GET = async () => {
  try {
    const genres = await spotifyService.getMusicCategories();

    return json({
      categories: genres, // Keep as 'categories' for backward compatibility with frontend
      success: true,
    });
  } catch (error) {
    console.error("Error fetching music genres:", error);

    return json(
      {
        error: `Failed to fetch music genres from Spotify: ${error instanceof Error ? error.message : "Unknown error"}`,
        success: false,
      },
      { status: 500 }
    );
  }
};
