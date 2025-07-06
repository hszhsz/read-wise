import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * 确认对话框组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const ConfirmDialog = ({
  open,
  title = '确认操作',
  content = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  confirmColor = 'primary',
  cancelColor = 'inherit',
  maxWidth = 'sm',
  fullWidth = true,
  icon,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
}) => {
  // 处理点击背景关闭
  const handleBackdropClick = (event) => {
    if (disableBackdropClick) {
      event.stopPropagation();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onBackdropClick={handleBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        <Box display="flex" alignItems="center">
          {icon && (
            <Box mr={1} display="flex" alignItems="center">
              {icon}
            </Box>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={onCancel}
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color={cancelColor}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmDialog.propTypes = {
  /**
   * 对话框是否打开
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * 对话框标题
   */
  title: PropTypes.node,
  
  /**
   * 对话框内容
   */
  content: PropTypes.node,
  
  /**
   * 确认按钮文本
   */
  confirmText: PropTypes.string,
  
  /**
   * 取消按钮文本
   */
  cancelText: PropTypes.string,
  
  /**
   * 确认按钮点击事件处理函数
   */
  onConfirm: PropTypes.func.isRequired,
  
  /**
   * 取消按钮点击事件处理函数
   */
  onCancel: PropTypes.func.isRequired,
  
  /**
   * 确认按钮颜色
   */
  confirmColor: PropTypes.string,
  
  /**
   * 取消按钮颜色
   */
  cancelColor: PropTypes.string,
  
  /**
   * 对话框最大宽度
   */
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  
  /**
   * 是否全宽
   */
  fullWidth: PropTypes.bool,
  
  /**
   * 图标
   */
  icon: PropTypes.node,
  
  /**
   * 是否禁用点击背景关闭
   */
  disableBackdropClick: PropTypes.bool,
  
  /**
   * 是否禁用ESC键关闭
   */
  disableEscapeKeyDown: PropTypes.bool,
  
  /**
   * 是否显示关闭按钮
   */
  showCloseButton: PropTypes.bool,
};

export default ConfirmDialog;