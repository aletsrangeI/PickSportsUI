import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    status: "unauthenticated",
    userId: null,
    email: null,
    nombres: null,
    photoURL: null,
    authToken: null,
  },

  reducers: {
    login: (state, { payload }) => {
      console.log(payload);
      state.status = "authenticated";
      state.userId = payload.userId;
      state.email = payload.email;
      state.nombres = `${payload.nombres} ${payload.apellidos}`;
      state.photoURL = "";
      state.authToken = payload.token;
    },

    logout: (state, { payload }) => {
      state.status = "unauthenticated";
      state.userId = null;
      state.email = null;
      state.nombres = null;
      state.photoURL = null;
      state.token = null;
    },

    checkingCredentials: (state, payload) => {
      state.status = "checking";
    },
  },
});

export const { login, logout, checkingCredentials } = authSlice.actions;
