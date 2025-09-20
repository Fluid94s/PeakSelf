import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setMsg('Check your email for a verification link (or server logs in dev).');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const googleRegister = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <h2 className="text-4xl font-bold mb-3">Create your account</h2>
          <p className="text-gray-600 mb-6">Sign up and get the best of PeakSelf tailored to you.</p>
          <div className="bg-gray-50 p-6 rounded-2xl shadow">
            <p className="text-gray-700">We'll email you a verification link to confirm your account.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">P</div>
            <div>
              <h1 className="text-2xl font-bold">Create account</h1>
              <p className="text-gray-600 text-sm">Join PeakSelf in seconds</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="w-full" type="submit">Create account</button>
          </form>
          <div className="mt-4">
            <button className="w-full" onClick={googleRegister}>Continue with Google</button>
          </div>
          {msg && <p className="mt-4 text-gray-700 text-center">{msg}</p>}
        </div>
      </div>
    </div>
  );
}


