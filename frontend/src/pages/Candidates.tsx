import * as React from 'react'
import { useParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import Sidenav from '../components/Sidenav'
import CreateCandidates from '../components/CreateCandidates'
import StatusModal from '../components/StatusModal'
import { useGetElection } from '../hooks/ElectionHooks'
import { useGetCandidates, useDeleteCandidate, type Candidate } from '../hooks/CandidateHooks'
import { getImageUrl } from '../utils/imageUtils'
import Tooltip from '@mui/material/Tooltip'

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',    
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ongoing':
      return { bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', label: 'Ongoing' }
    case 'not_started':
      return { bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', label: 'Not Started' }
    case 'ended':
      return { bgcolor: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e', label: 'Ended' }
    default:
      return { bgcolor: 'rgba(158, 158, 158, 0.1)', color: '#9e9e9e', label: 'Unknown' }
  }
}

const getTypeConfig = (type: 'school' | 'corporate' | 'barangay') => {
  switch (type) {
    case 'school':
      return { label: 'School Election', color: '#2e7d32', bgcolor: 'rgba(46, 125, 50, 0.12)' }
    case 'corporate':
      return { label: 'Corporate Election', color: '#1565c0', bgcolor: 'rgba(21, 101, 192, 0.12)' }
    case 'barangay':
      return { label: 'Barangay Election', color: '#ef6c00', bgcolor: 'rgba(239, 108, 0, 0.12)' }
    default:
      return { label: 'General', color: '#6d6d6d', bgcolor: 'rgba(109, 109, 109, 0.12)' }
  }
}

type SortOption = 'name_asc' | 'name_desc' | 'party' | 'position' | 'date_asc' | 'date_desc'
type ViewMode = 'card' | 'table'

export default function Candidates() {
  const { electionId } = useParams<{ electionId: string }>()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [menuCandidateId, setMenuCandidateId] = React.useState<number | null>(null)
  const [sortBy, setSortBy] = React.useState<SortOption>('name_asc')
  const [viewMode, setViewMode] = React.useState<ViewMode>('card')
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
  
  // Fetch election details
  const { data: election, isLoading: electionLoading, error: electionError } = useGetElection(
    electionId ? parseInt(electionId) : 0,
    !!electionId
  )
  
  // Fetch candidates for this election
  const { data: candidates = [], isLoading: candidatesLoading } = useGetCandidates(
    electionId ? parseInt(electionId) : 0,
    showArchived
  )
  
  const { mutate: deleteCandidate } = useDeleteCandidate()

  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const canModifyElection = React.useMemo(() => {
    if (!election) return false
    if (election.is_archived) return false
    if (election.status === 'ongoing' || election.status === 'ended') return false
    const startTime = new Date(election.start_date).getTime()
    if (Number.isNaN(startTime)) return false
    return startTime - Date.now() > ONE_DAY_MS
  }, [election])

  const modificationLockMessage = React.useMemo(() => {
    const managementType = election?.election_type === 'barangay' ? 'Project Election Management' : 'Candidate management'
    return `${managementType} is locked within 24 hours of the election start and while an election is ongoing or completed.`
  }, [election])

  const electionTypeConfig = React.useMemo(
    () => (election ? getTypeConfig(election.election_type) : null),
    [election]
  )

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, candidateId: number) => {
    if (!canModifyElection) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Action not allowed',
        message: modificationLockMessage,
      })
      return
    }
    setAnchorEl(event.currentTarget)
    setMenuCandidateId(candidateId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuCandidateId(null)
  }

  const handleOpenDialog = (candidate?: Candidate) => {
    if (!canModifyElection) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Candidate updates locked',
        message: modificationLockMessage,
      })
      handleMenuClose()
      return
    }
    if (candidate) {
      setEditMode(true)
      setSelectedCandidate(candidate)
    } else {
      setEditMode(false)
      setSelectedCandidate(null)
    }
    setOpenDialog(true)
    handleMenuClose()
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditMode(false)
    setSelectedCandidate(null)
  }

  const handleCandidateSuccess = () => {
    handleCloseDialog()
    setModalState({
      open: true,
      type: 'success',
      title: editMode ? 'Candidate Updated!' : 'Candidate Created!',
      message: editMode 
        ? 'The candidate has been successfully updated.' 
        : 'The candidate has been successfully created.',
    })
  }

  const handleDelete = () => {
    if (!canModifyElection) {
      setModalState({
        open: true,
        type: 'error',
        title: 'Action not allowed',
        message: modificationLockMessage,
      })
      handleMenuClose()
      return
    }
    if (menuCandidateId && electionId) {
      deleteCandidate({
        id: menuCandidateId,
        electionId: parseInt(electionId),
        archive: true,
      }, {
        onSuccess: () => {
          setModalState({
            open: true,
            type: 'success',
            title: 'Candidate Archived!',
            message: 'The candidate has been successfully archived.',
          })
        },
        onError: (error: any) => {
          setModalState({
            open: true,
            type: 'error',
            title: 'Archive Failed',
            message: error?.message || 'Failed to archive candidate. Please try again.',
          })
        },
      })
    }
    handleMenuClose()
  }

  // Sort candidates based on selected option
  const sortedCandidates = React.useMemo(() => {
    const sorted = [...candidates]
    
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => {
          const nameA = a.full_name || `${a.fname} ${a.lname}`
          const nameB = b.full_name || `${b.fname} ${b.lname}`
          return nameA.localeCompare(nameB)
        })
      case 'name_desc':
        return sorted.sort((a, b) => {
          const nameA = a.full_name || `${a.fname} ${a.lname}`
          const nameB = b.full_name || `${b.fname} ${b.lname}`
          return nameB.localeCompare(nameA)
        })
      case 'party':
        return sorted.sort((a, b) => (a.party_name || '').localeCompare(b.party_name || ''))
      case 'position':
        return sorted.sort((a, b) => a.position.localeCompare(b.position))
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      default:
        return sorted
    }
  }, [candidates, sortBy])

  return (
    <Sidenav>
      <Container maxWidth="xl">
        {/* Election Details Section */}
        {electionLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {electionError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {electionError.message}
          </Alert>
        )}

        {!canModifyElection && election && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {election.election_type === 'barangay' ? 'Project Election Management' : 'Candidate management'} for this election is read-only. {modificationLockMessage}
          </Alert>
        )}

        {election && (
          <Paper 
            elevation={2}
            sx={{ 
              mb: 4, 
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              {/* Election Image */}
              {election.img_url ? (
                <Box
                  component="img"
                  src={getImageUrl(election.img_url) || ''}
                  alt={election.election_title}
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 2,
                    objectFit: 'cover',
                    boxShadow: 3,
                    display: { xs: 'none', sm: 'block' }
                  }}
                />
              ) : null}

              {/* Election Info */}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {election.election_title}
                  </Typography>
                  <Chip
                    label={getStatusColor(election.status || 'not_started').label}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                  {electionTypeConfig && (
                    <Chip
                      label={electionTypeConfig.label}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.18)',
                        color: 'white',
                        fontWeight: 600,
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body1" sx={{ mb: 2, opacity: 0.95 }}>
                  {election.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">
                      Start: {formatDateTime(election.start_date)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">
                      End: {formatDateTime(election.end_date)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Candidates Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {election?.election_type === 'barangay' ? 'Project Election Management' : 'Candidate Management'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {election ? election.election_title : 'Loading...'}
            </Typography>
          </Box>
          {election && (
            <Tooltip
              title={!canModifyElection ? modificationLockMessage : ''}
              arrow
              disableHoverListener={canModifyElection}
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ textTransform: 'none' }}
                  disabled={!canModifyElection}
                >
                  {election?.election_type === 'barangay' ? 'Add Project' : 'Add Candidate'}
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* Controls Bar */}
        {election && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                <MenuItem value="party">Party</MenuItem>
                <MenuItem value="position">Position</MenuItem>
                <MenuItem value="date_desc">Newest First</MenuItem>
                <MenuItem value="date_asc">Oldest First</MenuItem>
              </Select>
            </FormControl>

            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newView) => newView && setViewMode(newView)}
              size="small"
            >
              <ToggleButton value="card">
                <ViewModuleIcon sx={{ mr: 1 }} />
                Card
              </ToggleButton>
              <ToggleButton value="table">
                <ViewListIcon sx={{ mr: 1 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Archived Toggle */}
            <Button
              variant={showArchived ? 'contained' : 'outlined'}
              startIcon={showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
              onClick={() => setShowArchived(!showArchived)}
              sx={{ textTransform: 'none' }}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {candidatesLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!candidatesLoading && sortedCandidates.length === 0 && election && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {showArchived ? 'No archived candidates found' : 'No candidates yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {showArchived 
                ? 'You don\'t have any archived candidates for this election' 
                : 'Add the first candidate for this election'
              }
            </Typography>
            {!showArchived && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                {election?.election_type === 'barangay' ? 'Add Project' : 'Add Candidate'}
              </Button>
            )}
          </Box>
        )}

        {/* Candidates Grid - Card View */}
        {!candidatesLoading && sortedCandidates.length > 0 && viewMode === 'card' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)', 
                lg: 'repeat(4, 1fr)', 
                xl: 'repeat(5, 1fr)' 
              },
              gap: 3,
            }}
          >
            {sortedCandidates.map((candidate) => {
              const photoUrl = getImageUrl(candidate.photo_url)
              const candidateActionLabel = canModifyElection ? 'Edit Candidate' : 'View Candidate'
              
              return (
              <Card
                key={candidate.id}
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
                <Tooltip
                  title={!canModifyElection ? modificationLockMessage : ''}
                  arrow
                  disableHoverListener={canModifyElection}
                >
                  <span>
                    <IconButton
                      size="small"
                      disabled={!canModifyElection}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMenuClick(e, candidate.id)
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
                  </span>
                </Tooltip>

                {/* Candidate Image */}
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
                      alt={candidate.full_name || `${candidate.fname} ${candidate.lname}`}
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
                  {/* Party Badge */}
                  <Chip
                    label={candidate.party_code}
                    size="small"
                    sx={{
                      mb: 1,
                      bgcolor: 'grey.100',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />

                  {/* Name */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      mb: 0.5,
                      color: 'text.primary',
                    }}
                  >
                    {candidate.full_name || `${candidate.fname} ${candidate.mname ? candidate.mname + ' ' : ''}${candidate.lname}`}
                  </Typography>

                  {/* Position & Party */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {candidate.position} • {candidate.party_name}
                  </Typography>

                  {/* Bio */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      mb: 2,
                    }}
                  >
                    {candidate.bio}
                  </Typography>

                  {/* Archived Badge */}
                  {candidate.is_archived ? (
                    <Chip
                      label="Archived"
                      size="small"
                      color="warning"
                      sx={{ mb: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  ) : null}

                  {/* View Details Button */}
                  <Box sx={{ mt: 'auto' }}>
                    <Tooltip
                      title={!canModifyElection ? modificationLockMessage : ''}
                      arrow
                      disableHoverListener={canModifyElection}
                    >
                      <span>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          sx={{ 
                            textTransform: 'none',
                            bgcolor: canModifyElection ? 'grey.800' : 'grey.500',
                            '&:hover': {
                              bgcolor: canModifyElection ? 'grey.900' : 'grey.500',
                            },
                          }}
                          disabled={!canModifyElection}
                          onClick={() => {
                            const candidateToEdit = candidates.find((c) => c.id === candidate.id)
                            if (candidateToEdit) handleOpenDialog(candidateToEdit)
                          }}
                        >
                          {candidateActionLabel}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            )
            })}
          </Box>
        )}

        {/* Table View */}
        {!candidatesLoading && sortedCandidates.length > 0 && viewMode === 'table' && (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Candidate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Party</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Biography</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCandidates.map((candidate) => {
                  const photoUrl = getImageUrl(candidate.photo_url)
                  
                  return (
                    <TableRow 
                      key={candidate.id}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={photoUrl || undefined}
                            sx={{ width: 48, height: 48, bgcolor: 'grey.100' }}
                          >
                            {!photoUrl && <PersonIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {candidate.full_name || `${candidate.fname} ${candidate.mname ? candidate.mname + ' ' : ''}${candidate.lname}`}
                            </Typography>
                            {candidate.is_archived && (
                              <Chip
                                label="Archived"
                                size="small"
                                color="warning"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={candidate.position}
                          size="small"
                          color="primary"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {candidate.party_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({candidate.party_code})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {candidate.bio}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip
                            title={!canModifyElection ? modificationLockMessage : ''}
                            arrow
                            disableHoverListener={canModifyElection}
                          >
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                sx={{ textTransform: 'none', bgcolor: canModifyElection ? 'grey.800' : 'grey.500', '&:hover': { bgcolor: canModifyElection ? 'grey.900' : 'grey.500' } }}
                                disabled={!canModifyElection}
                                onClick={() => handleOpenDialog(candidate)}
                              >
                                {canModifyElection ? 'Edit Candidate' : 'View Candidate'}
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={!canModifyElection ? modificationLockMessage : ''}
                            arrow
                            disableHoverListener={canModifyElection}
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={!canModifyElection}
                                onClick={(e) => handleMenuClick(e, candidate.id)}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Menu for card actions */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            onClick={() => {
              const candidate = candidates.find((c) => c.id === menuCandidateId)
              if (candidate) handleOpenDialog(candidate)
            }}
            disabled={!canModifyElection}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={handleDelete}
            disabled={!canModifyElection}
            sx={{ color: 'error.main', '&.Mui-disabled': { color: 'text.disabled' } }}
          >
            Delete
          </MenuItem>
        </Menu>

        {/* Create/Edit Candidate Dialog */}
        {electionId && (
          <CreateCandidates
            open={openDialog}
            onClose={handleCloseDialog}
            onSuccess={handleCandidateSuccess}
            electionId={parseInt(electionId)}
            initialData={selectedCandidate || undefined}
            editMode={editMode}
            canModify={canModifyElection}
          />
        )}

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
