/**
 * API Configuration
 *
 * This file configures the OpenAPI client with the base URL from environment variables.
 * It also configures request/response interceptors to match Umi's request configuration.
 *
 * Environment Variables:
 * - UMI_APP_API_BASE_URL: The base URL for API requests (default: http://localhost:8080)
 *
 * Note: In Umi, environment variables must be prefixed with UMI_APP_ to be accessible in the browser.
 */

import { OpenAPI } from '@/services';
import { getToken } from '@/utils/auth';
import { getCSRFToken } from '@/utils/csrf';
import { SessionSecurityManager } from '@/utils/sessionSecurity';

// Get API base URL from environment variable or use default
export const API_BASE_URL =
  process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080';

/**
 * Initialize the OpenAPI configuration
 * This should be called at app startup
 */
export function initializeApiConfig() {
  // Set the base URL for all API calls
  OpenAPI.BASE = API_BASE_URL;

  // Configure credentials
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';

  // Configure token resolver to dynamically get token from storage
  // This matches Umi's request interceptor behavior
  OpenAPI.TOKEN = async () => {
    const token = getToken();
    return token || '';
  };

  // Configure additional headers to include CSRF token for non-GET requests
  // This matches Umi's request interceptor behavior
  OpenAPI.HEADERS = async (options) => {
    const headers: Record<string, string> = {};

    // Add CSRF token for non-GET requests (matching Umi interceptor)
    if (options.method && options.method.toUpperCase() !== 'GET') {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Update session activity (matching Umi interceptor)
    try {
      SessionSecurityManager.updateActivity();
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }

    return headers;
  };
}

/**
 * Update the API base URL dynamically (if needed)
 */
export function setApiBaseUrl(url: string) {
  OpenAPI.BASE = url;
  console.log(`[API Config] Base URL updated to: ${OpenAPI.BASE}`);
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return OpenAPI.BASE;
}
