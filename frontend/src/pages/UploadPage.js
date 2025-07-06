import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  CircularProgress,
  Alert,
  Container,
  LinearProgress,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { FileUpload, PageHeader, BookStatusChip } from '../components';
import { uploadBook, pollBookStatus } from '../services/api';
import { useAppContext } from '../context/AppContext';

const steps = ['选择文件', '上传文件', '处理分析', '查看结果'];

const UploadPage = () => {
  const navigate = useNavigate();
  const { addNotification, setUploadingBookData, clearUploadingBook } = useAppContext();
  const [activeStep, setActiveStep] = useState(0);
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);

  // 组件卸载时清除上传中的书籍
  useEffect(() => {
    return () => {
      // 如果书籍已完成处理，则不清除
      if (bookData && bookData.status === 'completed') return;
      clearUploadingBook();
    };
  }, [clearUploadingBook, bookData]);

  const handleFileSelect = (files) => {
    setSelectedFiles(files);
    if (files.length > 0) {
      setActiveStep(1);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择文件');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0]);

      const response = await uploadBook(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      const bookDataWithFile = {
        ...response.data,
        fileName: selectedFiles[0].name,
        fileSize: selectedFiles[0].size,
        fileType: selectedFiles[0].type,
        uploadProgress: 100,
        processingProgress: 0
      };

      setBookData(bookDataWithFile);
      // 将上传中的书籍信息存储到 AppContext 中
      setUploadingBookData(bookDataWithFile);
      setActiveStep(2);
      addNotification({
        message: '文件上传成功，正在处理中...',
        severity: 'success',
      });
      checkBookStatus(response.data.book_id);
    } catch (err) {
      console.error('上传失败:', err);
      setError(err.message || '上传失败，请稍后再试');
      addNotification({
        message: '文件上传失败',
        severity: 'error',
      });
      clearUploadingBook();
    } finally {
      setLoading(false);
    }
  };

  const checkBookStatus = async (bookId) => {
    setLoading(true);
    setError('');

    try {
      // 检查 bookId 是否存在
      if (!bookId) {
        throw new Error('书籍ID不存在，无法获取处理状态');
      }
      
      // 轮询检查书籍处理状态
      await pollBookStatus(bookId, (status, progress) => {
        // 更新处理进度
        setProcessingProgress(progress || 0);
        
        // 更新书籍状态
        const updatedBookData = {
          ...bookData,
          status: status,
          processingProgress: progress || 0
        };
        
        setBookData(updatedBookData);
        
        // 同时更新 AppContext 中的上传中书籍信息
        setUploadingBookData(updatedBookData);
        
        // 如果处理完成，进入下一步
        if (status === 'completed') {
          setActiveStep(3);
          addNotification({
            message: '书籍处理完成！',
            severity: 'success',
          });
        } else if (status === 'failed') {
          setError('书籍处理失败');
          addNotification({
            message: '书籍处理失败',
            severity: 'error',
          });
          clearUploadingBook();
        }
      });
    } catch (err) {
      console.error('检查状态失败:', err);
      setError(err.message || '处理失败，请稍后再试');
      addNotification({
        message: err.message || '书籍处理失败',
        severity: 'error',
      });
      clearUploadingBook();
    } finally {
      setLoading(false);
    }
  };
  
  // 模拟处理进度增加
  useEffect(() => {
    let interval;
    if (activeStep === 2 && processingProgress < 95) {
      interval = setInterval(() => {
        setProcessingProgress((prev) => {
          // 缓慢增加进度，但不超过95%
          const increment = Math.random() * 2;
          return Math.min(prev + increment, 95);
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeStep, processingProgress]);

  const handleViewResult = () => {
    if (bookData && bookData.book_id) {
      navigate(`/books/${bookData.book_id}`);
    } else {
      addNotification({
        message: '无法查看结果：书籍ID不存在',
        severity: 'error',
      });
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setBookData(null);
    setError('');
    clearUploadingBook();
  };

  return (
    <Container maxWidth="md">
      <PageHeader 
        title="上传电子书" 
        subtitle="上传您的电子书，我们将使用大语言模型为您分析书籍内容，生成重点总结、作者背景和阅读推荐。"
      />

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        {activeStep === 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              选择文件上传
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              支持的格式: PDF, EPUB, MOBI, TXT, DOCX (最大 50MB)
            </Typography>
            <FileUpload 
              onFileSelect={handleFileSelect}
              onFileRemove={() => setSelectedFiles([])}
              accept=".pdf,.epub,.mobi,.txt,.docx"
              maxSize={50 * 1024 * 1024} // 50MB
              multiple={false}
              selectedFiles={selectedFiles}
            />
          </>
        )}

        {activeStep === 1 && (
          <Box sx={{ py: 4 }}>
            <Typography variant="h6" gutterBottom>
              准备上传
            </Typography>
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  已选择文件: {selectedFiles[0].name} ({(selectedFiles[0].size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
            
            {loading && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  上传进度: {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={loading || selectedFiles.length === 0}
              >
                {loading ? '上传中...' : '开始上传'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                disabled={loading}
              >
                重新选择
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="h6">
                正在处理您的书籍
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              这可能需要几分钟时间，请耐心等待...
            </Typography>
            
            <Box sx={{ width: '100%', mb: 3, mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                处理进度: {Math.round(processingProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={processingProgress} />
            </Box>
            
            {bookData && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  书籍信息:
                </Typography>
                <Typography variant="body2">
                  书籍ID: {bookData.book_id}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    状态:
                  </Typography>
                  <BookStatusChip 
                    status={bookData && bookData.status && ['pending', 'processing', 'completed', 'failed'].includes(bookData.status) 
                      ? bookData.status 
                      : 'processing'} 
                    showProgress 
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              处理完成！
            </Typography>
            <Typography variant="body1" paragraph>
              您的书籍已成功分析，现在可以查看详细的分析结果。
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleViewResult}
              sx={{ mt: 2 }}
            >
              查看分析结果
            </Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 4 }}>
        {activeStep > 0 && (
          <Button 
            onClick={handleReset} 
            disabled={loading && activeStep < 3}
            variant="text"
            color="inherit"
          >
            重新上传
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default UploadPage;