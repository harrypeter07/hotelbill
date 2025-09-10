import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageProps } from 'react-native';
import { getItemImageUri, getItemImageUriFallback, getFoodishImageUri } from '@/lib/images';

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

  const handleError = () => {
    if (fallbackIndex < 8) {
      // Try next fallback (Foodish + LoremFlickr + 6 fallbacks)
      setFallbackIndex(prev => prev + 1);
    } else {
      // All fallbacks failed
      setImageError(true);
    }
  };

  const getImageUri = () => {
    if (imageError) return null;
    if (fallbackIndex === 0) {
      // Try Foodish API first for guaranteed food images
      return getFoodishImageUri(itemName);
    } else if (fallbackIndex === 1) {
      // Then try LoremFlickr with food tags
      return getItemImageUri(itemName);
    }
    // Then try fallback sources
    return getItemImageUriFallback(itemName, fallbackIndex - 2);
  };

  const imageUri = getImageUri();

  if (imageError || !imageUri) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={styles.fallbackText}>
          {showFallbackText ? (fallbackText || itemName.charAt(0).toUpperCase()) : ''}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
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
