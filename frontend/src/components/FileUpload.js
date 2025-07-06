import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  getFileExtension, 
  isFileTypeSupported, 
  formatFileSize,
  getFileTypeName,
} from '../utils/fileUtils';
import { getApiBaseUrl, getMaxUploadSize, getSupportedFileTypes } from '../utils/env';

/**
 * 文件上传组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const FileUpload = ({
  onFileSelect,
  onFileRemove,
  multiple = false,
  accept = getSupportedFileTypes().join(','),
  maxSize = getMaxUploadSize(),
  uploading = false,
  uploadProgress = 0,
  selectedFiles = [],
  error = '',
  helperText = '支持的文件类型：PDF、EPUB、TXT、DOCX、MD',
  variant = 'default',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (event) => {
    const files = event.target.files || (event.dataTransfer && event.dataTransfer.files);
    if (!files || files.length === 0) return;

    const validFiles = [];
    const invalidFiles = [];

    Array.from(files).forEach(file => {
      const fileExt = getFileExtension(file.name);
      const isSupported = isFileTypeSupported(fileExt);
      const isValidSize = file.size <= maxSize;

      if (isSupported && isValidSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          error: !isSupported ? '不支持的文件类型' : '文件大小超过限制'
        });
      }
    });

    if (validFiles.length > 0) {
      onFileSelect(multiple ? validFiles : [validFiles[0]]);
    }

    // 重置文件输入，以便可以再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖放事件
  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 处理拖放释放
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFileSelect(event);
  };

  // 处理按钮点击
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // 渲染文件列表
  const renderFileList = () => {
    if (selectedFiles.length === 0) return null;

    return (
      <List sx={{ width: '100%', mt: 2 }}>
        {selectedFiles.map((file, index) => (
          <ListItem
            key={`${file.name}-${index}`}
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete" 
                onClick={() => onFileRemove(file)}
                disabled={uploading}
              >
                <DeleteIcon />
              </IconButton>
            }
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
            }}
          >
            <ListItemIcon>
              <AttachFileIcon />
            </ListItemIcon>
            <ListItemText
              primary={file.name}
              secondary={`${getFileTypeName(getFileExtension(file.name))} · ${formatFileSize(file.size)}`}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  // 紧凑型上传区域
  if (variant === 'compact') {
    return (
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={handleButtonClick}
            disabled={uploading}
          >
            选择文件
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Typography variant="body2" color="text.secondary">
            {helperText}
          </Typography>
        </Box>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            <ErrorIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {error}
          </Typography>
        )}

        {renderFileList()}

        {uploading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} variant="determinate" value={uploadProgress} />
            <Typography variant="body2">
              上传中... {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // 默认上传区域
  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleButtonClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} variant="determinate" value={uploadProgress} />
            <Typography variant="body1">
              上传中... {uploadProgress}%
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {dragActive ? '释放文件以上传' : '拖放文件或点击上传'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {helperText}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              startIcon={<CloudUploadIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              选择文件
            </Button>
          </>
        )}
      </Paper>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          <ErrorIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          {error}
        </Typography>
      )}

      {renderFileList()}
    </Box>
  );
};

FileUpload.propTypes = {
  /**
   * 文件选择回调函数
   */
  onFileSelect: PropTypes.func.isRequired,
  
  /**
   * 文件移除回调函数
   */
  onFileRemove: PropTypes.func.isRequired,
  
  /**
   * 是否允许多文件上传
   */
  multiple: PropTypes.bool,
  
  /**
   * 接受的文件类型
   */
  accept: PropTypes.string,
  
  /**
   * 最大文件大小（字节）
   */
  maxSize: PropTypes.number,
  
  /**
   * 是否正在上传
   */
  uploading: PropTypes.bool,
  
  /**
   * 上传进度（0-100）
   */
  uploadProgress: PropTypes.number,
  
  /**
   * 已选择的文件列表
   */
  selectedFiles: PropTypes.array,
  
  /**
   * 错误信息
   */
  error: PropTypes.string,
  
  /**
   * 帮助文本
   */
  helperText: PropTypes.string,
  
  /**
   * 组件变体
   */
  variant: PropTypes.oneOf(['default', 'compact']),
};

export default FileUpload;