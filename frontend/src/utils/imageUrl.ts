/**
 * Normalizes image URLs to work correctly with the development proxy
 * and production environment
 */
export function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'null' || imageUrl === 'undefined') {
    return '';
  }

  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a data URL, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // In development, use full URL to backend to avoid proxy issues
  // In production, relative paths will work fine
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment && imageUrl.startsWith('/uploads')) {
    // Use backend URL directly in development
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003';
    return `${backendUrl}${imageUrl}`;
  }

  // For relative paths (starting with /), return as is
  // Vite proxy should handle /uploads -> localhost:3003/uploads
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // For paths without leading slash, add it
  return `/${imageUrl}`;
}

