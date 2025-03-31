import React from 'react';
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { useDispatch } from 'react-redux';
import { clearReduxState } from '../../functions/redux_state/redux_state_functions';

import * as Sentry from '@sentry/react';
import authTokenHandler from '../../functions/auth_token/auth_token_handler';

const SignOutButton: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signOutUser = () => {
    signOut(auth).then(() => {
      clearReduxState(dispatch);
      localStorage.removeItem('currentFormId');
      localStorage.removeItem('isProctored');
      authTokenHandler.clearToken();

      navigate('/');
    }).catch((error) => {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'SignOutButton.signOutUser');
        Sentry.captureException(error);
      });
      console.log(error);
    });
  };

  return (
    <button onClick={signOutUser}>Sign Out</button>
  );
};

export default SignOutButton;