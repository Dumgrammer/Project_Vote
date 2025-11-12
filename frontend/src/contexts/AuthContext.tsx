import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, type User } from '../services/authService'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  checkSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  const checkSession = React.useCallback(async () => {
    try {
      const response = await authService.checkSession()
      if (response.status === 'success' && response.data.logged_in) {
        setUser(response.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check session on mount
  React.useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = React.useCallback((userData: User) => {
    setUser(userData)
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      navigate('/login')
    }
  }, [navigate])

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      checkSession,
    }),
    [user, isLoading, login, logout, checkSession]
  )

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

