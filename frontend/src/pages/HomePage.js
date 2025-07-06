import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Container,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SummarizeIcon from '@mui/icons-material/Summarize';
import PersonIcon from '@mui/icons-material/Person';
import RecommendIcon from '@mui/icons-material/Recommend';
import { BookList, EmptyState, LoadingState, PageHeader } from '../components';
import { useAppContext } from '../context/AppContext';
import { getBooks } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { addNotification } = useAppContext();
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取最近上传的书籍
  const fetchRecentBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBooks({ limit: 6, page: 1 });
      setRecentBooks(response.data.data);
    } catch (err) {
      console.error('获取最近书籍失败:', err);
      setError(err.message || '获取书籍数据失败');
      addNotification({
        message: '无法加载最近的书籍',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取最近书籍
  useEffect(() => {
    fetchRecentBooks();
  }, []);

  const features = [
    {
      icon: <SummarizeIcon sx={{ fontSize: 40 }} />,
      title: '书籍重点总结',
      description: '提取关键论点、核心思想和重要结论，帮助您快速把握书籍精华。',
    },
    {
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
      title: '作者背景介绍',
      description: '了解作者的教育背景、写作风格、代表作品等信息，加深对作品的理解。',
    },
    {
      icon: <RecommendIcon sx={{ fontSize: 40 }} />,
      title: '引申阅读推荐',
      description: '基于当前书籍主题和内容，推荐相关领域的其他优质书籍或文章。',
    },
  ];

  return (
    <Box>
      {/* 英雄区域 */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          mb: 6,
          background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
          color: 'white',
        }}
      >
        <Box
          sx={{
            p: { xs: 4, md: 8 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Readwise 智能读书助手
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, maxWidth: 800 }}>
            上传您的电子书，借助大语言模型获取深度解析，
            包括重点总结、作者背景和延伸阅读推荐。
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<UploadFileIcon />}
              onClick={() => navigate('/upload')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
                px: 3,
                py: 1.5,
              }}
            >
              上传书籍
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MenuBookIcon />}
              onClick={() => navigate('/books')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
                px: 3,
                py: 1.5,
              }}
            >
              我的书籍
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 功能特点 */}
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
        主要功能
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
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
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                    color: 'primary.main',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 使用流程 */}
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
        使用流程
      </Typography>
      <Box sx={{ mb: 6 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                1. 上传您的电子书
              </Typography>
              <Typography variant="body1" paragraph>
                支持PDF、EPUB、MOBI、TXT等多种格式，简单拖放即可上传。
              </Typography>
              <Typography variant="h5" component="h3" gutterBottom>
                2. 智能分析处理
              </Typography>
              <Typography variant="body1" paragraph>
                系统自动提取书籍内容，通过DeepSeek大语言模型进行深度分析。
              </Typography>
              <Typography variant="h5" component="h3" gutterBottom>
                3. 获取分析报告
              </Typography>
              <Typography variant="body1">
                查看生成的书籍重点总结、作者背景和延伸阅读推荐，帮助您更好地理解和吸收书籍内容。
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 300,
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(25, 118, 210, 0.05)',
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}
              >
                <AutoStoriesIcon sx={{ fontSize: 100, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 最近上传的书籍 */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          最近上传的书籍
        </Typography>
        <Box sx={{ mb: 2 }}>
          {loading ? (
            <LoadingState message="加载最近书籍中..." />
          ) : error ? (
            <EmptyState
              title="加载失败"
              description={`无法加载最近的书籍: ${error}`}
              actionText="重试"
              onAction={() => fetchRecentBooks()}
            />
          ) : recentBooks.length === 0 ? (
            <EmptyState
              title="暂无书籍"
              description="您还没有上传任何书籍"
              actionText="上传第一本书"
              onAction={() => navigate('/upload')}
              icon={<AutoStoriesIcon sx={{ fontSize: 60 }} />}
            />
          ) : (
            <Grid container spacing={3}>
              {recentBooks.map((book) => (
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
                    <CardActionArea onClick={() => navigate(`/books/${book.id}`)}>
                      <CardContent>
                        <Typography variant="h6" component="h3" noWrap gutterBottom>
                          {book.title || '未命名书籍'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {book.author || '未知作者'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          上传于 {new Date(book.created_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/books')}
            startIcon={<MenuBookIcon />}
          >
            查看全部书籍
          </Button>
        </Box>
      </Box>

      {/* 号召性用语 */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          bgcolor: 'rgba(25, 118, 210, 0.05)',
          border: '1px solid rgba(25, 118, 210, 0.1)',
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          开始您的智能阅读之旅
        </Typography>
        <Typography variant="body1" paragraph>
          上传您的第一本书，体验AI辅助阅读带来的全新体验！
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<UploadFileIcon />}
          onClick={() => navigate('/upload')}
          sx={{ mt: 2 }}
        >
          立即开始
        </Button>
      </Paper>
    </Box>
  );
};

export default HomePage;