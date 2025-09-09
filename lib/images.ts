// Returns a deterministic image URL for a given dish name.
// Use picsum.photos with a seeded path to ensure a stable image without API keys.
function stableNumberFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000);
}

export function getItemImageUri(name: string): string {
  const q = (name || 'food').toLowerCase().trim();
  const query = encodeURIComponent(`${q},food,meal,dish`);
  const lock = stableNumberFromString(q);
  // Deterministic 200x200 food-themed image related to the query
  return `https://loremflickr.com/200/200/${query}?lock=${lock}`;
}


