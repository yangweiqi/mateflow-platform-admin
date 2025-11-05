/**
 * API Response Handler
 *
 * This utility provides response handling for OpenAPI-generated services
 * to match the behavior of Umi's response interceptors.
 */

import { history } from '@umijs/max';
import { message } from 'antd';
import { clearAuth } from './auth';
import {
  SessionActivityTracker,
  SessionSecurityManager,
} from './sessionSecurity';

/**
 * Handle API response errors
 * This matches the behavior of Umi's response interceptor in app.tsx
 */
export function handleApiError(error: any): void {
  // Extract status from error
  const status = error?.status || error?.statusCode;

  if (!status) {
    console.error('API Error:', error);
    return;
  }

  switch (status) {
    case 401:
      // Handle token expiration (matching Umi interceptor)
      message.error('Session expired, please login again');

      // Clear session and auth
      SessionSecurityManager.clearSession();
      SessionActivityTracker.stop();
      clearAuth();

      // Redirect to login
      history.push('/login');
      break;

    case 403:
      // Handle forbidden access (matching Umi interceptor)
      message.error('Access denied');
      break;

    case 500:
      // Handle server errors (matching Umi interceptor)
      message.error('Server error, please try again later');
      break;

    case 429:
      // Handle rate limiting (matching Umi interceptor)
      message.warning('Too many requests. Please slow down.');
      break;

    default:
      // Handle other errors
      if (error?.body?.msg) {
        message.error(error.body.msg);
      } else if (error?.message) {
        message.error(error.message);
      }
  }
}

/**
 * Wrap an OpenAPI service call with error handling
 * Usage: const result = await withErrorHandling(() => ServiceClass.method())
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    handleApiError(error);
    return null;
  }
}

/**
 * Wrap an OpenAPI service call with error handling and custom error callback
 */
export async function withErrorHandlingAndCallback<T>(
  apiCall: () => Promise<T>,
  onError?: (error: any) => void,
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    handleApiError(error);
    if (onError) {
      onError(error);
    }
    return null;
  }
}

/**
 * Check if an API response indicates success
 */
export function isApiSuccess(response: any): boolean {
  return response?.code === 0 || response?.code === '0';
}

/**
 * Extract error message from API response
 */
export function getApiErrorMessage(response: any): string {
  return response?.msg || response?.message || 'Unknown error';
}
