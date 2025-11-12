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
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Snackbar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import PersonIcon from '@mui/icons-material/Person'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import VoterSidenav from '../components/VoterSidenav'
import { useVoterElections } from '../hooks/VoterAuthHooks'
import { useVoterVotes, useCastVotes } from '../hooks/VoterVotingHooks'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

const API_URL = 'http://localhost/Project_Vote/backend'

interface Candidate {
  id: number
  photo: string | null
  photo_url: string | null
  full_name: string
  position: string
  party_name: string
  party_code: string
  bio?: string
}

const VoterElectionCandidates = () => {
  const { electionId } = useParams<{ electionId: string }>()
  const navigate = useNavigate()
  const [selectedVotes, setSelectedVotes] = useState<Record<string, number>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Get elections from voter context to find the current election
  const { data: elections = [] } = useVoterElections()
  const election = elections.find(e => e.id === Number(electionId))
  
  // Fetch candidates using the public endpoint
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ['voter-candidates', electionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/?request=search-candidates&election_id=${electionId}`,
        { withCredentials: true }
      )
      return response.data.data
    },
    enabled: !!electionId,
  })

  // Fetch voter's votes for this election
  const { data: voterVotesData, isLoading: votesLoading, refetch: refetchVotes } = useVoterVotes(electionId || '')
  const hasVoted = voterVotesData?.has_voted || false
  const existingVotes = voterVotesData?.votes || []

  // Cast votes mutation
  const castVotesMutation = useCastVotes()

  const candidates = candidatesData?.candidates || []

  // Group candidates by position
  const candidatesByPosition = candidates.reduce((acc: Record<string, Candidate[]>, candidate: Candidate) => {
    if (!acc[candidate.position]) {
      acc[candidate.position] = []
    }
    acc[candidate.position].push(candidate)
    return acc
  }, {} as Record<string, Candidate[]>)

  // Check if election is ongoing
  const isElectionOngoing = election ? 
    new Date() >= new Date(election.start_date) && new Date() <= new Date(election.end_date) : false

  // Allow voting/editing as long as election is ongoing
  const canVote = isElectionOngoing

  const isLoading = candidatesLoading || votesLoading

  // Initialize selected votes with existing votes when data loads
  useEffect(() => {
    if (existingVotes.length > 0) {
      const initialVotes: Record<string, number> = {}
      existingVotes.forEach(vote => {
        initialVotes[vote.position] = vote.candidate_id
      })
      setSelectedVotes(initialVotes)
    }
  }, [existingVotes.length]) // Only run when vote count changes

  // Handle vote selection
  const handleVoteChange = (position: string, candidateId: number) => {
    setSelectedVotes(prev => ({
      ...prev,
      [position]: candidateId
    }))
  }

  // Handle submit votes
  const handleSubmitVotes = async () => {
    if (Object.keys(selectedVotes).length === 0) {
      setErrorMessage('Please select at least one candidate')
      setShowError(true)
      return
    }

    const votes = Object.entries(selectedVotes).map(([position, candidate_id]) => ({
      position,
      candidate_id
    }))

    try {
      await castVotesMutation.mutateAsync({
        election_id: Number(electionId),
        votes
      })
      setShowSuccess(true)
      // Refetch votes to update the UI with latest data
      refetchVotes()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      setErrorMessage(err?.response?.data?.message || 'Failed to cast votes')
      setShowError(true)
    }
  }

  if (isLoading) {
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
                {election.election_title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                {election.description || 'No description available'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`${new Date(election.start_date).toLocaleDateString()} - ${new Date(
                    election.end_date
                  ).toLocaleDateString()}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip
                  icon={<HowToVoteIcon />}
                  label={`${candidates.length} Candidates`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Voting Status Alert */}
        {hasVoted && isElectionOngoing && (
          <Alert severity="info" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            You have cast your votes. You can still edit your selections until the election ends.
          </Alert>
        )}

        {hasVoted && !isElectionOngoing && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            You have cast your votes for this election. The election has ended.
          </Alert>
        )}

        {!isElectionOngoing && !hasVoted && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {new Date() < new Date(election?.start_date || '') 
              ? 'This election has not started yet.' 
              : 'This election has ended and you did not vote.'}
          </Alert>
        )}

        {/* Candidates by Position */}
        {Object.keys(candidatesByPosition).length === 0 ? (
          <Alert severity="info">No candidates available for this election yet.</Alert>
        ) : (
          <>
            {Object.entries(candidatesByPosition).map(([position, positionCandidates]) => {
              const existingVote = existingVotes.find(v => v.position === position)
              
              return (
                <Box key={position} sx={{ mb: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {position}
                    </Typography>
                    {existingVote && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`Voted for ${existingVote.candidate_name}`}
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <FormControl component="fieldset" fullWidth disabled={!canVote}>
                    <RadioGroup
                      value={selectedVotes[position] || (existingVote?.candidate_id || '')}
                      onChange={(e) => handleVoteChange(position, Number(e.target.value))}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: 3,
                        }}
                      >
                        {(positionCandidates as Candidate[]).map((candidate: Candidate) => {
                          const photoUrl = candidate.photo_url ? getImageUrl(candidate.photo_url) : null
                          const isSelected = selectedVotes[position] === candidate.id || existingVote?.candidate_id === candidate.id
                          
                          return (
                            <Card
                              key={candidate.id}
                              elevation={isSelected ? 4 : 2}
                              sx={{
                                maxWidth: 345,
                                borderRadius: 2,
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'all 0.2s',
                                border: isSelected ? '2px solid' : '1px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                '&:hover': {
                                  transform: !canVote ? 'none' : 'translateY(-4px)',
                                  boxShadow: 3,
                                },
                                opacity: !canVote ? 0.7 : 1,
                              }}
                            >
                              {/* Candidate Image */}
                              <Box
                                sx={{
                                  height: 200,
                                  bgcolor: 'grey.200',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  position: 'relative',
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
                                {isSelected && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 10,
                                      right: 10,
                                      bgcolor: 'primary.main',
                                      borderRadius: '50%',
                                      p: 0.5,
                                    }}
                                  >
                                    <CheckCircleIcon sx={{ color: 'white', fontSize: 28 }} />
                                  </Box>
                                )}
                              </Box>

                              {/* Card Content */}
                              <CardContent sx={{ p: 2 }}>
                                {/* Party Badge */}
                                <Chip
                                  label={candidate.party_code}
                                  size="small"
                                  sx={{
                                    mb: 1,
                                    bgcolor: 'grey.100',
                                    fontSize: '0.75rem',
                                    height: 24,
                                  }}
                                />

                                {/* Name */}
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    mb: 0.5,
                                    color: 'text.primary',
                                  }}
                                >
                                  {candidate.full_name}
                                </Typography>

                                {/* Position & Party */}
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ mb: 1.5 }}
                                >
                                  {position} • {candidate.party_name}
                                </Typography>

                                {/* Bio */}
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    mb: 2,
                                  }}
                                >
                                  {candidate.bio || 'No biography available'}
                                </Typography>

                                {/* Vote Radio Button */}
                                {canVote && (
                                  <FormControlLabel
                                    value={candidate.id}
                                    control={<Radio />}
                                    label="Select this candidate"
                                    sx={{ width: '100%' }}
                                  />
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </Box>
              )
            })}

            {/* Submit Votes Button */}
            {canVote && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitVotes}
                  disabled={castVotesMutation.isPending || Object.keys(selectedVotes).length === 0}
                  startIcon={castVotesMutation.isPending ? <CircularProgress size={20} /> : <HowToVoteIcon />}
                  sx={{
                    px: 6,
                    py: 1.5,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  {castVotesMutation.isPending 
                    ? 'Submitting...' 
                    : hasVoted 
                      ? 'Update Votes' 
                      : 'Submit Votes'}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Success/Error Snackbars */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
            {hasVoted ? 'Your votes have been successfully updated!' : 'Your votes have been successfully cast!'}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    </VoterSidenav>
  )
}

export default VoterElectionCandidates

