import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voterAuthService, type VoterUser, type VoterProfile, type Election } from '../services/voterAuthService'

export { type VoterUser, type VoterProfile, type Election }

// Query keys
export const voterAuthKeys = {
  session: ['voter-session'] as const,
  profile: ['voter-profile'] as const,
  elections: ['voter-elections'] as const,
}

// Check session
export const useVoterSession = () => {
  return useQuery({
    queryKey: voterAuthKeys.session,
    queryFn: voterAuthService.checkSession,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Login mutation
export const useVoterLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      voterAuthService.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voterAuthKeys.session })
    },
  })
}

// Logout mutation
export const useVoterLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: voterAuthService.logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voterAuthKeys.session })
      queryClient.clear()
    },
    onError: () => {
      // Clear session even on error
      queryClient.invalidateQueries({ queryKey: voterAuthKeys.session })
      queryClient.clear()
    },
  })
}

// Get voter profile
export const useVoterProfile = () => {
  return useQuery({
    queryKey: voterAuthKeys.profile,
    queryFn: voterAuthService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update voter profile
export const useUpdateVoterProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: voterAuthService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: voterAuthKeys.profile })
      queryClient.invalidateQueries({ queryKey: voterAuthKeys.session })
    },
  })
}

// Get elections for voters
export const useVoterElections = () => {
  return useQuery({
    queryKey: voterAuthKeys.elections,
    queryFn: voterAuthService.getElections,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

