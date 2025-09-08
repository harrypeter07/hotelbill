// Returns a deterministic image URL for a given dish name.
// Uses Unsplash Source which doesn't require an API key.
export function getItemImageUri(name: string): string {
  const query = encodeURIComponent(name.toLowerCase());
  // small square image; fall back-safe endpoint
  return `https://source.unsplash.com/collection/8354882/200x200/?${query}`;
}


