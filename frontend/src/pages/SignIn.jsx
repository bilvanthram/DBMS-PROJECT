import { useState } from 'react';
import { LockKeyhole, Mail } from 'lucide-react';
import { LogoMark } from '../components/Navbar.jsx';
import { loginUser } from '../services/api.js';

export function SignIn({ onAuth, onSignUp }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const submit = async () => {
    try {
      const payload = await loginUser(form);
      onAuth(payload);
      setMessage('Signed in');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card compact-auth">
        <div className="auth-card-header">
          <h1>Login</h1>
          <div className="auth-logo">
            <LogoMark />
            <span><strong>ReportFlow</strong></span>
          </div>
        </div>

        <form>
          <Input label="Email*" icon={Mail} placeholder="Enter email id" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <Input label="Password*" icon={LockKeyhole} type="password" placeholder="Enter password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          <button className="forgot-link" type="button">Forgot Password?</button>
          {message && <div className="auth-message">{message}</div>}
          <button className="primary-action full" type="button" onClick={submit}>Let&apos;s start</button>
        </form>

        <p className="auth-switch">Don&apos;t have an account? <button type="button" onClick={onSignUp}>Sign up</button></p>
        <p className="copyright">Copyright © 2026. All rights reserved.</p>
      </section>
    </main>
  );
}

function Input({ label, icon: Icon, type = 'text', placeholder, value, onChange }) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <div className="input-shell">
        <Icon size={17} />
        <input type={type} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}
