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
  
  // Check if it's a voter image (starts with voter_)
  if (imagePath.includes('voter_')) {
    return `${baseUrl}/uploads/voters/${imagePath}`
  }
  
  // Check if it's a candidate image (starts with candidate_)
  if (imagePath.includes('candidate_')) {
    return `${baseUrl}/uploads/candidates/${imagePath}`
  }
  
  // Otherwise, assume it's an election image
  return `${baseUrl}/uploads/elections/${imagePath}`
}

