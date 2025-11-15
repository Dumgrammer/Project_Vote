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
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { candidateSchema, type CandidateFormData } from '../schemas/candidateSchema'
import { useCreateCandidate, useUpdateCandidate, type Candidate } from '../hooks/CandidateHooks'
import { useGetParties } from '../hooks/PartyHooks'
import { useGetPositions } from '../hooks/PositionHooks'
import { useGetElection } from '../hooks/ElectionHooks'
import CreateParty from './CreateParty'
import CreatePosition from './CreatePosition'

interface CreateCandidatesProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  electionId: number
  initialData?: Candidate
  editMode?: boolean
  canModify?: boolean
}

export default function CreateCandidates({
  open,
  onClose,
  onSuccess,
  electionId,
  initialData,
  editMode = false,
  canModify = true,
}: CreateCandidatesProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [partyDialogOpen, setPartyDialogOpen] = React.useState(false)
  const [positionDialogOpen, setPositionDialogOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { mutate: createCandidate, isPending: isCreating, error: createError } = useCreateCandidate()
  const { mutate: updateCandidate, isPending: isUpdating, error: updateError } = useUpdateCandidate()
  const { data: parties = [], isLoading: partiesLoading } = useGetParties()
  const { data: election } = useGetElection(electionId, open)
  const { data: positions = [], isLoading: positionsLoading } = useGetPositions(false, election?.election_type)

  const isPending = isCreating || isUpdating
  const error = createError || updateError
  const isLocked = !canModify
  const isInteractionDisabled = isLocked || isPending

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      fname: initialData?.fname || '',
      mname: initialData?.mname || '',
      lname: initialData?.lname || '',
      party_id: initialData?.party_id || 0,
      position_id: initialData?.position_id || 0,
      bio: initialData?.bio || '',
      photo: null,
    },
  })

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        fname: initialData.fname,
        mname: initialData.mname || '',
        lname: initialData.lname,
        party_id: initialData.party_id,
        position_id: initialData.position_id || 0,
        bio: initialData.bio,
        photo: null,
      })
      setImagePreview(initialData.photo_url || null)
    } else if (open) {
      reset({
        fname: '',
        mname: '',
        lname: '',
        party_id: 0,
        position_id: 0,
        bio: '',
        photo: null,
      })
      setImagePreview(null)
    }
  }, [initialData, reset, open])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB')
        return
      }

      // Store the File object
      setValue('photo', file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    if (isLocked) return
    setImagePreview(null)
    setValue('photo', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = (data: CandidateFormData) => {
    if (isLocked) {
      return
    }
    if (editMode && initialData) {
      // Update existing candidate
      updateCandidate(
        {
          id: initialData.id,
          data: {
            fname: data.fname,
            mname: data.mname,
            lname: data.lname,
            party_id: data.party_id,
            position_id: data.position_id,
            bio: data.bio,
            photo: data.photo,
          },
        },
        {
          onSuccess: () => {
            handleCancel()
            if (onSuccess) {
              onSuccess()
            }
          },
        }
      )
    } else {
      // Create new candidate
      createCandidate(
        {
          election_id: electionId,
          fname: data.fname,
          mname: data.mname,
          lname: data.lname,
          party_id: data.party_id,
          position_id: data.position_id,
          bio: data.bio,
          photo: data.photo,
        },
        {
          onSuccess: () => {
            handleCancel()
            if (onSuccess) {
              onSuccess()
            }
          },
        }
      )
    }
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
        <Box>{editMode ? 'Edit Candidate' : 'Add New Candidate'}</Box>
        <IconButton edge="end" color="inherit" onClick={handleCancel} aria-label="close" size="small">
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
            {isLocked && (
              <Alert severity="info">
                Candidate updates are locked for this election. You can only modify candidates more than 24 hours before the election begins.
              </Alert>
            )}

            {/* Photo Upload */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Candidate Photo
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
                  <Avatar src={imagePreview} sx={{ width: 120, height: 120, mx: 'auto' }} />
                  <IconButton
                    size="small"
                    disabled={isInteractionDisabled}
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
                    id="candidate-photo-upload"
                    disabled={isInteractionDisabled}
                  />
                  <label htmlFor="candidate-photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      sx={{ textTransform: 'none' }}
                      disabled={isInteractionDisabled}
                    >
                      Upload Photo
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Max size: 2MB. Formats: JPG, PNG
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* First Name */}
          <Controller
            name="fname"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="First Name"
                fullWidth
                required
                placeholder="e.g., John"
                error={!!errors.fname}
                helperText={errors.fname?.message}
                disabled={isInteractionDisabled}
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
                label="Middle Name (Optional)"
                fullWidth
                placeholder="e.g., Michael"
                error={!!errors.mname}
                helperText={errors.mname?.message}
                disabled={isInteractionDisabled}
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
                label="Last Name"
                fullWidth
                required
                placeholder="e.g., Smith"
                error={!!errors.lname}
                helperText={errors.lname?.message}
                disabled={isInteractionDisabled}
              />
            )}
          />

          {/* Position Dropdown with Add New Button */}
          <Box>
            <Controller
              name="position_id"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Position"
                  fullWidth
                  required
                  error={!!errors.position_id}
                  helperText={errors.position_id?.message}
                  disabled={positionsLoading || isInteractionDisabled}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {positions.length === 0 && !positionsLoading ? (
                    <MenuItem disabled value={0}>
                      No positions available. Please create positions for this election type first.
                    </MenuItem>
                  ) : (
                    positions.map((position) => (
                      <MenuItem key={position.id} value={position.id}>
                        {position.name}
                        {position.allows_multiple_votes && ' (Multiple votes allowed)'}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              )}
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => !isInteractionDisabled && setPositionDialogOpen(true)}
              sx={{ mt: 1, textTransform: 'none' }}
              disabled={isInteractionDisabled || !election?.election_type}
            >
              Add New Position
            </Button>
          </Box>

          {/* Party Dropdown with Add New Button */}
          <Box>
            <Controller
              name="party_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Party / Affiliation"
                  fullWidth
                  required
                  error={!!errors.party_id}
                  helperText={errors.party_id?.message}
                  disabled={partiesLoading || isInteractionDisabled}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  {parties.map((party) => (
                    <MenuItem key={party.id} value={party.id}>
                      {party.party_name} ({party.party_code})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => !isInteractionDisabled && setPartyDialogOpen(true)}
              sx={{ mt: 1, textTransform: 'none' }}
              disabled={isInteractionDisabled}
            >
              Add New Party
            </Button>
          </Box>

          {/* Bio */}
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Biography"
                fullWidth
                required
                multiline
                rows={4}
                placeholder="Brief description of the candidate..."
                error={!!errors.bio}
                helperText={errors.bio?.message}
                disabled={isInteractionDisabled}
              />
            )}
          />
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
            disabled={isInteractionDisabled}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
          >
            {isLocked
              ? 'Editing Locked'
              : isPending
              ? editMode
                ? 'Updating...'
                : 'Creating...'
              : editMode
              ? 'Update Candidate'
              : 'Add Candidate'}
          </Button>
        </DialogActions>
      </form>

      {/* Create Party Dialog */}
      <CreateParty
        open={partyDialogOpen}
        onClose={() => setPartyDialogOpen(false)}
        onSuccess={() => {
          // Party list will auto-refresh due to React Query invalidation
        }}
      />

      {/* Create Position Dialog */}
      <CreatePosition
        open={positionDialogOpen}
        onClose={() => setPositionDialogOpen(false)}
        onSuccess={() => {
          // Position list will auto-refresh due to React Query invalidation
        }}
        electionType={election?.election_type}
      />
    </Dialog>
  )
}

