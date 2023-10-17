import * as React from 'react';
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import styles from '../styles/Home.module.css';

const pages = ['Home 🏠', 'Chat 💬', 'Workspaces 🖥️', 'Saved 💾', 'Profile 👤', 'Exit ⏏️'];

const ResponsiveAppBar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);

  const handleOpenHamburgerMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  }

  const handleCloseHamburgerMenu = (event) => {
    if (event.target.innerText === 'Home 🏠') {
      return window.location.href = `/`;
    }
    if (event.target.innerText === 'Chat 💬') {
      return window.location.href = `/chat`;
    } 
    if (event.target.innerText === 'Workspaces 🖥️') {
      return window.location.href = `/workspaces/home`;
    }
    if (event.target.innerText === 'Saved 💾') {
      return window.location.href = `/workspaces/play-ground`;
    }
    if (event.target.innerText === 'Profile 👤') {
      return window.location.href = `/profile`;
    }
    if (event.target.innerText === 'Exit ⏏️') {
      return window.location.href = `/api/auth/signout`;
    }
    if (event.target.innerHTML[0] === '<') {
      return window.location.href = `/`;
    } else {
      window.location.href = `/${event.target.innerHTML}`;
      return setAnchorElNav(null);
    }
  }

  const handleCloseNavMenu = (event) => {
    if (event.target.innerText === 'HOME 🏠') {
      return window.location.href = `/`;
    }
    if (event.target.innerText === 'CHAT 💬') {
      return window.location.href = `/chat`;
    }
    if (event.target.innerText === 'WORKSPACES 🖥️') {
      return window.location.href = `/workspaces/home`;
    }
    if (event.target.innerText === 'SAVED 💾') {
      return window.location.href = `/workspaces/6619e718-2af9-4cd6-819b-fe06c4c849ad`;
    }
    if (event.target.innerText === 'PROFILE 👤') {
      return window.location.href = `/profile`;
    }
    if (event.target.innerText === 'EXIT ⏏️') {
      return window.location.href = `/api/auth/signout`;
    }

    let url = event.target.innerText[0] + event.target.innerText.slice(1).toLowerCase();
    if (url === 'undefined') {
      window.location.href = `/`;
    } else if (url[0] === '<') {
      window.location.href = `/`;
    } else {
      window.location.href = `/${url}`;
      setAnchorElNav(null);
    }
  };

  return (
    <AppBar position="fixed"
    className={styles.AppBar}
    sx={{ borderBottom: "1px solid white", height: "70px" }}
    >
      <Container maxWidth="l">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          > 
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenHamburgerMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {/* Hamburger Navigation Menu */}
              {pages.map((page) => (
                <MenuItem key={page} onClick={handleCloseHamburgerMenu}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href={`/`}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
          </Typography>
          {/* Main Navigation Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page}
                onClick={handleCloseNavMenu}
                sx={{ my: 1, color: 'white', display: 'block', mx: 12 }}
              >
                {page}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
export default ResponsiveAppBar;



