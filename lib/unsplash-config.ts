// Unsplash API Configuration
// Get your access key from: https://unsplash.com/developers

export const UNSPLASH_CONFIG = {
  // Replace with your actual Unsplash Access Key
  // You can get one for free at https://unsplash.com/developers
  ACCESS_KEY: '09WWylaoKhKr-2bvBPwrAfmW5J2Oy6JDSZmk_7R-Cjc',
  
  // API endpoints
  SEARCH_PHOTOS: 'https://api.unsplash.com/search/photos',
  
  // Default parameters
  DEFAULT_PARAMS: {
    per_page: 10,
    orientation: 'squarish',
    order_by: 'relevant',
    content_filter: 'low'
  }
};

// Check if we have a valid API key
export const hasValidApiKey = (): boolean => {
  return UNSPLASH_CONFIG.ACCESS_KEY !== 'YOUR_UNSPLASH_ACCESS_KEY' && 
         UNSPLASH_CONFIG.ACCESS_KEY.length > 0;
};
