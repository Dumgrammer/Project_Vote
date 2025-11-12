import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { electionSchema, type ElectionFormData } from '../schemas/electionSchema'
import { useCreateElection } from '../hooks/ElectionHooks'

interface CreateElectionProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateElection({ open, onClose, onSuccess }: CreateElectionProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const { mutate: createElection, isPending, error } = useCreateElection()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      election_title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      img: null,
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      // Store the File object
      setValue('img', file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('img', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = (data: ElectionFormData) => {
    // Combine date and time for API format
    const startDateTime = `${data.startDate}T${data.startTime}:00`
    const endDateTime = `${data.endDate}T${data.endTime}:00`
    
    const electionData = {
      election_title: data.election_title,
      description: data.description,
      start_date: startDateTime,
      end_date: endDateTime,
      img: data.img,
    }
    
    createElection(electionData, {
      onSuccess: () => {
        reset()
        setImagePreview(null)
        if (onSuccess) {
          onSuccess()
        }
      },
    })
  }

  const handleCancel = () => {
    reset()
    setImagePreview(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          Create New Election
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleCancel}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            {/* Error Alert */}
            {error && (
              <Alert severity="error">
                {error.message}
              </Alert>
            )}
            
            {/* Image Upload */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Election Banner Image
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                }}
              >
                {imagePreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{ width: 200, height: 120, mx: 'auto' }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="election-image-upload"
                    />
                    <label htmlFor="election-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Upload Image
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      Max size: 5MB. Formats: JPG, PNG, GIF
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            {/* Title */}
            <Controller
              name="election_title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Election Title"
                  fullWidth
                  required
                  placeholder="e.g., Student Council Election 2024"
                  error={!!errors.election_title}
                  helperText={errors.election_title?.message}
                />
              )}
            />

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  placeholder="Provide details about the election..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            {/* Start Date and Time */}
            <Box>
              <Box sx={{ mb: 1 }}>
                <strong>Start Date & Time</strong>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Date"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                    />
                  )}
                />
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Time"
                      type="time"
                      fullWidth
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* End Date and Time */}
            <Box>
              <Box sx={{ mb: 1 }}>
                <strong>End Date & Time</strong>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Date"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.endDate}
                      helperText={errors.endDate?.message}
                    />
                  )}
                />
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Time"
                      type="time"
                      fullWidth
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCancel} sx={{ textTransform: 'none' }} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ textTransform: 'none' }}
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
          >
            {isPending ? 'Creating...' : 'Create Election'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
