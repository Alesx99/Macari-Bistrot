import { useState } from 'react';
import { api } from '../api/client.js';

export default function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(password);
      onLogin?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bistrot-100">
      <form onSubmit={handleSubmit}
            className="card p-8 max-w-sm w-full">
        <h1 className="font-display text-3xl text-bistrot-800 text-center">Admin</h1>
        <p className="text-center text-sm text-bistrot-600 mt-1 mb-6">
          Inserisci la password per gestire il menù.
        </p>

        <label className="label" htmlFor="pwd">Password</label>
        <input
          id="pwd"
          type="password"
          autoFocus
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button type="submit" disabled={loading || !password}
                className="btn-primary w-full mt-6">
          {loading ? 'Accesso…' : 'Accedi'}
        </button>

      </form>
    </div>
  );
}
