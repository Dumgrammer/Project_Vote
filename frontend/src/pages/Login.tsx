  import * as React from 'react'
  import { Navigate } from 'react-router-dom'
  import Box from '@mui/material/Box'
  import Typography from '@mui/material/Typography'
  import TextField from '@mui/material/TextField'
  import Button from '@mui/material/Button'
  import Stack from '@mui/material/Stack'
  import FormControlLabel from '@mui/material/FormControlLabel'
  import Checkbox from '@mui/material/Checkbox'
  import Link from '@mui/material/Link'
  import FormControl from '@mui/material/FormControl'
  import FormLabel from '@mui/material/FormLabel'
  import InputAdornment from '@mui/material/InputAdornment'
  import CircularProgress from '@mui/material/CircularProgress'
  import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
  import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import AuthLayout from '../layouts/AuthLayout'
  import StatusModal from '../components/StatusModal'
  import { useForm, Controller } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { useLogin } from '../hooks/LoginHooks'
  import { useAuth } from '../contexts/AuthContext'

  // Zod validation schema
  const loginSchema = z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    remember: z.boolean().optional(),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  export default function Login() {
  const [modalState, setModalState] = React.useState<{
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
    const { isAuthenticated, isLoading } = useAuth()
    const { mutate: login, isPending } = useLogin()

    // Redirect if already authenticated (session check happens in AuthContext)
    if (!isLoading && isAuthenticated) {
      return <Navigate to="/dashboard" replace />
    }

    const {
      control,
      handleSubmit,
      formState: { errors },
    } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: '',
        password: '',
        remember: false,
      },
    })

    const onSubmit = (data: LoginFormData) => {
      login(data, {
        onSuccess: () => {
          setModalState({
            open: true,
            type: 'success',
            title: 'Login Successful!',
            message: 'You have been logged in successfully. Redirecting to dashboard...',
          })
        },
        onError: (err: any) => {
          const message = err?.response?.data?.data?.message || 
                        err?.response?.data?.message || 
                        'Login failed. Please try again.'
          setModalState({
            open: true,
            type: 'error',
            title: 'Login Failed',
            message: message,
          })
        },
      })
    }

    return (
      <AuthLayout>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 360 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="overline" sx={{ letterSpacing: 1, color: 'primary.main' }}>
                Pollify
              </Typography>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access your voting dashboard
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
                    placeholder="you@example.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon fontSize="small" />
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

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        color="primary"
                      />
                    }
                    label={<Typography variant="caption">Remember me</Typography>}
                    sx={{ m: 0 }}
                  />
                )}
              />
              <Link href="#" variant="caption" sx={{ fontSize: '0.75rem' }}>
                Forgot password?
              </Link>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isPending}
              sx={{ py: 1.2 }}
            >
              {isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              By signing in, you agree to our{' '}
              <Link href="#" sx={{ fontSize: '0.75rem' }}>
                Terms and Conditions
              </Link>
              .
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


