import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/users";

const UserAuth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // login | register | forgot | resetOtp
  const [form, setForm] = useState({ userName: "", userEmail: "", userPassword: "", userMobileNo: "", confirmPassword: "" });
  const [otp, setOtp] = useState(["","","","","",""]);
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };
  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus();
  };

  const api = async (endpoint, payload) => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      const { data } = await axios.patch ? 
        await axios({ method: endpoint.method || "post", url: API + endpoint.url, data: payload, withCredentials: true }) :
        await axios.post(API + endpoint, payload, { withCredentials: true });
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(API + "/login", { userEmail: form.userEmail, userPassword: form.userPassword }, { withCredentials: true });
      if (data.success) { localStorage.setItem("userToken", data.token); localStorage.setItem("userData", JSON.stringify(data.user)); onAuthSuccess(data.user, data.token); }
      else setError(data.message);
    } catch (err) { setError(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError("");
    if (form.userPassword !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(API + "/register", { userName: form.userName, userEmail: form.userEmail, userPassword: form.userPassword, userMobileNo: form.userMobileNo }, { withCredentials: true });
      if (data.success) { localStorage.setItem("userToken", data.token); localStorage.setItem("userData", JSON.stringify(data.user)); onAuthSuccess(data.user, data.token); }
      else setError(data.message);
    } catch (err) { setError(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const handleForgotSend = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await axios.patch(API + "/forgot-password", { userEmail: form.userEmail }, { withCredentials: true });
      if (data.success) { setSuccess(data.message); setMode("resetOtp"); }
      else setError(data.message);
    } catch (err) { setError(err.response?.data?.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError("");
    if (newPass !== confirmNewPass) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data } = await axios.patch(API + "/reset-password", { userEmail: form.userEmail, otp: otp.join(""), newPassword: newPass }, { withCredentials: true });
      if (data.success) { setSuccess("Password reset! Please sign in."); setMode("login"); setOtp(["","","","","",""]); setNewPass(""); setConfirmNewPass(""); }
      else setError(data.message);
    } catch (err) { setError(err.response?.data?.message || "Reset failed"); }
    finally { setLoading(false); }
  };

  const S = {
    page: { minHeight: "100vh", display: "flex", fontFamily: "'Inter', -apple-system, sans-serif", background: "#080d1a" },
    left: { width: "45%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px", position: "relative", overflow: "hidden", borderRight: "1px solid rgba(99,102,241,0.12)" },
    right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "linear-gradient(135deg, #080d1a 0%, #0c1628 100%)", overflowY: "auto" },
    card: { width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "40px 36px", backdropFilter: "blur(20px)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" },
    label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 7 },
    input: { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: "0.9rem", color: "white", background: "rgba(255,255,255,0.05)", outline: "none", fontFamily: "inherit", marginBottom: 16, transition: "border-color 0.2s" },
    btn: (dis) => ({ width: "100%", padding: "14px", border: "none", borderRadius: 12, background: dis ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: dis ? "not-allowed" : "pointer", boxShadow: dis ? "none" : "0 4px 24px rgba(99,102,241,0.45)", fontFamily: "inherit", letterSpacing: "0.02em" }),
    tab: (active) => ({ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", background: active ? "rgba(99,102,241,0.25)" : "transparent", color: active ? "#818cf8" : "rgba(255,255,255,0.35)", fontFamily: "inherit", transition: "all 0.2s", borderBottom: active ? "2px solid #6366f1" : "2px solid transparent" }),
  };
  const focus = e => e.target.style.borderColor = "#6366f1";
  const blur = e => e.target.style.borderColor = "rgba(255,255,255,0.1)";

  return (
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left} className="hidden lg:flex">
        {[[500,500,"rgba(99,102,241,0.12)",-150,-100],[300,300,"rgba(16,185,129,0.08)",50,-60],[200,200,"rgba(139,92,246,0.1)","42%","30%"]].map(([w,h,bg,t,l],i)=>(
          <div key={i} style={{position:"absolute",width:w,height:h,borderRadius:"50%",background:bg,filter:"blur(70px)",top:t,left:l}}/>
        ))}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: "0 10px 40px rgba(99,102,241,0.45)", fontSize: 30 }}>📄</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "white", margin: "0 0 14px", letterSpacing: "-1px", lineHeight: 1.15 }}>
            Advanced Digital Archive<br/>
            <span style={{ background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>System</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.75, fontSize: "0.9rem", marginBottom: 32 }}>
            Access, bookmark and download all your important documents in one secure place.
          </p>
          {[["🔒","Encrypted Storage","256-bit SSL protection"],["⚡","Instant Access","Documents always ready"],["❤️","Bookmarks","Save favourites offline"],["🔔","Notifications","Get new doc alerts"]].map(([icon,title,sub])=>(
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div><div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: 600 }}>{title}</div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{sub}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.card}>
          {mode === "forgot" || mode === "resetOtp" ? (
            <>
              <div style={{ marginBottom: 26 }}>
                <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.85rem", padding: 0, fontFamily: "inherit", marginBottom: 16 }}>← Back to Sign In</button>
                <h2 style={{ fontSize: "1.55rem", fontWeight: 800, color: "white", margin: "0 0 6px" }}>{mode === "forgot" ? "Forgot Password?" : "Reset Password"}</h2>
                <p style={{ color: "rgba(255,255,255,0.38)", margin: 0, fontSize: "0.87rem" }}>{mode === "forgot" ? "We'll send a 6-digit OTP to your email" : `OTP sent to ${form.userEmail}`}</p>
              </div>
              {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 16 }}>{error}</div>}
              {success && <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "10px 14px", color: "#6ee7b7", fontSize: "0.85rem", marginBottom: 16 }}>{success}</div>}

              {mode === "forgot" ? (
                <form onSubmit={handleForgotSend}>
                  <label style={S.label}>Email Address</label>
                  <input name="userEmail" type="email" placeholder="you@email.com" value={form.userEmail} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} required />
                  <button type="submit" disabled={loading} style={S.btn(loading)}>{loading ? "📨 Sending..." : "Send OTP →"}</button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <label style={S.label}>6-Digit OTP</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 18, justifyContent: "center", }}>
                    {otp.map((d, i) => (
                      <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKey(i, e)}
                        style={{ flex: none, height: 45, textAlign: "center", fontSize: "20px", fontWeight: 800, border: `2px solid ${d ? "#6366f1" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, background: d ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", color: "white", outline: "none" }} />
                    ))}
                  </div>
                  <label style={S.label}>New Password</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" style={S.input} onFocus={focus} onBlur={blur} />
                  <label style={S.label}>Confirm Password</label>
                  <input type="password" value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)} placeholder="Re-enter password" style={{ ...S.input, borderColor: confirmNewPass && confirmNewPass !== newPass ? "#ef4444" : "rgba(255,255,255,0.1)" }} onFocus={focus} onBlur={blur} />
                  <button type="submit" disabled={loading} style={S.btn(loading)}>{loading ? "🔄 Resetting..." : "🔒 Reset Password"}</button>
                </form>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.55rem", fontWeight: 800, color: "white", margin: "0 0 6px" }}>Welcome</h2>
                <p style={{ color: "rgba(255,255,255,0.38)", margin: 0, fontSize: "0.87rem" }}>Access your document portal</p>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 26, gap: 4 }}>
                <button style={S.tab(mode === "login")} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Sign In</button>
                <button style={S.tab(mode === "register")} onClick={() => { setMode("register"); setError(""); setSuccess(""); }}>Register</button>
              </div>

              {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 16 }}>{error}</div>}
              {success && <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "10px 14px", color: "#6ee7b7", fontSize: "0.85rem", marginBottom: 16 }}>{success}</div>}

              {mode === "login" ? (
                <form onSubmit={handleLogin}>
                  <label style={S.label}>Email</label>
                  <input name="userEmail" type="email" placeholder="you@email.com" value={form.userEmail} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} required />
                  <label style={S.label}>Password</label>
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <input name="userPassword" type={showPass ? "text" : "password"} placeholder="Enter password" value={form.userPassword} onChange={handleChange} style={{ ...S.input, marginBottom: 0, paddingRight: 44 }} onFocus={focus} onBlur={blur} />
                    <button type="button" onClick={() => setShowPass(p=>!p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</button>
                  </div>
                  <div style={{ textAlign: "right", marginBottom: 22 }}>
                    <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#818cf8", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>Forgot password?</button>
                  </div>
                  <button type="submit" disabled={loading} style={S.btn(loading)}>{loading ? "⏳ Signing in..." : "Sign In →"}</button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <label style={S.label}>Full Name</label>
                  <input name="userName" placeholder="Your full name" value={form.userName} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />
                  <label style={S.label}>Mobile</label>
                  <input name="userMobileNo" placeholder="+91 98765 43210" value={form.userMobileNo} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />
                  <label style={S.label}>Email</label>
                  <input name="userEmail" type="email" placeholder="you@email.com" value={form.userEmail} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} required />
                  <label style={S.label}>Password</label>
                  <input name="userPassword" type="password" placeholder="Min 6 characters" value={form.userPassword} onChange={handleChange} style={S.input} onFocus={focus} onBlur={blur} />
                  <label style={S.label}>Confirm Password</label>
                  <input name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange}
                    style={{ ...S.input, borderColor: form.confirmPassword && form.confirmPassword !== form.userPassword ? "#ef4444" : "rgba(255,255,255,0.1)" }} onFocus={focus} onBlur={blur} />
                  <button type="submit" disabled={loading} style={{ ...S.btn(loading), marginTop: 6 }}>{loading ? "⏳ Creating..." : "🚀 Create Account"}</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
