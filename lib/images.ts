// Returns a deterministic image URL for a given dish name.
// Use food-specific image services to ensure we get actual food images.

import { UNSPLASH_CONFIG, hasValidApiKey } from './unsplash-config';

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
  
  // Add indian and cooked to the query for Indian cooked food images
  const foodTags = `${cleanName},indian,cooked,food,meal,dish,restaurant,cooking`;
  return `https://loremflickr.com/200/200/${foodTags}?lock=${seed}`;
}

// Alternative food image service using Foodish API
export function getFoodishImageUri(name: string): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Foodish API provides random food images - use seed for consistency
  return `https://foodish-api.herokuapp.com/images/food/${seed % 10}.jpg`;
}

// Use Unsplash API with exact food name for high-quality food images
export async function getUnsplashFoodUri(name: string): Promise<string> {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Check if we have a valid API key
  if (!hasValidApiKey()) {
    throw new Error('No valid Unsplash API key');
  }
  
  try {
    // Add indian and cooked to the query for Indian cooked food images
    const query = encodeURIComponent(`${cleanName} indian cooked food meal dish restaurant cooking`);
    const page = (seed % 3) + 1; // Use different pages for variety
    
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: UNSPLASH_CONFIG.DEFAULT_PARAMS.per_page.toString(),
      orientation: UNSPLASH_CONFIG.DEFAULT_PARAMS.orientation,
      order_by: UNSPLASH_CONFIG.DEFAULT_PARAMS.order_by,
      content_filter: UNSPLASH_CONFIG.DEFAULT_PARAMS.content_filter
    });
    
    const apiUrl = `${UNSPLASH_CONFIG.SEARCH_PHOTOS}?${params}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_CONFIG.ACCESS_KEY}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Use the seed to pick a consistent image from results
      const imageIndex = seed % data.results.length;
      const selectedImage = data.results[imageIndex];
      
      // Return the small image URL (200x200)
      return selectedImage.urls.small || selectedImage.urls.thumb;
    }
    
    throw new Error('No images found');
  } catch (error) {
    // Fallback to the sync method if API fails
    return getUnsplashFoodUriSync(name);
  }
}

// Synchronous fallback for Unsplash (without API key)
export function getUnsplashFoodUriSync(name: string): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Add indian and cooked to the query for Indian cooked food images
  return `https://source.unsplash.com/200x200/?${encodeURIComponent(cleanName + ' indian cooked food meal dish')}&sig=${seed}`;
}

// Fallback image sources - all food-specific with exact food name
export function getItemImageUriFallback(name: string, fallbackIndex: number = 0): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName + fallbackIndex.toString());
  
  const fallbacks = [
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,food,meal?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,restaurant,cooking?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,food,delicious?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,meal,plate?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,chef,cooking?lock=${seed}`,
    `https://loremflickr.com/200/200/${cleanName},indian,cooked,curry,spice?lock=${seed}`,
  ];
  
  return fallbacks[fallbackIndex % fallbacks.length];
}


