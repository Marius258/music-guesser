import { spotifyService } from "./src/lib/server/spotify.js";

async function testCategories() {
  try {
    console.log("Testing dynamic category fetching...");
    const categories = await spotifyService.getMusicCategories();
    console.log(
      "Categories:",
      categories.slice(0, 10).map((c) => ({ id: c.id, name: c.name }))
    );
    console.log("Total categories found:", categories.length);

    // Test if we have any non-fallback categories (should be more than 5 if Spotify API works)
    if (categories.length > 5) {
      console.log("✅ Successfully fetched categories from Spotify API");
    } else {
      console.log("⚠️ Using fallback categories (Spotify API may be failing)");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testCategories();
