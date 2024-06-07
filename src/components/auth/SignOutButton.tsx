import React from 'react';
import {  getAuth, signOut } from "firebase/auth";
import { app } from "../../firebase/firebase";
import { useNavigate } from 'react-router-dom';

const SignOutButton = () => {
    const navigate = useNavigate();
    const auth = getAuth(app);
    const signOutUser = () => {
        signOut(auth).then(() => {
            navigate('/login');
        }).catch((error) => {
            console.log(error);
        });
    }
    return (
        <button onClick={signOutUser}>Sign Out</button>
    )
}

export default SignOutButton;