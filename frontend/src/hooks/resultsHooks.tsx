import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { API_BASE_URL } from '../config/axios'
const API_URL = API_BASE_URL

interface Election {
  id: number
  election_title: string
  description: string
  start_date: string
  end_date: string
  img: string
  is_archived: number
  status?: string
}

interface Candidate {
  id: number
  full_name: string
  fname: string
  mname: string
  lname: string
  position: string
  party_name: string
  party_code: string
  photo: string
  photo_url: string | null
  bio: string
  vote_count: number
  percentage?: number
  vote_percentage?: number
}

interface ResultsByPosition {
  position: string
  total_votes: number
  candidates: Candidate[]
}

interface ElectionResults {
  election: Election
  total_voters: number
  results: ResultsByPosition[]
}

export const useElections = () => {
  return useQuery<Election[]>({
    queryKey: ['elections-list-all'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/?request=elections`, {
        withCredentials: true,
      })
      // Return all non-archived elections (backend already filters archived)
      return response.data.data || []
    },
  })
}

export const useElectionResults = (electionId: number | null) => {
  return useQuery<ElectionResults>({
    queryKey: ['election-results', electionId],
    queryFn: async () => {
      if (!electionId) throw new Error('Election ID is required')
      const response = await axios.get(
        `${API_URL}/?request=election-results&election_id=${electionId}`,
        {
          withCredentials: true,
        }
      )
      return response.data.data
    },
    enabled: !!electionId,
  })
}

