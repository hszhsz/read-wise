import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';

/**
 * 加载状态组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const LoadingState = ({
  message = '加载中...',
  variant = 'circular',
  size = 'medium',
  fullPage = false,
  progress = 0,
  showProgress = false,
}) => {
  // 根据大小设置尺寸
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      case 'medium':
      default:
        return 40;
    }
  };

  // 渲染加载指示器
  const renderLoader = () => {
    if (variant === 'linear') {
      return (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress 
            variant={showProgress ? 'determinate' : 'indeterminate'} 
            value={progress} 
          />
        </Box>
      );
    }

    return (
      <CircularProgress 
        size={getSize()} 
        variant={showProgress ? 'determinate' : 'indeterminate'}
        value={progress}
      />
    );
  };

  // 全页面加载样式
  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 9999,
        }}
      >
        {renderLoader()}
        {message && (
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        {showProgress && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {progress}%
          </Typography>
        )}
      </Box>
    );
  }

  // 普通加载样式
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        minHeight: 100,
      }}
    >
      {renderLoader()}
      {message && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
      {showProgress && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {progress}%
        </Typography>
      )}
    </Box>
  );
};

LoadingState.propTypes = {
  /**
   * 加载消息
   */
  message: PropTypes.string,
  
  /**
   * 加载指示器变体
   */
  variant: PropTypes.oneOf(['circular', 'linear']),
  
  /**
   * 加载指示器大小
   */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  /**
   * 是否全页面加载
   */
  fullPage: PropTypes.bool,
  
  /**
   * 加载进度（0-100）
   */
  progress: PropTypes.number,
  
  /**
   * 是否显示进度
   */
  showProgress: PropTypes.bool,
};

export default LoadingState;