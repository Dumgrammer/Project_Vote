import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import Sidenav from '../components/Sidenav'
import PeopleIcon from '@mui/icons-material/People'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import BarChartIcon from '@mui/icons-material/BarChart'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useDashboardStats } from '../hooks/dashboardHooks'

export default function Dashboard() {
  // Fetch dashboard stats from the API
  const { data: dashboardData, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <Sidenav>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </Sidenav>
    )
  }

  if (error) {
    return (
      <Sidenav>
        <Container maxWidth="xl">
          <Alert severity="error">
            Failed to load dashboard data. {error instanceof Error ? error.message : 'Please try again later.'}
          </Alert>
        </Container>
      </Sidenav>
    )
  }

  if (!dashboardData) {
    return (
      <Sidenav>
        <Container maxWidth="xl">
          <Alert severity="info">No dashboard data available</Alert>
        </Container>
      </Sidenav>
    )
  }

  const stats = [
    {
      title: 'Total Voters',
      value: dashboardData?.stats?.totalVoters?.toLocaleString() || '0',
      icon: <PeopleIcon sx={{ fontSize: 18 }} />,
      change: '+0%',
      trend: 'up' as const,
    },
    {
      title: 'Total Elections',
      value: dashboardData?.stats?.totalElections?.toLocaleString() || '0',
      icon: <HowToVoteIcon sx={{ fontSize: 18 }} />,
      change: '+0%',
      trend: 'up' as const,
    },
    {
      title: 'Total Votes',
      value: dashboardData?.stats?.totalVotes?.toLocaleString() || '0',
      icon: <BarChartIcon sx={{ fontSize: 18 }} />,
      change: '+0%',
      trend: 'up' as const,
    },
    {
      title: 'Active Elections',
      value: dashboardData?.stats?.activeElections?.toLocaleString() || '0',
      icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
      change: '+0%',
      trend: (dashboardData?.stats?.activeElections || 0) > 0 ? ('up' as const) : ('down' as const),
    },
  ]

  // Format participation data for chart (last 30 days)
  const participationData = dashboardData?.participation || []
  const maxValue = participationData.length > 0 
    ? Math.max(...participationData.map((d: { voters_count: number }) => parseInt(String(d.voters_count))))
    : 100
  
  // Calculate total participation
  const totalParticipation = participationData.reduce((sum: number, d: { voters_count: number }) => 
    sum + parseInt(String(d.voters_count)), 0)

  // Format recent elections
  const recentElections = dashboardData?.recentElections?.slice(0, 4).map((election: {
    election_title: string;
    total_voters: number;
    status: string;
  }, idx: number) => ({
    name: election.election_title,
    votes: parseInt(String(election.total_voters)),
    change: '+0%',
    trend: 'up',
    color: idx === 0 ? '#2196f3' : idx === 1 ? '#4caf50' : idx === 2 ? '#f44336' : '#64b5f6',
    status: election.status,
  })) || []

  return (
    <Sidenav>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dashboard Overview
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {stats.map((stat, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                p: 3,
                bgcolor: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: '#e3f2fd',
                    color: '#2196f3',
                    p: 1,
                    borderRadius: 2,
                    display: 'flex',
                  }}
                >
                  {stat.icon}
                </Box>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {stat.value}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Chip
                  icon={stat.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={stat.change}
                  size="small"
                  sx={{
                    bgcolor: stat.trend === 'up' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    color: stat.trend === 'up' ? '#4caf50' : '#f44336',
                    height: 20,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': {
                      fontSize: 14,
                      ml: 0.5,
                    },
                  }}
                />
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Recent Ended Election Results */}
        {dashboardData?.recentEndedElection && dashboardData?.electionResults?.length > 0 && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'white',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Latest Election Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dashboardData.recentEndedElection.election_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ended: {new Date(dashboardData.recentEndedElection.end_date).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip 
                label="COMPLETED" 
                size="small"
                sx={{ bgcolor: '#757575', color: 'white' }}
              />
            </Box>

            {/* Horizontal Bar Chart */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dashboardData.electionResults.map((result: {
                candidate_name: string;
                position: string;
                party_code: string;
                vote_count: number;
              }, idx: number) => {
                const maxVotes = Math.max(...dashboardData.electionResults.map((r: { vote_count: number }) => r.vote_count))
                const percentage = maxVotes > 0 ? (result.vote_count / maxVotes) * 100 : 0
                
                return (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '30px' }}>
                          #{idx + 1}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {result.candidate_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.position} • {result.party_code}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2196f3' }}>
                        {result.vote_count}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: idx === 0 ? '#4caf50' : idx === 1 ? '#2196f3' : idx === 2 ? '#ff9800' : '#64b5f6',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* Voting Activity Over Time - Line Graph */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              bgcolor: 'white',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Voting Activity Over Time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalParticipation.toLocaleString()} total votes • Hourly breakdown
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Last 48 Hours" size="small" sx={{ bgcolor: '#2196f3', color: 'white' }} />
              </Box>
            </Box>

            {/* Line Graph */}
            <Box sx={{ position: 'relative', height: 220, px: 2 }}>
              {participationData.length > 0 ? (
                <>
                  {/* Y-axis labels */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      pr: 1,
                    }}
                  >
                    {[maxValue, Math.floor(maxValue * 0.75), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.25), 0].map((val, idx) => (
                      <Typography key={idx} variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {val}
                      </Typography>
                    ))}
                  </Box>

                  {/* Graph area */}
                  <Box sx={{ position: 'relative', height: '100%', ml: 4 }}>
                    {/* Grid lines */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Box key={i} sx={{ width: '100%', height: '1px', bgcolor: '#f0f0f0' }} />
                      ))}
                    </Box>

                    {/* SVG Line Chart */}
                    <svg
                      width="100%"
                      height="100%"
                      style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
                      preserveAspectRatio="none"
                      viewBox={`0 0 ${participationData.length * 100} 200`}
                    >
                      {/* Area fill */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#2196f3" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2196f3" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      <path
                        d={`
                          M 0 200
                          ${participationData.map((data: { voters_count: number }, idx: number) => {
                            const x = participationData.length > 1 
                              ? (idx / (participationData.length - 1)) * (participationData.length * 100)
                              : (participationData.length * 100) / 2
                            const y = 200 - ((parseInt(String(data.voters_count)) / maxValue) * 180)
                            return `L ${x} ${y}`
                          }).join(' ')}
                          L ${participationData.length * 100} 200
                          Z
                        `}
                        fill="url(#areaGradient)"
                      />

                      {/* Line */}
                      <path
                        d={participationData.map((data: { voters_count: number }, idx: number) => {
                          const x = participationData.length > 1 
                            ? (idx / (participationData.length - 1)) * (participationData.length * 100)
                            : (participationData.length * 100) / 2
                          const y = 200 - ((parseInt(String(data.voters_count)) / maxValue) * 180)
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="#2196f3"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data points */}
                      {participationData.map((data: { voters_count: number; date_label: string }, idx: number) => {
                        const x = participationData.length > 1 
                          ? (idx / (participationData.length - 1)) * (participationData.length * 100)
                          : (participationData.length * 100) / 2
                        const y = 200 - ((parseInt(String(data.voters_count)) / maxValue) * 180)
                        return (
                          <g key={idx}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#fff"
                              stroke="#2196f3"
                              strokeWidth="2"
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r="8"
                              fill="#2196f3"
                              fillOpacity="0"
                              style={{ cursor: 'pointer' }}
                            >
                              <title>{`${data.date_label}: ${data.voters_count} votes`}</title>
                            </circle>
                          </g>
                        )
                      })}
                    </svg>

                    {/* X-axis labels */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        px: 1,
                      }}
                    >
                      {participationData.length > 0 && participationData.length > 1 ? (
                        [
                          participationData[0],
                          participationData[Math.floor(participationData.length / 4)],
                          participationData[Math.floor(participationData.length / 2)],
                          participationData[Math.floor(participationData.length * 3 / 4)],
                          participationData[participationData.length - 1],
                        ].map((data: { date_label: string } | undefined, idx) => (
                          data && (
                            <Typography key={idx} variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {data.date_label}
                            </Typography>
                          )
                        ))
                      ) : (
                        participationData.length === 1 && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {participationData[0].date_label}
                          </Typography>
                        )
                      )}
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    No voting data available yet
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Recent Elections */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              bgcolor: 'white',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Elections
              </Typography>
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Featured Election Card */}
            {recentElections.length > 0 ? (
              <Paper
                elevation={1}
                sx={{
                  p: 2.5,
                  mb: 2,
                  bgcolor: '#e3f2fd',
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: '#2196f3',
                }}
              >
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  {recentElections[0].name}
                </Typography>
                <Chip 
                  label={recentElections[0].status.toUpperCase()} 
                  size="small"
                  sx={{ 
                    mb: 2,
                    bgcolor: recentElections[0].status === 'ongoing' ? '#4caf50' : 
                             recentElections[0].status === 'upcoming' ? '#2196f3' : '#757575',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                  {recentElections[0].votes} voters
                </Typography>
                {/* Simple line wave */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    opacity: 0.2,
                  }}
                >
                  <svg width="100%" height="100%" preserveAspectRatio="none">
                    <path
                      d="M0,30 Q25,10 50,30 T100,30 T150,30 T200,30 T250,30 T300,30 T350,30"
                      fill="none"
                      stroke="#2196f3"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </Box>
              </Paper>
            ) : null}

            {/* Election List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentElections.length > 1 ? (
                recentElections.slice(1).map((election: {
                  name: string;
                  votes: number;
                  status: string;
                  color: string;
                }, idx: number) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: '#f5f5f5',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: election.color,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {election.name}
                        </Typography>
                        <Chip 
                          label={election.status.toUpperCase()} 
                          size="small"
                          sx={{ 
                            mt: 0.5,
                            bgcolor: election.status === 'ongoing' ? 'rgba(76, 175, 80, 0.1)' : 
                                     election.status === 'upcoming' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(117, 117, 117, 0.1)',
                            color: election.status === 'ongoing' ? '#4caf50' : 
                                   election.status === 'upcoming' ? '#2196f3' : '#757575',
                            fontSize: '0.65rem',
                            height: 18
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {election.votes}
                    </Typography>
                  </Box>
                ))
              ) : recentElections.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent elections available
                  </Typography>
                </Box>
              ) : null}
            </Box>

            {/* View All Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View All →
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Sidenav>
  )
}
