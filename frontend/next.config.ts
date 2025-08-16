import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 环境变量配置
  env: {
    CUSTOM_LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    ENABLE_LOGGING: process.env.ENABLE_LOGGING || 'true',
  },
  
  // 开发环境配置
  ...(process.env.NODE_ENV === 'development' && {
    // 开发环境下启用详细日志
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
  
  // 生产环境优化
  ...(process.env.NODE_ENV === 'production' && {
    // 生产环境下的日志配置
    compress: true,
    poweredByHeader: false,
  }),
};

export default nextConfig;
