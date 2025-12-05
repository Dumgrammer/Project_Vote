import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, type User } from '../services/authService'

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
  const navigate = useNavigate()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Check session via API on mount (cookie is HttpOnly, can't read it directly)
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔵 AuthContext: Checking session via API...')
        const response = await authService.checkSession()
        console.log('🔵 AuthContext: Session check response:', response)
        
        if (response.data?.logged_in && response.data?.user) {
          console.log('✅ AuthContext: Session valid, setting user')
          setUser(response.data.user)
        } else {
          console.log('❌ AuthContext: No valid session')
          setUser(null)
        }
      } catch (error) {
        console.log('❌ AuthContext: Session check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const checkSession = React.useCallback(async () => {
    try {
      const response = await authService.checkSession()
      if (response.data?.logged_in && response.data?.user) {
        setUser(response.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }, [])

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

