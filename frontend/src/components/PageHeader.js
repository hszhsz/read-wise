import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, Breadcrumbs, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * 页面标题组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  divider = true,
  marginBottom = 3,
}) => {
  // 渲染面包屑
  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 1 }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !crumb.link) {
            return (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={crumb.link}
              underline="hover"
              color="inherit"
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={action.onClick}
            component={action.link ? RouterLink : undefined}
            to={action.link}
            disabled={action.disabled}
            size={action.size || 'medium'}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ mb: marginBottom }}>
      {renderBreadcrumbs()}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: divider ? 2 : 0,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={Boolean(subtitle)}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {renderActions()}
      </Box>

      {divider && <Divider />}
    </Box>
  );
};

PageHeader.propTypes = {
  /**
   * 页面标题
   */
  title: PropTypes.string.isRequired,
  
  /**
   * 页面副标题
   */
  subtitle: PropTypes.string,
  
  /**
   * 面包屑导航项
   */
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      link: PropTypes.string,
    })
  ),
  
  /**
   * 操作按钮
   */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      variant: PropTypes.string,
      color: PropTypes.string,
      icon: PropTypes.node,
      link: PropTypes.string,
      disabled: PropTypes.bool,
      size: PropTypes.string,
    })
  ),
  
  /**
   * 是否显示分隔线
   */
  divider: PropTypes.bool,
  
  /**
   * 底部外边距
   */
  marginBottom: PropTypes.number,
};

export default PageHeader;