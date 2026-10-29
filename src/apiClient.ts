export const API_URL = '/api';

export const apiClient = {
  getToken() {
    return localStorage.getItem('token');
  },
  
  setToken(token: string) {
    localStorage.setItem('token', token);
  },
  
  clearToken() {
    localStorage.removeItem('token');
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

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

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
      let errorMsg = 'An error occurred';
      try {
         const errorData = await response.json();
         errorMsg = errorData.error || errorMsg;
      } catch (e) {
         errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }
};