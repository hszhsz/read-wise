import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  TextField,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { uploadBook } from '../services/api';

// 支持的文件类型
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/epub+zip': ['.epub'],
  'application/x-mobipocket-ebook': ['.mobi'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const FileUploader = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    // 重置状态
    setError('');
    setSuccess(false);
    setUploadProgress(0);
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // 尝试从文件名中提取标题和作者（如果未手动输入）
      if (!bookTitle) {
        const fileName = file.name.split('.')[0];
        setBookTitle(fileName);
      }
    }
  }, [bookTitle]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setError('');
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // 添加元数据
      if (bookTitle) formData.append('title', bookTitle);
      if (bookAuthor) formData.append('author', bookAuthor);
      
      const response = await uploadBook(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
      
      setSuccess(true);
      setSelectedFile(null);
      setBookTitle('');
      setBookAuthor('');
      
      // 通知父组件上传成功
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error('上传失败:', err);
      setError(err.response?.data?.detail || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeColor = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '#f44336'; // 红色
      case 'epub':
        return '#2196f3'; // 蓝色
      case 'mobi':
        return '#ff9800'; // 橙色
      case 'txt':
        return '#4caf50'; // 绿色
      case 'docx':
        return '#9c27b0'; // 紫色
      default:
        return '#757575'; // 灰色
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          文件上传成功！系统正在处理您的书籍，请稍候查看分析结果。
        </Alert>
      )}
      
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        {isDragActive ? (
          <Typography variant="h6" color="primary">
            释放文件以上传
          </Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              拖放文件到此处，或点击选择文件
            </Typography>
            <Typography variant="body2" color="text.secondary">
              支持的格式: PDF, EPUB, MOBI, TXT, DOCX (最大 50MB)
            </Typography>
          </>
        )}
        
        {isDragReject && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            不支持的文件类型，请上传PDF、EPUB、MOBI、TXT或DOCX文件
          </Typography>
        )}
      </Paper>
      
      {selectedFile && (
        <Box sx={{ mt: 2 }}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <InsertDriveFileIcon sx={{ color: getFileTypeColor(selectedFile.name), mr: 1 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
            <Chip
              label={selectedFile.type.split('/')[1].toUpperCase()}
              size="small"
              sx={{ backgroundColor: getFileTypeColor(selectedFile.name), color: 'white' }}
            />
          </Paper>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="书籍标题"
                variant="outlined"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                disabled={uploading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="作者"
                variant="outlined"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                disabled={uploading}
              />
            </Grid>
          </Grid>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress}%
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {uploading ? '上传中...' : '上传并分析'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;