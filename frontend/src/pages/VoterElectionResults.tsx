import {
  Box,
  Container,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PersonIcon from '@mui/icons-material/Person'
import { useParams, useNavigate } from 'react-router-dom'
import VoterSidenav from '../components/VoterSidenav'
import { useVoterElections } from '../hooks/VoterAuthHooks'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

const API_URL = 'http://localhost/Project_Vote/backend'

interface CandidateResult {
  id: number
  photo_url: string | null
  full_name: string
  position: string
  party_name: string
  party_code: string
  bio?: string
  vote_count: number
  percentage: number
}

interface PositionResults {
  position: string
  total_votes: number
  candidates: CandidateResult[]
}

const VoterElectionResults = () => {
  const { electionId } = useParams<{ electionId: string }>()
  const navigate = useNavigate()
  
  // Get election details
  const { data: elections = [] } = useVoterElections()
  const election = elections.find(e => e.id === Number(electionId))
  
  // Fetch results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/?request=election-results&election_id=${electionId}`,
        { withCredentials: true }
      )
      return response.data.data
    },
    enabled: !!electionId,
  })

  const results: PositionResults[] = resultsData?.results || []
  const totalVoters = resultsData?.total_voters || 0

  if (resultsLoading) {
    return (
      <VoterSidenav>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </VoterSidenav>
    )
  }

  if (!election) {
    return (
      <VoterSidenav>
        <Container maxWidth="xl">
          <Alert severity="error">Election not found</Alert>
        </Container>
      </VoterSidenav>
    )
  }

  return (
    <VoterSidenav>
      <Container maxWidth="xl">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate('/voter/home')} sx={{ mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Election Header */}
        <Paper
          elevation={2}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
            {/* Election Image */}
            {election.img_url && getImageUrl(election.img_url) ? (
              <Box
                component="img"
                src={getImageUrl(election.img_url) || ''}
                alt={election.election_title}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                  objectFit: 'cover',
                  boxShadow: 3,
                  display: { xs: 'none', sm: 'block' },
                }}
              />
            ) : null}

            {/* Election Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {election.election_title} - Results
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                {election.description || 'No description available'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Ended: ${new Date(election.end_date).toLocaleDateString()}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip
                  label={`Total Voters: ${totalVoters}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Results by Position */}
        {results.length === 0 ? (
          <Alert severity="info">No results available yet.</Alert>
        ) : (
          <>
            {results.map((positionResult) => (
              <Box key={positionResult.position} sx={{ mb: 5 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  {positionResult.position}
                  <Chip
                    label={`${positionResult.total_votes} votes`}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 3,
                  }}
                >
                  {positionResult.candidates
                    .sort((a, b) => b.vote_count - a.vote_count)
                    .map((candidate, index) => {
                      const isWinner = index === 0 && candidate.vote_count > 0
                      const photoUrl = candidate.photo_url ? getImageUrl(candidate.photo_url) : null

                      return (
                        <Card
                          key={candidate.id}
                          elevation={isWinner ? 6 : 2}
                          sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                            border: isWinner ? '3px solid' : '1px solid',
                            borderColor: isWinner ? 'primary.main' : 'divider',
                          }}
                        >
                          {/* Winner Badge */}
                          {isWinner && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                zIndex: 2,
                                bgcolor: 'warning.main',
                                borderRadius: '50%',
                                p: 1,
                                boxShadow: 3,
                              }}
                            >
                              <EmojiEventsIcon sx={{ color: 'white', fontSize: 32 }} />
                            </Box>
                          )}

                          {/* Candidate Image */}
                          <Box
                            sx={{
                              height: 200,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {photoUrl ? (
                              <Box
                                component="img"
                                src={photoUrl}
                                alt={candidate.full_name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <PersonIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                            )}
                          </Box>

                          {/* Card Content */}
                          <CardContent sx={{ p: 3 }}>
                            {/* Rank Badge */}
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              color={isWinner ? 'primary' : 'default'}
                              sx={{
                                mb: 1,
                                fontWeight: 600,
                              }}
                            />

                            {/* Party Badge */}
                            <Chip
                              label={candidate.party_code}
                              size="small"
                              sx={{
                                mb: 2,
                                ml: 1,
                                bgcolor: 'grey.100',
                              }}
                            />

                            {/* Name */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                mb: 0.5,
                              }}
                            >
                              {candidate.full_name}
                            </Typography>

                            {/* Party */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              {candidate.party_name}
                            </Typography>

                            {/* Vote Count */}
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Votes: {candidate.vote_count}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {candidate.percentage.toFixed(1)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={candidate.percentage}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: isWinner ? 'primary.main' : 'grey.500',
                                  },
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })}
                </Box>
              </Box>
            ))}
          </>
        )}
      </Container>
    </VoterSidenav>
  )
}

export default VoterElectionResults

