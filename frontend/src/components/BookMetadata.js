import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import LanguageIcon from '@mui/icons-material/Language';
import BookIcon from '@mui/icons-material/Book';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BookStatusChip from './BookStatusChip';
import { formatDate } from '../utils/dateUtils';
import { formatFileSize, getFileTypeName, extractBookTitle } from '../utils/fileUtils';
import { calculateReadingTime } from '../utils/textUtils';

/**
 * 书籍元数据组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const BookMetadata = ({ book, elevation = 1 }) => {
  // 适配上传中的书籍和已保存的书籍的不同属性名
  const {
    title,
    author,
    file_name,
    file_type,
    file_size,
    created_at,
    status,
    language,
    category,
    page_count,
    word_count,
  } = book;

  // 获取文件名（兼容上传中的书籍）
  const fileName = file_name || book.fileName;
  // 获取文件类型（兼容上传中的书籍）
  const fileType = file_type || book.fileType;
  // 获取文件大小（兼容上传中的书籍）
  const fileSize = file_size || book.fileSize;
  // 获取上传时间（兼容上传中的书籍）
  const uploadDate = created_at || book.upload_date || new Date().toISOString();
  // 获取书籍标题（优先使用设置的标题，其次使用extractBookTitle函数提取文件名中的标题，最后使用默认值）
  const bookTitle = title || (fileName && extractBookTitle(fileName)) || '未命名书籍';

  // 处理复制内容
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // 渲染元数据项
  const renderMetadataItem = (icon, label, value, copyable = false) => {
    if (!value) return null;

    return (
      <Grid item xs={12} sm={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 1, color: 'text.secondary' }}>
            {icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              {value}
              {copyable && (
                <Tooltip title="复制">
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopy(value)}
                    sx={{ ml: 0.5 }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
          </Box>
        </Box>
      </Grid>
    );
  };

  return (
    <Paper elevation={elevation} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {bookTitle}
          </Typography>
          {author && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              作者: {author}
            </Typography>
          )}
        </Box>
        <BookStatusChip status={status || 'pending'} showProgress book={book} />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={3}>
        {renderMetadataItem(
          <DescriptionIcon fontSize="small" />,
          '文件类型',
          getFileTypeName(fileType)
        )}

        {renderMetadataItem(
          <CalendarTodayIcon fontSize="small" />,
          '上传时间',
          formatDate(uploadDate)
        )}

        {fileSize && renderMetadataItem(
          <DescriptionIcon fontSize="small" />,
          '文件大小',
          formatFileSize(fileSize)
        )}

        {word_count && renderMetadataItem(
          <BookIcon fontSize="small" />,
          '字数',
          `${word_count.toLocaleString()} 字`
        )}

        {word_count && renderMetadataItem(
          <AccessTimeIcon fontSize="small" />,
          '预计阅读时间',
          calculateReadingTime(word_count)
        )}

        {page_count && renderMetadataItem(
          <BookIcon fontSize="small" />,
          '页数',
          `${page_count} 页`
        )}

        {language && renderMetadataItem(
          <LanguageIcon fontSize="small" />,
          '语言',
          language
        )}

        {category && renderMetadataItem(
          <CategoryIcon fontSize="small" />,
          '分类',
          <Chip label={category} size="small" />
        )}

        {fileName && renderMetadataItem(
          <DescriptionIcon fontSize="small" />,
          '文件名',
          fileName,
          true
        )}
      </Grid>
    </Paper>
  );
};

BookMetadata.propTypes = {
  /**
   * 书籍数据
   */
  book: PropTypes.shape({
    title: PropTypes.string,
    author: PropTypes.string,
    file_name: PropTypes.string,
    fileName: PropTypes.string,  // 上传中的书籍使用的属性名
    file_type: PropTypes.string,
    fileType: PropTypes.string,  // 上传中的书籍使用的属性名
    file_size: PropTypes.number,
    fileSize: PropTypes.number,  // 上传中的书籍使用的属性名
    created_at: PropTypes.string,
    upload_date: PropTypes.string,  // 上传中的书籍使用的属性名
    status: PropTypes.string.isRequired,
    language: PropTypes.string,
    category: PropTypes.string,
    page_count: PropTypes.number,
    word_count: PropTypes.number,
  }).isRequired,
  
  /**
   * 卡片阴影深度
   */
  elevation: PropTypes.number,
};

export default BookMetadata;