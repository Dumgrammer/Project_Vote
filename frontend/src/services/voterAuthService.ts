import axios from 'axios'

const API_URL = 'http://localhost/Project_Vote/backend'

axios.defaults.withCredentials = true

export interface VoterUser {
  id: number
  voters_id: string
  email: string
  fname: string
  mname: string
  lname: string
  fullname: string
}

export interface VoterSessionResponse {
  logged_in: boolean
  voter?: VoterUser
}

export interface VoterProfile {
  id: number
  voters_id: string
  v_image: string | null
  v_image_url: string | null
  fname: string
  mname: string
  lname: string
  full_name: string
  email: string
  contact_number: string | null
  is_verified: boolean
  date_registered: string
  date_verified: string | null
}

export interface Election {
  id: number
  election_title: string
  description: string
  start_date: string
  end_date: string
  img: string | null
  img_url: string | null
  status: 'not_started' | 'ongoing' | 'ended'
  created: string
}

export const voterAuthService = {
  login: async (email: string, password: string): Promise<VoterUser> => {
    const response = await axios.post(`${API_URL}/?request=voter-login`, {
      email,
      password,
    })
    return response.data.data.voter
  },

  logout: async (): Promise<void> => {
    await axios.post(`${API_URL}/?request=voter-logout`)
  },

  checkSession: async (): Promise<VoterSessionResponse> => {
    try {
      const response = await axios.get(`${API_URL}/?request=voter-session`)
      // Ensure we always return a valid response
      if (response.data && response.data.data) {
        return response.data.data
      }
      // Fallback if data structure is unexpected
      return { logged_in: false }
    } catch (error) {
      // If there's an error, return logged out state instead of undefined
      return { logged_in: false }
    }
  },

  getProfile: async (): Promise<VoterProfile> => {
    const response = await axios.get(`${API_URL}/?request=voter-profile`)
    // If data is undefined, throw an error instead of returning undefined
    if (!response.data?.data) {
      throw new Error('Profile not found')
    }
    return response.data.data
  },

  updateProfile: async (formData: FormData): Promise<void> => {
    await axios.post(`${API_URL}/?request=voter-profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getElections: async (): Promise<Election[]> => {
    const response = await axios.get(`${API_URL}/?request=voter-elections`)
    // Ensure we always return an array
    return response.data?.data || []
  },
}

