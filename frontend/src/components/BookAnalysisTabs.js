import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { BOOK_ANALYSIS_TABS } from '../utils/constants';
import { exportBookAnalysis } from '../utils/exportUtils';

/**
 * 标签页内容面板
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`book-analysis-tabpanel-${index}`}
      aria-labelledby={`book-analysis-tab-${index}`}
      {...other}
      style={{ minHeight: '300px' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

/**
 * 获取标签页属性
 */
function a11yProps(index) {
  return {
    id: `book-analysis-tab-${index}`,
    'aria-controls': `book-analysis-tabpanel-${index}`,
  };
}

/**
 * 书籍分析结果标签页组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const BookAnalysisTabs = ({ book, analysis, loading, error, onRetry }) => {
  const [tabValue, setTabValue] = useState(0);
  const [copySuccess, setCopySuccess] = useState('');

  // 处理标签页变化
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理导出
  const handleExport = () => {
    if (analysis) {
      exportBookAnalysis(book, analysis);
    }
  };

  // 处理复制内容
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('已复制到剪贴板');
        setTimeout(() => setCopySuccess(''), 2000);
      },
      (err) => {
        console.error('无法复制文本: ', err);
        setCopySuccess('复制失败');
      }
    );
  };

  // 渲染内容区块
  const renderContentBlock = (title, content, allowCopy = true) => {
    if (!content) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {allowCopy && (
            <Tooltip title={copySuccess || '复制内容'}>
              <IconButton 
                size="small" 
                onClick={() => handleCopy(content)}
                sx={{ ml: 1 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
          {content}
        </Typography>
      </Box>
    );
  };

  // 如果正在加载
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          加载分析结果中...
        </Typography>
      </Box>
    );
  }

  // 如果有错误
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
        {onRetry && (
          <Button variant="outlined" onClick={onRetry} sx={{ mt: 2 }}>
            重试
          </Button>
        )}
      </Box>
    );
  }

  // 如果书籍状态不是已完成
  if (book?.status !== 'completed') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          书籍尚未完成分析，请等待处理完成后查看结果。
        </Typography>
      </Box>
    );
  }

  // 如果没有分析数据
  if (!analysis) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          暂无分析数据
        </Typography>
      </Box>
    );
  }

  const { summary, key_points, author_background, reading_recommendations } = analysis;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="书籍分析标签页"
          variant="scrollable"
          scrollButtons="auto"
        >
          {BOOK_ANALYSIS_TABS.map((tab, index) => (
            <Tab key={tab.id} label={tab.label} {...a11yProps(index)} />
          ))}
        </Tabs>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="small"
        >
          导出分析
        </Button>
      </Box>
      
      <Divider />
      
      {/* 摘要标签页 */}
      <TabPanel value={tabValue} index={0}>
        {renderContentBlock('内容摘要', summary)}
      </TabPanel>
      
      {/* 要点标签页 */}
      <TabPanel value={tabValue} index={1}>
        {renderContentBlock('关键要点', key_points)}
      </TabPanel>
      
      {/* 作者背景标签页 */}
      <TabPanel value={tabValue} index={2}>
        {renderContentBlock('作者背景', author_background)}
      </TabPanel>
      
      {/* 阅读推荐标签页 */}
      <TabPanel value={tabValue} index={3}>
        {renderContentBlock('阅读推荐', reading_recommendations)}
      </TabPanel>
    </Box>
  );
};

BookAnalysisTabs.propTypes = {
  /**
   * 书籍数据
   */
  book: PropTypes.object.isRequired,
  
  /**
   * 分析数据
   */
  analysis: PropTypes.shape({
    summary: PropTypes.string,
    key_points: PropTypes.string,
    author_background: PropTypes.string,
    reading_recommendations: PropTypes.string,
  }),

  /**
   * 是否正在加载
   */
  loading: PropTypes.bool,

  /**
   * 错误信息
   */
  error: PropTypes.string,

  /**
   * 重试回调函数
   */
  onRetry: PropTypes.func,
};

export default BookAnalysisTabs;