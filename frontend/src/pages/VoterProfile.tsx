import React from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import { useVoterProfile, useUpdateVoterProfile } from '../hooks/VoterAuthHooks'
import VoterSidenav from '../components/VoterSidenav'

// Voter profile schema (without verify/archive)
const voterProfileSchema = z.object({
  fname: z.string().min(1, 'First name is required'),
  mname: z.string().optional(),
  lname: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  contact_number: z.string().max(20, 'Contact number must be at most 20 characters').optional(),
  password: z
    .string()
    .refine((val) => val === '' || val.length >= 6, {
      message: 'Password must be at least 6 characters',
    })
    .optional(),
})

type VoterProfileFormData = z.infer<typeof voterProfileSchema>

const VoterProfile = () => {
  const { data: profile, isLoading: profileLoading, error: profileError } = useVoterProfile()
  const updateMutation = useUpdateVoterProfile()
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoterProfileFormData>({
    resolver: zodResolver(voterProfileSchema),
    defaultValues: {
      fname: '',
      mname: '',
      lname: '',
      email: '',
      contact_number: '',
      password: '',
    },
  })

  // Set form values when profile is loaded
  React.useEffect(() => {
    if (profile) {
      reset({
        fname: profile.fname,
        mname: profile.mname || '',
        lname: profile.lname,
        email: profile.email,
        contact_number: profile.contact_number || '',
        password: '',
      })
      setImagePreview(profile.v_image_url)
      setSelectedFile(null)
    }
  }, [profile, reset])

  const onSubmit = async (data: VoterProfileFormData) => {
    try {
      setSuccessMessage(null)
      const formData = new FormData()
      
      if (data.fname) formData.append('fname', data.fname)
      if (data.mname !== undefined) formData.append('mname', data.mname)
      if (data.lname) formData.append('lname', data.lname)
      if (data.email) formData.append('email', data.email)
      if (data.contact_number !== undefined) formData.append('contact_number', data.contact_number)
      if (data.password && data.password.trim().length > 0) formData.append('password', data.password)
      
      if (selectedFile) {
        formData.append('v_image', selectedFile)
      }

      await updateMutation.mutateAsync(formData)
      setSuccessMessage('Profile updated successfully!')
      
      // Clear password field after successful update
      reset({
        ...data,
        password: '',
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

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

  const handleRemoveImage = () => {
    setImagePreview(profile?.v_image_url || null)
    setSelectedFile(null)
  }

  if (profileLoading) {
    return (
      <VoterSidenav>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        </Container>
      </VoterSidenav>
    )
  }

  if (profileError) {
    return (
      <VoterSidenav>
        <Container maxWidth="md">
          <Alert severity="error">Failed to load profile</Alert>
        </Container>
      </VoterSidenav>
    )
  }

  return (
    <VoterSidenav>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Update your contact details and password
        </Typography>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}

            {updateMutation.error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'Failed to update profile'}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Profile Image */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
                  >
                    {!imagePreview && <PersonIcon sx={{ fontSize: 60 }} />}
                  </Avatar>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    size="small"
                  >
                    Upload Photo
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  {selectedFile && (
                    <Button size="small" onClick={handleRemoveImage} startIcon={<CloseIcon />} sx={{ mt: 1 }}>
                      Remove
                    </Button>
                  )}
                </Box>

                {/* Voter ID (readonly) */}
                <TextField
                  label="Voter ID"
                  value={profile?.voters_id || ''}
                  fullWidth
                  disabled
                  helperText="This cannot be changed"
                />

                {/* Name Fields */}
                <Controller
                  name="fname"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name *"
                      error={!!errors.fname}
                      helperText={errors.fname?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="mname"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Middle Name"
                      error={!!errors.mname}
                      helperText={errors.mname?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="lname"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name *"
                      error={!!errors.lname}
                      helperText={errors.lname?.message}
                      fullWidth
                    />
                  )}
                />

                {/* Contact Fields */}
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email *"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="contact_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contact Number"
                      type="tel"
                      error={!!errors.contact_number}
                      helperText={errors.contact_number?.message}
                      fullWidth
                    />
                  )}
                />

                {/* Password Field */}
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="New Password (leave blank to keep current)"
                      type="password"
                      error={!!errors.password}
                      helperText={errors.password?.message || "Only fill if you want to change your password"}
                      fullWidth
                    />
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={updateMutation.isPending}
                  startIcon={updateMutation.isPending && <CircularProgress size={20} />}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </VoterSidenav>
  )
}

export default VoterProfile

