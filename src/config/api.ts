/**
 * API Configuration
 *
 * This file configures the @hey-api/openapi-ts client with the base URL from environment variables.
 * It also configures request/response interceptors to match Umi's request configuration.
 *
 * Environment Variables:
 * - UMI_APP_API_BASE_URL: The base URL for API requests (default: http://localhost:8080)
 *
 * Note: In Umi, environment variables must be prefixed with UMI_APP_ to be accessible in the browser.
 */

import { client } from '@/services/client.gen';
import { getToken } from '@/utils/auth';
import { SessionSecurityManager } from '@/utils/sessionSecurity';

// Get API base URL from environment variable or use default
export const API_BASE_URL =
  process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080';

/**
 * Initialize the API client configuration
 * This should be called at app startup
 */
export function initializeApiConfig() {
  // Set the base URL for all API calls
  client.setConfig({
    baseUrl: API_BASE_URL,
  });

  // Add request interceptor for authentication and session tracking
  client.interceptors.request.use(async (request) => {
    // Get token and add to headers
    const token = getToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    // Update session activity (matching Umi interceptor)
    try {
      SessionSecurityManager.updateActivity();
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }

    return request;
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(async (response) => {
    // You can add custom response handling here if needed
    return response;
  });

  console.log(`[API Config] Initialized with base URL: ${API_BASE_URL}`);
}

/**
 * Update the API base URL dynamically (if needed)
 */
export function setApiBaseUrl(url: string) {
  client.setConfig({
    baseUrl: url,
  });
  console.log(`[API Config] Base URL updated to: ${url}`);
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return client.getConfig().baseUrl || API_BASE_URL;
}
