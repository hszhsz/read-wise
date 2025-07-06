import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

/**
 * 主题切换按钮组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const ThemeToggle = ({ onClick, size = 'medium', tooltip = true }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const button = (
    <IconButton
      onClick={onClick}
      color="inherit"
      size={size}
      aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

ThemeToggle.propTypes = {
  /**
   * 点击事件处理函数
   */
  onClick: PropTypes.func.isRequired,
  
  /**
   * 按钮大小
   */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  /**
   * 是否显示提示文本
   */
  tooltip: PropTypes.bool,
};

export default ThemeToggle;