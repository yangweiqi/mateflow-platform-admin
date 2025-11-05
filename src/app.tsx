// 运行时配置
import logo from '@/assets/logo.png';
import ErrorBoundary from '@/components/ErrorBoundary';
import LayoutWrapper from '@/components/LayoutWrapper';
import { LogoutOutlined } from '@ant-design/icons';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { App as AntdApp, message } from 'antd';
import React from 'react';
import { initializeApiConfig } from './config/api';
import {
  clearAuth,
  getToken,
  getUserEmail,
  isAuthenticated,
} from './utils/auth';
import { initCaptcha } from './utils/captcha';
import { setCSRFToken } from './utils/csrf';
import {
  SessionActivityTracker,
  SessionSecurityManager,
} from './utils/sessionSecurity';

// Initialize security features on app load
if (typeof window !== 'undefined') {
  // Suppress known deprecation warnings from Ant Design components
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      // Filter findDOMNode deprecation warnings (known Ant Design v5 issue)
      if (args[0].includes('findDOMNode is deprecated')) {
        return;
      }
      // Filter static message API warnings in runtime config where hooks aren't available
      if (args[0].includes('Static function can not consume context')) {
        return;
      }
    }
    originalError.apply(console, args);
  };

  // Initialize API configuration (must be done before any API calls)
  initializeApiConfig();

  // Initialize CAPTCHA (Cloudflare Turnstile)
  // For production, replace 'mock' with your actual Cloudflare Turnstile site key
  // Get your key from: https://dash.cloudflare.com/?to=/:account/turnstile
  // Example: initCaptcha('0x4AAAAAAABbBbBbBbBbBbBb');
  const TURNSTILE_SITE_KEY =
    process.env.UMI_APP_TURNSTILE_SITE_KEY ||
    process.env.UMI_APP_CAPTCHA_SITE_KEY ||
    'mock';
  initCaptcha(TURNSTILE_SITE_KEY);

  // Initialize CSRF token
  setCSRFToken();

  // Configure session security
  SessionSecurityManager.configure({
    maxConcurrentSessions: 3,
    requireReauthForSensitiveOps: true,
    validateDeviceFingerprint: true,
    trackSessionActivity: true,
  });

  // Start session activity tracking
  SessionActivityTracker.start();

  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default error logging that shows "error without stack trace"
    event.preventDefault();
  });

  // Global error handler for runtime errors
  window.addEventListener('error', (event) => {
    console.error('Runtime error:', event.error || event.message);
  });
}

export interface InitialState {
  currentUser?: {
    token?: string;
    email?: string;
  };
  fetchUserInfo?: () => Promise<any>;
}

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<InitialState> {
  const fetchUserInfo = async () => {
    try {
      // Check if user is authenticated
      if (isAuthenticated()) {
        const token = getToken();
        const email = getUserEmail();
        return {
          token: token || undefined,
          email: email || undefined,
        };
      }
      return undefined;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return undefined;
    }
  };

  // If not on login page, check authentication
  const { location } = history;
  if (location.pathname !== '/login') {
    const currentUser = await fetchUserInfo();
    return {
      currentUser,
      fetchUserInfo,
    };
  }

  return {
    fetchUserInfo,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    logo: logo,
    menu: {
      locale: true,
    },
    layout: 'mix',
    title: 'Platform Admin',
    // Show user info in the header
    avatarProps: {
      src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      title: initialState?.currentUser?.email || 'Admin',
      render: (_, avatarChildren) => {
        return avatarChildren;
      },
    },
    // Logout action
    actionsRender: () => {
      if (initialState?.currentUser) {
        return [
          <LogoutOutlined
            key="logout"
            onClick={async () => {
              // Clear session security
              SessionSecurityManager.clearSession();
              SessionActivityTracker.stop();

              // Clear auth
              clearAuth();
              setInitialState({ ...initialState, currentUser: undefined });
              message.success('Logged out successfully');
              history.push('/login');
            }}
            style={{ cursor: 'pointer', fontSize: '16px' }}
          />,
        ];
      }
      return [];
    },
    // Redirect to login if not authenticated
    onPageChange: () => {
      const { location } = history;
      // If not logged in and not on login page, redirect to login
      if (!initialState?.currentUser && location.pathname !== '/login') {
        history.push('/login');
      }
    },
    // Wrap children with session timeout warning
    childrenRender: (children) => {
      return <LayoutWrapper>{children}</LayoutWrapper>;
    },
  };
};

// Request configuration
export const request: RequestConfig = {
  timeout: 30000,
  requestInterceptors: [
    (config: any) => {
      // Add token to request headers
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token for non-GET requests
      if (config.method && config.method.toUpperCase() !== 'GET') {
        const csrfToken = require('./utils/csrf').getCSRFToken();
        if (csrfToken && config.headers) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }

      // Update session activity
      SessionSecurityManager.updateActivity();

      return config;
    },
  ],
  responseInterceptors: [
    (response: any) => {
      // Handle token expiration
      if (response.status === 401) {
        message.error('Session expired, please login again');

        // Clear session and auth
        SessionSecurityManager.clearSession();
        SessionActivityTracker.stop();
        clearAuth();

        history.push('/login');
      }

      // Handle forbidden access
      if (response.status === 403) {
        message.error('Access denied');
      }

      // Handle server errors
      if (response.status === 500) {
        message.error('Server error, please try again later');
      }

      // Handle rate limiting
      if (response.status === 429) {
        message.warning('Too many requests. Please slow down.');
      }

      return response;
    },
  ],
};

// Wrap the app with Ant Design App component to enable hooks API for message, notification, modal
// Also wrap with ErrorBoundary to catch and handle errors gracefully
export function rootContainer(container: React.ReactElement) {
  return (
    <ErrorBoundary>
      <AntdApp>{container}</AntdApp>
    </ErrorBoundary>
  );
}
