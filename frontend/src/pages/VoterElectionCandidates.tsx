import {
  Avatar,
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
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import PersonIcon from '@mui/icons-material/Person'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import VoterSidenav from '../components/VoterSidenav'
import StatusModal from '../components/StatusModal'
import { useVoterElections } from '../hooks/VoterAuthHooks'
import { useVoterVotes, useCastVotes } from '../hooks/VoterVotingHooks'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

const API_URL = 'http://localhost/Project_Vote/backend'

const getTypeConfig = (type: 'school' | 'corporate' | 'barangay') => {
  switch (type) {
    case 'school':
      return { label: 'School Election', bgcolor: 'rgba(46, 125, 50, 0.2)', color: '#e8f5e9' }
    case 'corporate':
      return { label: 'Corporate Election', bgcolor: 'rgba(21, 101, 192, 0.2)', color: '#e3f2fd' }
    case 'barangay':
      return { label: 'Barangay Election', bgcolor: 'rgba(239, 108, 0, 0.2)', color: '#fff3e0' }
    default:
      return { label: 'Election', bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }
  }
}

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
  const [expandedBios, setExpandedBios] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [modalState, setModalState] = useState<{
    open: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  })
  
  // Get elections from voter context to find the current election
  const { data: elections = [] } = useVoterElections()
  const election = elections.find(e => e.id === Number(electionId))
  const electionTypeConfig = election ? getTypeConfig(election.election_type) : null
  
  if (!election && elections.length > 0) {
    return (
      <VoterSidenav>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <IconButton size="small" onClick={() => navigate('/voter/home')} sx={{ color: 'inherit' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Election Unavailable
            </Typography>
          </Box>
          <Alert severity="warning">
            This election is not available for your voter account. Please choose another election from the list.
          </Alert>
        </Container>
      </VoterSidenav>
    )
  }

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

  // Toggle bio expansion
  const toggleBioExpansion = (candidateId: number) => {
    setExpandedBios(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  // Sort candidates
  const sortCandidates = (candidates: Candidate[]) => {
    return [...candidates].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }

  const handleViewModeChange = (_: unknown, newMode: 'cards' | 'table' | null) => {
    if (newMode) {
      setViewMode(newMode)
    }
  }

  // Handle submit votes
  const handleSubmitVotes = async () => {
    if (Object.keys(selectedVotes).length === 0) {
      setModalState({
        open: true,
        type: 'error',
        title: 'No Selection',
        message: 'Please select at least one candidate before submitting.',
      })
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
      setModalState({
        open: true,
        type: 'success',
        title: hasVoted ? 'Votes Updated!' : 'Votes Cast Successfully!',
        message: hasVoted 
          ? 'Your votes have been successfully updated!' 
          : 'Your votes have been successfully cast!',
      })
      // Refetch votes to update the UI with latest data
      refetchVotes()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      setModalState({
        open: true,
        type: 'error',
        title: 'Vote Failed',
        message: err?.response?.data?.message || 'Failed to cast votes. Please try again.',
      })
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
                {electionTypeConfig && (
                  <Chip
                    label={electionTypeConfig.label}
                    sx={{
                      bgcolor: electionTypeConfig.bgcolor,
                      color: electionTypeConfig.color,
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                    }}
                  />
                )}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '8px !important' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
                color="primary"
              >
                <ToggleButton value="cards" sx={{ textTransform: 'none' }}>
                  Card view
                </ToggleButton>
                <ToggleButton value="table" sx={{ textTransform: 'none' }}>
                  Table view
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {Object.entries(candidatesByPosition).map(([position, positionCandidates], index) => {
              const existingVote = existingVotes.find(v => v.position === position)
              const sortedCandidates = sortCandidates(positionCandidates as Candidate[])
              const currentSelection = selectedVotes[position] ?? existingVote?.candidate_id ?? ''
              const radioGroupValue =
                typeof currentSelection === 'number' ? String(currentSelection) : ''

              return (
                <Box key={position} sx={{ mt: index === 0 ? '0 !important' : '2px !important', mb: '0 !important' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: '4px !important',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  </Box>

                  <FormControl
                    component="fieldset"
                    fullWidth
                    disabled={!canVote}
                    sx={{ mt: '0 !important', mb: '0 !important' }}
                  >
                    <RadioGroup
                      name={`candidate-${position}`}
                      value={radioGroupValue}
                      onChange={e => handleVoteChange(position, Number(e.target.value))}
                      sx={{ width: '100%', mt: '0 !important', mb: '0 !important' }}
                    >
                      {viewMode === 'cards' ? (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                              xs: '1fr',
                              sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                            },
                            gap: '6px !important',
                            alignItems: 'start',
                          }}
                        >
                          {sortedCandidates.map((candidate: Candidate) => {
                            const photoUrl = candidate.photo_url ? getImageUrl(candidate.photo_url) : null
                            const isSelected =
                              selectedVotes[position] === candidate.id || existingVote?.candidate_id === candidate.id

                            const isBioExpanded = expandedBios.has(candidate.id)
                            const bioText = candidate.bio || 'No biography available'
                            const isBioLong = bioText.length > 100

                            return (
                              <Card
                                key={candidate.id}
                                elevation={isSelected ? 4 : 2}
                                onClick={() => canVote && handleVoteChange(position, candidate.id)}
                                sx={{
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  transition: 'all 0.2s',
                                  border: isSelected ? '2px solid' : '1px solid',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  cursor: canVote ? 'pointer' : 'default',
                                  '&:hover': {
                                    transform: !canVote ? 'none' : 'translateY(-4px)',
                                    boxShadow: 3,
                                    borderColor: canVote ? 'primary.main' : 'divider',
                                  },
                                  opacity: !canVote ? 0.7 : 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    height: { xs: 120, sm: 120 },
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
                                        top: 8,
                                        right: 8,
                                        bgcolor: 'primary.main',
                                        borderRadius: '50%',
                                        p: 0.3,
                                      }}
                                    >
                                      <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                                    </Box>
                                  )}
                                </Box>

                                <CardContent
                                  sx={{
                                    p: { xs: 2, sm: 1.5 },
                                    '&:last-child': { pb: { xs: 2, sm: 1.5 } },
                                  }}
                                >
                                  <Chip
                                    label={candidate.party_code}
                                    size="small"
                                    sx={{
                                      mb: 0.5,
                                      bgcolor: 'grey.100',
                                      fontSize: '0.7rem',
                                      height: 18,
                                    }}
                                  />

                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: { xs: '1rem', sm: '0.95rem' },
                                      mb: 0.2,
                                    }}
                                  >
                                    {candidate.full_name}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      mb: 0.5,
                                      fontSize: { xs: '0.85rem', sm: '0.75rem' },
                                    }}
                                  >
                                    {position} • {candidate.party_name}
                                  </Typography>

                                  <Box sx={{ mb: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: { xs: '0.85rem', sm: '0.75rem' },
                                        lineHeight: 1.4,
                                        display: isBioLong && !isBioExpanded ? '-webkit-box' : 'block',
                                        WebkitLineClamp: isBioLong && !isBioExpanded ? 2 : 'unset',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: isBioLong && !isBioExpanded ? 'ellipsis' : 'clip',
                                      }}
                                    >
                                      {bioText}
                                    </Typography>

                                    {isBioLong && (
                                      <Link
                                        component="button"
                                        variant="body2"
                                        onClick={e => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleBioExpansion(candidate.id)
                                        }}
                                        sx={{
                                          mt: 0.2,
                                          fontSize: '0.7rem',
                                          textDecoration: 'none',
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                      >
                                        {isBioExpanded ? 'Read less' : 'Read more'}
                                      </Link>
                                    )}
                                  </Box>

                                  {canVote && (
                                    <FormControlLabel
                                      value={String(candidate.id)}
                                      control={<Radio size="small" />}
                                      label="Select this candidate"
                                      onClick={e => e.stopPropagation()}
                                      sx={{
                                        width: '100%',
                                        m: 0,
                                        mt: 0.5,
                                        '& .MuiFormControlLabel-label': {
                                          fontSize: '0.8rem',
                                        },
                                      }}
                                    />
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </Box>
                      ) : (
                        <TableContainer
                          component={Paper}
                          sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 0,
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell padding="checkbox"></TableCell>
                                <TableCell>Candidate</TableCell>
                                <TableCell>Party</TableCell>
                                <TableCell>Bio</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {sortedCandidates.map((candidate: Candidate) => {
                                const photoUrl = candidate.photo_url ? getImageUrl(candidate.photo_url) : null
                                const isSelected =
                                  selectedVotes[position] === candidate.id || existingVote?.candidate_id === candidate.id

                                const isBioExpanded = expandedBios.has(candidate.id)
                                const bioText = candidate.bio || 'No biography available'
                                const isBioLong = bioText.length > 100

                                return (
                                  <TableRow
                                    key={candidate.id}
                                    hover
                                    selected={isSelected}
                                    onClick={() => canVote && handleVoteChange(position, candidate.id)}
                                    sx={{
                                      cursor: canVote ? 'pointer' : 'default',
                                      backgroundColor: isSelected ? 'action.selected' : 'inherit',
                                      '&.Mui-selected:hover': {
                                        backgroundColor: 'action.selected',
                                      },
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Radio
                                        value={String(candidate.id)}
                                        disabled={!canVote}
                                        sx={{ p: 0.5 }}
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar
                                          src={photoUrl || undefined}
                                          alt={candidate.full_name}
                                          sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}
                                        >
                                          {!photoUrl && <PersonIcon sx={{ fontSize: 22, color: 'grey.500' }} />}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {candidate.full_name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {position}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={`${candidate.party_name} (${candidate.party_code})`}
                                        size="small"
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          fontSize: '0.8rem',
                                          lineHeight: 1.4,
                                          display: isBioLong && !isBioExpanded ? '-webkit-box' : 'block',
                                          WebkitLineClamp: isBioLong && !isBioExpanded ? 2 : 'unset',
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          textOverflow: isBioLong && !isBioExpanded ? 'ellipsis' : 'clip',
                                        }}
                                      >
                                        {bioText}
                                      </Typography>

                                      {isBioLong && (
                                        <Link
                                          component="button"
                                          variant="body2"
                                          onClick={e => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleBioExpansion(candidate.id)
                                          }}
                                          sx={{
                                            mt: 0.3,
                                            fontSize: '0.7rem',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                          }}
                                        >
                                          {isBioExpanded ? 'Read less' : 'Read more'}
                                        </Link>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
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

        {/* Status Modal */}
        <StatusModal
          open={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
        />
      </Container>
    </VoterSidenav>
  )
}

export default VoterElectionCandidates

