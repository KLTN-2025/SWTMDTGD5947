// Image utility functions

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009/api';
const BASE_URL = API_BASE_URL.replace('/api', ''); // Remove /api suffix

/**
 * Build full image URL from relative path
 * @param imagePath - Relative path from database (e.g., "/storage/images/profiles/123.jpg")
 * @returns Full URL (e.g., "http://localhost:8009/storage/images/profiles/123.jpg")
 */
export function getImageUrl(imagePath: string | null | undefined): string | undefined {
  if (!imagePath) return undefined;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Ensure path starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Build full URL
  return `${BASE_URL}${normalizedPath}`;
}
