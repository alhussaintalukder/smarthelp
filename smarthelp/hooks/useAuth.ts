/**
 * Auth hook — provides auth state and actions.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  login,
  register,
  logout,
  forgotPassword,
  clearError,
} from '@/store/slices/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const handleLogin = useCallback(
    (email: string, password: string) => {
      dispatch(login({ email, password }));
    },
    [dispatch]
  );

  const handleRegister = useCallback(
    (email: string, password: string, displayName: string) => {
      dispatch(register({ email, password, displayName }));
    },
    [dispatch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleForgotPassword = useCallback(
    (email: string) => {
      dispatch(forgotPassword(email));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...authState,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    forgotPassword: handleForgotPassword,
    clearError: handleClearError,
  };
}
