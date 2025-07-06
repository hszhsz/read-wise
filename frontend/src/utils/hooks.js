/**
 * 自定义React Hooks
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from './helpers';

/**
 * 使用本地存储的状态
 * @param {string} key 存储键
 * @param {any} initialValue 初始值
 * @returns {Array} [storedValue, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // 获取初始值
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // 状态管理
  const [storedValue, setStoredValue] = useState(readValue);

  // 返回一个包装过的版本，用于更新本地存储和状态
  const setValue = useCallback(
    (value) => {
      try {
        // 允许值是一个函数，类似于useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        
        // 保存到state
        setStoredValue(valueToStore);
        
        // 保存到localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 监听其他窗口的存储事件
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
      }
    };
    
    // 添加事件监听
    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
};

/**
 * 使用防抖值
 * @param {any} value 要防抖的值
 * @param {number} delay 延迟时间（毫秒）
 * @returns {any} 防抖后的值
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 使用防抖回调
 * @param {Function} callback 回调函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 防抖后的回调函数
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    debounce((...args) => callbackRef.current(...args), delay),
    [delay]
  );
};

/**
 * 使用上一个值
 * @param {any} value 当前值
 * @returns {any} 上一个值
 */
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
};

/**
 * 使用媒体查询
 * @param {string} query 媒体查询字符串
 * @returns {boolean} 是否匹配
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * 使用点击外部元素检测
 * @param {Function} callback 点击外部时的回调函数
 * @returns {React.RefObject} 引用对象
 */
export const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback]);

  return ref;
};

/**
 * 使用窗口大小
 * @returns {Object} 包含宽度和高度的对象
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 添加事件监听
    window.addEventListener('resize', handleResize);
    
    // 初始化调用一次
    handleResize();
    
    // 清理函数
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * 使用滚动位置
 * @param {React.RefObject} [elementRef] 元素引用，不提供则使用window
 * @returns {Object} 包含x和y的对象
 */
export const useScrollPosition = (elementRef) => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef?.current ? elementRef.current : window;
    
    const handleScroll = () => {
      if (elementRef?.current) {
        setScrollPosition({
          x: elementRef.current.scrollLeft,
          y: elementRef.current.scrollTop,
        });
      } else {
        setScrollPosition({
          x: window.pageXOffset,
          y: window.pageYOffset,
        });
      }
    };

    // 添加事件监听
    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // 初始化调用一次
    handleScroll();
    
    // 清理函数
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [elementRef]);

  return scrollPosition;
};

/**
 * 使用异步操作
 * @param {Function} asyncFunction 异步函数
 * @param {any[]} deps 依赖数组
 * @returns {Object} 包含loading, error, data和execute的对象
 */
export const useAsync = (asyncFunction, deps = []) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction, ...deps]);

  return { loading, error, data, execute };
};

/**
 * 使用轮询
 * @param {Function} callback 回调函数
 * @param {number} interval 轮询间隔（毫秒）
 * @param {boolean} immediate 是否立即执行
 * @returns {Object} 包含start, stop和isPolling的对象
 */
export const usePolling = (callback, interval = 5000, immediate = false) => {
  const [isPolling, setIsPolling] = useState(false);
  const savedCallback = useRef(callback);
  const timeoutRef = useRef(null);

  // 记住最新的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置轮询函数
  const poll = useCallback(() => {
    const tick = async () => {
      try {
        await savedCallback.current();
      } finally {
        if (isPolling) {
          timeoutRef.current = setTimeout(tick, interval);
        }
      }
    };
    
    tick();
  }, [isPolling, interval]);

  // 启动轮询
  const start = useCallback(() => {
    if (!isPolling) {
      setIsPolling(true);
      if (immediate) {
        poll();
      } else {
        timeoutRef.current = setTimeout(poll, interval);
      }
    }
  }, [isPolling, poll, interval, immediate]);

  // 停止轮询
  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { start, stop, isPolling };
};