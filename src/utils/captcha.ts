/**
 * CAPTCHA Integration
 * Supports multiple CAPTCHA providers (Cloudflare Turnstile, Mock)
 */

export interface CaptchaProvider {
  load(): Promise<void>;
  execute(action: string): Promise<string>;
  isLoaded(): boolean;
  reset(): void;
  render?(container: HTMLElement): Promise<void>;
}

/**
 * Cloudflare Turnstile Provider
 * Privacy-focused CAPTCHA alternative with better performance
 * https://developers.cloudflare.com/turnstile/
 *
 * Note: Uses "interaction-only" mode - widget only appears when challenge needed
 */
export class CloudflareTurnstileProvider implements CaptchaProvider {
  private siteKey: string;
  private loaded = false;
  private scriptElement: HTMLScriptElement | null = null;
  private widgetId: string | null = null;
  private containerElement: HTMLElement | null = null;
  private pendingToken: string | null = null;

  constructor(siteKey: string) {
    this.siteKey = siteKey;
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    // Check if already loaded by another instance
    if ((window as any).turnstile) {
      this.loaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.loaded = true;
        this.scriptElement = script;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Cloudflare Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Render Turnstile widget (interaction-only mode)
   * Widget only appears when user interaction is needed
   */
  async render(container?: HTMLElement): Promise<void> {
    if (!this.loaded) {
      await this.load();
    }

    // If widget already rendered, don't render again
    if (this.widgetId) {
      return;
    }

    let containerElement = container;
    if (!containerElement) {
      // Create hidden container if not provided
      containerElement = document.createElement('div');
      containerElement.style.position = 'fixed';
      containerElement.style.bottom = '20px';
      containerElement.style.right = '20px';
      containerElement.style.zIndex = '1000';
      document.body.appendChild(containerElement);
    }

    this.containerElement = containerElement;

    return new Promise((resolve, reject) => {
      if (!(window as any).turnstile) {
        reject(new Error('Turnstile not loaded'));
        return;
      }

      try {
        this.widgetId = (window as any).turnstile.render(containerElement, {
          sitekey: this.siteKey,
          callback: (token: string) => {
            // Store token when received
            this.pendingToken = token;
            resolve();
          },
          'error-callback': (error: any) => {
            reject(new Error('Turnstile verification failed: ' + error));
          },
          theme: 'auto',
          size: 'flexible', // Flexible size - adapts to container width (100%)
          appearance: 'interaction-only', // Only show interactive challenge when needed
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async execute(): Promise<string> {
    if (!this.loaded) {
      await this.load();
    }

    // Render widget if not already rendered
    if (!this.widgetId) {
      await this.render();
    }

    return new Promise((resolve, reject) => {
      if (!(window as any).turnstile) {
        reject(new Error('Turnstile not loaded'));
        return;
      }

      try {
        // Check if we already have a token from the callback
        if (this.pendingToken) {
          const token = this.pendingToken;
          this.pendingToken = null; // Clear it
          resolve(token);
          return;
        }

        // Try to get the response from the widget
        const token = (window as any).turnstile.getResponse(this.widgetId);
        if (token) {
          resolve(token);
          return;
        }

        // If no token yet, execute the widget and wait for callback

        // Wait for token with timeout
        const timeout = setTimeout(() => {
          reject(new Error('Turnstile token generation timeout'));
        }, 30000); // 30 second timeout

        // Poll for token (Turnstile will automatically show challenge if needed)
        const checkToken = () => {
          try {
            const token = (window as any).turnstile.getResponse(this.widgetId);
            if (token) {
              clearTimeout(timeout);
              resolve(token);
            } else {
              // Check again in 100ms
              setTimeout(checkToken, 100);
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        checkToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  isLoaded(): boolean {
    return this.loaded && !!(window as any).turnstile;
  }

  reset(): void {
    if ((window as any).turnstile && this.widgetId) {
      try {
        (window as any).turnstile.reset(this.widgetId);
        this.pendingToken = null;
      } catch (e) {
        console.error('Failed to reset Turnstile:', e);
      }
    }

    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
      this.containerElement = null;
    }

    if (this.scriptElement && this.scriptElement.parentNode) {
      this.scriptElement.parentNode.removeChild(this.scriptElement);
      this.scriptElement = null;
    }

    this.widgetId = null;
    this.pendingToken = null;
    this.loaded = false;
    delete (window as any).turnstile;
  }
}

/**
 * Mock CAPTCHA Provider for development/testing
 */
export class MockCaptchaProvider implements CaptchaProvider {
  private loaded = false;

  async load(): Promise<void> {
    this.loaded = true;
    return Promise.resolve();
  }

  async execute(action: string = 'login'): Promise<string> {
    this.loaded = true;
    // Return a mock token
    return Promise.resolve(`mock_captcha_token_${action}_${Date.now()}`);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  reset(): void {
    this.loaded = false;
  }
}

// Singleton instance
let captchaProvider: CaptchaProvider | null = null;

/**
 * Initialize CAPTCHA provider
 * @param siteKey - Cloudflare Turnstile site key (pass 'mock' for development)
 */
export function initCaptcha(siteKey: string): void {
  if (siteKey === 'mock' || !siteKey) {
    console.warn('Using mock CAPTCHA provider - NOT FOR PRODUCTION');
    captchaProvider = new MockCaptchaProvider();
  } else {
    captchaProvider = new CloudflareTurnstileProvider(siteKey);
  }
}

/**
 * Get the initialized CAPTCHA provider
 */
export function getCaptchaProvider(): CaptchaProvider {
  if (!captchaProvider) {
    throw new Error('CAPTCHA not initialized. Call initCaptcha() first.');
  }
  return captchaProvider;
}

/**
 * Check if CAPTCHA is initialized
 */
export function isCaptchaInitialized(): boolean {
  return captchaProvider !== null;
}

/**
 * Reset CAPTCHA provider
 */
export function resetCaptcha(): void {
  if (captchaProvider) {
    captchaProvider.reset();
    captchaProvider = null;
  }
}
