import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import IconButton from '@mui/material/IconButton'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import MenuItem from '@mui/material/MenuItem'
import AuthLayout from '../layouts/AuthLayout'
import StatusModal from '../components/StatusModal'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateVoter } from '../hooks/VoterHooks'

// Zod validation schema
const voterRegisterSchema = z.object({
  fname: z
    .string()
    .min(1, 'First name is required')
    .max(255, 'First name must be at most 255 characters'),
  mname: z
    .string()
    .max(255, 'Middle name must be at most 255 characters')
    .optional(),
  lname: z
    .string()
    .min(1, 'Last name is required')
    .max(255, 'Last name must be at most 255 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  contact_number: z
    .string()
    .max(20, 'Contact number must be at most 20 characters')
    .optional(),
  sex: z.enum(['male', 'female', 'other'], {
    error: 'Sex is required'
  }),
  voter_type: z.enum(['school', 'corporate', 'barangay'], {
    error: 'Voter type is required'
  }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type VoterRegisterFormData = z.infer<typeof voterRegisterSchema>

export default function VoterRegister() {
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
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const navigate = useNavigate()
  
  const createVoterMutation = useCreateVoter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VoterRegisterFormData>({
    resolver: zodResolver(voterRegisterSchema) as Resolver<VoterRegisterFormData>,
    defaultValues: {
      fname: '',
      mname: '',
      lname: '',
      email: '',
      contact_number: '',
      sex: 'male',
      voter_type: 'school',
      password: '',
      confirmPassword: '',
    },
  })

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: VoterRegisterFormData) => {
    try {
      const result = await createVoterMutation.mutateAsync({
        fname: data.fname,
        mname: data.mname,
        lname: data.lname,
        email: data.email,
        contact_number: data.contact_number,
        password: data.password,
        sex: data.sex,
        voter_type: data.voter_type,
        v_image: selectedFile || undefined,
        is_verified: false, // Public registration starts unverified
        is_archived: false,
      })
      
      // Show success message with Voter ID
      setModalState({
        open: true,
        type: 'success',
        title: 'Registration Successful!',
        message: `Your Voter ID is: ${result.voters_id}. Redirecting to login...`,
      })
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/voter/login')
      }, 2000)
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Registration failed. Please try again.'
      setModalState({
        open: true,
        type: 'error',
        title: 'Registration Failed',
        message: message,
      })
    }
  }

  return (
    <AuthLayout>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 400 }}>
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
              Register to Vote
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your voter account to participate in elections
            </Typography>
          </Stack>

          {/* Photo Upload */}
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 1, textTransform: 'none' }}
            >
              Upload Your Photo (Optional)
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mx: 'auto',
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            )}
          </Box>

          <FormControl fullWidth error={!!errors.fname}>
            <FormLabel htmlFor="fname">First Name</FormLabel>
            <Controller
              name="fname"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="fname"
                  type="text"
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="Juan"
                  error={!!errors.fname}
                  helperText={errors.fname?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.mname}>
            <FormLabel htmlFor="mname">Middle Name (Optional)</FormLabel>
            <Controller
              name="mname"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="mname"
                  type="text"
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="Miguel"
                  error={!!errors.mname}
                  helperText={errors.mname?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.lname}>
            <FormLabel htmlFor="lname">Last Name</FormLabel>
            <Controller
              name="lname"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="lname"
                  type="text"
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="Dela Cruz"
                  error={!!errors.lname}
                  helperText={errors.lname?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </FormControl>

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
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="juan@example.com"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.contact_number}>
            <FormLabel htmlFor="contact_number">Contact Number (Optional)</FormLabel>
            <Controller
              name="contact_number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="contact_number"
                  type="tel"
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="09123456789"
                  error={!!errors.contact_number}
                  helperText={errors.contact_number?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.sex}>
            <FormLabel htmlFor="sex">Sex</FormLabel>
            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="sex"
                  select
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  error={!!errors.sex}
                  helperText={errors.sex?.message}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.voter_type}>
            <FormLabel htmlFor="voter_type">Voter Type</FormLabel>
            <Controller
              name="voter_type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="voter_type"
                  select
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  error={!!errors.voter_type}
                  helperText={errors.voter_type?.message}
                >
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="barangay">Barangay</MenuItem>
                </TextField>
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

          <FormControl fullWidth error={!!errors.confirmPassword}>
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="confirmPassword"
                  type="password"
                  fullWidth
                  variant="outlined"
                  size="small"
                  margin="dense"
                  placeholder="••••••••"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
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
            disabled={createVoterMutation.isPending}
            sx={{ py: 1.2 }}
          >
            {createVoterMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Registering...
              </>
            ) : (
              'Register'
            )}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Already have a Voter ID?{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/voter/login')}
              sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
            >
              Sign in here
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
      />
    </AuthLayout>
  )
}

