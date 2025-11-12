import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import Sidenav from '../components/Sidenav'
import PeopleIcon from '@mui/icons-material/People'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import BarChartIcon from '@mui/icons-material/BarChart'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// Static data for statistics
const stats = [
  {
    title: 'Total Voters',
    value: '12,458',
    icon: <PeopleIcon sx={{ fontSize: 18 }} />,
    change: '+12.5%',
    trend: 'up',
  },
  {
    title: 'Total Elections',
    value: '48',
    icon: <HowToVoteIcon sx={{ fontSize: 18 }} />,
    change: '+8.2%',
    trend: 'up',
  },
  {
    title: 'Total Votes',
    value: '35,742',
    icon: <BarChartIcon sx={{ fontSize: 18 }} />,
    change: '+23.1%',
    trend: 'up',
  },
  {
    title: 'Active Elections',
    value: '12',
    icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
    change: '-5.2%',
    trend: 'down',
  },
]

// Election participation data
const participationData = [
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 68 },
  { month: 'Mar', value: 52 },
  { month: 'Apr', value: 85 },
  { month: 'May', value: 58 },
  { month: 'Jun', value: 92 },
  { month: 'Jul', value: 78 },
  { month: 'Aug', value: 65 },
  { month: 'Sep', value: 88 },
  { month: 'Oct', value: 95 },
  { month: 'Nov', value: 72 },
  { month: 'Dec', value: 80 },
]

// Recent elections data
const recentElections = [
  { name: 'Student Council 2024', votes: 1839, change: '+10%', trend: 'up', color: '#2196f3' },
  { name: 'Department Head', votes: 1839, change: '+10%', trend: 'up', color: '#4caf50' },
  { name: 'Class Representative', votes: 1520, change: '-5%', trend: 'down', color: '#f44336' },
  { name: 'Sports Committee', votes: 892, change: '+15%', trend: 'up', color: '#64b5f6' },
]

export default function Dashboard() {
  const maxValue = Math.max(...participationData.map(d => d.value))

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

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          {/* Voter Participation Chart */}
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Voter Participation
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  2,324
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Today" size="small" sx={{ bgcolor: '#2196f3', color: 'white' }} />
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Custom Bar Chart */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 200, px: 1 }}>
              {participationData.map((data, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: `${(data.value / maxValue) * 100}%`,
                      bgcolor: idx === 5 ? '#2196f3' : idx % 3 === 0 ? '#1976d2' : idx % 2 === 0 ? '#64b5f6' : 'rgba(255,255,255,0.1)',
                      borderRadius: 1,
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: '#42a5f5',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {data.month}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 3, mt: 3, justifyContent: 'center' }}>
              {['Investment', 'Loss', 'Profit', 'Maintenance'].map((label, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 1,
                      bgcolor: idx === 0 ? '#1976d2' : idx === 1 ? '#64b5f6' : idx === 2 ? '#2196f3' : '#e0e0e0',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              ))}
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {recentElections[0].change} Profit
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                {recentElections[0].votes}
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

            {/* Election List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentElections.slice(1).map((election, idx) => (
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
                      <Typography variant="caption" color={election.trend === 'up' ? '#4caf50' : '#f44336'}>
                        {election.change} {election.trend === 'up' ? 'Profit' : 'loss'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {election.votes}
                  </Typography>
                </Box>
              ))}
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
