import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export interface Candidate {
  id: number
  election_id: number
  photo?: string
  photo_url?: string
  fname: string
  mname?: string
  lname: string
  full_name?: string
  party_id: number
  party_name?: string
  party_code?: string
  position_id?: number
  position: string
  position_name?: string
  allows_multiple_votes?: boolean
  bio: string
  created_by: number
  creator_name?: string
  creator_email?: string
  created: string
  updated: string
  is_archived: boolean
}

export interface CreateCandidateData {
  election_id: number
  fname: string
  mname?: string
  lname: string
  party_id: number
  position_id: number
  bio: string
  photo?: File | null
}

// Query key factory
export const candidateKeys = {
  all: ['candidates'] as const,
  lists: () => [...candidateKeys.all, 'list'] as const,
  list: (electionId: number, includeArchived = false) => [...candidateKeys.lists(), { electionId, includeArchived }] as const,
  details: () => [...candidateKeys.all, 'detail'] as const,
  detail: (id: number) => [...candidateKeys.details(), id] as const,
}

// Fetch candidates by election
export const useGetCandidates = (electionId: number, includeArchived = false) => {
  return useQuery({
    queryKey: candidateKeys.list(electionId, includeArchived),
    queryFn: async () => {
      const response = await api.get(`/candidates?election_id=${electionId}${includeArchived ? '&archived=true' : ''}`)
      if (response.data.status === 'success') {
        return response.data.data as Candidate[]
      }
      throw new Error(response.data.message || 'Failed to fetch candidates')
    },
    enabled: !!electionId,
  })
}

// Fetch single candidate
export const useGetCandidate = (id: number, enabled = true) => {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/candidate/${id}`)
      if (response.data.status === 'success') {
        return response.data.data as Candidate
      }
      throw new Error(response.data.message || 'Failed to fetch candidate')
    },
    enabled,
  })
}

// Create candidate mutation
export const useCreateCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateCandidateData) => {
      const formData = new FormData()
      formData.append('election_id', data.election_id.toString())
      formData.append('fname', data.fname)
      formData.append('mname', data.mname || '')
      formData.append('lname', data.lname)
      formData.append('party_id', data.party_id.toString())
      formData.append('position_id', data.position_id.toString())
      formData.append('bio', data.bio)
      
      if (data.photo) {
        formData.append('photo', data.photo)
      }
      
      const response = await api.post('/candidate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to create candidate')
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch candidates list for this election (both archived and non-archived)
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(variables.election_id, false) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(variables.election_id, true) })
    },
  })
}

// Update candidate mutation
export const useUpdateCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<CreateCandidateData, 'election_id'> }) => {
      const formData = new FormData()
      formData.append('fname', data.fname)
      formData.append('mname', data.mname || '')
      formData.append('lname', data.lname)
      formData.append('party_id', data.party_id.toString())
      formData.append('position_id', data.position_id.toString())
      formData.append('bio', data.bio)
      
      if (data.photo) {
        formData.append('photo', data.photo)
      }
      
      const response = await api.put(`/candidate/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to update candidate')
    },
    onSuccess: (data) => {
      // Invalidate the specific candidate and lists
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(data.candidate.id) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(data.candidate.election_id, false) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(data.candidate.election_id, true) })
    },
  })
}

// Delete/Archive candidate mutation
export const useDeleteCandidate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, electionId, archive = false }: { id: number; electionId: number; archive?: boolean }) => {
      const url = archive ? `/candidate/${id}/archive` : `/candidate/${id}`
      const response = await api.delete(url)
      if (response.data.status === 'success') {
        return { success: true, electionId }
      }
      throw new Error(response.data.message || `Failed to ${archive ? 'archive' : 'delete'} candidate`)
    },
    onSuccess: (data) => {
      // Invalidate candidates list for this election (both archived and non-archived)
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(data.electionId, false) })
      queryClient.invalidateQueries({ queryKey: candidateKeys.list(data.electionId, true) })
    },
  })
}

