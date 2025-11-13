import { useEffect, useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import Sidenav from '../components/Sidenav'
import { useElections, useElectionResults } from '../hooks/resultsHooks'

interface CandidateDetails {
  id: number
  full_name: string
  fname?: string
  mname?: string
  lname?: string
  position: string
  party_name?: string
  party_code?: string
  photo_url: string | null
  bio?: string
  vote_count: number
  vote_percentage?: number
  percentage?: number
}

export default function Results() {
  const [selectedElection, setSelectedElection] = useState<number | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetails | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: elections, isLoading: electionsLoading } = useElections()
  const { data: results, isLoading: resultsLoading, error: resultsError } = useElectionResults(selectedElection)

  useEffect(() => {
    const electionIdParam = searchParams.get('electionId')
    if (electionIdParam) {
      const parsed = Number(electionIdParam)
      const electionExists = elections?.some((election) => election.id === parsed)
      if (!Number.isNaN(parsed) && electionExists && parsed !== selectedElection) {
        setSelectedElection(parsed)
      }
    }
  }, [searchParams, elections, selectedElection])

  const getPositionTotalVotes = (positionData: { total_votes?: number; candidates?: CandidateDetails[] }) => {
    if (typeof positionData.total_votes === 'number' && !Number.isNaN(positionData.total_votes)) {
      return positionData.total_votes
    }
    const candidates = positionData.candidates ?? []
    const computedTotal = candidates.reduce((sum, candidate) => sum + Number(candidate.vote_count || 0), 0)
    return computedTotal
  }

  const getCandidatePercentage = (
    candidate: CandidateDetails,
    positionTotalVotes: number
  ) => {
    if (typeof candidate.percentage === 'number' && !Number.isNaN(candidate.percentage)) {
      return candidate.percentage
    }
    if (typeof candidate.vote_percentage === 'number' && !Number.isNaN(candidate.vote_percentage)) {
      return candidate.vote_percentage
    }
    if (!positionTotalVotes) return 0
    return (Number(candidate.vote_count || 0) / positionTotalVotes) * 100
  }

  const handleExportCSV = () => {
    if (!results) return

    let csv = 'Position,Rank,Candidate Name,Party,Vote Count,Vote Percentage\n'
    
    results.results?.forEach((positionData) => {
      const positionTotalVotes = getPositionTotalVotes(positionData as any)
      positionData.candidates.forEach((candidate, index) => {
        const votePercentage = getCandidatePercentage(candidate, positionTotalVotes)
        csv += `"${positionData.position}",${index + 1},"${candidate.full_name}","${candidate.party_code || 'Independent'}",${candidate.vote_count},${votePercentage.toFixed(2)}%\n`
      })
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${results.election.election_title.replace(/\s+/g, '_')}_Results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    if (!results) return

    // Create a printable HTML content
    const printWindow = window.open('', '', 'height=800,width=800')
    if (!printWindow) return

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${results.election.election_title} - Results</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            background: white;
          }
          h1 { 
            color: #1976d2; 
            text-align: center;
            margin-bottom: 10px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .stat {
            text-align: center;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
          }
          .stat-label {
            color: #666;
            font-size: 14px;
          }
          .position-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .position-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1976d2;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th { 
            background: #1976d2; 
            color: white; 
            padding: 12px;
            text-align: left;
          }
          td { 
            border: 1px solid #ddd; 
            padding: 10px;
          }
          tr:nth-child(even) { 
            background: #f9f9f9; 
          }
          .winner {
            background: #fff3cd !important;
            font-weight: bold;
          }
          .rank {
            font-weight: bold;
            color: #1976d2;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>${results.election.election_title}</h1>
        <div class="subtitle">
          <p>${results.election.description || ''}</p>
          <p>Election Period: ${new Date(results.election.start_date).toLocaleDateString()} - ${new Date(results.election.end_date).toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${results.total_voters || 0}</div>
            <div class="stat-label">Total Voters</div>
          </div>
          <div class="stat">
            <div class="stat-value">${results.results?.reduce((sum, pos: any) => sum + getPositionTotalVotes(pos), 0) || 0}</div>
            <div class="stat-label">Total Votes Cast</div>
          </div>
          <div class="stat">
            <div class="stat-value">${results.results?.length || 0}</div>
            <div class="stat-label">Positions</div>
          </div>
        </div>
    `

    results.results?.forEach((positionData) => {
      const positionTotalVotes = getPositionTotalVotes(positionData as any)
      html += `
        <div class="position-section">
          <div class="position-title">${positionData.position}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%">Rank</th>
                <th style="width: 40%">Candidate</th>
                <th style="width: 20%">Party</th>
                <th style="width: 15%">Votes</th>
                <th style="width: 15%">Percentage</th>
              </tr>
            </thead>
            <tbody>
      `

      positionData.candidates.forEach((candidate, index) => {
        const votePercentage = getCandidatePercentage(candidate, positionTotalVotes)
        const isWinner = index === 0
        html += `
          <tr class="${isWinner ? 'winner' : ''}">
            <td class="rank">${isWinner ? '🏆 ' : ''}#${index + 1}</td>
            <td>${candidate.full_name}</td>
            <td>${candidate.party_code || 'Independent'}</td>
            <td>${candidate.vote_count}</td>
            <td>${votePercentage.toFixed(2)}%</td>
          </tr>
        `
      })

      html += `
            </tbody>
          </table>
        </div>
      `
    })

    html += `
        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleViewDetails = (candidate: CandidateDetails, votePercentage: number) => {
    setSelectedCandidate({ ...candidate, vote_percentage: votePercentage })
    setDetailsOpen(true)
  }

  const totalVotesCast = results?.results?.reduce((sum, pos: any) => sum + getPositionTotalVotes(pos), 0) || 0
  const totalPositions = results?.results?.length || 0

  return (
    <Sidenav>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
            Election Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and export election results
          </Typography>
        </Box>

        {/* Election Selector */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {electionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography color="text.secondary">Loading elections...</Typography>
            </Box>
          ) : elections && elections.length === 0 ? (
            <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  No completed elections available
                </Typography>
                <Typography variant="body2">
                  Elections must be ended before results can be viewed. Check back after an election has concluded.
                </Typography>
              </Box>
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Completed Election</InputLabel>
              <Select
                value={selectedElection || ''}
                label="Select Completed Election"
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setSelectedElection(value)
                  setSearchParams(value ? { electionId: String(value) } : {})
                }}
                disabled={electionsLoading}
              >
                {elections?.map((election) => (
                  <MenuItem key={election.id} value={election.id}>
                    {election.election_title} 
                    {' • '}
                    {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                    {' • '}
                    <Chip 
                      label="Completed"
                      size="small"
                      sx={{ ml: 1 }}
                      color="default"
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Paper>

        {/* Loading State */}
        {resultsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {resultsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load results. Please try again.
          </Alert>
        )}

        {/* Results Display */}
        {results && !resultsLoading && (
          <>
            {/* Summary Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3', mb: 1 }}>
                  {results.total_voters || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Voters Participated
                </Typography>
              </Paper>
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                  {totalVotesCast}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Votes Cast
                </Typography>
              </Paper>
              <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                  {totalPositions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Positions Available
                </Typography>
              </Paper>
            </Box>

            {/* Export Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<CsvIcon />}
                onClick={handleExportCSV}
                sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
                sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#da190b' } }}
              >
                Export PDF
              </Button>
            </Box>

            {/* Results by Position */}
            {results.results?.map((positionData, idx) => {
              const positionTotalVotes = getPositionTotalVotes(positionData as any)
              return (
              <Paper key={idx} elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {positionData.position}
                  </Typography>
                  <Typography variant="body2">
                    Total Votes: {positionData.total_votes}
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Candidate</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Party</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Votes</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Percentage</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Vote Distribution</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(positionData.candidates ?? []).map((candidate, candIdx) => {
                        const votePercentage = getCandidatePercentage(candidate, positionTotalVotes)
                        return (
                        <TableRow
                          key={candidate.id}
                          sx={{
                            bgcolor: candIdx === 0 ? '#fff3cd' : 'inherit',
                            '&:hover': { bgcolor: candIdx === 0 ? '#ffe8a1' : '#f5f5f5' },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {candIdx === 0 && <TrophyIcon sx={{ color: '#ffd700' }} />}
                              <Typography sx={{ fontWeight: candIdx === 0 ? 700 : 400 }}>
                                #{candIdx + 1}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {candidate.photo_url ? (
                                <Avatar src={candidate.photo_url} />
                              ) : (
                                <Avatar>
                                  <PersonIcon />
                                </Avatar>
                              )}
                              <Typography sx={{ fontWeight: candIdx === 0 ? 600 : 400 }}>
                                {candidate.full_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={candidate.party_code || 'IND'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }}>
                              {candidate.vote_count}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: '#2196f3' }}>
                              {votePercentage.toFixed(2)}%
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: '250px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(Math.max(votePercentage, 0), 100)}
                                sx={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 4,
                                  bgcolor: '#e0e0e0',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: candIdx === 0 ? '#4caf50' : '#2196f3',
                                  },
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(candidate, votePercentage)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )})}
          </>
        )}

        {/* No Selection State */}
        {!selectedElection && !resultsLoading && elections && elections.length > 0 && (
          <Paper elevation={3} sx={{ p: 8, textAlign: 'center' }}>
            <DownloadIcon sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Select a completed election to view results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose from {elections.length} completed election{elections.length !== 1 ? 's' : ''}
            </Typography>
          </Paper>
        )}

        {/* Candidate Details Modal */}
        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Candidate Details
            </Typography>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            {selectedCandidate && (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  {selectedCandidate.photo_url ? (
                    <Avatar src={selectedCandidate.photo_url} sx={{ width: 120, height: 120, mb: 2 }} />
                  ) : (
                    <Avatar sx={{ width: 120, height: 120, mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                  )}
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {selectedCandidate.full_name}
                  </Typography>
                  <Chip label={selectedCandidate.party_code || 'Independent'} color="primary" size="small" />
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Position
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCandidate.position}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Party
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCandidate.party_name || 'Independent'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Vote Count
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196f3' }}>
                    {selectedCandidate.vote_count} votes ({(selectedCandidate.vote_percentage ?? selectedCandidate.percentage ?? 0).toFixed(2)}%)
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Biography
                  </Typography>
                  <Typography variant="body1">
                    {selectedCandidate.bio || 'No biography available'}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Sidenav>
  )
}

