import { spotifyService } from "./src/lib/server/spotify.js";

async function testCategoryFallback() {
  try {
    console.log("🧪 Testing category fallback logic...");

    // Test with a category that might not have playlists
    const categoryId = "0JQ5DAqbMKFziKOShCi009"; // The problematic category from the error

    console.log(`📋 Testing category: ${categoryId}`);

    const tracks = await spotifyService.getTracksByCategory(categoryId, 10);

    console.log(`✅ Successfully fetched ${tracks.length} tracks for category ${categoryId}`);
    console.log("🎵 Sample tracks:");

    tracks.slice(0, 3).forEach((track, index) => {
      console.log(`   ${index + 1}. "${track.name}" by ${track.artists[0]?.name} (popularity: ${track.popularity})`);
    });

    // Test getRandomTrackForRound with this category
    console.log("\n🎮 Testing full round track generation...");
    const { correct, wrongOptions } = await spotifyService.getRandomTrackForRound(categoryId);

    console.log(`✅ Successfully generated round data for category ${categoryId}`);
    console.log(`🎯 Correct track: "${correct.name}" by ${correct.artists[0]?.name}`);
    console.log(`❌ Wrong options: ${wrongOptions.map((t) => `"${t.name}" by ${t.artists[0]?.name}`).join(", ")}`);

    console.log("\n🎉 Category fallback test completed successfully!");
  } catch (error) {
    console.error("❌ Category fallback test failed:", error.message);
    process.exit(1);
  }
}

testCategoryFallback();
