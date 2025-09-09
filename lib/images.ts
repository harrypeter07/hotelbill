// Returns a deterministic image URL for a given dish name.
// Use picsum.photos with a seeded path to ensure a stable image without API keys.
export function getItemImageUri(name: string): string {
  const seed = encodeURIComponent(name.trim().toLowerCase() || 'item');
  // 200x200 deterministic image per seed
  return `https://picsum.photos/seed/${seed}/200/200`;
}


