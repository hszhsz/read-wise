import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  LinearProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { 
  BookMetadata, 
  BookAnalysisTabs, 
  LoadingState, 
  EmptyState, 
  ConfirmDialog,
  PageHeader,
  BookStatusChip
} from '../components';
import { extractBookTitle } from '../utils/fileUtils';
import { getBook, getBookAnalysis, deleteBook } from '../services/api';
import { useAppContext } from '../context/AppContext';

const BookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { addNotification, addRecentBook, uploadingBook } = useAppContext();
  
  const [book, setBook] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 检查当前查看的书籍是否是正在上传的书籍
  const isUploadingBook = uploadingBook && uploadingBook.book_id === bookId;

  const fetchBookDetails = async () => {
    // 如果是正在上传的书籍，直接使用 uploadingBook 数据
    if (isUploadingBook) {
      // 确保 uploadingBook 有正确的状态
      const processedBook = {
        ...uploadingBook,
        // 确保状态字段存在且有效
        status: uploadingBook.status || 'processing',
        // 确保文件名字段存在
        file_name: uploadingBook.fileName || uploadingBook.file_name,
        // 确保标题字段存在
        title: uploadingBook.title || (uploadingBook.file_name && extractBookTitle(uploadingBook.file_name)) || (uploadingBook.fileName && extractBookTitle(uploadingBook.fileName)) || '未命名书籍'
      };
      setBook(processedBook);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 检查 bookId 是否存在
      if (!bookId) {
        throw new Error('书籍ID不存在，无法获取书籍详情');
      }
      
      const bookData = await getBook(bookId);
      // 确保书籍数据有正确的状态和标题
      const processedBookData = {
        ...bookData,
        // 确保状态字段存在且有效
        status: bookData.status || 'pending',
        // 确保标题字段存在
        title: bookData.title || (bookData.file_name && extractBookTitle(bookData.file_name)) || (bookData.fileName && extractBookTitle(bookData.fileName)) || '未命名书籍'
      };
      setBook(processedBookData);
      
      // 如果书籍状态为已完成，同时设置分析数据
      if (processedBookData && processedBookData.status === 'completed') {
        setAnalysis(processedBookData);
      }
      
      // 添加到最近查看的书籍
      if (processedBookData) {
        addRecentBook(processedBookData);
      }
    } catch (err) {
      console.error('获取书籍详情失败:', err);
      setError(err.message || '获取书籍详情失败');
      addNotification({
        message: '无法加载书籍详情',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [bookId, isUploadingBook, uploadingBook]);

  const handleDeleteBook = async () => {
    setDeleteLoading(true);

    try {
      await deleteBook(bookId);
      addNotification({
        message: '书籍已成功删除',
        severity: 'success',
      });
      navigate('/books');
    } catch (err) {
      console.error('删除书籍失败:', err);
      addNotification({
        message: '删除书籍失败: ' + (err.message || '未知错误'),
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // 渲染正在上传/处理中的书籍状态
  const renderUploadingBookStatus = () => {
    if (!isUploadingBook) return null;
    
    // 确保状态有效
    const status = uploadingBook.status || 'processing';
    const processingProgress = uploadingBook.processingProgress || 0;
    
    return (
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px dashed', borderColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" color="primary">
            书籍正在处理中
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          该书籍正在上传或处理中，完成后将显示完整分析结果。
        </Alert>
        
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">
              处理进度: {Math.round(processingProgress)}%
            </Typography>
            <BookStatusChip status={status} />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={processingProgress} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return <LoadingState message="加载书籍详情中..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={`无法加载书籍详情: ${error}`}
        actionText="返回书籍列表"
        onAction={() => navigate('/books')}
      />
    );
  }

  if (!book) {
    return (
      <EmptyState
        title="未找到书籍"
        description="该书籍可能已被删除或不存在"
        actionText="返回书籍列表"
        onAction={() => navigate('/books')}
      />
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink 
            component="button" 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate('/books')}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <ArrowBackIcon sx={{ mr: 0.5, fontSize: 18 }} />
            所有书籍
          </MuiLink>
          <Typography color="text.primary">{book.title || (book.file_name && book.file_name.split('.')[0]) || (book.fileName && book.fileName.split('.')[0]) || '未命名书籍'}</Typography>
        </Breadcrumbs>

        <PageHeader
          title={book.title || (book.file_name && book.file_name.split('.')[0]) || (book.fileName && book.fileName.split('.')[0]) || '未命名书籍'}
          subtitle={book.author ? `作者: ${book.author}` : '未知作者'}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isUploadingBook && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={!book.download_url}
                    onClick={() => window.open(book.download_url, '_blank')}
                  >
                    下载
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    删除
                  </Button>
                </>
              )}
            </Box>
          }
        />
      </Box>

      {/* 显示正在上传/处理中的状态 */}
      {renderUploadingBookStatus()}

      <Grid container spacing={3}>
        {/* 书籍元数据 */}
        <Grid item xs={12} md={4}>
          <BookMetadata book={book} />
        </Grid>

        {/* 书籍分析结果 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            {isUploadingBook ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                书籍处理完成后将在此显示分析结果
              </Typography>
            ) : (
              <BookAnalysisTabs 
                book={book} 
                analysis={analysis} 
                loading={false} 
                error={null} 
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="删除书籍"
        content={`确定要删除《${book.title || (book.file_name && book.file_name.split('.')[0]) || (book.fileName && book.fileName.split('.')[0]) || '未命名书籍'}》吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        confirmColor="error"
        loading={deleteLoading}
        onConfirm={handleDeleteBook}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  );
};

export default BookDetailPage;