// store/uiSlice.js — UI state (modals, dark mode, sidebar)
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    darkMode: false,
    activeModal: null, // 'login' | 'createPost' | 'createCommunity' | null
    searchQuery: '',
    contentDensity: 'classy', // 'classy' | 'compact' | 'gallery'
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      if (action.payload) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    openModal: (state, action) => { state.activeModal = action.payload; },
    closeModal: (state) => { state.activeModal = null; },
    setSearchQuery: (state, action) => { state.searchQuery = action.payload; },
    setContentDensity: (state, action) => { state.contentDensity = action.payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen, setDarkMode,
  openModal, closeModal, setSearchQuery, setContentDensity,
} = uiSlice.actions;

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectDarkMode = (state) => state.ui.darkMode;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectContentDensity = (state) => state.ui.contentDensity;

export default uiSlice.reducer;
