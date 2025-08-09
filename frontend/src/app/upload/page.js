'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { booksApi } from '../../services/api';
import Layout from '../../components/Layout';

const UploadPage = () => {
  const router = useRouter();
  const { addNotification } = useAppContext();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            addNotification({
              message: `文件 "${file.name}" 太大，请选择小于 50MB 的文件`,
              severity: 'error'
            });
          } else if (error.code === 'file-invalid-type') {
            addNotification({
              message: `文件 "${file.name}" 格式不支持，请选择 PDF、EPUB、TXT 或 DOCX 文件`,
              severity: 'error'
            });
          }
        });
      });
    }

    // 处理接受的文件
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending', // pending, uploading, success, error
      progress: 0,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [addNotification]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileItem) => {
    const formData = new FormData();
    formData.append('file', fileItem.file);

    try {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileItem.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      const response = await booksApi.uploadBook(formData);
      
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'success', progress: 100, bookId: response.data.book_id }
          : f
      ));

      addNotification({
        message: `"${fileItem.file.name}" 上传成功`,
        severity: 'success'
      });

    } catch (error) {
      console.error('上传失败:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error.response?.data?.message || '上传失败'
            }
          : f
      ));

      addNotification({
        message: `"${fileItem.file.name}" 上传失败: ${error.response?.data?.message || '未知错误'}`,
        severity: 'error'
      });
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    
    try {
      // 并发上传，但限制并发数
      const concurrency = 3;
      for (let i = 0; i < pendingFiles.length; i += concurrency) {
        const batch = pendingFiles.slice(i, i + concurrency);
        await Promise.all(batch.map(uploadFile));
      }
    } finally {
      setUploading(false);
    }
  };

  const retryUpload = (fileItem) => {
    uploadFile(fileItem);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileText className="h-8 w-8 text-orange-600" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const successFiles = files.filter(f => f.status === 'success');
  const hasFiles = files.length > 0;

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              上传<span className="text-orange-600">书籍</span>
            </h1>
            <p className="text-xl text-gray-600">
              支持 PDF、EPUB、TXT、DOCX 格式，让 AI 为你解读每一本书
            </p>
          </div>

          {/* 拖拽上传区域 */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragActive
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-orange-600" />
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-xl font-semibold text-orange-600 mb-2">
                    松开鼠标即可上传
                  </p>
                  <p className="text-gray-600">
                    将文件拖放到这里
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    拖拽文件到这里，或点击选择文件
                  </p>
                  <p className="text-gray-600 mb-4">
                    支持 PDF、EPUB、TXT、DOCX 格式，单个文件最大 50MB
                  </p>
                  <button className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                    <Upload className="h-5 w-5" />
                    <span>选择文件</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 文件列表 */}
          {hasFiles && (
            <div className="mt-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    文件列表 ({files.length})
                  </h3>
                  
                  {pendingFiles.length > 0 && (
                    <button
                      onClick={uploadAllFiles}
                      disabled={uploading}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploading ? '上传中...' : '开始上传'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {files.map((fileItem) => (
                    <div
                      key={fileItem.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {/* 文件图标 */}
                      <div className="flex-shrink-0">
                        {getFileIcon(fileItem.file.name)}
                      </div>

                      {/* 文件信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {fileItem.file.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(fileItem.status)}
                            {fileItem.status === 'pending' && (
                              <button
                                onClick={() => removeFile(fileItem.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            {formatFileSize(fileItem.file.size)}
                          </p>
                          
                          {fileItem.status === 'uploading' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${fileItem.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {fileItem.progress}%
                              </span>
                            </div>
                          )}
                          
                          {fileItem.status === 'error' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-red-600">
                                {fileItem.error}
                              </span>
                              <button
                                onClick={() => retryUpload(fileItem)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                重试
                              </button>
                            </div>
                          )}
                          
                          {fileItem.status === 'success' && fileItem.bookId && (
                            <button
                              onClick={() => router.push(`/books/${fileItem.bookId}`)}
                              className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              <span>查看详情</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 成功上传提示 */}
          {successFiles.length > 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">
                  上传完成！
                </h3>
              </div>
              <p className="text-green-700 mb-4">
                已成功上传 {successFiles.length} 个文件，AI 正在为你分析书籍内容...
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/books')}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>查看书库</span>
                </button>
                <button
                  onClick={() => setFiles([])}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  继续上传
                </button>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              使用说明
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h4 className="font-medium mb-2">支持的文件格式：</h4>
                <ul className="space-y-1">
                  <li>• PDF 文档 (.pdf)</li>
                  <li>• EPUB 电子书 (.epub)</li>
                  <li>• 纯文本文件 (.txt)</li>
                  <li>• Word 文档 (.docx)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">AI 功能：</h4>
                <ul className="space-y-1">
                  <li>• 智能内容摘要</li>
                  <li>• 关键词提取</li>
                  <li>• 章节结构分析</li>
                  <li>• 智能问答对话</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UploadPage;