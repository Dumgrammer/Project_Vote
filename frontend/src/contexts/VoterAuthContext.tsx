import React, { createContext, useContext, type ReactNode, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVoterSession, useVoterLogout, type VoterUser } from '../hooks/VoterAuthHooks'

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
  const { data: sessionData, isLoading } = useVoterSession()
  const logoutMutation = useVoterLogout()
  const [voter, setVoter] = useState<VoterUser | null>(null)

  useEffect(() => {
    if (sessionData?.logged_in && sessionData.voter) {
      setVoter(sessionData.voter)
    } else if (sessionData?.logged_in === false) {
      setVoter(null)
    }
  }, [sessionData])

  const isAuthenticated = !!voter

  const login = useCallback((voterData: VoterUser) => {
    setVoter(voterData)
  }, [])

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
      setVoter(null)
      navigate('/voter/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Navigate anyway
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

