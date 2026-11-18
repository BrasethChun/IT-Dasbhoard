export const API_URL = '/api';

const USER_CACHE_KEY = 'auth_user_cache';

export const apiClient = {
  getToken() {
    return localStorage.getItem('token');
  },
  
  setToken(token: string) {
    localStorage.setItem('token', token);
    try {
      localStorage.setItem('auth_token_refreshed_at', String(Date.now()));
    } catch {}
  },

  getCachedUser<T = any>(): T | null {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  setCachedUser(user: any | null) {
    try {
      if (user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch {}
  },
  
  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem('auth_token_refreshed_at');
  },

  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {})
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default JSON headers if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const method = (options.method || 'GET').toUpperCase();
    const maxAttempts = method === 'GET' ? 3 : 1;
    let response: Response | null = null;
    let lastNetworkError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers
        });
        const isTransient = response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;
        if (isTransient && attempt < maxAttempts - 1) {
          const retryAfterSec = Number(response.headers.get('Retry-After'));
          const delayMs = response.status === 429
            ? Math.min(3500, (retryAfterSec > 0 ? retryAfterSec * 1000 : 1200 * (attempt + 1)))
            : 600 * (attempt + 1);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        lastNetworkError = null;
        break;
      } catch (networkErr: any) {
        lastNetworkError = networkErr;
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
          continue;
        }
      }
    }

    if (lastNetworkError || !response) {
      const err: any = new Error(lastNetworkError?.message || 'Unable to reach server');
      err.isNetworkError = true;
      throw err;
    }

    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid
      this.clearToken();
      if (!window.location.hash.includes('/public/notes/')) {
        if (window.location.hash && window.location.hash !== '#/login' && window.location.hash !== '#/signup') {
          window.location.hash = '#/login';
        }
      }
    }

    if (!response.ok) {
      let errorMsg = response.status === 429
        ? 'Rate limit temporarily exceeded. Please try again in a moment.'
        : response.status >= 500
          ? `Server temporarily unavailable (HTTP ${response.status})`
          : `Request failed (HTTP ${response.status})`;
      try {
         const errorData = await response.json();
         errorMsg = errorData.error || errorMsg;
      } catch (e) {
         if (response.statusText) {
           errorMsg = `${response.statusText} (HTTP ${response.status})`;
         }
      }
      const err: any = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    return response.json();
  }
};