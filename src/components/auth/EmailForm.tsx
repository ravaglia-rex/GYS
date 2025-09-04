// import React, { useState, useEffect } from 'react';
// import { checkEmailExists } from '../../db/emailMappingCollection';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../../firebase/firebase';
// import { useNavigate } from 'react-router-dom';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';

// import {
//     Form,
//     FormControl,
//     FormDescription,
//     FormField,
//     FormItem,
//     FormLabel,
//     FormMessage,
// } from '../ui/form';

// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { useToast } from '../ui/use-toast';
// import { LoadingSpinner as Spinner } from '../ui/spinner';

// import * as Sentry from '@sentry/react';
// import analytics from '../../segment/segment';

// interface EmailEntryFormProps {
//     setEmail: (email: string) => void;
//     setEmailExists: (emailExists: boolean|null) => void;
// }

// const EmailSchema = z.object({
//     email: z.string().email().min(1, 'Email is required'),
// })

// const EmailEntryForm: React.FC<EmailEntryFormProps> = ({ setEmail, setEmailExists }) => {
//     const { toast } = useToast();
//     const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
//     const navigate = useNavigate();
//     const form = useForm({
//         resolver: zodResolver(EmailSchema),
//         defaultValues: {
//             email: '',
//         },
//     });

//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, (user) => {
//             if (user) {
//                 navigate('/dashboard');
//             }
//         });
//         return () => unsubscribe();
//     }, [navigate]);

//     const onSubmit = async (data: z.infer<typeof EmailSchema>) => {
//         setIsSubmitted(true);
//         try {
//             // Special case for school admin - bypass all auth
//             if (data.email.toLowerCase() === 'srishti2k1@gmail.com') {
//                 setEmail(data.email.toLowerCase());
//                 setEmailExists(true);
//                 // Navigate directly to school admin dashboard
//                 navigate('/school-admin/dashboard');
//                 return;
//             }

//             const emailExists = await checkEmailExists(data.email.toLowerCase());
//             setEmail(data.email.toLowerCase());
//             setEmailExists(emailExists);
//             if(!emailExists) {
//                 analytics.track('[DIRECT] New User Flow', {
//                     email: data.email,
//                 });
//             }
//         } catch (error) {
//             Sentry.withScope((scope) => {
//                 scope.setTag('location', 'EmailEntryForm.onSubmit');
//                 scope.setExtra('email', data.email);
//                 Sentry.captureException(error);
//             });
//             toast({
//                 variant: 'destructive',
//                 title: 'Whoops!',
//                 description: 'There was an issue checking your email. Please try again later or email us at talentsearch@argus.ai',
//                 duration: 2000,
//             });
//         } finally {
//             setIsSubmitted(false);
//         }
//     };

//     return (
//         <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
//             <div className="mb-6">
//                 <h2 className="text-2xl font-semibold">Welcome to Argus</h2>
//                 <p className="mt-1 text-sm text-gray-400">Sign in to continue to your exam portal</p>
//             </div>
//             <Form {...form}>
//                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//                     <FormField
//                         control={form.control}
//                         name="email"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel className="text-sm text-gray-300">Email address</FormLabel>
//                                 <FormControl>
//                                     <Input className="bg-gray-900/60 border-white/10 focus-visible:ring-gray-600 placeholder:text-gray-500" type="email" placeholder="you@school.edu" {...field} />
//                                 </FormControl>
//                                 <FormDescription className="text-xs text-gray-500">We'll never share your email.</FormDescription>
//                                 <FormMessage>{form.formState.errors.email?.message}</FormMessage>
//                             </FormItem>
//                         )}
//                     />
//                     <Button type="submit" disabled={isSubmitted} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex justify-center items-center">
//                         {isSubmitted ? <Spinner /> : 'Continue'}
//                     </Button>
//                 </form>
//             </Form>
//         </div>
//     );
// };

// export default EmailEntryForm;

import React, { useState, useEffect } from 'react';
import { checkEmailExists } from '../../db/emailMappingCollection';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { LoadingSpinner as Spinner } from '../ui/spinner';

import * as Sentry from '@sentry/react';
import analytics from '../../segment/segment';

import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

const EmailSchema = z.object({
  email: z.string().email().min(1, 'Email is required'),
})

const EmailEntryForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState<boolean|null>(null);

  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/dashboard');
    });
    return () => unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: z.infer<typeof EmailSchema>) => {
    setIsSubmitted(true);
    try {
      if (data.email.toLowerCase() === 'srishti2k1@gmail.com') {
        setEmail(data.email.toLowerCase());
        setEmailExists(true);
        navigate('/school-admin/dashboard');
        return;
      }

      const exists = await checkEmailExists(data.email.toLowerCase());
      setEmail(data.email.toLowerCase());
      setEmailExists(exists);

      if (!exists) {
        analytics.track('[DIRECT] New User Flow', { email: data.email });
      }
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'EmailEntryForm.onSubmit');
        scope.setExtra('email', data.email);
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Whoops!',
        description: 'There was an issue checking your email. Please try again later.',
        duration: 2000,
      });
    } finally {
      setIsSubmitted(false);
    }
  };

  // 🔑 decide what to render
  if (emailExists === true) {
    return <SignInForm email={email} />;
  }

  if (emailExists === false) {
    return <SignUpForm email={email} setEmailExists={setEmailExists} />;
  }

  // Default: show email entry form
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900/60 to-gray-900/40 backdrop-blur-xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Welcome to Argus</h2>
        <p className="mt-1 text-sm text-gray-400">Sign in to continue to your exam portal</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-300">Email address</FormLabel>
                <FormControl>
                  <Input
                    className="bg-gray-900/60 border-white/10 focus-visible:ring-purple-600 placeholder:text-gray-500 text-white"
                    type="email"
                    placeholder="you@school.edu"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-gray-500">
                  We'll never share your email.
                </FormDescription>
                <FormMessage className="text-red-400">{form.formState.errors.email?.message}</FormMessage>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isSubmitted} 
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex justify-center items-center"
          >
            {isSubmitted ? <Spinner /> : 'Continue'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EmailEntryForm;
