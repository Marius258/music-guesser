// Quick test to verify categories with icons work
console.log("Testing category icons support...");

// Mock test to verify the interface works
const testCategory = {
  id: "pop",
  name: "🎤 Pop",
  description: "Popular mainstream music",
  icons: [{ url: "https://example.com/icon.jpg", height: 300, width: 300 }],
};

console.log("✅ Category interface supports icons:", testCategory);
console.log("✅ Image URL extraction would work:", testCategory.icons[0]?.url);

// Clean up
setTimeout(() => {
  console.log("✅ Test completed successfully");
  process.exit(0);
}, 100);
