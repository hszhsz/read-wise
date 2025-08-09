'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// 初始状态
const initialState = {
  books: [],
  currentBook: null,
  loading: false,
  error: null,
  notifications: [],
  theme: 'light',
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BOOKS: 'SET_BOOKS',
  SET_CURRENT_BOOK: 'SET_CURRENT_BOOK',
  ADD_BOOK: 'ADD_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_THEME: 'SET_THEME',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_BOOKS:
      return { ...state, books: action.payload, loading: false };
    
    case ActionTypes.SET_CURRENT_BOOK:
      return { ...state, currentBook: action.payload };
    
    case ActionTypes.ADD_BOOK:
      return { 
        ...state, 
        books: [action.payload, ...state.books],
        loading: false 
      };
    
    case ActionTypes.UPDATE_BOOK:
      return {
        ...state,
        books: state.books.map(book => 
          book.id === action.payload.id ? action.payload : book
        ),
        currentBook: state.currentBook?.id === action.payload.id 
          ? action.payload 
          : state.currentBook
      };
    
    case ActionTypes.DELETE_BOOK:
      return {
        ...state,
        books: state.books.filter(book => book.id !== action.payload),
        currentBook: state.currentBook?.id === action.payload 
          ? null 
          : state.currentBook
      };
    
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          ...action.payload
        }]
      };
    
    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider组件
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  const setBooks = useCallback((books) => {
    dispatch({ type: ActionTypes.SET_BOOKS, payload: books });
  }, []);

  const setCurrentBook = useCallback((book) => {
    dispatch({ type: ActionTypes.SET_CURRENT_BOOK, payload: book });
  }, []);

  const addBook = useCallback((book) => {
    dispatch({ type: ActionTypes.ADD_BOOK, payload: book });
  }, []);

  const updateBook = useCallback((book) => {
    dispatch({ type: ActionTypes.UPDATE_BOOK, payload: book });
  }, []);

  const deleteBook = useCallback((bookId) => {
    dispatch({ type: ActionTypes.DELETE_BOOK, payload: bookId });
  }, []);

  const addNotification = useCallback((notification) => {
    dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification });
    
    // 自动移除通知
    if (notification.autoHide !== false) {
      setTimeout(() => {
        dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: notification.id || Date.now() });
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const setTheme = useCallback((theme) => {
    dispatch({ type: ActionTypes.SET_THEME, payload: theme });
  }, []);

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    setBooks,
    setCurrentBook,
    addBook,
    updateBook,
    deleteBook,
    addNotification,
    removeNotification,
    setTheme,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;