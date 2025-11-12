import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import { useVoterElections } from '../hooks/VoterAuthHooks'
import VoterSidenav from '../components/VoterSidenav'
import { getImageUrl } from '../utils/imageUtils'
import { useNavigate } from 'react-router-dom'

const VoterHome = () => {
  const { data: elections = [], isLoading, error } = useVoterElections()
  const navigate = useNavigate()

  // Group elections by status
  const notStarted = elections.filter((e) => e.status === 'not_started')
  const ongoing = elections.filter((e) => e.status === 'ongoing')
  const ended = elections.filter((e) => e.status === 'ended')

  const handleElectionClick = (electionId: number) => {
    navigate(`/voter/election/${electionId}/candidates`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return { bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', label: 'Ongoing' }
      case 'not_started':
        return { bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', label: 'Not Started' }
      case 'ended':
        return { bgcolor: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e', label: 'Ended' }
      default:
        return { bgcolor: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e', label: 'Unknown' }
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderElectionSection = (title: string, electionList: typeof elections, emptyMessage: string) => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        {title}
      </Typography>
      {electionList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {electionList.map((election) => {
            const statusInfo = getStatusColor(election.status || 'not_started')
            const imageUrl = getImageUrl(election.img_url)
            
            return (
              <Card
                key={election.id}
                sx={{
                  maxWidth: 345,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                {/* Election Image */}
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
                  {imageUrl ? (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={election.election_title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <HowToVoteIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                  )}
                </Box>

                {/* Card Content */}
                <CardContent sx={{ p: 2 }}>
                  {/* Status Badge */}
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: statusInfo.bgcolor,
                      color: statusInfo.color,
                      fontSize: '0.75rem',
                      height: 24,
                      fontWeight: 600,
                    }}
                  />

                  {/* Title */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {election.election_title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      mb: 1.5,
                      minHeight: 42,
                    }}
                  >
                    {election.description}
                  </Typography>

                  {/* Dates */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                    Start: {formatDateTime(election.start_date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                    End: {formatDateTime(election.end_date)}
                  </Typography>

                  {/* View Details Button */}
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      bgcolor: 'grey.800',
                      '&:hover': {
                        bgcolor: 'grey.900',
                      },
                    }}
                    onClick={() => handleElectionClick(election.id)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}
    </Box>
  )

  if (isLoading) {
    return (
      <VoterSidenav>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </VoterSidenav>
    )
  }

  if (error) {
    return (
      <VoterSidenav>
        <Container maxWidth="xl">
          <Alert severity="error">Failed to load elections</Alert>
        </Container>
      </VoterSidenav>
    )
  }

  return (
    <VoterSidenav>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Elections
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View upcoming, ongoing, and completed elections
          </Typography>
        </Box>

        {/* Ongoing Elections */}
        {renderElectionSection('Ongoing Elections', ongoing, 'No ongoing elections at the moment')}

        {/* Upcoming Elections */}
        {renderElectionSection('Upcoming Elections', notStarted, 'No upcoming elections')}

        {/* Completed Elections */}
        {renderElectionSection('Completed Elections', ended, 'No completed elections')}
      </Container>
    </VoterSidenav>
  )
}

export default VoterHome

