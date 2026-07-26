// hooks/useAuth.js — Authentication hook
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { selectUser, selectIsAuthenticated, selectAuthLoading, loginUser, logoutUser, registerUser } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);

  const login = useCallback((credentials) => dispatch(loginUser(credentials)), [dispatch]);
  const register = useCallback((data) => dispatch(registerUser(data)), [dispatch]);
  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  return { user, isAuthenticated, isLoading, login, register, logout };
};
