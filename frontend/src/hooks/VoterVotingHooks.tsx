import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from '../config/axios'

const API_URL = 'http://localhost/Project_Vote/backend'

interface VoteData {
  candidate_id: number
  position: string
}

interface CastVotesRequest {
  election_id: number
  votes: VoteData[]
}

interface VoterVote {
  id: number
  candidate_id: number
  position: string
  date_voted: string
  candidate_name: string
  party_name: string
  party_code: string
}

interface VoterVotesResponse {
  has_voted: boolean
  votes: VoterVote[]
}

// Hook to fetch voter's votes for an election
export const useVoterVotes = (electionId: number | string) => {
  return useQuery({
    queryKey: ['voter-votes', electionId],
    queryFn: async (): Promise<VoterVotesResponse> => {
      const response = await axios.get(
        `${API_URL}/?request=voter-votes&election_id=${electionId}`,
        { withCredentials: true }
      )
      return response.data.data
    },
    enabled: !!electionId,
  })
}

// Hook to cast votes
export const useCastVotes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (votesData: CastVotesRequest) => {
      const response = await axios.post(
        `${API_URL}/?request=cast-votes`,
        votesData,
        { withCredentials: true }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate voter votes query for this election
      queryClient.invalidateQueries({ queryKey: ['voter-votes', variables.election_id] })
    },
  })
}

