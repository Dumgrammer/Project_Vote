import axiosInstance from '../config/axios';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fname: string;
  mname?: string;
  lname: string;
  rules?: Record<string, boolean>;
}

export interface User {
  id: number;
  email: string;
  fname: string;
  mname?: string;
  lname: string;
  fullname?: string;
  rules: Record<string, boolean> | [];
  date_created?: string;
}

export interface AuthResponse {
  status: string;
  data: {
    message: string;
    user: User;
  };
  statusCode: number;
}

export interface SessionResponse {
  status: string;
  data: {
    logged_in: boolean;
    user: User;
  };
  statusCode: number;
}

// API calls
export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/login', {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/register', data);
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ status: string; message: string }> => {
    const response = await axiosInstance.post('/logout');
    return response.data;
  },

  // Check session
  checkSession: async (): Promise<SessionResponse> => {
    try {
      const response = await axiosInstance.get('/session');
      // Ensure we always return a valid response
      if (response.data) {
        return response.data;
      }
      // Fallback if data structure is unexpected
      return {
        status: 'error',
        data: { logged_in: false, user: {} as User },
        statusCode: 401
      };
    } catch (error) {
      // If there's an error, return logged out state instead of undefined
      return {
        status: 'error',
        data: { logged_in: false, user: {} as User },
        statusCode: 401
      };
    }
  },

  // Check auth (alternative endpoint)
  checkAuth: async (): Promise<SessionResponse> => {
    try {
      const response = await axiosInstance.get('/check-auth');
      // Ensure we always return a valid response
      if (response.data) {
        return response.data;
      }
      // Fallback if data structure is unexpected
      return {
        status: 'error',
        data: { logged_in: false, user: {} as User },
        statusCode: 401
      };
    } catch (error) {
      // If there's an error, return logged out state instead of undefined
      return {
        status: 'error',
        data: { logged_in: false, user: {} as User },
        statusCode: 401
      };
    }
  },
};

