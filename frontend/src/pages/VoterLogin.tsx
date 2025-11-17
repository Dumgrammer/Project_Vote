  import { useNavigate, Navigate } from 'react-router-dom'
  import { useState } from 'react'
  import Box from '@mui/material/Box'
  import Typography from '@mui/material/Typography'
  import TextField from '@mui/material/TextField'
  import Button from '@mui/material/Button'
  import Stack from '@mui/material/Stack'
  import FormControl from '@mui/material/FormControl'
  import FormLabel from '@mui/material/FormLabel'
  import InputAdornment from '@mui/material/InputAdornment'
  import CircularProgress from '@mui/material/CircularProgress'
  import EmailIcon from '@mui/icons-material/Email'
  import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
  import ArrowBackIcon from '@mui/icons-material/ArrowBack'
  import IconButton from '@mui/material/IconButton'
  import AuthLayout from '../layouts/AuthLayout'
  import StatusModal from '../components/StatusModal'
  import { useForm, Controller } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { useVoterLogin } from '../hooks/VoterAuthHooks'
import { useVoterAuth } from '../contexts/VoterAuthContext'

  // Zod validation schema
  const voterLoginSchema = z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
  })

  type VoterLoginFormData = z.infer<typeof voterLoginSchema>

  export default function VoterLogin() {
    const navigate = useNavigate()
    const loginMutation = useVoterLogin()
  const { isAuthenticated, isLoading: authLoading, login: setAuthenticatedVoter } = useVoterAuth()
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

    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<VoterLoginFormData>({
      resolver: zodResolver(voterLoginSchema),
      defaultValues: {
        email: '',
        password: '',
      },
    })

    const onSubmit = async (data: VoterLoginFormData) => {
      try {
        const voterData = await loginMutation.mutateAsync(data)
        setModalState({
          open: true,
          type: 'success',
          title: 'Login Successful!',
          message: 'You have been logged in successfully. Redirecting to home...',
        })
        setAuthenticatedVoter(voterData)
      } catch (error: any) {
        // Get the HTTP status code and error message from the response
        const statusCode = error?.response?.status || error?.response?.data?.statusCode
        const backendMessage = error?.response?.data?.message
        const errorMessage = backendMessage || error?.message || 'Login failed. Please try again.'
        
        // Debug logging
        console.log('Login error details:', {
          statusCode,
          backendMessage,
          errorMessage,
          fullResponse: error?.response
        })
        
        // Handle different error cases based on status code
        if (statusCode === 403) {
          // Account exists but not verified (HTTP 403 Forbidden)
          setModalState({
            open: true,
            type: 'error',
            title: 'Account Not Verified',
            message: backendMessage || 'Your account is not yet verified. Please wait for admin approval or contact the administrator.',
          })
        } else if (statusCode === 401) {
          // Invalid email or password (HTTP 401 Unauthorized)
          setModalState({
            open: true,
            type: 'error',
            title: 'Invalid Credentials',
            message: backendMessage || 'The email or password you entered is incorrect. Please try again.',
          })
        } else {
          // Other errors - show the actual error message from backend
          setModalState({
            open: true,
            type: 'error',
            title: 'Login Failed',
            message: errorMessage,
          })
        }
      }
    }

    // Redirect if already authenticated
    if (authLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      )
    }

    if (isAuthenticated) {
      return <Navigate to="/voter/home" replace />
    }

    return (
      <AuthLayout>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 360 }}>
          <Stack spacing={2}>
            {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <IconButton onClick={() => navigate('/')} size="small">
                <ArrowBackIcon />
              </IconButton>
            </Box>

            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ letterSpacing: 1, color: 'primary.main' }}>
                Pollify Voter
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                Cast Your Vote
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in with your email to participate in elections
              </Typography>
            </Stack>

            <FormControl fullWidth error={!!errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="email"
                    type="email"
                    autoComplete="email"
                    fullWidth
                    variant="outlined"
                    size="small"
                    margin="dense"
                    placeholder="voter@example.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth error={!!errors.password}>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    fullWidth
                    variant="outlined"
                    size="small"
                    margin="dense"
                    placeholder="••••••••"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loginMutation.isPending}
              sx={{ py: 1.2 }}
            >
              {loginMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Signing in...
                </>
              ) : (
                'Sign in to Vote'
              )}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Don't have a Voter ID?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/voter/register')}
                sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
              >
                Register here
              </Button>
            </Typography>
          </Stack>
        </Box>

        {/* Status Modal */}
        <StatusModal
          open={modalState.open}
          onClose={() => setModalState({ ...modalState, open: false })}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          autoHideDuration={modalState.type === 'success' ? 1500 : undefined}
        />
      </AuthLayout>
    )
  }

