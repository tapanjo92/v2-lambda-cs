'use client';

import { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '../../lib/cognito';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    setMsg('Verifying...');
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err, _result) => {
      if (err) {
        setMsg(err.message || JSON.stringify(err));
      } else {
        setVerified(true);
        setMsg('Email verified! You can now login.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Verify Email</h1>
        <input
          className="w-full mb-3 px-4 py-2 border rounded-xl"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-3 px-4 py-2 border rounded-xl"
          type="text"
          placeholder="Verification Code"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold"
          onClick={handleVerify}
        >
          Verify
        </button>
        <div className="mt-4 text-center text-sm text-gray-600">{msg}</div>
        {verified && (
          <div className="mt-2 text-center">
            <a href="/login" className="text-blue-700 underline">
              Proceed to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
