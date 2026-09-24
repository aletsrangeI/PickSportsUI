import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, useRegisterMutation } from '../services/api';
import { setCredentials } from '../store/authSlice';

export const useAuthForm = (defaultEmail: string = '') => {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unclaimedAccount, setUnclaimedAccount] = useState<{
    token: string;
    alias: string;
  } | null>(null);
  const [isSuccessRegistered, setIsSuccessRegistered] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{
    username: string;
    email: string;
    displayName?: string;
  } | null>(null);

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUnclaimedAccount(null);

    try {
      const response = await loginMutation({ email, password }).unwrap();
      if (response.isSuccess && response.data) {
        dispatch(setCredentials(response.data));
        navigate('/', { replace: true });
      } else {
        setErrorMessage(response.message || 'Error al iniciar sesión.');
      }
    } catch (err: any) {
      const unclaimedError = err?.data?.errors?.find(
        (e: any) => e.propertyName === 'UNCLAIMED_ACCOUNT'
      );
      if (unclaimedError) {
        const aliasError = err?.data?.errors?.find((e: any) => e.propertyName === 'Alias');
        setUnclaimedAccount({
          token: unclaimedError.errorMessage,
          alias: aliasError?.errorMessage || email,
        });
        setErrorMessage(err.data.message);
      } else {
        setErrorMessage(
          err?.data?.message || 'Credenciales incorrectas o error en el servidor.'
        );
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const response = await registerMutation({
        email,
        username,
        password,
        displayName: displayName || undefined,
      }).unwrap();

      if (response.isSuccess) {
        setIsSuccessRegistered(true);
        setRegisteredUser({
          username,
          email,
          displayName: displayName || undefined,
        });
      } else {
        setErrorMessage(response.message || 'Error al registrarse.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.data?.message || 'Error en el registro. Verifique sus datos.'
      );
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    displayName,
    setDisplayName,
    errorMessage,
    unclaimedAccount,
    isSuccessRegistered,
    registeredUser,
    isLoading: isLoginLoading || isRegisterLoading,
    handleLogin,
    handleRegister,
  };
};
