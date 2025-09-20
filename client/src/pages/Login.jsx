import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setMsg('Logged in');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const googleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="hero-section">
        <div className="container">
          <div className="py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h1 className="hero-title md:text-5xl">Welcome back</h1>
                <p className="hero-subtitle" style={{margin: '0 auto 1.5rem auto'}}>Pick up where you left off. Your insights await.</p>
                <div className="bg-white text-gray-700 rounded-lg shadow p-4 inline-block">
                  <span className="font-semibold">Tip:</span> In development, verification links are printed in the server console.
                </div>
              </div>
              <div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">P</div>
                    <div>
                      <h2 className="text-2xl font-bold">Sign in</h2>
                      <p className="text-gray-600 text-sm">to your PeakSelf account</p>
                    </div>
                  </div>

                  <button onClick={googleLogin} className="w-full mb-4">
                    Continue with Google
                  </button>

                  <div className="flex items-center mb-4">
                    <div className="flex-1 h-0.5 bg-gray-200" />
                    <span className="px-3 text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-0.5 bg-gray-200" />
                  </div>

                  <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                      <label className="text-gray-700 mb-2 block">Email</label>
                      <input className="w-full" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-gray-700 mb-2 block">Password</label>
                      <input className="w-full" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button className="w-full" type="submit">Login</button>
                  </form>

                  <p className="text-gray-600 mt-4" style={{textAlign:'center'}}>New here? <a href="/register">Create an account</a></p>
                  {msg && <p className="mt-3 text-gray-700 text-center">{msg}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


