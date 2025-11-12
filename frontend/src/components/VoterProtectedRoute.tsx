import { Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useVoterAuth } from '../contexts/VoterAuthContext'

interface VoterProtectedRouteProps {
  children: React.ReactNode
}

const VoterProtectedRoute: React.FC<VoterProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useVoterAuth()

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/voter/login" replace />
  }

  return <>{children}</>
}

export default VoterProtectedRoute

