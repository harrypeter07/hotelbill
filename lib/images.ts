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

// Indian food mapping for generic food names
const indianFoodMapping: { [key: string]: string } = {
  'fish': 'indian fish curry machli',
  'chicken': 'indian chicken curry murg',
  'beef': 'indian beef curry gosht',
  'lamb': 'indian lamb curry gosht',
  'rice': 'indian rice pulao biryani',
  'bread': 'indian bread naan roti chapati',
  'soup': 'indian soup dal shorba',
  'salad': 'indian salad raita kachumber',
  'vegetables': 'indian vegetables sabzi bhaji',
  'potato': 'indian potato aloo sabzi',
  'onion': 'indian onion pyaz sabzi',
  'tomato': 'indian tomato tamatar sabzi',
  'spinach': 'indian spinach palak sabzi',
  'cauliflower': 'indian cauliflower gobi sabzi',
  'eggplant': 'indian eggplant baingan sabzi',
  'lentils': 'indian lentils dal',
  'beans': 'indian beans rajma chole',
  'chickpeas': 'indian chickpeas chole',
  'yogurt': 'indian yogurt dahi raita',
  'milk': 'indian milk doodh lassi',
  'cheese': 'indian cheese paneer',
  'dessert': 'indian dessert mithai gulab jamun',
  'sweet': 'indian sweet mithai rasgulla',
  'drink': 'indian drink lassi chai',
  'tea': 'indian tea chai masala',
  'coffee': 'indian coffee filter coffee',
  'juice': 'indian juice nimbu paani',
  'snack': 'indian snack samosa pakora',
  'appetizer': 'indian appetizer chaat tikki',
  'main course': 'indian main course curry sabzi',
  'side dish': 'indian side dish raita pickle',
  'breakfast': 'indian breakfast paratha poha',
  'lunch': 'indian lunch thali curry',
  'dinner': 'indian dinner curry rice',
  'sauce': 'indian sauce chutney curry',
  'spice': 'indian spice masala garam',
  'curry': 'indian curry masala',
  'gravy': 'indian gravy curry',
  'dry': 'indian dry sabzi tawa',
  'fried': 'indian fried pakora bhaji',
  'grilled': 'indian grilled tandoori',
  'steamed': 'indian steamed dhokla idli',
  'boiled': 'indian boiled dal sabzi',
  'roasted': 'indian roasted bhuna',
  'stir fried': 'indian stir fried tawa',
  'deep fried': 'indian deep fried pakora',
  'baked': 'indian baked tandoori',
  'raw': 'indian raw salad kachumber'
};

function getFoodCategory(name: string): string {
  const lowerName = name.toLowerCase();
  for (const category of foodCategories) {
    if (lowerName.includes(category)) {
      return category;
    }
  }
  return 'food';
}

// Enhance food name with Indian cuisine context
function enhanceFoodNameForIndianCuisine(name: string): string {
  const cleanName = name.toLowerCase().trim();
  
  // Check if it's already an Indian dish
  const indianDishes = ['biryani', 'curry', 'dal', 'naan', 'roti', 'chapati', 'pulao', 'tandoori', 'kebab', 'samosa', 'pakora', 'raita', 'lassi', 'chai', 'masala', 'gulab', 'jamun', 'rasgulla', 'paneer', 'sabzi', 'bhaji', 'aloo', 'gobi', 'palak', 'baingan', 'rajma', 'chole', 'dahi', 'mithai', 'chaat', 'tikki', 'paratha', 'poha', 'idli', 'dosa', 'dhokla', 'vada', 'sambar', 'rasam', 'pongal', 'upma', 'puri', 'bhature', 'kulcha', 'tandoori', 'tikka', 'malai', 'korma', 'vindaloo', 'jalfrezi', 'dopiaza', 'kadai', 'makhani', 'butter', 'chicken', 'mutton', 'gosht', 'machli', 'prawns', 'jhinga', 'crab', 'lobster', 'fish', 'murg', 'chicken', 'mutton', 'lamb', 'beef', 'pork'];
  
  const isIndianDish = indianDishes.some(dish => cleanName.includes(dish));
  
  if (isIndianDish) {
    // Already an Indian dish, add more context
    return `${cleanName} indian food restaurant cooking`;
  }
  
  // Check for generic food names and map to Indian equivalents
  for (const [generic, indian] of Object.entries(indianFoodMapping)) {
    if (cleanName.includes(generic)) {
      return indian;
    }
  }
  
  // If no specific mapping found, add Indian context
  return `${cleanName} indian food restaurant cooking`;
}

// Use LoremFlickr with the exact food name for specific food images
export function getItemImageUri(name: string): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName);
  
  // Enhance with Indian cuisine context
  const enhancedName = enhanceFoodNameForIndianCuisine(cleanName);
  const foodTags = `${enhancedName},food,meal,dish,restaurant,cooking`;
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
    // Enhance with Indian cuisine context
    const enhancedName = enhanceFoodNameForIndianCuisine(cleanName);
    const query = encodeURIComponent(`${enhancedName} food meal dish restaurant cooking`);
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
  
  // Enhance with Indian cuisine context
  const enhancedName = enhanceFoodNameForIndianCuisine(cleanName);
  return `https://source.unsplash.com/200x200/?${encodeURIComponent(enhancedName + ' food meal dish')}&sig=${seed}`;
}

// Fallback image sources - all food-specific with exact food name
export function getItemImageUriFallback(name: string, fallbackIndex: number = 0): string {
  const cleanName = (name || 'food').toLowerCase().trim();
  const seed = stableNumberFromString(cleanName + fallbackIndex.toString());
  
  // Enhance with Indian cuisine context
  const enhancedName = enhanceFoodNameForIndianCuisine(cleanName);
  
  const fallbacks = [
    `https://loremflickr.com/200/200/${enhancedName},food,meal?lock=${seed}`,
    `https://loremflickr.com/200/200/${enhancedName},restaurant,cooking?lock=${seed}`,
    `https://loremflickr.com/200/200/${enhancedName},indian,food?lock=${seed}`,
    `https://loremflickr.com/200/200/${enhancedName},meal,plate?lock=${seed}`,
    `https://loremflickr.com/200/200/${enhancedName},food,delicious?lock=${seed}`,
    `https://loremflickr.com/200/200/${enhancedName},chef,cooking?lock=${seed}`,
  ];
  
  return fallbacks[fallbackIndex % fallbacks.length];
}


