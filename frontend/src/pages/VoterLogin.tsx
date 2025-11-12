import { useNavigate, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import EmailIcon from '@mui/icons-material/Email'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import IconButton from '@mui/material/IconButton'
import AuthLayout from '../layouts/AuthLayout'
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
  const { isAuthenticated, isLoading: authLoading } = useVoterAuth()

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
      await loginMutation.mutateAsync(data)
      navigate('/voter/home')
    } catch (error: any) {
      // Error is handled by the mutation error state
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

          {loginMutation.error && (
            <Alert severity="error">
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : 'Login failed. Please check your credentials.'}
            </Alert>
          )}

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
    </AuthLayout>
  )
}

