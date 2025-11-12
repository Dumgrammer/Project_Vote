import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { LoginCredentials, RegisterData } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Login Hook
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthContext();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response) => {
      // Backend returns: { status: "success", data: { message, user }, statusCode: 200 }
      const user = response?.data?.user;
      
      if (user) {
        // Store user in query cache
        queryClient.setQueryData(['user'], user);
        
        // Update auth context
        setAuthUser(user);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error('Invalid response structure:', response);
      }
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      // Error handling is done in the component
    },
  });
};

// Register Hook
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthContext();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      // Backend returns: { status: "success", data: { message, user }, statusCode: 201 }
      const user = response?.data?.user;
      
      if (user) {
        // Store user in query cache
        queryClient.setQueryData(['user'], user);
        
        // Update auth context
        setAuthUser(user);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error('Invalid response structure:', response);
      }
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
    },
  });
};

// Logout Hook
export const useLogout = () => {
  const { logout: authLogout } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      
      // Trigger auth context logout (will navigate)
      authLogout();
    },
    onError: (error: any) => {
      console.error('Logout failed:', error);
      // Still logout from context even if API fails
      authLogout();
    },
  });
};

// Check Session Hook (for protected routes)
export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => authService.checkSession(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Check Auth Hook (alternative)
export const useAuthCheck = () => {
  return useQuery({
    queryKey: ['auth'],
    queryFn: () => authService.checkAuth(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Get Current User Hook
export const useCurrentUser = () => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(['user']);
};

