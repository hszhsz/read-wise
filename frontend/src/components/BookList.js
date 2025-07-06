import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Box, Typography, Pagination } from '@mui/material';
import BookCard from './BookCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * 书籍列表组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const BookList = ({
  books = [],
  loading = false,
  error = null,
  onDelete,
  onDownload,
  emptyStateProps = {},
  pagination = null,
  onPageChange,
}) => {
  // 加载状态
  if (loading) {
    return <LoadingState message="加载书籍列表中..." />;
  }

  // 错误状态
  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={`无法加载书籍列表: ${error}`}
        icon={<MenuBookIcon fontSize="large" />}
        actionText="重试"
        onActionClick={emptyStateProps.onRetry}
        {...emptyStateProps}
      />
    );
  }

  // 空状态
  if (!books || books.length === 0) {
    return (
      <EmptyState
        title="暂无书籍"
        description="您还没有上传任何书籍，点击下方按钮上传您的第一本书籍。"
        icon={<MenuBookIcon fontSize="large" />}
        actionText="上传书籍"
        actionLink="/upload"
        {...emptyStateProps}
      />
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
            <BookCard
              book={book}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          </Grid>
        ))}
      </Grid>

      {/* 分页 */}
      {pagination && pagination.total_pages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 4,
            mb: 2,
          }}
        >
          <Pagination
            count={pagination.total_pages}
            page={pagination.current_page}
            onChange={onPageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            共 {pagination.total_items} 本书籍
          </Typography>
        </Box>
      )}
    </Box>
  );
};

BookList.propTypes = {
  /**
   * 书籍数据列表
   */
  books: PropTypes.array,
  
  /**
   * 是否加载中
   */
  loading: PropTypes.bool,
  
  /**
   * 错误信息
   */
  error: PropTypes.string,
  
  /**
   * 删除回调函数
   */
  onDelete: PropTypes.func,
  
  /**
   * 下载回调函数
   */
  onDownload: PropTypes.func,
  
  /**
   * 空状态组件属性
   */
  emptyStateProps: PropTypes.object,
  
  /**
   * 分页信息
   */
  pagination: PropTypes.shape({
    current_page: PropTypes.number.isRequired,
    total_pages: PropTypes.number.isRequired,
    total_items: PropTypes.number.isRequired,
    page_size: PropTypes.number.isRequired,
  }),
  
  /**
   * 页码变化回调函数
   */
  onPageChange: PropTypes.func,
};

export default BookList;