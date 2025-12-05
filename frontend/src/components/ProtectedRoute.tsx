import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { keyframes } from '@mui/system'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Define keyframe animations
const floatBox = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -40px) rotate(90deg);
  }
  50% {
    transform: translate(-25px, 30px) rotate(180deg);
  }
  75% {
    transform: translate(35px, 20px) rotate(270deg);
  }
`

const floatSmallBox = keyframes`
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(-25px, 30px) rotate(120deg);
  }
  66% {
    transform: translate(20px, -25px) rotate(240deg);
  }
`

// Floating background boxes component for admin (blue)
const FloatingBackground: React.FC<{ color: 'blue' | 'green' }> = ({ color }) => {
  const primaryColor = color === 'blue' ? '#2196f3' : '#4caf50'
  const secondaryColor = color === 'blue' ? '#1976d2' : '#388e3c'
  const lightColor = color === 'blue' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)'

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Floating boxes */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 60, sm: 80, md: 100 },
            height: { xs: 60, sm: 80, md: 100 },
            borderRadius: 3,
            bgcolor: lightColor,
            border: `2px solid ${primaryColor}`,
            opacity: 0.3,
            animation: `${floatBox} 20s infinite ease-in-out`,
            animationDelay: `${i * 0.5}s`,
            top: `${10 + i * 12}%`,
            left: `${5 + i * 11}%`,
          }}
        />
      ))}
      {/* Additional smaller boxes */}
      {[...Array(12)].map((_, i) => (
        <Box
          key={`small-${i}`}
          sx={{
            position: 'absolute',
            width: { xs: 30, sm: 40, md: 50 },
            height: { xs: 30, sm: 40, md: 50 },
            borderRadius: 2,
            bgcolor: lightColor,
            border: `1px solid ${secondaryColor}`,
            opacity: 0.2,
            animation: `${floatSmallBox} 15s infinite ease-in-out`,
            animationDelay: `${i * 0.3}s`,
            top: `${15 + i * 7}%`,
            left: `${8 + i * 7}%`,
          }}
        />
      ))}
    </Box>
  )
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        <FloatingBackground color="blue" />
        <CircularProgress sx={{ position: 'relative', zIndex: 1 }} />
      </Box>
    )
  }

  // Only redirect if not authenticated AND not already on login page
  // This prevents redirect loops on reload
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <FloatingBackground color="blue" />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}

