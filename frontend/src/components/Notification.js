import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

// 自定义 Alert 组件
const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * 通知消息组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const Notification = ({
  open,
  message,
  severity = 'info',
  autoHideDuration = 5000,
  onClose,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
  action,
}) => {
  // 处理关闭事件
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      action={action}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

Notification.propTypes = {
  /**
   * 是否显示通知
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * 通知消息内容
   */
  message: PropTypes.string.isRequired,
  
  /**
   * 通知类型
   */
  severity: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
  
  /**
   * 自动隐藏时间（毫秒）
   */
  autoHideDuration: PropTypes.number,
  
  /**
   * 关闭事件处理函数
   */
  onClose: PropTypes.func,
  
  /**
   * 通知位置
   */
  anchorOrigin: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'center', 'right']),
  }),
  
  /**
   * 自定义操作按钮
   */
  action: PropTypes.node,
};

export default Notification;