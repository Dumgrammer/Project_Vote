import React from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { API_BASE_URL } from '../config/axios'
const API_URL = API_BASE_URL

interface SearchCandidateResult {
  id: number
  full_name: string
  position: string
  party_name: string
  party_code: string
  photo_url: string | null
}

interface Election {
  id: number
  election_title: string
}

const ElectionCandidates = () => {
  const navigate = useNavigate()
  const [elections, setElections] = React.useState<Election[]>([])
  const [selectedElection, setSelectedElection] = React.useState<number | ''>('')
  const [candidateResults, setCandidateResults] = React.useState<SearchCandidateResult[]>([])
  const [candidateLoading, setCandidateLoading] = React.useState(false)
  const [candidateError, setCandidateError] = React.useState('')
  const [electionTitle, setElectionTitle] = React.useState('')

  // Load elections when component mounts
  React.useEffect(() => {
    const loadElections = async () => {
      try {
        const response = await axios.get(`${API_URL}/?request=elections`)
        setElections(response.data.data || [])
      } catch (error) {
        console.error('Failed to load elections:', error)
      }
    }
    loadElections()
  }, [])

  const handleCandidateSearch = async () => {
    if (!selectedElection) {
      setCandidateError('Please select an election')
      return
    }

    setCandidateLoading(true)
    setCandidateError('')
    setCandidateResults([])
    setElectionTitle('')

    try {
      const response = await axios.get(
        `${API_URL}/?request=search-candidates&election_id=${selectedElection}`
      )
      setCandidateResults(response.data.data.candidates || [])
      setElectionTitle(response.data.data.election?.election_title || '')
      if ((response.data.data.candidates || []).length === 0) {
        setCandidateError('No candidates found for this election')
      }
    } catch (error) {
      setCandidateError('Failed to load candidates')
    } finally {
      setCandidateLoading(false)
    }
  }

  // Group candidates by position
  const candidatesByPosition = React.useMemo(() => {
    const grouped: { [key: string]: SearchCandidateResult[] } = {}
    candidateResults.forEach((candidate) => {
      if (!grouped[candidate.position]) {
        grouped[candidate.position] = []
      }
      grouped[candidate.position].push(candidate)
    })
    return grouped
  }, [candidateResults])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3, textTransform: 'none' }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Election Candidates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View candidates for ongoing elections
          </Typography>
        </Box>

        {/* Election Selector */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <FormControl fullWidth>
              <InputLabel>Select Election</InputLabel>
              <Select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value as number)}
                label="Select Election"
              >
                {elections.length === 0 ? (
                  <MenuItem disabled>No elections available</MenuItem>
                ) : (
                  elections.map((election) => (
                    <MenuItem key={election.id} value={election.id}>
                      {election.election_title}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleCandidateSearch}
              disabled={candidateLoading || !selectedElection}
              sx={{ px: 5, textTransform: 'none', minWidth: 140, py: 1.5 }}
              startIcon={!candidateLoading && <HowToVoteIcon />}
            >
              {candidateLoading ? <CircularProgress size={24} /> : 'View Candidates'}
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {candidateError && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {candidateError}
          </Alert>
        )}

        {/* Election Title */}
        {electionTitle && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {electionTitle}
            </Typography>
          </Box>
        )}

        {/* Results by Position */}
        {Object.keys(candidatesByPosition).length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(candidatesByPosition).map(([position, candidates]) => (
              <Paper key={position} sx={{ overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {position}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Candidate Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Party/Affiliation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {candidates.map((candidate) => (
                        <TableRow
                          key={candidate.id}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {candidate.full_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${candidate.party_name} (${candidate.party_code})`}
                              size="medium"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!candidateLoading && candidateResults.length === 0 && !candidateError && selectedElection && (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <HowToVoteIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No candidates registered yet
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  )
}

export default ElectionCandidates

