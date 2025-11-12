import * as React from 'react'
import { useNavigate } from 'react-router-dom'
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
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewListIcon from '@mui/icons-material/ViewList'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import Sidenav from '../components/Sidenav'
import CreateElection from '../components/CreateElection'
import { useGetElections, useDeleteElection } from '../hooks/ElectionHooks'
import { getImageUrl } from '../utils/imageUtils'

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

type SortOption = 'title_asc' | 'title_desc' | 'date_asc' | 'date_desc' | 'status'
type ViewMode = 'card' | 'table'

export default function Elections() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [selectedElection, setSelectedElection] = React.useState<number | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<SortOption>('date_desc')
  const [viewMode, setViewMode] = React.useState<ViewMode>('card')
  const [showArchived, setShowArchived] = React.useState(false)
  
  const navigate = useNavigate()
  const { data: elections = [], isLoading, error } = useGetElections(showArchived)
  const { mutate: deleteElection } = useDeleteElection()

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, electionId: number) => {
    setAnchorEl(event.currentTarget)
    setSelectedElection(electionId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedElection(null)
  }

  const handleViewDetails = (electionId?: number) => {
    const id = electionId || selectedElection
    if (id) {
      navigate(`/elections/${id}/candidates`)
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    console.log('Edit election:', selectedElection)
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedElection) {
      deleteElection({ id: selectedElection, archive: true })
    }
    handleMenuClose()
  }

  const handleElectionCreated = () => {
    setOpenCreateDialog(false)
  }

  // Sort elections based on selected option
  const sortedElections = React.useMemo(() => {
    const sorted = [...elections]
    
    switch (sortBy) {
      case 'title_asc':
        return sorted.sort((a, b) => a.election_title.localeCompare(b.election_title))
      case 'title_desc':
        return sorted.sort((a, b) => b.election_title.localeCompare(a.election_title))
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      case 'status':
        const statusOrder = { ongoing: 0, not_started: 1, ended: 2 }
        return sorted.sort((a, b) => {
          const statusA = statusOrder[a.status || 'ended']
          const statusB = statusOrder[b.status || 'ended']
          return statusA - statusB
        })
      default:
        return sorted
    }
  }, [elections, sortBy])

  return (
    <Sidenav>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Elections
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ textTransform: 'none' }}
          >
            Create Election
          </Button>
        </Box>

        {/* Controls Bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sort Dropdown */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="date_desc">Newest First</MenuItem>
              <MenuItem value="date_asc">Oldest First</MenuItem>
              <MenuItem value="title_asc">Title (A-Z)</MenuItem>
              <MenuItem value="title_desc">Title (Z-A)</MenuItem>
              <MenuItem value="status">Status</MenuItem>
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

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && sortedElections.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {showArchived ? 'No archived elections found' : 'No elections found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {showArchived 
                ? 'You don\'t have any archived elections yet' 
                : 'Create your first election to get started'
              }
            </Typography>
            {!showArchived && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Create Election
              </Button>
            )}
          </Box>
        )}

        {/* Card View */}
        {!isLoading && sortedElections.length > 0 && viewMode === 'card' && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 3,
            }}
          >
            {sortedElections.map((election) => {
              const statusInfo = getStatusColor(election.status || 'not_started')
              const imageUrl = getImageUrl(election.img_url)
              
              return (
                <Card
                  key={election.id}
                  sx={{
                    maxWidth: 345,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
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
                      handleMenuClick(e, election.id)
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

                  {/* Election Image */}
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={election.election_title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <HowToVoteIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                    )}
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ p: 2 }}>
                    {/* Status Badge */}
                    <Chip
                      label={statusInfo.label}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: statusInfo.bgcolor,
                        color: statusInfo.color,
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 600,
                      }}
                    />

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: 'text.primary',
                        mb: 0.5,
                      }}
                    >
                      {election.election_title}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mb: 1.5,
                        minHeight: 42,
                      }}
                    >
                      {election.description}
                    </Typography>

                    {/* Dates */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      Start: {formatDateTime(election.start_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                      End: {formatDateTime(election.end_date)}
                    </Typography>

                    {/* Archived Badge */}
                    {election.is_archived ? (
                      <Chip
                        label="Archived"
                        size="small"
                        color="warning"
                        sx={{ mb: 2, height: 20, fontSize: '0.7rem' }}
                      />
                    ) : null}

                    {/* View Details Button */}
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
                      onClick={() => handleViewDetails(election.id)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}

        {/* Table View */}
        {!isLoading && sortedElections.length > 0 && viewMode === 'table' && (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Election</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedElections.map((election) => {
                  const statusInfo = getStatusColor(election.status || 'not_started')
                  const imageUrl = getImageUrl(election.img_url)
                  
                  return (
                    <TableRow 
                      key={election.id}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        cursor: 'pointer',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={imageUrl || undefined}
                            variant="rounded"
                            sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}
                          >
                            {!imageUrl && <HowToVoteIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {election.election_title}
                            </Typography>
                            {election.is_archived && (
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
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            bgcolor: statusInfo.bgcolor,
                            color: statusInfo.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(election.start_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(election.end_date)}
                        </Typography>
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
                          {election.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(election.id)}
                          sx={{ textTransform: 'none', mr: 1 }}
                        >
                          View
                        </Button>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, election.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
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
          <MenuItem onClick={() => handleViewDetails()}>View Details</MenuItem>
          <MenuItem onClick={handleEdit}>Edit</MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        </Menu>

        {/* Create Election Dialog */}
        <CreateElection
          open={openCreateDialog}
          onClose={() => setOpenCreateDialog(false)}
          onSuccess={handleElectionCreated}
        />
      </Container>
    </Sidenav>
  )
}
