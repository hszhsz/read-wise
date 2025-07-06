import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getBooks } from '../services/api';
import { useAppContext } from '../context/AppContext';

// 状态颜色映射
const statusColors = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
};

// 状态文本映射
const statusText = {
  pending: '等待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '处理失败',
};

const BookListPage = () => {
  const navigate = useNavigate();
  const { uploadingBook } = useAppContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);

  const limit = 9; // 每页显示的书籍数量

  useEffect(() => {
    fetchBooks();
  }, [page]);

  useEffect(() => {
    // 根据搜索词过滤书籍
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, books]);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getBooks({
        page: page,
        limit: limit
      });
      setBooks(response.data.data || []);
      setFilteredBooks(response.data.data || []);
      
      // 使用API返回的总页数
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error('获取书籍列表失败:', err);
      setError('获取书籍列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleViewBook = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  const handleViewUploadingBook = () => {
    if (uploadingBook && uploadingBook.book_id) {
      navigate(`/books/${uploadingBook.book_id}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 渲染正在上传的书籍卡片
  const renderUploadingBookCard = () => {
    if (!uploadingBook) return null;

    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px dashed', borderColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CloudUploadIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" color="primary">
            正在上传/处理的书籍
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {uploadingBook.title || (uploadingBook.fileName && uploadingBook.fileName.split('.')[0]) || '未命名书籍'}
              </Typography>
              {uploadingBook.author && (
                <Typography variant="body2" color="text.secondary">
                  作者: {uploadingBook.author}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                文件: {uploadingBook.fileName} ({(uploadingBook.fileSize / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            </Box>

            {uploadingBook.status === 'processing' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  处理进度: {Math.round(uploadingBook.processingProgress || 0)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadingBook.processingProgress || 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                状态:
              </Typography>
              <Chip
                label={statusText[uploadingBook.status] || uploadingBook.status}
                color={statusColors[uploadingBook.status] || 'default'}
                size="small"
              />
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={handleViewUploadingBook}
            >
              查看详情
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          我的书籍
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/upload')}
        >
          上传新书籍
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 显示正在上传的书籍 */}
      {renderUploadingBookCard()}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="搜索书籍标题或作者"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredBooks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? '没有找到匹配的书籍' : '您还没有上传任何书籍'}
          </Typography>
          {searchTerm ? (
            <Button onClick={clearSearch} sx={{ mt: 2 }}>
              清除搜索
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/upload')}
              sx={{ mt: 2 }}
            >
              上传第一本书
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" gutterBottom noWrap sx={{ maxWidth: '70%' }}>
                        {book.title || (book.file_name && book.file_name.split('.')[0]) || '未命名书籍'}
                      </Typography>
                      <Chip
                        label={statusText[book.status] || book.status}
                        color={statusColors[book.status] || 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      作者: {book.author}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        上传时间: {formatDate(book.upload_date)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        文件类型: {book.file_type.toUpperCase().replace('.', '')}
                      </Typography>
                      {book.word_count && (
                        <Typography variant="body2" color="text.secondary">
                          字数: {book.word_count.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewBook(book.id)}
                      disabled={book.status !== 'completed'}
                    >
                      查看分析
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default BookListPage;