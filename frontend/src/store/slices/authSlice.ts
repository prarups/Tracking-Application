import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Group } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  selectedGroup: Group | null;
  isAuthenticated: boolean;
}

const initialUser = localStorage.getItem('user_data')
  ? JSON.parse(localStorage.getItem('user_data')!)
  : null;

const initialGroup = localStorage.getItem('selected_group')
  ? JSON.parse(localStorage.getItem('selected_group')!)
  : null;

const initialState: AuthState = {
  user: initialUser,
  accessToken: localStorage.getItem('access_token'),
  selectedGroup: initialGroup,
  isAuthenticated: !!localStorage.getItem('access_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; access: string; refresh: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload.access);
      localStorage.setItem('refresh_token', action.payload.refresh);
      localStorage.setItem('user_data', JSON.stringify(action.payload.user));
    },
    setSelectedGroup: (state, action: PayloadAction<Group | null>) => {
      state.selectedGroup = action.payload;
      if (action.payload) {
        localStorage.setItem('selected_group', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('selected_group');
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.selectedGroup = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('selected_group');
    },
  },
});

export const { setCredentials, setSelectedGroup, logout } = authSlice.actions;
export default authSlice.reducer;
