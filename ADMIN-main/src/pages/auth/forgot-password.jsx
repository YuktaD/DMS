import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  sendForgotPasswordOTP,
  verifyOTPAndResetPassword,
  clearAllForgotResetPassErrors,
} from '../../store/slices/forgotResetPasswordSlice';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message, codeSent, codeVerified } = useSelector(
    (s) => s.forgotPassword
  );

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const otpRefs = useRef([]);

  // Move to step 2 when OTP is sent successfully
  useEffect(() => {
    if (codeSent && step === 1) {
      setStep(2);
      toast.success('OTP sent! Check your email.');
    }
  }, [codeSent]);

  // Redirect to login when password reset done
  useEffect(() => {
    if (codeVerified) {
      toast.success('Password reset successfully! Please sign in.');
      setTimeout(() => {
        dispatch(clearAllForgotResetPassErrors());
        navigate('/auth/sign-in');
      }, 1800);
    }
  }, [codeVerified]);

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAllForgotResetPassErrors());
    }
  }, [error]);

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    dispatch(sendForgotPasswordOTP(email.trim()));
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Please enter the complete 6-digit OTP'); return; }
    if (!newPass || newPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return; }
    dispatch(verifyOTPAndResetPassword(email.trim(), code, newPass));
  };

  const S = {
    page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#080d1a' },
    left: { width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(99,102,241,0.12)' },
    right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #080d1a 0%, #0c1628 100%)' },
    card: { width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px', backdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 7 },
    input: { width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.92rem', color: 'white', background: 'rgba(255,255,255,0.05)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', marginBottom: 18 },
    primaryBtn: (dis) => ({
      width: '100%', padding: '14px', border: 'none', borderRadius: 12,
      background: dis ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white', fontWeight: 700, fontSize: '0.95rem',
      cursor: dis ? 'not-allowed' : 'pointer',
      boxShadow: dis ? 'none' : '0 4px 24px rgba(99,102,241,0.45)',
      fontFamily: 'inherit', letterSpacing: '0.02em',
    }),
  };
  const onFocus = (e) => (e.target.style.borderColor = '#6366f1');
  const onBlur = (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  return (
    <div style={S.page}>
      <ToastContainer position="top-right" theme="dark" autoClose={4000} />

      {/* ── Left branding panel ── */}
      <div style={S.left} className="hidden lg:flex">
        {/* blobs */}
        {[
          { w: 450, h: 450, bg: 'rgba(99,102,241,0.12)', t: -130, r: -90 },
          { w: 280, h: 280, bg: 'rgba(16,185,129,0.08)', b: 40, l: -60 },
          { w: 200, h: 200, bg: 'rgba(139,92,246,0.1)', t: '42%', l: '28%' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', width: b.w, height: b.h, borderRadius: '50%', background: b.bg, filter: 'blur(70px)', top: b.t, right: b.r, bottom: b.b, left: b.l }} />
        ))}

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 8px 32px rgba(99,102,241,0.45)', fontSize: 30 }}>
            🔐
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Reset Your<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Password
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: 36 }}>
            Enter your email and we'll send a 6-digit OTP. Use it to set a new password instantly.
          </p>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            {[
              { n: 1, label: 'Enter Email' },
              { n: 2, label: 'Verify OTP' },
              { n: 3, label: 'Done ✓' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.88rem', margin: '0 auto 6px', transition: 'all 0.3s',
                    background: step > s.n ? 'linear-gradient(135deg,#10b981,#059669)' : step === s.n ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                    color: step >= s.n ? 'white' : 'rgba(255,255,255,0.3)',
                    boxShadow: step >= s.n ? '0 4px 14px rgba(99,102,241,0.45)' : 'none',
                  }}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: step >= s.n ? '#a5b4fc' : 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 44, height: 2, marginBottom: 22, borderRadius: 2, background: step > s.n ? '#10b981' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={S.right}>
        <div style={S.card}>

          {/* ─── STEP 1 : Email ─── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.12em', marginBottom: 8 }}>STEP 1 OF 2</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Find Your Account</h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', margin: 0, fontSize: '0.88rem' }}>Enter the email linked to your admin account</p>
              </div>

              <form onSubmit={handleSendOTP}>
                <label style={S.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  style={S.input}
                  onFocus={onFocus} onBlur={onBlur}
                  required
                />

                <button type="submit" disabled={loading} style={S.primaryBtn(loading)}>
                  {loading ? '📨 Sending OTP...' : 'Send OTP →'}
                </button>
              </form>
            </>
          )}

          {/* ─── STEP 2 : OTP + New Password ─── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.12em', marginBottom: 8 }}>STEP 2 OF 2</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>Set New Password</h2>
                <p style={{ color: 'rgba(255,255,255,0.38)', margin: 0, fontSize: '0.88rem' }}>
                  OTP sent to <span style={{ color: '#818cf8', fontWeight: 600 }}>{email}</span>
                </p>
              </div>

              {/* Green success notice */}
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📧</span>
                <span style={{ color: '#6ee7b7', fontSize: '0.84rem' }}>Check your inbox and enter the 6-digit code below.</span>
              </div>

              <form onSubmit={handleResetPassword}>
                {/* OTP boxes */}
                <label style={S.label}>6-Digit OTP</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      style={{
                        flex: 1, height: 54, textAlign: 'center', fontSize: '1.5rem', fontWeight: 800,
                        border: `2px solid ${digit ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 12,
                        background: digit ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                        color: 'white', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                    />
                  ))}
                </div>

                <label style={S.label}>New Password</label>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ ...S.input, marginBottom: 0, paddingRight: 46 }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                  <button type="button" onClick={() => setShowPass((p) => !p)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>

                <label style={S.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{
                    ...S.input,
                    borderColor: confirmPass && confirmPass !== newPass ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                {confirmPass && confirmPass !== newPass && (
                  <p style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: -12, marginBottom: 16 }}>
                    ✗ Passwords don't match
                  </p>
                )}

                <button type="submit" disabled={loading} style={S.primaryBtn(loading)}>
                  {loading ? '🔄 Resetting...' : '🔒 Reset Password'}
                </button>

                {/* Resend OTP */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => { dispatch(sendForgotPasswordOTP(email)); toast.info('Sending new OTP...'); }}
                  style={{ width: '100%', marginTop: 10, padding: '10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'transparent', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                  📨 Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['','','','','','']); dispatch(clearAllForgotResetPassErrors()); }}
                  style={{ width: '100%', marginTop: 6, padding: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                  ← Change Email
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
            Remember password?{' '}
            <Link to="/auth/sign-in" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
