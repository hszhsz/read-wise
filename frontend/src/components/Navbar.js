import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ThemeToggle from './ThemeToggle';
import { NAV_ITEMS } from '../utils/constants';
import { isRouteActive } from '../utils/routeUtils';

/**
 * 导航栏组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const Navbar = ({ onThemeToggle }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 处理抽屉开关
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // 渲染导航链接
  const renderNavLinks = () => {
    return NAV_ITEMS.map((item) => {
      const active = isRouteActive(location.pathname, item.path);

      return (
        <Button
          key={item.path}
          component={RouterLink}
          to={item.path}
          color="inherit"
          sx={{
            mx: 1,
            fontWeight: active ? 'bold' : 'normal',
            borderBottom: active ? `2px solid ${theme.palette.primary.main}` : 'none',
            borderRadius: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          startIcon={item.icon}
        >
          {item.label}
        </Button>
      );
    });
  };

  // 渲染移动端抽屉
  const renderDrawer = () => {
    return (
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <AutoStoriesIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              ReadWise
            </Typography>
          </Box>
          <Divider />
          <List>
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(location.pathname, item.path);

              return (
                <ListItem
                  key={item.path}
                  button
                  component={RouterLink}
                  to={item.path}
                  selected={active}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    );
  };

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* 左侧Logo和标题 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <AutoStoriesIcon sx={{ mr: 1 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                ReadWise
              </Typography>
            </RouterLink>
          </Box>

          {/* 中间导航链接 */}
          {!isMobile && (
            <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
              {renderNavLinks()}
            </Box>
          )}

          {/* 右侧操作按钮 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle onClick={onThemeToggle} />
          </Box>
        </Toolbar>
      </Container>

      {/* 移动端抽屉 */}
      {renderDrawer()}
    </AppBar>
  );
};

Navbar.propTypes = {
  /**
   * 主题切换回调函数
   */
  onThemeToggle: PropTypes.func.isRequired,
};

export default Navbar;