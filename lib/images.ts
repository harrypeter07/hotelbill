// Returns a deterministic image URL for a given dish name.
// Use food-specific image services to ensure we get actual food images.

function stableNumberFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000);
}

// Food-related image categories for better results
const foodCategories = [
  'pizza', 'burger', 'pasta', 'salad', 'soup', 'sandwich', 'rice', 'noodles',
  'chicken', 'beef', 'fish', 'vegetables', 'dessert', 'cake', 'coffee', 'tea',
  'juice', 'smoothie', 'bread', 'cheese', 'fruit', 'vegetable', 'curry', 'biryani',
  'naan', 'roti', 'dal', 'sabzi', 'tandoori', 'kebab', 'samosa', 'pakora'
];

function getFoodCategory(name: string): string {
  const lowerName = name.toLowerCase();
  for (const category of foodCategories) {
    if (lowerName.includes(category)) {
      return category;
    }
  }
  return 'food';
}

// Use LoremFlickr with the exact food name for specific food images
export function getItemImageUri(name: string): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Use the exact food name as the primary tag, with food-related fallback tags
  const foodTags = `${cleanName},food,meal,dish,restaurant,cooking`;
  return `https://loremflickr.com/200/200/${foodTags}?lock=${seed}`;
}

// Alternative food image service using Foodish API
export function getFoodishImageUri(name: string): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Foodish API provides random food images - use seed for consistency
  return `https://foodish-api.herokuapp.com/images/food/${seed % 10}.jpg`;
}

// Fallback image sources - all food-specific with exact food name
export function getItemImageUriFallback(name: string, fallbackIndex: number = 0): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName + fallbackIndex.toString());
  
  const fallbacks = [
    `https://loremflickr.com/200/200/${cleanName},food,meal?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},restaurant,cooking?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,food?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},meal,plate?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},food,delicious?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},chef,cooking?lock=${seed}`,
  ];
  
  return fallbacks[fallbackIndex % fallbacks.length];
}


