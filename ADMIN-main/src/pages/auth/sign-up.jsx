import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { registerDoctor } from '../../store/slices/doctorSlice';

export function SignUp() {
  const [formData, setFormData] = useState({
    adminName: '', adminEmailId: '', password: '', confirmPassword: '',
    adminMobileNo: '', termsAccepted: false, profileImage: null
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isRegistered } = useSelector((s) => s.doctor);

  useEffect(() => {
    if (error) toast.error(error);
    if (isRegistered) { toast.success('Account created! Please sign in.'); navigate('/auth/sign-in'); }
  }, [error, isRegistered, navigate]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === 'profileImage' && files?.[0]) {
      setPreviewImg(URL.createObjectURL(files[0]));
      setFormData(p => ({ ...p, profileImage: files[0] }));
    } else {
      setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    }
  };

 const handleSubmit = (e) => {
  e.preventDefault();

  if (
    !formData.adminName ||
    !formData.adminEmailId ||
    !formData.password
  ) {
    toast.error("Please fill all required fields");
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  if (!formData.termsAccepted) {
    toast.error("Please accept the terms");
    return;
  }

  const fd = new FormData();

  fd.append("adminName", formData.adminName);
  fd.append("adminEmailId", formData.adminEmailId);

  // Backend expects adminPassword
  fd.append("adminPassword", formData.password);

  fd.append("confirmPassword", formData.confirmPassword);
  fd.append("adminMobileNo", formData.adminMobileNo);
  fd.append("termsAccepted", formData.termsAccepted);

  if (formData.profileImage) {
    fd.append("profileImage", formData.profileImage);
  }

  console.log("===== REGISTER PAYLOAD =====");
  for (let pair of fd.entries()) {
    console.log(pair[0], pair[1]);
  }

  dispatch(registerDoctor(fd));
};

  const S = {
    page: { minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#080d1a' },
    left: { width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(99,102,241,0.12)' },
    right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'linear-gradient(135deg, #080d1a 0%, #0c1628 100%)', overflowY: 'auto' },
    card: { width: '100%', maxWidth: 440, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '38px 36px', backdropFilter: 'blur(20px)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' },
    label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 7 },
    input: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.05)', outline: 'none', fontFamily: 'inherit', marginBottom: 16, transition: 'border-color 0.2s' },
    btn: (dis) => ({ width: '100%', padding: '13px', border: 'none', borderRadius: 12, background: dis ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: dis ? 'not-allowed' : 'pointer', boxShadow: dis ? 'none' : '0 4px 24px rgba(99,102,241,0.45)', fontFamily: 'inherit' }),
  };

  const focus = (e) => e.target.style.borderColor = '#6366f1';
  const blur = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)';

  return (
    <div style={S.page}>
      <ToastContainer position="top-right" theme="dark" />

      {/* Left Branding */}
      <div style={S.left} className="hidden lg:flex">
        {[[500,500,'rgba(99,102,241,0.1)',-150,-120],[280,280,'rgba(16,185,129,0.07)',30,-70],[180,180,'rgba(139,92,246,0.09)','45%','28%']].map(([w,h,bg,t,l],i)=>(
          <div key={i} style={{position:'absolute',width:w,height:h,borderRadius:'50%',background:bg,filter:'blur(70px)',top:t,left:l}}/>
        ))}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 10px 40px rgba(99,102,241,0.4)', fontSize: 30 }}>✍️</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.15 }}>
            Create Your<br/>
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Account</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, fontSize: '0.9rem', marginBottom: 32 }}>
            Join the Advanced Digital Archive System as an administrator and start managing documents securely.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {['Full access to document management','Upload, edit & delete documents','Manage user notifications','Secure encrypted storage'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#34d399', fontSize: 16 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div style={S.right}>
        <div style={S.card}>
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'white', margin: '0 0 5px', letterSpacing: '-0.4px' }}>Create Account</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', margin: 0, fontSize: '0.87rem' }}>Fill in details to register as admin</p>
          </div>

          {/* Avatar upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(99,102,241,0.4)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {previewImg ? <img src={previewImg} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26 }}>👤</span>}
            </div>
            <div>
              <label htmlFor="profileImage" style={{ display: 'inline-block', padding: '7px 16px', borderRadius: 10, border: '1.5px solid rgba(99,102,241,0.4)', color: '#818cf8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                {previewImg ? 'Change Photo' : 'Upload Photo'}
              </label>
              <input id="profileImage" name="profileImage" type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: 4 }}>Optional · JPG, PNG</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div>
                <label style={S.label}>Full Name *</label>
                <input name="adminName" placeholder="Your name" value={formData.adminName} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={S.label}>Mobile</label>
                <input name="adminMobileNo" placeholder="+91 98765..." value={formData.adminMobileNo} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <label style={S.label}>Email Address *</label>
            <input name="adminEmailId" type="email" placeholder="admin@company.com" value={formData.adminEmailId} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div>
                <label style={S.label}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPass ? 'text' : 'password'} placeholder="Min 8 chars" value={formData.password} onChange={handleChange} style={{ ...S.input, paddingRight: 42 }} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={() => setShowPass(p=>!p)} style={{ position: 'absolute', right: 12, top: 13, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div>
                <label style={S.label}>Confirm *</label>
                <div style={{ position: 'relative' }}>
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter" value={formData.confirmPassword} onChange={handleChange}
                    style={{ ...S.input, paddingRight: 42, borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password ? '#ef4444' : 'rgba(255,255,255,0.1)' }} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={() => setShowConfirm(p=>!p)} style={{ position: 'absolute', right: 12, top: 13, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 22, marginTop: 4 }}>
              <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange}
                style={{ marginTop: 2, accentColor: '#6366f1', width: 16, height: 16 }} />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: '#818cf8', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#818cf8', cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </label>

            <button type="submit" disabled={loading} style={S.btn(loading)}>
              {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.86rem', color: 'rgba(255,255,255,0.35)' }}>
            Already have an account?{' '}
            <Link to="/auth/sign-in" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
