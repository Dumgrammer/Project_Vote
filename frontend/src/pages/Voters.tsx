import React from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  FormControl,
  Select,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Container,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import VerifiedIcon from '@mui/icons-material/Verified'
import {
  useGetVoters,
  useArchiveVoter,
  useDeleteVoter,
  type Voter,
} from '../hooks/VoterHooks'
import CreateVoter from '../components/CreateVoter'
import Sidenav from '../components/Sidenav'
import StatusModal from '../components/StatusModal'

const Voters = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedVoter, setSelectedVoter] = React.useState<Voter | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [menuVoterId, setMenuVoterId] = React.useState<number | null>(null)
  const [sortBy, setSortBy] = React.useState<string>('date_desc')
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card')
  const [showArchived, setShowArchived] = React.useState(false)
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

  const { data: voters = [], isLoading, error } = useGetVoters(showArchived)
  const archiveMutation = useArchiveVoter()
  const deleteMutation = useDeleteVoter()

  const handleOpenDialog = (voter?: Voter) => {
    setSelectedVoter(voter || null)
    setDialogOpen(true)
  }

  const handleCloseDialog = (wasSuccess?: boolean) => {
    setDialogOpen(false)
    if (wasSuccess) {
      setModalState({
        open: true,
        type: 'success',
        title: selectedVoter ? 'Voter Updated!' : 'Voter Created!',
        message: selectedVoter 
          ? 'The voter has been successfully updated.' 
          : 'The voter has been successfully created.',
      })
    }
    setSelectedVoter(null)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, voterId: number) => {
    setAnchorEl(event.currentTarget)
    setMenuVoterId(voterId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuVoterId(null)
  }

  const handleEdit = () => {
    const voter = voters.find((v) => v.id === menuVoterId)
    if (voter) {
      handleOpenDialog(voter)
    }
    handleMenuClose()
  }

  const handleArchive = async () => {
    if (menuVoterId) {
      try {
        await archiveMutation.mutateAsync(menuVoterId)
        setModalState({
          open: true,
          type: 'success',
          title: 'Voter Archived!',
          message: 'The voter has been successfully archived.',
        })
      } catch (error: any) {
        setModalState({
          open: true,
          type: 'error',
          title: 'Archive Failed',
          message: error?.message || 'Failed to archive voter. Please try again.',
        })
      }
    }
    handleMenuClose()
  }

  const handleDelete = async () => {
    if (menuVoterId && window.confirm('Are you sure you want to delete this voter?')) {
      try {
        await deleteMutation.mutateAsync(menuVoterId)
        setModalState({
          open: true,
          type: 'success',
          title: 'Voter Deleted!',
          message: 'The voter has been successfully deleted.',
        })
      } catch (error: any) {
        setModalState({
          open: true,
          type: 'error',
          title: 'Delete Failed',
          message: error?.message || 'Failed to delete voter. Please try again.',
        })
      }
    }
    handleMenuClose()
  }

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'card' | 'table' | null) => {
    if (newMode !== null) {
      setViewMode(newMode)
    }
  }

  // Sorting logic
  const sortedVoters = React.useMemo(() => {
    const sorted = [...voters]
    
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name))
      case 'name_desc':
        return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name))
      case 'voter_id_asc':
        return sorted.sort((a, b) => a.voters_id.localeCompare(b.voters_id))
      case 'voter_id_desc':
        return sorted.sort((a, b) => b.voters_id.localeCompare(a.voters_id))
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.date_registered).getTime() - new Date(b.date_registered).getTime())
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.date_registered).getTime() - new Date(a.date_registered).getTime())
      case 'verified':
        return sorted.sort((a, b) => {
          if (a.is_verified === b.is_verified) return 0
          return a.is_verified ? -1 : 1
        })
      default:
        return sorted
    }
  }, [voters, sortBy])

  if (isLoading) {
    return (
      <Sidenav>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </Sidenav>
    )
  }

  if (error) {
    return (
      <Sidenav>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load voters</Alert>
        </Box>
      </Sidenav>
    )
  }

  return (
    <Sidenav>
      <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Voters
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Voter
        </Button>
      </Box>

      {/* Controls Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Sort Dropdown */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="date_desc">Date (Newest First)</MenuItem>
            <MenuItem value="date_asc">Date (Oldest First)</MenuItem>
            <MenuItem value="name_asc">Name (A-Z)</MenuItem>
            <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            <MenuItem value="voter_id_asc">Voter ID (A-Z)</MenuItem>
            <MenuItem value="voter_id_desc">Voter ID (Z-A)</MenuItem>
            <MenuItem value="verified">Verified First</MenuItem>
          </Select>
        </FormControl>

        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="card">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="table">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Show Archived Toggle */}
        <Button
          variant={showArchived ? 'contained' : 'outlined'}
          startIcon={showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
          onClick={() => setShowArchived(!showArchived)}
          size="small"
        >
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </Box>

      {/* Voters List */}
      {sortedVoters.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {showArchived ? 'No archived voters found' : 'No voters yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {showArchived ? 'Archive voters to see them here' : 'Click "Add Voter" to register a new voter'}
          </Typography>
        </Box>
      ) : viewMode === 'card' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {sortedVoters.map((voter) => {
            const photoUrl = voter.v_image_url

            return (
              <Card
                key={voter.id}
                sx={{
                  maxWidth: 345,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                {/* Menu button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMenuClick(e, voter.id)
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    zIndex: 2,
                    '&:hover': {
                      bgcolor: 'white',
                    },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>

                {/* Voter Image */}
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {photoUrl ? (
                    <Box
                      component="img"
                      src={photoUrl}
                      alt={voter.full_name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <PersonIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                  )}
                </Box>

                {/* Card Content */}
                <CardContent 
                  sx={{ 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  {/* Voter ID Badge */}
                  <Chip
                    label={voter.voters_id}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: 'grey.100',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />

                  {/* Name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: 'text.primary',
                      }}
                    >
                      {voter.full_name}
                    </Typography>
                    {voter.is_verified ? (
                      <VerifiedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    ) : null}
                  </Box>

                  {/* Registration Date */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Registered: {new Date(voter.date_registered).toLocaleDateString()}
                  </Typography>

                  {/* Verification Date */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 1, minHeight: 20 }}
                  >
                    {voter.is_verified && voter.date_verified 
                      ? `Verified: ${new Date(voter.date_verified).toLocaleDateString()}`
                      : '\u00A0'
                    }
                  </Typography>

                  {/* Status Badges */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, minHeight: 28 }}>
                    {voter.is_verified ? (
                      <Chip
                        label="Verified"
                        size="small"
                        color="success"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    ) : null}
                    {voter.is_archived ? (
                      <Chip
                        label="Archived"
                        size="small"
                        color="warning"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    ) : null}
                  </Box>

                  {/* View Details Button */}
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        bgcolor: 'grey.800',
                        '&:hover': {
                          bgcolor: 'grey.900',
                        },
                      }}
                      onClick={() => handleOpenDialog(voter)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>Voter ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedVoters.map((voter) => (
                <TableRow key={voter.id} hover>
                  <TableCell>
                    <Avatar
                      src={voter.v_image_url || undefined}
                      alt={voter.full_name}
                      sx={{ width: 40, height: 40 }}
                    >
                      <PersonIcon />
                    </Avatar>
                  </TableCell>
                  <TableCell>{voter.voters_id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {voter.full_name}
                      {voter.is_verified ? (
                        <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(voter.date_registered).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {voter.is_verified ? (
                        <Chip label="Verified" size="small" color="success" />
                      ) : null}
                      {voter.is_archived ? (
                        <Chip label="Archived" size="small" color="warning" />
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, voter.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleArchive}>Archive</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <CreateVoter
        open={dialogOpen}
        onClose={handleCloseDialog}
        voter={selectedVoter}
      />

      {/* Status Modal */}
      <StatusModal
        open={modalState.open}
        onClose={() => setModalState({ ...modalState, open: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
      </Container>
    </Sidenav>
  )
}

export default Voters

