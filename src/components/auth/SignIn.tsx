import React, {useState} from 'react';
import { UserCredential, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../firebase/firebase';
import { NavLink, useNavigate } from 'react-router-dom'
 
const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const auth = getAuth(app);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
       
    const signIn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password).then((userCredential: UserCredential) => {
            navigate('/');
        }).catch((error) => {
            console.log(error);
        });
    };
 
    return (
        <div className="login-container">
            <h1>Login</h1>
            <form>
                <div>
                    <label htmlFor="email-address">
                        Email address
                    </label>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        required             
                        placeholder="Email address"
                        onChange={(e)=>setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="Password"
                        onChange={(e)=>setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        onClick={signIn}
                    >
                        Login
                    </button>
                </div>
            </form>
            <p className="text-sm text-white text-center">
                No account yet? {' '}
                <NavLink to="/signup">
                    Sign up
                </NavLink>
            </p>
        </div>
    );
}

export default SignInPage