import axios from 'axios'
import type { Voter } from '../hooks/VoterHooks'

const API_URL = 'http://localhost/Project_Vote/backend'

axios.defaults.withCredentials = true

export interface CreateVoterResponse {
  id: number
  voters_id: string
  message: string
}

export const voterService = {
  getAllVoters: async (includeArchived: boolean = false): Promise<Voter[]> => {
    const response = await axios.get(
      `${API_URL}/?request=voters${includeArchived ? '&archived=true' : ''}`
    )
    // Ensure we always return an array
    return response.data?.data || []
  },

  getVoterById: async (id: number): Promise<Voter> => {
    const response = await axios.get(`${API_URL}/?request=voter/${id}`)
    // If data is undefined, throw an error instead of returning undefined
    if (!response.data?.data) {
      throw new Error('Voter not found')
    }
    return response.data.data
  },

  createVoter: async (formData: FormData): Promise<CreateVoterResponse> => {
    const response = await axios.post(`${API_URL}/?request=voter`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  updateVoter: async (id: number, formData: FormData): Promise<void> => {
    await axios.post(`${API_URL}/?request=voter/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-HTTP-Method-Override': 'PUT',
      },
    })
  },

  archiveVoter: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/?request=voter/${id}/archive`)
  },

  deleteVoter: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/?request=voter/${id}`)
  },
}

