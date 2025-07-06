import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { useDebounce } from '../utils/hooks';
import { BOOK_STATUS } from '../utils/constants';

/**
 * 搜索和过滤栏组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const SearchFilterBar = ({
  onSearch,
  onFilter,
  onSort,
  initialSearchTerm = '',
  initialStatus = 'all',
  initialSortBy = 'created_at',
  initialSortOrder = 'desc',
  showStatusFilter = true,
  showSortOptions = true,
  elevation = 0,
  variant = 'outlined',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [status, setStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [activeFilters, setActiveFilters] = useState(0);

  // 使用防抖处理搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 监听搜索词变化
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  // 监听过滤条件变化
  useEffect(() => {
    if (onFilter) {
      onFilter({ status });
    }
    
    // 计算活跃过滤器数量
    let count = 0;
    if (status !== 'all') count += 1;
    setActiveFilters(count);
  }, [status, onFilter]);

  // 监听排序条件变化
  useEffect(() => {
    if (onSort) {
      onSort({ sortBy, sortOrder });
    }
  }, [sortBy, sortOrder, onSort]);

  // 处理搜索输入变化
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // 处理清除搜索
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 处理状态过滤变化
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  // 处理排序字段变化
  const handleSortByChange = (event) => {
    setSortBy(event.target.value);
  };

  // 处理排序顺序变化
  const handleSortOrderChange = (event) => {
    setSortOrder(event.target.value);
  };

  // 获取状态显示文本
  const getStatusText = (statusValue) => {
    if (statusValue === 'all') return '全部';
    const statusObj = BOOK_STATUS.find(s => s.value === statusValue);
    return statusObj ? statusObj.text : statusValue;
  };

  return (
    <Paper 
      elevation={elevation} 
      variant={variant}
      sx={{ 
        p: 2, 
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2,
      }}
    >
      {/* 搜索框 */}
      <TextField
        placeholder="搜索书籍标题或作者..."
        value={searchTerm}
        onChange={handleSearchChange}
        variant="outlined"
        size="small"
        fullWidth
        sx={{ flexGrow: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="清除搜索"
                onClick={handleClearSearch}
                edge="end"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* 过滤选项 */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {showStatusFilter && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
                状态
                {activeFilters > 0 && (
                  <Chip 
                    label={activeFilters} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 0.5, height: 16, '& .MuiChip-label': { px: 0.5, fontSize: '0.6rem' } }} 
                  />
                )}
              </Box>
            </InputLabel>
            <Select
              labelId="status-filter-label"
              value={status}
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
                  状态
                  {activeFilters > 0 && (
                    <Chip 
                      label={activeFilters} 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 0.5, height: 16, '& .MuiChip-label': { px: 0.5, fontSize: '0.6rem' } }} 
                    />
                  )}
                </Box>
              )}
              onChange={handleStatusChange}
            >
              <MenuItem value="all">全部</MenuItem>
              {BOOK_STATUS.map((statusOption) => (
                <MenuItem key={statusOption.value} value={statusOption.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={statusOption.text} 
                      size="small" 
                      color={statusOption.color} 
                      sx={{ mr: 1 }} 
                    />
                    {statusOption.text}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* 排序选项 */}
        {showSortOptions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="sort-by-label">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
                  排序字段
                </Box>
              </InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label={(
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
                    排序字段
                  </Box>
                )}
                onChange={handleSortByChange}
              >
                <MenuItem value="created_at">上传时间</MenuItem>
                <MenuItem value="title">书名</MenuItem>
                <MenuItem value="author">作者</MenuItem>
                <MenuItem value="status">状态</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-order-label">排序方式</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="排序方式"
                onChange={handleSortOrderChange}
              >
                <MenuItem value="desc">降序</MenuItem>
                <MenuItem value="asc">升序</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* 活跃过滤器显示 */}
      {activeFilters > 0 && (
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, flexWrap: 'wrap' }}>
          {status !== 'all' && (
            <Tooltip title="点击移除过滤器">
              <Chip
                label={`状态: ${getStatusText(status)}`}
                onDelete={() => setStatus('all')}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Tooltip>
          )}
        </Box>
      )}
    </Paper>
  );
};

SearchFilterBar.propTypes = {
  /**
   * 搜索回调函数
   */
  onSearch: PropTypes.func,
  
  /**
   * 过滤回调函数
   */
  onFilter: PropTypes.func,
  
  /**
   * 排序回调函数
   */
  onSort: PropTypes.func,
  
  /**
   * 初始搜索词
   */
  initialSearchTerm: PropTypes.string,
  
  /**
   * 初始状态过滤
   */
  initialStatus: PropTypes.string,
  
  /**
   * 初始排序字段
   */
  initialSortBy: PropTypes.string,
  
  /**
   * 初始排序顺序
   */
  initialSortOrder: PropTypes.string,
  
  /**
   * 是否显示状态过滤
   */
  showStatusFilter: PropTypes.bool,
  
  /**
   * 是否显示排序选项
   */
  showSortOptions: PropTypes.bool,
  
  /**
   * 卡片阴影深度
   */
  elevation: PropTypes.number,
  
  /**
   * 卡片变体
   */
  variant: PropTypes.oneOf(['elevation', 'outlined']),
};

export default SearchFilterBar;