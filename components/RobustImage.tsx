import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, ImageProps } from 'react-native';
import { getItemImageUri, getItemImageUriFallback, getFoodishImageUri, getUnsplashFoodUriSync, getUnsplashFoodUri } from '@/lib/images';

interface RobustImageProps extends Omit<ImageProps, 'source'> {
  itemName: string;
  fallbackText?: string;
  showFallbackText?: boolean;
}

export default function RobustImage({ 
  itemName, 
  fallbackText, 
  showFallbackText = true,
  style,
  ...props 
}: RobustImageProps) {
  const [imageError, setImageError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the appropriate image based on fallback index
  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);
      
      try {
        let imageUri: string | null = null;
        
        if (fallbackIndex === 0) {
          // Try Unsplash sync first for high-quality food images with exact name
          imageUri = getUnsplashFoodUriSync(itemName);
        } else if (fallbackIndex === 1) {
          // Try Unsplash async API for better results
          try {
            imageUri = await getUnsplashFoodUri(itemName);
          } catch (error) {
            // Fallback to sync version
            imageUri = getUnsplashFoodUriSync(itemName);
          }
        } else if (fallbackIndex === 2) {
          // Then try LoremFlickr with exact food name
          imageUri = getItemImageUri(itemName);
        } else if (fallbackIndex === 3) {
          // Then try Foodish API for guaranteed food images
          imageUri = getFoodishImageUri(itemName);
        } else {
          // Then try fallback sources
          imageUri = getItemImageUriFallback(itemName, fallbackIndex - 4);
        }
        
        setCurrentImageUri(imageUri);
      } catch (error) {
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [itemName, fallbackIndex]);

  const handleError = () => {
    if (fallbackIndex < 9) {
      // Try next fallback (Unsplash sync + Unsplash async + LoremFlickr + Foodish + 6 fallbacks)
      setFallbackIndex(prev => prev + 1);
    } else {
      // All fallbacks failed
      setImageError(true);
    }
  };

  if (imageError || (!isLoading && !currentImageUri)) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackText}>
          {showFallbackText ? (fallbackText || itemName.charAt(0).toUpperCase()) : ''}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackText}>...</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: currentImageUri! }}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
