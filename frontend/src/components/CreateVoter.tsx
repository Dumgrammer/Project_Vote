import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { voterSchema, type VoterFormData } from '../schemas/voterSchema'
import { useCreateVoter, useUpdateVoter, type Voter } from '../hooks/VoterHooks'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'

interface CreateVoterProps {
  open: boolean
  onClose: () => void
  voter?: Voter | null
}

const CreateVoter: React.FC<CreateVoterProps> = ({ open, onClose, voter }) => {
  const isEditMode = !!voter
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoterFormData>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      fname: '',
      mname: '',
      lname: '',
      email: '',
      contact_number: '',
      sex: 'male',
      voter_type: 'school',
      is_verified: false,
      is_archived: false,
    },
  })

  const createMutation = useCreateVoter()
  const updateMutation = useUpdateVoter()

  // Set form values when editing
  React.useEffect(() => {
    if (voter) {
      reset({
        fname: voter.fname,
        mname: voter.mname || '',
        lname: voter.lname,
        email: voter.email,
        contact_number: voter.contact_number || '',
        password: '', // Don't populate password for security
        is_verified: Boolean(voter.is_verified), // Explicitly convert to boolean
        is_archived: Boolean(voter.is_archived), // Explicitly convert to boolean
        sex: voter.sex ?? 'other',
        voter_type: voter.voter_type ?? 'school',
      })
      setImagePreview(voter.v_image_url)
      setSelectedFile(null)
    } else {
      reset({
        fname: '',
        mname: '',
        lname: '',
        email: '',
        contact_number: '',
        password: '',
        sex: 'male',
        voter_type: 'school',
        is_verified: false,
        is_archived: false,
      })
      setImagePreview(null)
      setSelectedFile(null)
    }
  }, [voter, reset])

  const onSubmit = async (data: VoterFormData) => {
    try {
      if (isEditMode && voter) {
        await updateMutation.mutateAsync({
          id: voter.id,
          fname: data.fname,
          mname: data.mname,
          lname: data.lname,
          email: data.email,
          contact_number: data.contact_number,
          password: data.password, // Only updates if provided
          v_image: selectedFile || undefined,
          sex: data.sex,
          voter_type: data.voter_type,
          is_verified: data.is_verified,
          is_archived: data.is_archived,
        })
      } else {
        // For new voters created by admin, a default password should be provided
        await createMutation.mutateAsync({
          fname: data.fname,
          mname: data.mname,
          lname: data.lname,
          email: data.email,
          contact_number: data.contact_number,
          password: data.password || 'Pollify123', // Default password if not provided
          v_image: selectedFile || undefined,
          sex: data.sex,
          voter_type: data.voter_type,
          is_verified: data.is_verified,
          is_archived: data.is_archived,
        })
      }
      handleClose()
    } catch (error) {
      console.error('Failed to save voter:', error)
    }
  }

  const handleClose = () => {
    reset()
    setImagePreview(null)
    setSelectedFile(null)
    onClose()
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
    setImagePreview(null)
    setSelectedFile(null)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Voter' : 'Add New Voter'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error instanceof Error ? error.message : 'An error occurred'}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Image Upload */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mb: 1 }}
              >
                Upload Voter Photo
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
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Voter ID - Display only in edit mode */}
            {isEditMode && voter && (
              <TextField
                label="Voter ID"
                value={voter.voters_id}
                fullWidth
                disabled
                helperText="Auto-generated (cannot be changed)"
              />
            )}

            {/* First Name */}
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

            {/* Middle Name */}
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

            {/* Last Name */}
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

            {/* Email */}
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

            {/* Contact Number */}
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

            {/* Sex */}
            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.sex}>
                  <InputLabel id="sex-label">Sex *</InputLabel>
                  <Select
                    {...field}
                    labelId="sex-label"
                    label="Sex *"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {errors.sex && <FormHelperText>{errors.sex.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Voter Type */}
            <Controller
              name="voter_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.voter_type}>
                  <InputLabel id="voter-type-label">Voter Type *</InputLabel>
                  <Select
                    {...field}
                    labelId="voter-type-label"
                    label="Voter Type *"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                  >
                    <MenuItem value="school">School</MenuItem>
                    <MenuItem value="corporate">Corporate</MenuItem>
                    <MenuItem value="barangay">Barangay</MenuItem>
                  </Select>
                  {errors.voter_type && <FormHelperText>{errors.voter_type.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={isEditMode ? "New Password (leave blank to keep current)" : "Password *"}
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message || (isEditMode ? "Only fill if you want to change the password" : "Default: Pollify123")}
                  fullWidth
                />
              )}
            />

            {/* Is Verified */}
            <Controller
              name="is_verified"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  }
                  label="Verified"
                />
              )}
            />

            {/* Is Archived */}
            {isEditMode && (
              <Controller
                name="is_archived"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    }
                    label="Archived"
                  />
                )}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateVoter

