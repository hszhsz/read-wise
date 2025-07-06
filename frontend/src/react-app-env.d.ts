/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
    REACT_APP_API_BASE_URL: string;
    REACT_APP_MAX_UPLOAD_SIZE: string;
    REACT_APP_SUPPORTED_FILE_TYPES: string;
  }
}