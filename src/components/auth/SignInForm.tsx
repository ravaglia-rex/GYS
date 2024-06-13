import React, { useEffect } from 'react';
import { UserCredential, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const SignInPage: React.FC = () => {
    const navigate = useNavigate();
    const {toast} = useToast();
    const form = useForm({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const enterFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/camera-microphone-access');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const signIn = (data: z.infer<typeof signinSchema>) => {
        signInWithEmailAndPassword(auth, data.email, data.password)
            .then((userCredential: UserCredential) => {
                if(!userCredential.user.emailVerified) {
                    toast({
                        variant: 'destructive',
                        title: 'Email not verified',
                        description: 'Please verify your email to continue.',
                    });
                    signOut(auth).then(() => {
                        navigate('/login');
                    }
                    ).catch((error) => {
                        console.log(error);
                    });
                    return;
                }
                toast({
                    variant: 'default',
                    title: 'Signed in successfully!',
                    description: `Welcome back, ${userCredential.user.email}`,
                });
                enterFullScreen();
                navigate('/camera-microphone-access');
            })
            .catch((error) => {
                toast({
                    variant: 'destructive',
                    title: 'Uh oh! Something went wrong.',
                    description: error.message || 'An error occurred while signing in. Please try again.',
                });
            });
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat"
            style={{ backgroundImage: `url(/assets/sign-in-background.jpg)` }}
        >
            <div className="bg-white bg-opacity-75 backdrop-filter backdrop-blur-lg p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6">Sign in to Argus</h2>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(signIn)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="hello@argus.ai" {...field} />
                                    </FormControl>
                                    <FormDescription>We'll never share your email.</FormDescription>
                                    <FormMessage>{form.formState.errors.email?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormDescription>Shhhhhh</FormDescription>
                                    <FormMessage>{form.formState.errors.password?.message}</FormMessage>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                            Sign In
                        </Button>
                    </form>
                </Form>
                <p className="text-sm text-center text-gray-600 mt-4">
                    No account yet?{' '}
                    <NavLink to="/signup" className="text-green-600 hover:underline">Sign up</NavLink>
                </p>
            </div>
        </div>
    );
};

export default SignInPage;
