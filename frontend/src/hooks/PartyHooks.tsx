import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export interface Party {
  id: number
  party_name: string
  party_code: string
  description?: string
  created_by: number
  creator_name?: string
  creator_email?: string
  created: string
  updated: string
  is_archived: boolean
}

export interface CreatePartyData {
  party_name: string
  party_code: string
  description?: string
}

// Query key factory
export const partyKeys = {
  all: ['parties'] as const,
  lists: () => [...partyKeys.all, 'list'] as const,
  list: (includeArchived = false) => [...partyKeys.lists(), { includeArchived }] as const,
  details: () => [...partyKeys.all, 'detail'] as const,
  detail: (id: number) => [...partyKeys.details(), id] as const,
}

// Fetch all parties
export const useGetParties = (includeArchived = false) => {
  return useQuery({
    queryKey: partyKeys.list(includeArchived),
    queryFn: async () => {
      const response = await api.get(`/parties${includeArchived ? '?archived=true' : ''}`)
      if (response.data.status === 'success') {
        return response.data.data as Party[]
      }
      throw new Error(response.data.message || 'Failed to fetch parties')
    },
  })
}

// Fetch single party
export const useGetParty = (id: number, enabled = true) => {
  return useQuery({
    queryKey: partyKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/party/${id}`)
      if (response.data.status === 'success') {
        return response.data.data as Party
      }
      throw new Error(response.data.message || 'Failed to fetch party')
    },
    enabled,
  })
}

// Create party mutation
export const useCreateParty = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreatePartyData) => {
      const response = await api.post('/party', data)
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to create party')
    },
    onSuccess: () => {
      // Invalidate and refetch parties list
      queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
    },
  })
}

// Update party mutation
export const useUpdateParty = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreatePartyData }) => {
      const response = await api.put(`/party/${id}`, data)
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to update party')
    },
    onSuccess: (data) => {
      // Invalidate the specific party and lists
      queryClient.invalidateQueries({ queryKey: partyKeys.detail(data.party.id) })
      queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
    },
  })
}

// Delete/Archive party mutation
export const useDeleteParty = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, archive = false }: { id: number; archive?: boolean }) => {
      const url = archive ? `/party/${id}/archive` : `/party/${id}`
      const response = await api.delete(url)
      if (response.data.status === 'success') {
        return { success: true }
      }
      throw new Error(response.data.message || `Failed to ${archive ? 'archive' : 'delete'} party`)
    },
    onSuccess: () => {
      // Invalidate parties list
      queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
    },
  })
}

