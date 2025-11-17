import axiosInstance, { buildApiUrl } from '../config/axios'
import type { Voter } from '../hooks/VoterHooks'

export interface CreateVoterResponse {
  id: number
  voters_id: string
  message: string
}

export const voterService = {
  getAllVoters: async (includeArchived: boolean = false): Promise<Voter[]> => {
    const response = await axiosInstance.get(
      buildApiUrl(`/?request=voters${includeArchived ? '&archived=true' : ''}`)
    )
    // Ensure we always return an array
    return response.data?.data || []
  },

  getVoterById: async (id: number): Promise<Voter> => {
    const response = await axiosInstance.get(buildApiUrl(`/?request=voter/${id}`))
    // If data is undefined, throw an error instead of returning undefined
    if (!response.data?.data) {
      throw new Error('Voter not found')
    }
    return response.data.data
  },

  createVoter: async (formData: FormData): Promise<CreateVoterResponse> => {
    const response = await axiosInstance.post(buildApiUrl('/?request=voter'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  updateVoter: async (id: number, formData: FormData): Promise<void> => {
    await axiosInstance.post(buildApiUrl(`/?request=voter/${id}`), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-HTTP-Method-Override': 'PUT',
      },
    })
  },

  archiveVoter: async (id: number): Promise<void> => {
    await axiosInstance.delete(buildApiUrl(`/?request=voter/${id}/archive`))
  },

  deleteVoter: async (id: number): Promise<void> => {
    await axiosInstance.delete(buildApiUrl(`/?request=voter/${id}`))
  },
}

