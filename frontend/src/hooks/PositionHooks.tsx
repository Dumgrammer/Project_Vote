import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../config/axios'

export interface Position {
  id: number
  name: string
  allows_multiple_votes: boolean
  type: 'school' | 'corporate' | 'barangay'
  created_by: number
  creator_name?: string
  creator_email?: string
  created: string
  updated: string
  is_archived: boolean
}

export interface CreatePositionData {
  name: string
  allows_multiple_votes: boolean
  type: 'school' | 'corporate' | 'barangay'
}

// Query key factory
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (includeArchived = false, type?: string) => [...positionKeys.lists(), { includeArchived, type }] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: number) => [...positionKeys.details(), id] as const,
}

// Fetch all positions
export const useGetPositions = (includeArchived = false, type?: string) => {
  return useQuery({
    queryKey: positionKeys.list(includeArchived, type),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (includeArchived) params.append('archived', 'true')
      if (type) params.append('type', type)
      const response = await api.get(`/positions${params.toString() ? `?${params.toString()}` : ''}`)
      if (response.data.status === 'success') {
        // Normalize allows_multiple_votes to boolean (in case backend returns 0/1)
        return (response.data.data as Position[]).map(pos => ({
          ...pos,
          allows_multiple_votes: Boolean(pos.allows_multiple_votes)
        }))
      }
      throw new Error(response.data.message || 'Failed to fetch positions')
    },
  })
}

// Fetch single position
export const useGetPosition = (id: number, enabled = true) => {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/position/${id}`)
      if (response.data.status === 'success') {
        const position = response.data.data as Position
        // Normalize allows_multiple_votes to boolean (in case backend returns 0/1)
        return {
          ...position,
          allows_multiple_votes: Boolean(position.allows_multiple_votes)
        }
      }
      throw new Error(response.data.message || 'Failed to fetch position')
    },
    enabled,
  })
}

// Create position mutation
export const useCreatePosition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreatePositionData) => {
      const response = await api.post('/position', data)
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to create position')
    },
    onSuccess: () => {
      // Invalidate and refetch positions list
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

// Update position mutation
export const useUpdatePosition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreatePositionData }) => {
      const response = await api.put(`/position/${id}`, data)
      
      if (response.data.status === 'success') {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to update position')
    },
    onSuccess: (data) => {
      // Invalidate the specific position and lists
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(data.position.id) })
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

// Delete/Archive position mutation
export const useDeletePosition = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, archive = false }: { id: number; archive?: boolean }) => {
      const url = archive ? `/position/${id}/archive` : `/position/${id}`
      const response = await api.delete(url)
      if (response.data.status === 'success') {
        return { success: true }
      }
      throw new Error(response.data.message || `Failed to ${archive ? 'archive' : 'delete'} position`)
    },
    onSuccess: () => {
      // Invalidate positions list
      queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

