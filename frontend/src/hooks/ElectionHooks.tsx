import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export interface Election {
  id: number
  img?: string
  img_url?: string
  election_title: string
  description: string
  election_type: 'school' | 'corporate' | 'barangay'
  start_date: string
  end_date: string
  created_by: number
  creator_name?: string
  creator_email?: string
  created: string
  updated: string
  is_archived: boolean
  status?: 'ongoing' | 'not_started' | 'ended'
}

export interface CreateElectionData {
  election_title: string
  description: string
  election_type: 'school' | 'corporate' | 'barangay'
  start_date: string
  end_date: string
  img?: File | null
}

// Query key factory
export const electionKeys = {
  all: ['elections'] as const,
  lists: () => [...electionKeys.all, 'list'] as const,
  list: (includeArchived: boolean) => [...electionKeys.lists(), { includeArchived }] as const,
  details: () => [...electionKeys.all, 'detail'] as const,
  detail: (id: number) => [...electionKeys.details(), id] as const,
}

// Fetch all elections
export const useGetElections = (includeArchived = false) => {
  return useQuery({
    queryKey: electionKeys.list(includeArchived),
    queryFn: async () => {
      const response = await api.get(`/elections${includeArchived ? '?archived=true' : ''}`)
      if (response.data.status === 'success') {
        return response.data.data as Election[]
      }
      throw new Error(response.data.message || 'Failed to fetch elections')
    },
  })
}

// Fetch single election
export const useGetElection = (id: number, enabled = true) => {
  return useQuery({
    queryKey: electionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/election/${id}`)
      if (response.data.status === 'success') {
        return response.data.data as Election
      }
      throw new Error(response.data.message || 'Failed to fetch election')
    },
    enabled,
  })
}

// Create election mutation
export const useCreateElection = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateElectionData) => {
      const formData = new FormData()
      formData.append('election_title', data.election_title)
      formData.append('description', data.description)
      formData.append('election_type', data.election_type)
      formData.append('start_date', data.start_date)
      formData.append('end_date', data.end_date)
      
      if (data.img) {
        formData.append('img', data.img)
      }
      
      const response = await api.post('/election', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to create election')
    },
    onSuccess: () => {
      // Invalidate and refetch elections list
      queryClient.invalidateQueries({ queryKey: electionKeys.lists() })
    },
  })
}

// Update election mutation
export const useUpdateElection = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateElectionData }) => {
      const response = await api.put(`/election/${id}`, data)
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to update election')
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific election and lists
      queryClient.invalidateQueries({ queryKey: electionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: electionKeys.lists() })
    },
  })
}

// Delete/Archive election mutation
export const useDeleteElection = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, archive = false }: { id: number; archive?: boolean }) => {
      const url = archive ? `/election/${id}/archive` : `/election/${id}`
      const response = await api.delete(url)
      if (response.data.status === 'success') {
        return true
      }
      throw new Error(response.data.message || `Failed to ${archive ? 'archive' : 'delete'} election`)
    },
    onSuccess: () => {
      // Invalidate elections list
      queryClient.invalidateQueries({ queryKey: electionKeys.lists() })
    },
  })
}
