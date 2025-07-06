import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { BookList, EmptyState, LoadingState, PageHeader, SearchFilterBar } from '../components';
import { getBooks } from '../services/api';
import { useAppContext } from '../context/AppContext';

const BooksPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useAppContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchParams, setSearchParams] = useState({
    search: '',
    status: '',
    sort: 'created_at_desc',
  });

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);

    try {
      const { search, status, sort } = searchParams;
      const [sortField, sortOrder] = sort.split('_');

      const response = await getBooks({
        page,
        limit: 9,
        search,
        status,
        sort_by: sortField,
        sort_order: sortOrder,
      });

      setBooks(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
      setTotalBooks(response.data.total || 0);
    } catch (err) {
      console.error('获取书籍失败:', err);
      setError(err.message || '获取书籍数据失败');
      addNotification({
        message: '无法加载书籍列表',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, searchParams]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearchChange = (newParams) => {
    setSearchParams(newParams);
    setPage(1); // 重置到第一页
  };

  const handleRefresh = () => {
    fetchBooks();
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="我的书籍"
        subtitle={`共 ${totalBooks} 本书籍`}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/upload')}
          >
            上传新书籍
          </Button>
        }
      />

      <SearchFilterBar
        onSearchChange={handleSearchChange}
        initialValues={searchParams}
      />

      <Box sx={{ mt: 3, mb: 4 }}>
        {loading ? (
          <LoadingState message="加载书籍中..." />
        ) : error ? (
          <EmptyState
            title="加载失败"
            description={`无法加载书籍: ${error}`}
            actionText="重试"
            onAction={handleRefresh}
          />
        ) : books.length === 0 ? (
          <EmptyState
            title="暂无书籍"
            description={searchParams.search || searchParams.status ? '没有找到符合条件的书籍' : '您还没有上传任何书籍'}
            actionText={searchParams.search || searchParams.status ? '清除筛选' : '上传第一本书'}
            onAction={() => {
              if (searchParams.search || searchParams.status) {
                handleSearchChange({ search: '', status: '', sort: 'created_at_desc' });
              } else {
                navigate('/upload');
              }
            }}
          />
        ) : (
          <>
            <BookList books={books} onRefresh={handleRefresh} />
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                  showFirstButton 
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default BooksPage;