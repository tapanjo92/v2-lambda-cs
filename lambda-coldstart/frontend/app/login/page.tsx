'use client';

import { useState } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from '../../lib/cognito'; // Assuming this path is correct

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = () => {
    setMsg('Logging in...');
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        setMsg('Login successful!');
        // Optionally: redirect to dashboard here
        window.location.href = '/dashboard';
      },
      onFailure: (err) => {
        setMsg(err.message || JSON.stringify(err));
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign in</h1>
        <input
          className="w-full mb-3 px-4 py-2 border rounded-xl"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-3 px-4 py-2 border rounded-xl"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold"
          onClick={handleLogin}
        >
          Login
        </button>
        {/* START: Added Sign up link */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <a href="/signup" className="text-blue-700 underline">
            Need an account? Sign up
          </a>
        </div>
        {/* END: Added Sign up link */}
        <div className="mt-4 text-center text-sm text-gray-600">{msg}</div>
      </div>
    </div>
  );
}
