import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth';

const authService = {
  register: async (name, email, password, passwordConfirm) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        passwordConfirm
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await axios.post(`${API_URL}/verify-email`, { token });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email verification failed'
      };
    }
  },

  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      if (response.data.success) {
        // Token is in response.data.data (nested structure)
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('✅ Token stored:', response.data.data.accessToken.substring(0, 20) + '...');
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  logout: async () => {
    const token = localStorage.getItem('accessToken');

    // Call backend logout endpoint to clear image history
    if (token) {
      try {
        await axios.post(`${API_URL}/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Continue clearing local storage even if API call fails
      }
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken
      });

      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      authService.logout();
      return {
        success: false,
        message: 'Session expired'
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed'
      };
    }
  },

  resetPassword: async (token, password, passwordConfirm) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        token,
        password,
        passwordConfirm
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed'
      };
    }
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return null;
      }

      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  getAuthToken: () => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: () => {
    return localStorage.getItem('accessToken') !== null;
  }
};

export default authService;
