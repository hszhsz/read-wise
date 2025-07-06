import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * 空状态组件，用于显示无数据状态
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const EmptyState = ({
  title = '暂无数据',
  description = '没有找到相关数据',
  icon,
  actionText,
  actionLink,
  onActionClick,
  elevation = 0,
  height = 300,
  variant = 'default',
}) => {
  // 根据变体选择样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          py: 3,
          px: 2,
          height: 'auto',
          minHeight: 150,
        };
      case 'fullPage':
        return {
          py: 8,
          px: 3,
          height: 'calc(100vh - 200px)',
          minHeight: 400,
        };
      case 'default':
      default:
        return {
          py: 5,
          px: 3,
          height,
          minHeight: 200,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // 渲染操作按钮
  const renderAction = () => {
    if (!actionText) return null;

    if (actionLink) {
      return (
        <Button
          component={Link}
          to={actionLink}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      );
    }

    if (onActionClick) {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={onActionClick}
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      );
    }

    return null;
  };

  return (
    <Paper 
      elevation={elevation}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        borderRadius: 2,
        ...variantStyles,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 64 }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h5" component="h2" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
        {description}
      </Typography>
      
      {renderAction()}
    </Paper>
  );
};

EmptyState.propTypes = {
  /**
   * 标题
   */
  title: PropTypes.string,
  
  /**
   * 描述文本
   */
  description: PropTypes.string,
  
  /**
   * 图标元素
   */
  icon: PropTypes.node,
  
  /**
   * 操作按钮文本
   */
  actionText: PropTypes.string,
  
  /**
   * 操作按钮链接
   */
  actionLink: PropTypes.string,
  
  /**
   * 操作按钮点击事件处理函数
   */
  onActionClick: PropTypes.func,
  
  /**
   * 卡片阴影深度
   */
  elevation: PropTypes.number,
  
  /**
   * 高度
   */
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  
  /**
   * 变体样式
   */
  variant: PropTypes.oneOf(['default', 'compact', 'fullPage']),
};

export default EmptyState;