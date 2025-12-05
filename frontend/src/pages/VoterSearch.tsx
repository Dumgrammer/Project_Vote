import React from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { API_BASE_URL } from '../config/axios'
const API_URL = API_BASE_URL

interface SearchVoterResult {
  voters_id: string
  full_name: string
  is_verified: boolean
}

const VoterSearch = () => {
  const navigate = useNavigate()
  const [voterSearch, setVoterSearch] = React.useState('')
  const [voterResults, setVoterResults] = React.useState<SearchVoterResult[]>([])
  const [voterLoading, setVoterLoading] = React.useState(false)
  const [voterError, setVoterError] = React.useState('')

  const handleVoterSearch = async () => {
    if (voterSearch.trim().length === 0) {
      setVoterError('Please enter a search term')
      return
    }

    setVoterLoading(true)
    setVoterError('')
    setVoterResults([])

    try {
      const response = await axios.get(
        `${API_URL}/?request=search-voters&q=${encodeURIComponent(voterSearch)}`
      )
      setVoterResults(response.data.data || [])
      if (response.data.data.length === 0) {
        setVoterError('No voters found')
      }
    } catch (error) {
      setVoterError('Failed to search voters')
    } finally {
      setVoterLoading(false)
    }
  }

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
            Search Voters
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find registered voters by name or voter ID
          </Typography>
        </Box>

        {/* Search Box */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter voter name or voter ID (e.g., V2025-00001)"
              value={voterSearch}
              onChange={(e) => setVoterSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVoterSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleVoterSearch}
              disabled={voterLoading}
              sx={{ px: 5, textTransform: 'none', minWidth: 120, py: 1.5 }}
            >
              {voterLoading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {voterError && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {voterError}
          </Alert>
        )}

        {/* Results Table */}
        {voterResults.length > 0 && (
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Search Results ({voterResults.length})
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Voter ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voterResults.map((voter, index) => (
                    <TableRow
                      key={index}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {voter.voters_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">{voter.full_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={voter.is_verified ? 'Verified' : 'Unverified'}
                          color={voter.is_verified ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </Box>
  )
}

export default VoterSearch

