import { Box, Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import PeopleIcon from '@mui/icons-material/People'
import BarChartIcon from '@mui/icons-material/BarChart'

const Hero = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Voting',
      description: 'Your vote is encrypted and secure with industry-standard security protocols.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast & Easy',
      description: 'Cast your vote in seconds with our intuitive and user-friendly interface.',
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 40 }} />,
      title: 'Verified Results',
      description: 'Real-time vote counting with transparent and auditable results.',
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      title: 'Accessible',
      description: 'Vote from anywhere, anytime on any device. Democracy at your fingertips.',
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      title: 'Live Statistics',
      description: 'Monitor election progress with real-time statistics and analytics.',
    },
    {
      icon: <HowToVoteIcon sx={{ fontSize: 40 }} />,
      title: 'Multiple Elections',
      description: 'Participate in various elections and polls all in one platform.',
    },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HowToVoteIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '.1rem' }}>
                POLLIFY
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="text"
                onClick={() => navigate('/voter-search')}
                sx={{ textTransform: 'none' }}
              >
                Search Voters
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/election-candidates')}
                sx={{ textTransform: 'none' }}
              >
                View Candidates
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/voter/login')}
                sx={{ textTransform: 'none', px: 3 }}
              >
                Voter Login
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                Vote with Confidence
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.95,
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}
              >
                Secure, transparent, and accessible online voting platform for the digital age.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/voter/register')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Register to Vote
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/voter/login')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Cast Your Vote
                </Button>
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <HowToVoteIcon
                sx={{
                  fontSize: { xs: 200, md: 300 },
                  opacity: 0.2,
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Why Choose Pollify?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
            A modern voting platform built for security, accessibility, and transparency
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {features.map((feature, index) => (
            <Box
              key={index}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 24px rgba(102, 126, 234, 0.15)',
                  borderColor: 'primary.main',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                {feature.icon}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {feature.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to Make Your Voice Heard?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 300 }}>
              Join thousands of voters who trust Pollify for secure and transparent elections.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/voter/register')}
              sx={{
                px: 5,
                py: 2,
                fontSize: '1.1rem',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Get Started Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: 'grey.900',
          color: 'white',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              gap: 4,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HowToVoteIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  POLLIFY
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Empowering democracy through secure and accessible online voting.
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ textAlign: { xs: 'left', md: 'right' }, opacity: 0.7 }}>
                © 2025 Pollify. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Hero

