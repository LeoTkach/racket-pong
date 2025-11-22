import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Uploads an image file to Firebase Storage
 * @param file - The file to upload
 * @param folder - The folder path in storage (e.g., 'avatars' or 'tournaments')
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to the download URL
 */
export async function uploadImageToFirebase(
  file: File,
  folder: 'avatars' | 'tournaments',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not available. Please check your internet connection or use local file upload.');
  }
  
  try {
    // Validate file size
    const maxSize = folder === 'avatars' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for avatars, 10MB for tournaments
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${folder === 'avatars' ? 'avatar' : 'tournament'}-${timestamp}-${randomSuffix}-${sanitizedName}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `${folder}/${filename}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image to Firebase:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You are not authorized to upload files. Please sign in.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.message?.includes('CORS') || error.message?.includes('preflight')) {
      throw new Error('CORS error: Please configure CORS for Firebase Storage. See FIREBASE_CORS_SETUP.md for instructions.');
    }
    
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Deletes an image from Firebase Storage
 * @param url - The Firebase Storage URL of the file to delete
 */
export async function deleteImageFromFirebase(url: string): Promise<void> {
  if (!storage) {
    throw new Error('Firebase Storage is not available. Please check your internet connection.');
  }
  
  try {
    // Extract the path from the Firebase Storage URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL');
    }

    // Decode the path (Firebase Storage URLs are URL-encoded)
    const decodedPath = decodeURIComponent(pathMatch[1]);
    
    // Create storage reference
    const storageRef = ref(storage, decodedPath);

    // Delete file
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Error deleting image from Firebase:', error);
    throw new Error(error.message || 'Failed to delete image');
  }
}

/**
 * Checks if a URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebase.storage');
}

