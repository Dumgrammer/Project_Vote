import React, { createContext, useContext, type ReactNode, useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVoterLogout, type VoterUser } from '../hooks/VoterAuthHooks'
import { voterAuthService } from '../services/voterAuthService'

interface VoterAuthContextType {
  voter: VoterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (voterData: VoterUser) => void
  logout: () => void
}

const VoterAuthContext = createContext<VoterAuthContextType | undefined>(undefined)

export const VoterAuthProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const logoutMutation = useVoterLogout()
  const [voter, setVoter] = useState<VoterUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check session via API on mount (cookie is HttpOnly, can't read it directly)
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🟢 VoterAuthContext: Checking session via API...')
        const response = await voterAuthService.checkSession()
        console.log('🟢 VoterAuthContext: Session check response:', response)
        
        if (response.logged_in && response.voter) {
          console.log('✅ VoterAuthContext: Session valid, setting voter')
          setVoter(response.voter)
        } else {
          console.log('❌ VoterAuthContext: No valid session')
          setVoter(null)
        }
      } catch (error) {
        console.log('❌ VoterAuthContext: Session check failed:', error)
        setVoter(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const isAuthenticated = !!voter

  const login = useCallback((voterData: VoterUser) => {
    setVoter(voterData)
  }, [])

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setVoter(null)
      navigate('/voter/login')
    }
  }

  return (
    <VoterAuthContext.Provider
      value={{
        voter,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </VoterAuthContext.Provider>
  )
}

export const useVoterAuth = () => {
  const context = useContext(VoterAuthContext)
  if (context === undefined) {
    throw new Error('useVoterAuth must be used within a VoterAuthProvider')
  }
  return context
}

