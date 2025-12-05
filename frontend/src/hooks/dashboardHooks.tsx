import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { API_BASE_URL } from '../config/axios'
const API_URL = API_BASE_URL

interface DashboardStats {
  totalVoters: number
  totalElections: number
  totalVotes: number
  activeElections: number
}

interface ParticipationData {
  vote_hour: string
  date_label: string
  hour: number
  voters_count: number
  total_votes: number
}

interface RecentElection {
  id: number
  election_title: string
  start_date: string
  end_date: string
  total_voters: number
  total_votes: number
  status: 'ongoing' | 'upcoming' | 'completed'
}

interface TopElection {
  id: number
  election_title: string
  voter_count: number
  vote_count: number
}

interface VotingTrend {
  id: number
  election_title: string
  voters_voted: number
  total_voters: number
  participation_rate: number
}

interface ElectionResult {
  candidate_name: string
  position: string
  party_code: string
  vote_count: number
}

interface RecentEndedElection {
  id: number
  election_title: string
  start_date: string
  end_date: string
}

interface DashboardData {
  stats: DashboardStats
  participation: ParticipationData[]
  recentElections: RecentElection[]
  topElections: TopElection[]
  votingTrends: VotingTrend[]
  recentEndedElection: RecentEndedElection | null
  electionResults: ElectionResult[]
}

export const useDashboardStats = () => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/?request=dashboard-stats`, {
        withCredentials: true,
      })
      return response.data.data
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  })
}

export const useElectionAnalytics = (electionId: number | string) => {
  return useQuery({
    queryKey: ['election-analytics', electionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/?request=election-analytics&election_id=${electionId}`,
        { withCredentials: true }
      )
      return response.data.data
    },
    enabled: !!electionId,
    retry: 2,
  })
}

