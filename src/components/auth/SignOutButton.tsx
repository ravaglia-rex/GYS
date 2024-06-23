import React from 'react';
import {  signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import {auth} from '../../firebase/firebase';

const SignOutButton = () => {
    const navigate = useNavigate();
    const signOutUser = () => {
        signOut(auth).then(() => {
            navigate('/');
        }).catch((error) => {
            console.log(error);
        });
    }
    return (
        <button onClick={signOutUser}>Sign Out</button>
    )
}

export default SignOutButton;