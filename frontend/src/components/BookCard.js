import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Tooltip,
  CardActionArea,
  Divider,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import BookStatusChip from './BookStatusChip';
import { formatDate, getRelativeTime } from '../utils/dateUtils';
import { truncateText } from '../utils/textUtils';
import { getBookDetailRoute } from '../utils/routeUtils';
import { getFileExtension, getFileTypeName, extractBookTitle } from '../utils/fileUtils';
import { isBookProcessingComplete } from '../utils/bookUtils';

/**
 * 书籍卡片组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const BookCard = ({
  book,
  onDelete,
  onDownload,
  elevation = 1,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const {
    id,
    title,
    author,
    file_name,
    file_type,
    created_at,
    status,
    summary,
  } = book;

  // 处理卡片点击
  const handleCardClick = () => {
    navigate(getBookDetailRoute(id));
  };

  // 处理删除点击
  const handleDeleteClick = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(book);
    }
  };

  // 处理下载点击
  const handleDownloadClick = (event) => {
    event.stopPropagation();
    if (onDownload) {
      onDownload(book);
    }
  };

  // 获取文件类型
  const fileType = file_type || getFileExtension(file_name);
  const fileTypeName = getFileTypeName(fileType);

  return (
    <Card 
      elevation={elevation} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardActionArea onClick={handleCardClick} sx={{ flexGrow: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <BookStatusChip status={status} />
            <Typography variant="caption" color="text.secondary">
              {getRelativeTime(created_at)}
            </Typography>
          </Box>

          <Typography variant="h6" component="div" gutterBottom noWrap>
            {title || (file_name && extractBookTitle(file_name)) || '未命名书籍'}
          </Typography>

          {author && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              作者: {author}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DescriptionIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {fileTypeName}
            </Typography>
          </Box>

          {summary && isBookProcessingComplete(status) && (
            <Typography variant="body2" color="text.secondary">
              {truncateText(summary, 100)}
            </Typography>
          )}

          {!isBookProcessingComplete(status) && (
            <Typography variant="body2" color="text.secondary">
              {status === 'pending' ? '等待处理...' : status === 'processing' ? '正在处理中...' : '处理失败'}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>

      {showActions && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(created_at)}
            </Typography>
            <Box>
              <Tooltip title="查看详情">
                <IconButton size="small" onClick={handleCardClick}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {isBookProcessingComplete(status) && (
                <Tooltip title="下载分析结果">
                  <IconButton size="small" onClick={handleDownloadClick}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="删除">
                <IconButton size="small" onClick={handleDeleteClick}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardActions>
        </>
      )}
    </Card>
  );
};

BookCard.propTypes = {
  /**
   * 书籍数据
   */
  book: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    author: PropTypes.string,
    file_name: PropTypes.string,
    file_type: PropTypes.string,
    created_at: PropTypes.string,
    status: PropTypes.string.isRequired,
    summary: PropTypes.string,
  }).isRequired,
  
  /**
   * 删除回调函数
   */
  onDelete: PropTypes.func,
  
  /**
   * 下载回调函数
   */
  onDownload: PropTypes.func,
  
  /**
   * 卡片阴影深度
   */
  elevation: PropTypes.number,
  
  /**
   * 是否显示操作按钮
   */
  showActions: PropTypes.bool,
};

export default BookCard;