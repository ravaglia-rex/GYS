import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserCredential, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../../firebase/firebase";
import { getAuth } from "firebase/auth";

const SignUpPage = () => {
    const auth = getAuth(app);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = async (e:React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential: UserCredential)=> {
                console.log(userCredential.user);
                navigate('/account-creation-success');
            }).catch((error) => {
                console.log(error);
            })
    }

    return (
        <div className="sign-up-container">
            <div className='title-sign-up'>
                <h2>Create Account</h2>
            </div>
            <form>
                <div className="form-group">
                    <label htmlFor="email">
                        Email Address
                    </label>
                    <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">
                        Password
                    </label>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Password"
                    />
                </div>
                <button
                    type="submit"
                    onClick={onSubmit}
                >
                    Sign Up
                </button>
                <p>
                    Already have an account? {" "}
                    <NavLink to="/login">
                        Sign in
                    </NavLink>
                </p>
            </form>
        </div>
    )
}

export default SignUpPage;