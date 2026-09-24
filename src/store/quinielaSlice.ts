import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface QuinielaState {
  activeQuinielaId: number | null;
}

const savedActiveId = localStorage.getItem('picksports_active_quiniela');

const initialState: QuinielaState = {
  activeQuinielaId: savedActiveId ? parseInt(savedActiveId, 10) : null,
};

const quinielaSlice = createSlice({
  name: 'quiniela',
  initialState,
  reducers: {
    setActiveQuinielaId: (state, action: PayloadAction<number>) => {
      state.activeQuinielaId = action.payload;
      localStorage.setItem('picksports_active_quiniela', action.payload.toString());
    },
    clearActiveQuiniela: (state) => {
      state.activeQuinielaId = null;
      localStorage.removeItem('picksports_active_quiniela');
    },
  },
});

export const { setActiveQuinielaId, clearActiveQuiniela } = quinielaSlice.actions;
export default quinielaSlice.reducer;
