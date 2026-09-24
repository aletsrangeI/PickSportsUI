import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../types';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
}

const savedToken = localStorage.getItem('picksports_token');
let savedUser: UserProfile | null = null;
try {
  const userJson = localStorage.getItem('picksports_user');
  if (userJson) {
    savedUser = JSON.parse(userJson);
  }
} catch {
  savedUser = null;
}

const initialState: AuthState = {
  token: savedToken,
  user: savedUser,
  isAuthenticated: Boolean(savedToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: UserProfile }>
    ) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem('picksports_token', token);
      localStorage.setItem('picksports_user', JSON.stringify(user));
    },
    updateUser: (state, action: PayloadAction<UserProfile>) => {
      state.user = action.payload;
      localStorage.setItem('picksports_user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('picksports_token');
      localStorage.removeItem('picksports_user');
      localStorage.removeItem('picksports_active_quiniela');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
