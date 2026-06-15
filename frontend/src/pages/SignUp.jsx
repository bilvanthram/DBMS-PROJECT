import { useState } from 'react';
import { LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { LogoMark } from '../components/Navbar.jsx';
import { registerUser } from '../services/api.js';

export function SignUp({ onAuth, onSignIn }) {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ANALYST',
  });
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const payload = await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      onAuth(payload);
      setMessage('Account created');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <main className="auth-screen">
      <section className="auth-card signup-card">
        <div className="auth-card-header">
          <h1>Create Account</h1>
          <div className="auth-logo">
            <LogoMark />
            <span><strong>ReportFlow</strong></span>
          </div>
        </div>

        <form>
          <Input label="Full Name*" icon={UserRound} placeholder="Enter full name" value={form.fullName} onChange={(value) => update('fullName', value)} />
          <Input label="Mobile Number*" icon={Phone} placeholder="Enter mobile number" value={form.mobile} onChange={(value) => update('mobile', value)} />
          <Input label="Email Address*" icon={Mail} placeholder="Enter email id" value={form.email} onChange={(value) => update('email', value)} />
          <Input label="Password*" icon={LockKeyhole} type="password" placeholder="Enter password" value={form.password} onChange={(value) => update('password', value)} />
          <Input label="Re-type Password*" icon={LockKeyhole} type="password" placeholder="Re-type your password" value={form.confirmPassword} onChange={(value) => update('confirmPassword', value)} />
          {message && <div className="auth-message">{message}</div>}
          <button className="primary-action full" type="button" onClick={submit}>Register</button>
        </form>

        <p className="auth-switch">Already have an account? <button type="button" onClick={onSignIn}>Sign in</button></p>
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
