/**
 * API Configuration
 *
 * This file configures the OpenAPI client with the base URL from environment variables.
 *
 * Environment Variables:
 * - UMI_APP_API_BASE_URL: The base URL for API requests (default: http://localhost:8080)
 *
 * Note: In Umi, environment variables must be prefixed with UMI_APP_ to be accessible in the browser.
 */

import { OpenAPI } from '@/services';

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

  // Configure other OpenAPI settings if needed
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = 'include';
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
