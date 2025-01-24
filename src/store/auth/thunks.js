import { checkingCredentials, login, logout } from "./authSlice";

export const checkingAuthentication = () => {
  return async (dispatch) => {
    dispatch(checkingCredentials());
  };
};

export const startRegister = (payload) => {
  return async (dispatch) => {
    dispatch(checkingCredentials());
    dispatch(login(payload));
  };
};

export const startLogout = () => {
  return async (dispatch) => {
    dispatch(logout());
  };
};
