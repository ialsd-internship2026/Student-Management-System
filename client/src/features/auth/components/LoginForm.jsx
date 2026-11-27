import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle, GraduationCap, ShieldCheck } from 'lucide-react';

export default function LoginForm({ onLogin, branding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError('');
  };

  const wrapperStyle = branding?.heroImageUrl
    ? {
        ...styles.wrapper,
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.72), rgba(30, 27, 75, 0.8)), url("${branding.heroImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : styles.wrapper;

  const brandDisplayName = branding?.name || 'Aster';
  const brandDisplayTagline = branding?.tagline || 'Institute';

  return (
    <div style={wrapperStyle}>
      <div style={styles.card}>
        {/* Brand header */}
        <div style={styles.brandRow}>
          <div style={styles.brandIcon}>
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              />
            ) : (
              <GraduationCap size={28} color="#ffffff" />
            )}
          </div>
          <div>
            <h1 style={styles.brandTitle}>{brandDisplayName}</h1>
            <p style={styles.brandSubtitle}>{brandDisplayTagline} · Portal</p>
          </div>
        </div>

        <h2 style={styles.heading}>Sign in to your portal</h2>
        <p style={styles.subheading}>Connect as an Administrator or Faculty Member</p>

        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@aster.edu"
              style={styles.input}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ ...styles.input, paddingRight: '42px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={styles.demoSection}>
          <p style={styles.demoTitle}>Quick Demo Logins (Click to autofill):</p>
          <div style={styles.demoButtonsRow}>
            <button
              type="button"
              onClick={() => fillQuick('admin@aster.edu', 'Password123!')}
              style={styles.demoBtn}
            >
              <ShieldCheck size={14} color="#959598ff" />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuick('sarah.jenkins@aster.edu', 'Password123!')}
              style={styles.demoBtn}
            >
              <GraduationCap size={14} color="#059669" />
              <span>Teacher (Sarah Jenkins)</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuick('marcus.vance@aster.edu', 'Password123!')}
              style={styles.demoBtn}
            >
              <GraduationCap size={14} color="#059669" />
              <span>Teacher (Marcus Vance)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    padding: '20px',
    boxSizing: 'border-box'
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  brandIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.3px'
  },
  brandSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500
  },
  heading: {
    margin: '0 0 6px 0',
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827'
  },
  subheading: {
    margin: '0 0 20px 0',
    fontSize: '13px',
    color: '#6b7280'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    color: '#111827'
  },
  passwordContainer: {
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '6px',
    padding: '12px 0',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'opacity 0.2s',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
  },
  demoSection: {
    marginTop: '22px',
    paddingTop: '18px',
    borderTop: '1px solid #e5e7eb'
  },
  demoTitle: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280'
  },
  demoButtonsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    color: '#374151',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left'
  }
};
