import React, { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useLogout } from '../../hooks/useLogout';
import {
  Popover,
  MenuItem,
  MenuList,
  Divider,
  Avatar,
  Typography,
  Box,
} from '@mui/material';
import styles from './Toolbar.module.css';
import BubbleChatStrokeRounded from '../icons/bubble-chat-stroke-rounded-nav';
import Notification02StrokeRounded from '../icons/notification-02-stroke-rounded';
import ArrowDown01StrokeRounded from '../icons/arrow-down-01-stroke-rounded';
import Setting07StrokeRounded from '../icons/setting-07-stroke-rounded';
import Logout02StrokeRounded from '../icons/logout-02-stroke-rounded';

function Toolbar() {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    handleClose();
    if (action) action();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'user-popover' : undefined;

  return (
    <div className={styles.headerNav}>
      <BubbleChatStrokeRounded />
      <Notification02StrokeRounded />
      <img
        src={user?.photoURL || '/default-avatar.jpg'}
        alt="User Profile"
        className={styles.profilePicture}
        onClick={handleClick}
      />

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 280,
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #588157 0%, #4b6737 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src={user?.photoURL || '/default-avatar.jpg'}
            alt={user?.displayName || 'User'}
            sx={{ width: 48, height: 48, border: '2px solid white' }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.displayName || 'User Name'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <MenuList sx={{ py: 1 }}>
          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => console.log('Profile clicked'))
            }
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span style={{ fontSize: '18px' }}>👤</span>
              <Typography variant="body2">My Profile</Typography>
            </Box>
          </MenuItem>

          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => console.log('Settings clicked'))
            }
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Setting07StrokeRounded
                style={{ width: 18, height: 18, color: '#666', padding: '4px' }}
              />
              <Typography variant="body2">Settings</Typography>
            </Box>
          </MenuItem>

          <MenuItem
            onClick={() =>
              handleMenuItemClick(() => console.log('Help clicked'))
            }
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span style={{ fontSize: '18px' }}>❓</span>
              <Typography variant="body2">Help & Support</Typography>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem
            onClick={() => handleMenuItemClick(logout)}
            sx={{
              py: 1.5,
              px: 2,
              color: '#dc3545',
              '&:hover': {
                backgroundColor: '#fff5f5',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Logout02StrokeRounded
                style={{ width: 18, height: 18, color: '#dc3545' }}
              />
              <Typography variant="body2">Sign Out</Typography>
            </Box>
          </MenuItem>
        </MenuList>
      </Popover>
    </div>
  );
}

export default Toolbar;
