import * as React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CssBaseline from '@mui/material/CssBaseline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box
      component="main"
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'transparent',
      }}
    >
      <CssBaseline />
      {/* Centered page container */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { md: 8, xs: 0 }, width: '100%', maxWidth: 1120, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Left marketing panel (hidden on small screens) */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            p: 8,
            overflow: 'hidden',
            borderRadius: 3,
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <Stack spacing={3} sx={{ maxWidth: 520 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Secure, simple, and fast voting
            </Typography>
            <Typography color="text.secondary">
              Create and manage elections, monitor real-time participation, and ensure fair results
              with enterprise‑grade security.
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                <Typography variant="body2">End‑to‑end encrypted ballots</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                <Typography variant="body2">Live turnout and results</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
                <Typography variant="body2">Role‑based access control</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Right form card */}
        <Paper elevation={8} sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {children}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}


