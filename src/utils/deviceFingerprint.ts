/**
 * Device Fingerprinting
 * Creates a unique identifier for the user's device/browser
 */

export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  hardwareConcurrency: number;
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to simple hash if crypto API not available
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}

/**
 * Canvas fingerprinting
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello, Device! 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprinting', 4, 35);

    const dataURL = canvas.toDataURL();
    return await hashString(dataURL);
  } catch {
    return 'canvas-error';
  }
}

/**
 * WebGL fingerprinting
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

/**
 * Audio context fingerprinting
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(0);

    return new Promise((resolve) => {
      let hasResolved = false;
      let timeoutId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (hasResolved) return;
        hasResolved = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        try {
          oscillator.stop();
        } catch (e) {
          // Oscillator may already be stopped
        }

        try {
          scriptProcessor.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }

        // Close AudioContext only if not already closed
        if (context.state !== 'closed') {
          context.close().catch(() => {
            // Silently handle close errors
          });
        }
      };

      scriptProcessor.onaudioprocess = function (event: any) {
        if (hasResolved) return;

        const output = event.inputBuffer.getChannelData(0);
        const outputArray: number[] = Array.from(output.slice(0, 30));
        const hash = outputArray
          .reduce((acc: number, val: number) => acc + Math.abs(val), 0)
          .toString();

        cleanup();
        resolve(hash);
      };

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!hasResolved) {
          cleanup();
          resolve('audio-timeout');
        }
      }, 1000);
    });
  } catch (error) {
    console.warn('Audio fingerprinting failed:', error);
    return 'audio-error';
  }
}

/**
 * Generate a unique device fingerprint
 */
export async function getDeviceFingerprint(): Promise<DeviceInfo> {
  const components: string[] = [];

  // Browser and system info
  components.push(navigator.userAgent);
  components.push(navigator.platform);
  components.push(navigator.language);
  components.push(String(screen.colorDepth));
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.availWidth}x${screen.availHeight}`);
  components.push(String(new Date().getTimezoneOffset()));
  components.push(String(navigator.hardwareConcurrency || 0));

  // Storage support
  components.push(String(!!window.sessionStorage));
  components.push(String(!!window.localStorage));
  components.push(String(!!window.indexedDB));

  // Canvas fingerprinting
  const canvasFingerprint = await getCanvasFingerprint();
  components.push(canvasFingerprint);

  // WebGL fingerprinting
  const webglFingerprint = getWebGLFingerprint();
  components.push(webglFingerprint);

  // Audio context fingerprinting
  const audioFingerprint = await getAudioFingerprint();
  components.push(audioFingerprint);

  // Generate hash from all components
  const fingerprint = await hashString(components.join('|||'));

  return {
    fingerprint,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
  };
}

/**
 * Store device fingerprint
 */
export function storeDeviceFingerprint(fingerprint: string): void {
  try {
    localStorage.setItem('device_fingerprint', fingerprint);
    localStorage.setItem(
      'device_fingerprint_created',
      new Date().toISOString(),
    );
  } catch (error) {
    console.error('Failed to store device fingerprint:', error);
  }
}

/**
 * Get stored device fingerprint
 */
export function getStoredDeviceFingerprint(): string | null {
  try {
    return localStorage.getItem('device_fingerprint');
  } catch {
    return null;
  }
}

/**
 * Validate device fingerprint matches stored value
 */
export async function validateDeviceFingerprint(): Promise<boolean> {
  try {
    const stored = getStoredDeviceFingerprint();
    if (!stored) return true; // First time, no validation needed

    const current = await getDeviceFingerprint();
    return stored === current.fingerprint;
  } catch (error) {
    console.error('Failed to validate device fingerprint:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
}
