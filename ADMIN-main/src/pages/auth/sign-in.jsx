import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { login } from '../../store/slices/doctorSlice';

export function SignIn() {
  const [formData, setFormData] = useState({ adminEmailId: '', adminPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.doctor);

  useEffect(() => {
    if (error) toast.error(error);
    if (isAuthenticated) { toast.success('Welcome back!'); navigate('/dashboard/home'); }
  }, [error, isAuthenticated, navigate]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.adminEmailId || !formData.adminPassword) { toast.error('Please fill all fields'); return; }
    dispatch(login(formData.adminEmailId, formData.adminPassword));
  };

  const S = {
    page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#080d1a' },
    left: { width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(99,102,241,0.12)' },
    right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #080d1a 0%, #0c1628 100%)' },
    card: { width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '42px 38px', backdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 7 },
    input: { width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.92rem', color: 'white', background: 'rgba(255,255,255,0.05)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', marginBottom: 18 },
  };

  return (
    <div style={S.page}>
      <ToastContainer position="top-right" theme="dark" />

      {/* Left – Branding */}
      <div style={S.left} className="hidden lg:flex">
        {/* Background blobs */}
        {[
          { width: 500, height: 500, background: 'rgba(99,102,241,0.1)', top: -150, right: -120 },
          { width: 300, height: 300, background: 'rgba(16,185,129,0.07)', bottom: 20, left: -80 },
          { width: 200, height: 200, background: 'rgba(139,92,246,0.09)', top: '45%', left: '25%' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', ...b }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 76, height: 76, borderRadius: 22, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 10px 40px rgba(99,102,241,0.45)', fontSize: 34 }}>📄</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'white', margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Advanced Digital<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Archive System</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 40, fontSize: '0.92rem' }}>
            Secure admin access to manage, organize, and share documents across your organization.
          </p>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[{ v: '256-bit', l: 'Encryption' }, { v: '99.9%', l: 'Uptime' }, { v: 'RBAC', l: 'Access Control' }].map(s => (
              <div key={s.l} style={{ padding: '16px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8', marginBottom: 4 }}>{s.v}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right – Form */}
      <div style={S.right}>
        <div style={S.card}>
          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 30 }} className="lg:hidden">
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 10 }}>📄</div>
            <h2 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '1.2rem' }}>DMS Admin</h2>
          </div>

          <div style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Welcome back</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', margin: 0, fontSize: '0.88rem' }}>Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={S.label}>Email Address</label>
            <input name="adminEmailId" type="email" placeholder="admin@company.com" value={formData.adminEmailId} onChange={handleChange}
              style={S.input} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />

            <label style={S.label}>Password</label>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <input name="adminPassword" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={formData.adminPassword} onChange={handleChange}
                style={{ ...S.input, marginBottom: 0, paddingRight: 46 }}
                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link to="/auth/forgot-password" style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: loading ? 'rgba(99,102,241,0.35)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 24px rgba(99,102,241,0.5)', letterSpacing: '0.02em', fontFamily: 'inherit' }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.86rem', color: 'rgba(255,255,255,0.35)' }}>
            Don't have an account?{' '}
            <Link to="/auth/sign-up" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
