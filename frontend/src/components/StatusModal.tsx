import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  Button,
  IconButton 
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import CloseIcon from '@mui/icons-material/Close'

interface StatusModalProps {
  open: boolean
  onClose: () => void
  type: 'success' | 'error'
  title: string
  message: string
  autoHideDuration?: number
}

const StatusModal = ({ 
  open, 
  onClose, 
  type, 
  title, 
  message, 
  autoHideDuration 
}: StatusModalProps) => {
  // Auto close after duration if specified
  React.useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(() => {
        onClose()
      }, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [open, autoHideDuration, onClose])

  const isSuccess = type === 'success'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'visible',
        },
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'grey.500',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isSuccess ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              animation: 'scaleIn 0.3s ease-out',
              '@keyframes scaleIn': {
                '0%': {
                  transform: 'scale(0)',
                  opacity: 0,
                },
                '50%': {
                  transform: 'scale(1.1)',
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          >
            {isSuccess ? (
              <CheckCircleIcon
                sx={{
                  fontSize: 50,
                  color: 'success.main',
                }}
              />
            ) : (
              <ErrorIcon
                sx={{
                  fontSize: 50,
                  color: 'error.main',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {message}
        </Typography>

        {/* Action Button */}
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          sx={{
            py: 1.2,
            bgcolor: isSuccess ? 'success.main' : 'error.main',
            '&:hover': {
              bgcolor: isSuccess ? 'success.dark' : 'error.dark',
            },
          }}
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default StatusModal

