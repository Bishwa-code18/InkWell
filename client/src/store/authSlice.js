// store/authSlice.js — Authentication state
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// api is imported lazily inside each thunk to avoid circular dependency:
// store.js → authSlice → api.js → store.js
const getApi = () => import('../services/api').then(m => m.default);

// ── Async thunks ───────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.post('/auth/login', credentials);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.post('/auth/register', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    const api = await getApi();
    await api.post('/auth/logout');
  } catch { /* ignore */ }
  dispatch(logout());
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.get('/users/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateUserSettings = createAsyncThunk('auth/updateSettings', async (settings, { rejectWithValue }) => {
  try {
    const api = await getApi();
    const { data } = await api.put('/users/me/settings', settings);
    return data.settings;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ── Slice ──────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('accessToken') || null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    initialized: false, // whether we've checked auth on load
  },
  reducers: {
    setCredentials: (state, action) => {
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem('accessToken', action.payload.token);
      }
      if (action.payload.user) {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.initialized = true;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('accessToken');
      });

    // Update settings
    builder.addCase(updateUserSettings.fulfilled, (state, action) => {
      if (state.user) state.user.settings = action.payload;
    });
  },
});

export const { setCredentials, logout, updateUser, setInitialized } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;
export const selectDarkMode = (state) => state.auth.user?.settings?.darkMode ?? false;
export const selectContentDensity = (state) => state.auth.user?.settings?.contentDensity ?? 'classy';

export default authSlice.reducer;
