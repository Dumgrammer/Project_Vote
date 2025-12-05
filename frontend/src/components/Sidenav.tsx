import * as React from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Fab from '@mui/material/Fab'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined'
import BarChartIcon from '@mui/icons-material/BarChart'
import InfoIcon from '@mui/icons-material/Info'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PeopleIcon from '@mui/icons-material/People'

const drawerWidth = 240

interface SidenavProps {
  children: React.ReactNode
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Elections', icon: <HowToVoteOutlinedIcon />, path: '/elections' },
  { text: 'Voters', icon: <PeopleIcon />, path: '/voters' },
  { text: 'Results', icon: <BarChartIcon />, path: '/results' },
  { text: 'About', icon: <InfoIcon />, path: '/about' },
]

export default function Sidenav({ children }: SidenavProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (mobileOpen) {
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    if (mobileOpen) {
      setMobileOpen(false)
    }
  }

  const drawer = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 32px)',
        bgcolor: 'white',
        borderRadius: 2,
        m: 2,
        overflow: 'hidden',
      }}
    >
      <Box>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
              fontSize: '0.75rem',
            }}
          >
            Pollify
          </Typography>
        </Box>
        <List sx={{ px: 1.5, py: 0 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    bgcolor: isSelected ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                    },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: isSelected ? 600 : 400,
                        color: 'text.primary',
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>
      
      {/* Logout button at the bottom */}
      <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        <List sx={{ px: 1.5, py: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 2,
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'error.contrastText',
                  },
                },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile Menu Button */}
      <Fab
        color="primary"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
          zIndex: 1300,
        }}
      >
        <MenuIcon />
      </Fab>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'transparent',
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: 'transparent',
              border: 'none',
              position: 'relative',
              zIndex: 1,
              height: '100vh',
              overflow: 'visible',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
