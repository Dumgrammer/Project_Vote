import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { positionSchema, type PositionFormData } from '../schemas/positionSchema'
import { useCreatePosition, useUpdatePosition, type Position } from '../hooks/PositionHooks'

interface CreatePositionProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: Position
  editMode?: boolean
  electionType?: 'school' | 'corporate' | 'barangay'
}

export default function CreatePosition({
  open,
  onClose,
  onSuccess,
  initialData,
  editMode = false,
  electionType,
}: CreatePositionProps) {
  const { mutate: createPosition, isPending: isCreating, error: createError } = useCreatePosition()
  const { mutate: updatePosition, isPending: isUpdating, error: updateError } = useUpdatePosition()

  const isPending = isCreating || isUpdating
  const error = createError || updateError

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || electionType || 'school',
      allows_multiple_votes: initialData?.allows_multiple_votes || false,
    },
  })

  // Update form when initialData or electionType changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          type: initialData.type,
          allows_multiple_votes: initialData.allows_multiple_votes,
        })
      } else {
        reset({
          name: '',
          type: electionType || 'school',
          allows_multiple_votes: false,
        })
      }
    }
  }, [initialData, reset, open, electionType])

  const onSubmit = (data: PositionFormData) => {
    if (editMode && initialData) {
      // Update existing position
      updatePosition(
        {
          id: initialData.id,
          data: {
            name: data.name,
            type: data.type,
            allows_multiple_votes: data.allows_multiple_votes,
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
      // Create new position
      createPosition(
        {
          name: data.name,
          type: data.type,
          allows_multiple_votes: data.allows_multiple_votes,
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
        <Box>{editMode ? 'Edit Position' : 'Add New Position'}</Box>
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

            {/* Position Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Position Name"
                  fullWidth
                  required
                  placeholder="e.g., President, Secretary, Board Member"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            {/* Position Type */}
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Position Type"
                  fullWidth
                  required
                  error={!!errors.type}
                  helperText={errors.type?.message}
                  disabled={!!electionType && !editMode}
                >
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="barangay">Barangay</MenuItem>
                </TextField>
              )}
            />

            {/* Allows Multiple Votes */}
            <Controller
              name="allows_multiple_votes"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Allow Multiple Votes"
                />
              )}
            />
            {errors.allows_multiple_votes && (
              <Alert severity="error" sx={{ mt: -2 }}>
                {errors.allows_multiple_votes.message}
              </Alert>
            )}
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
            {isPending ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Position' : 'Add Position')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

