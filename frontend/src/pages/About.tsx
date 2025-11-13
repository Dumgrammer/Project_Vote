import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
} from '@mui/material'
import {
  HowToVote as VoteIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material'
import Sidenav from '../components/Sidenav'

export default function About() {
  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Voting',
      description: 'End-to-end encryption ensures your vote remains confidential and secure.',
      color: '#2196f3',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast & Efficient',
      description: 'Real-time vote counting and instant results publication.',
      color: '#4caf50',
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      title: 'Transparent Process',
      description: 'Complete audit trail and transparent voting process.',
      color: '#ff9800',
    },
    {
      icon: <VoteIcon sx={{ fontSize: 40 }} />,
      title: 'User Friendly',
      description: 'Intuitive interface makes voting accessible to everyone.',
      color: '#9c27b0',
    },
  ]

  return (
    <Sidenav>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Hero Section */}
        <Paper
          elevation={0}
          sx={{
            p: 6,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            About Pollify
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 800, mx: 'auto', opacity: 0.95 }}>
            A modern, secure, and transparent online voting system designed to make elections accessible, 
            efficient, and trustworthy for everyone.
          </Typography>
        </Paper>

        {/* Mission Statement */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a237e' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 2 }}>
            Pollify aims to revolutionize the democratic process by providing a secure, transparent, and 
            user-friendly platform for conducting elections. We believe that every voice matters, and 
            technology should empower people to participate in the democratic process easily and securely.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            Our system is built with cutting-edge security measures, ensuring that each vote is counted 
            accurately while maintaining voter privacy. We're committed to promoting fair, transparent, 
            and accessible elections for organizations of all sizes.
          </Typography>
        </Paper>

        {/* Features Grid */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1a237e' }}>
          Key Features
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {features.map((feature, index) => (
            <Card
              key={index}
              elevation={2}
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar
                  sx={{
                    width: 70,
                    height: 70,
                    bgcolor: feature.color,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* How It Works */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1a237e' }}>
            How It Works
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: '#2196f3', mx: 'auto', mb: 2, fontSize: 24, fontWeight: 700 }}>
                1
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Register & Verify
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Voters register with their credentials and get verified by administrators.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: '#4caf50', mx: 'auto', mb: 2, fontSize: 24, fontWeight: 700 }}>
                2
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Cast Your Vote
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse candidates, review their profiles, and cast your vote securely.
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: '#ff9800', mx: 'auto', mb: 2, fontSize: 24, fontWeight: 700 }}>
                3
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                View Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After the election ends, view real-time results and detailed analytics.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Technology Stack */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1a237e' }}>
            Built With Modern Technology
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#61dafb' }}>
                React
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Frontend Framework
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#007fff' }}>
                Material-UI
              </Typography>
              <Typography variant="caption" color="text.secondary">
                UI Components
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#777bb3' }}>
                PHP
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Backend API
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#00758f' }}>
                MySQL
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Database
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Container>
    </Sidenav>
  )
}

