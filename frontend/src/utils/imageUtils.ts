import { API_BASE_URL } from '../config/axios'

// Helper function to get the full image URL from the backend
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Construct the URL using the backend base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || API_BASE_URL
  
  // If the imagePath starts with 'uploads/', use it directly
  if (imagePath.startsWith('uploads/')) {
    return `${baseUrl}/${imagePath}`
  }
  
  // Otherwise, assume it's just the filename and construct the path
  return `${baseUrl}/uploads/elections/${imagePath}`
}

