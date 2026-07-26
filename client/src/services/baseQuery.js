// services/baseQuery.js — Axios base query for RTK Query
import axios from 'axios';
import { logout, setCredentials } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let isRefreshing = false;

export const axiosBaseQuery = () => async ({ url, method = 'GET', data, params, headers }, api) => {
  try {
    const token = api.getState().auth.token;
    const result = await axios({
      url: `${API_URL}${url}`,
      method,
      data,
      params,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError;

    // Auto-refresh on 401
    if (err.response?.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        api.dispatch(setCredentials({ token: newToken }));
        // Retry original request with new token
        const retry = await axios({
          url: `${API_URL}${url}`,
          method,
          data,
          params,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...headers,
          },
        });
        return { data: retry.data };
      } catch {
        api.dispatch(logout());
      } finally {
        isRefreshing = false;
      }
    }

    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    };
  }
};
