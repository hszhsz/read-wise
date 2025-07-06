import React from 'react';
import { Box, Container, Typography, Link, Divider, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * 页脚组件
 * @returns {JSX.Element} 组件
 */
const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* 左侧版权信息 */}
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="body2" color="text.secondary">
              © {currentYear} ReadWise. 保留所有权利。
            </Typography>
          </Box>
          
          {/* 右侧链接 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Link component={RouterLink} to="/" color="inherit" underline="hover">
              <Typography variant="body2">首页</Typography>
            </Link>
            
            <Link component={RouterLink} to="/books" color="inherit" underline="hover">
              <Typography variant="body2">我的书籍</Typography>
            </Link>
            
            <Link component={RouterLink} to="/upload" color="inherit" underline="hover">
              <Typography variant="body2">上传书籍</Typography>
            </Link>
            
            <Link component={RouterLink} to="/about" color="inherit" underline="hover">
              <Typography variant="body2">关于我们</Typography>
            </Link>
            
            <Link component={RouterLink} to="/privacy" color="inherit" underline="hover">
              <Typography variant="body2">隐私政策</Typography>
            </Link>
            
            <Link component={RouterLink} to="/terms" color="inherit" underline="hover">
              <Typography variant="body2">使用条款</Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;