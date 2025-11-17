import React, { createContext, useContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVoterSession, useVoterLogout, type VoterUser } from '../hooks/VoterAuthHooks'

interface VoterAuthContextType {
  voter: VoterUser | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => void
}

const VoterAuthContext = createContext<VoterAuthContextType | undefined>(undefined)

export const VoterAuthProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const { data: sessionData, isLoading } = useVoterSession()
  const logoutMutation = useVoterLogout()

  const voter = (sessionData?.logged_in && sessionData?.voter) ? sessionData.voter : null
  const isAuthenticated = !!voter


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

