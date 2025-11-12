import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { partySchema, type PartyFormData } from '../schemas/partySchema'
import { useCreateParty, useUpdateParty, type Party } from '../hooks/PartyHooks'

interface CreatePartyProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: Party
  editMode?: boolean
}

export default function CreateParty({
  open,
  onClose,
  onSuccess,
  initialData,
  editMode = false,
}: CreatePartyProps) {
  const { mutate: createParty, isPending: isCreating, error: createError } = useCreateParty()
  const { mutate: updateParty, isPending: isUpdating, error: updateError } = useUpdateParty()

  const isPending = isCreating || isUpdating
  const error = createError || updateError

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_name: initialData?.party_name || '',
      party_code: initialData?.party_code || '',
      description: initialData?.description || '',
    },
  })

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        party_name: initialData.party_name,
        party_code: initialData.party_code,
        description: initialData.description || '',
      })
    }
  }, [initialData, reset])

  const onSubmit = (data: PartyFormData) => {
    if (editMode && initialData) {
      // Update existing party
      updateParty(
        {
          id: initialData.id,
          data: {
            party_name: data.party_name,
            party_code: data.party_code,
            description: data.description,
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
      // Create new party
      createParty(
        {
          party_name: data.party_name,
          party_code: data.party_code,
          description: data.description,
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
        <Box>{editMode ? 'Edit Party' : 'Add New Party'}</Box>
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

            {/* Party Name */}
            <Controller
              name="party_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Party Name"
                  fullWidth
                  required
                  placeholder="e.g., Progressive Alliance"
                  error={!!errors.party_name}
                  helperText={errors.party_name?.message}
                />
              )}
            />

            {/* Party Code */}
            <Controller
              name="party_code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Party Code"
                  fullWidth
                  required
                  placeholder="e.g., PA, DEM, REP"
                  error={!!errors.party_code}
                  helperText={errors.party_code?.message || 'Use uppercase letters, numbers, underscores, or hyphens'}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  disabled={editMode && initialData?.party_code === 'IND'}
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
                  label="Description (Optional)"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Brief description of the party..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
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
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
          >
            {isPending ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Party' : 'Add Party')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

