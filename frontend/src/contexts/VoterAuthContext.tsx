import React, { createContext, useContext, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVoterSession, useVoterLogout, type VoterUser } from '../hooks/VoterAuthHooks'

interface VoterAuthContextType {
  voter: VoterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (voter: VoterUser) => void
  logout: () => void
}

const VoterAuthContext = createContext<VoterAuthContextType | undefined>(undefined)

export const VoterAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const { data: sessionData, isLoading } = useVoterSession()
  const logoutMutation = useVoterLogout()

  const voter = (sessionData?.logged_in && sessionData?.voter) ? sessionData.voter : null
  const isAuthenticated = !!voter

  const login = (voterData: VoterUser) => {
    // Session is managed by backend, just trigger a refetch
    // This will be handled by react-query after successful login
  }

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate('/voter/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Navigate anyway
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

