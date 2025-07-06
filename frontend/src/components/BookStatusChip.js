import React from 'react';
import PropTypes from 'prop-types';
import { Chip, Tooltip, CircularProgress, Box } from '@mui/material';
import { getBookStatusText, getBookStatusColor, getBookProcessingProgress } from '../utils/bookUtils';

/**
 * 书籍状态标签组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const BookStatusChip = ({ status = 'pending', showProgress = false, book = null, size = 'medium' }) => {
  // 确保状态有效
  const validStatus = status && ['pending', 'processing', 'completed', 'failed'].includes(status) ? status : 'pending';
  const statusText = getBookStatusText(validStatus);
  const statusColor = getBookStatusColor(validStatus);
  const progress = book ? getBookProcessingProgress(book) : 0;
  
  // 处理中状态显示进度
  if (validStatus === 'processing' && showProgress) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Chip
          label={statusText}
          color={statusColor}
          size={size}
          sx={{ mr: 1 }}
        />
        <Tooltip title={`处理进度: ${progress}%`}>
          <CircularProgress 
            variant="determinate" 
            value={progress} 
            size={24} 
            thickness={5}
            color={statusColor}
          />
        </Tooltip>
      </Box>
    );
  }
  
  // 其他状态
  return (
    <Chip
      label={statusText}
      color={statusColor}
      size={size}
    />
  );
};

BookStatusChip.propTypes = {
  /**
   * 书籍处理状态
   */
  status: PropTypes.oneOf(['pending', 'processing', 'completed', 'failed']).isRequired,
  
  /**
   * 是否显示进度
   */
  showProgress: PropTypes.bool,
  
  /**
   * 书籍数据对象（用于获取进度信息）
   */
  book: PropTypes.object,
  
  /**
   * 标签大小
   */
  size: PropTypes.oneOf(['small', 'medium']),
};

export default BookStatusChip;