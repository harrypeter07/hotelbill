# Unsplash API Setup

To get high-quality, specific food images for your menu items, you need to set up an Unsplash API key.

## Steps to Get Unsplash API Key:

1. **Go to Unsplash Developers**: https://unsplash.com/developers
2. **Sign up/Login**: Create an account or login to Unsplash
3. **Create New Application**: Click "New Application"
4. **Fill Application Details**:
   - Application name: "Hotel Waiter App" (or any name you prefer)
   - Description: "Mobile app for restaurant order management"
   - Website: Your website or "localhost" for development
5. **Accept Terms**: Accept the API terms and conditions
6. **Get Access Key**: Copy the "Access Key" from your application

## Setup in Your App:

1. **Open the config file**: `lib/unsplash-config.ts`
2. **Replace the placeholder**: Change `YOUR_UNSPLASH_ACCESS_KEY` with your actual access key
3. **Save the file**: The app will now use the Unsplash API for better food images

## Example:

```typescript
export const UNSPLASH_CONFIG = {
  ACCESS_KEY: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz', // Your actual key
  // ... rest of config
};
```

## Benefits:

- ✅ **High-Quality Images**: Professional food photography
- ✅ **Specific Food Images**: Images match the exact food name you enter
- ✅ **Consistent Results**: Same food name always gets the same image
- ✅ **Free Tier**: 50 requests per hour (more than enough for a restaurant app)
- ✅ **No Watermarks**: Clean, professional images

## Fallback System:

If the Unsplash API is not available or fails, the app will automatically fall back to:
1. Unsplash Source (without API key)
2. LoremFlickr with food tags
3. Foodish API
4. Multiple fallback sources

Your app will work even without the API key, but with the key you'll get much better results!
