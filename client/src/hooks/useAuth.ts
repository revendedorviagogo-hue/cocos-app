import { useCallback, useEffect, useState } from 'react';
import { cocosAPI, LoginResponse } from '@/lib/api';
import { useLocation } from 'wouter';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [, navigate] = useLocation();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Verificar se já está autenticado ao montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await cocosAPI.isAuthenticated();
        if (isAuth) {
          const profile = await cocosAPI.getUserProfile();
          setState({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const response: LoginResponse = await cocosAPI.login(email, password);

        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        navigate('/home', { replace: true });
        return response.data.user;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao fazer login';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
    }));

    try {
      await cocosAPI.logout();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await cocosAPI.getUserProfile();
      setState((prev) => ({
        ...prev,
        user: profile,
      }));
      return profile;
    } catch (err) {
      console.error('Profile refresh error:', err);
      throw err;
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshProfile,
  };
};
