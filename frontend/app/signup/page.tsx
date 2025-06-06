'use client';

import { useState, useMemo } from 'react';
import { userPool } from '../../lib/cognito';
import zxcvbn from 'zxcvbn';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  // For password strength
  const strengthResult = useMemo(() => zxcvbn(password), [password]);
  const passwordScore = strengthResult.score;
  const strengthMsg = [
    "Very weak",
    "Weak",
    "Fair",
    "Strong",
    "Very strong"
  ][passwordScore];
  const barWidth = (passwordScore + 1) * 20;
  const barColor = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-600"
  ][passwordScore];

  const handleSignup = () => {
    if (passwordScore < 2) {
      setMsg('Please use a stronger password.');
      return;
    }
    setMsg('Signing up...');
    userPool.signUp(email, password, [{ Name: 'email', Value: email }], [], err => {
      if (err) {
        setMsg(err.message || JSON.stringify(err));
      } else {
        setSignedUp(true);
        setMsg('Signup successful! Please check your email for a verification code.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign up</h1>
        <input
          className="w-full mb-3 px-4 py-2 border rounded-xl"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-1 px-4 py-2 border rounded-xl"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className={`mb-3 text-sm ${passwordScore < 2 ? "text-red-500" : "text-green-600"}`}> 
          Password strength: {strengthMsg}
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold"
          onClick={handleSignup}
        >
          Sign Up
        </button>
        <div className="mt-4 text-center text-sm text-gray-600">{msg}</div>
        {signedUp && (
          <div className="mt-2 text-center">
            <a href="/verify" className="text-blue-700 underline">
              Verify Email
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
