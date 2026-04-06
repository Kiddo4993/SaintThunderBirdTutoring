'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('student');
  const [isLight, setIsLight] = useState(false);

  // Student form state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRemember, setStudentRemember] = useState(false);

  // Tutor form state
  const [tutorEmail, setTutorEmail] = useState('');
  const [tutorPassword, setTutorPassword] = useState('');
  const [tutorRemember, setTutorRemember] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.body.classList.add('light-mode');
    }
    const remembered = localStorage.getItem('rememberEmail');
    if (remembered) {
      setStudentEmail(remembered);
      setStudentRemember(true);
    }
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.body.classList.add('light-mode');
      localStorage.setItem('st-theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('st-theme', 'dark');
    }
  }

  async function handleLogin(e, userType) {
    e.preventDefault();
    const email = userType === 'student' ? studentEmail : tutorEmail;
    const password = userType === 'student' ? studentPassword : tutorPassword;
    const remember = userType === 'student' ? studentRemember : tutorRemember;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType }),
      });
      const data = await res.json();

      if (!data.success) {
        alert('❌ Error: ' + (data.error || 'Login failed'));
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (remember) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      const u = data.user;
      if (u.email === 'dylanduancanada@gmail.com') {
        router.push('/tutor-dashboard');
        return;
      }
      if (u.userType === 'tutor') {
        const appStatus = u.tutorApplication?.status;
        if (appStatus === 'pending') {
          router.push('/tutor-pending');
        } else {
          router.push('/tutor-dashboard');
        }
      } else {
        router.push('/student-dashboard');
      }
    } catch (err) {
      alert('❌ Connection error: ' + err.message);
    }
  }

  return (
    <>
      <div className="mesh-gradient"></div>
      <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
        {isLight ? '☀️' : '🌓'}
      </button>

      <div className="auth-page-wrapper">
      <div className="login-container">
        <div className="logo">
          <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(96,165,250,0.6))' }}>⚡</div>
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #d4a574, #8b4513)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Saint Thunderbird
        </h1>
        <p className="subtitle">Welcome back to your learning journey</p>

        <div className="tabs">
          <div
            className={`tab${activeTab === 'student' ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('student')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('student'); } }}
          >
            Student
          </div>
          <div
            className={`tab${activeTab === 'tutor' ? ' active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('tutor')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('tutor'); } }}
          >
            Tutor
          </div>
        </div>

        {/* Student Login */}
        <div className={`tab-content${activeTab === 'student' ? ' active' : ''}`}>
          <form onSubmit={(e) => handleLogin(e, 'student')}>
            <div className="form-group">
              <label htmlFor="studentEmail">Email</label>
              <input
                type="email"
                id="studentEmail"
                name="email"
                placeholder="student@example.com"
                required
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="studentPassword">Password</label>
              <input
                type="password"
                id="studentPassword"
                name="password"
                placeholder="Enter your password"
                required
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
              />
              <div className="forgot-password">
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
            </div>
            <div className="remember-me">
              <input
                type="checkbox"
                id="studentRemember"
                checked={studentRemember}
                onChange={(e) => setStudentRemember(e.target.checked)}
              />
              <label htmlFor="studentRemember">Remember me</label>
            </div>
            <button type="submit" className="btn-submit">Login as Student</button>
          </form>
          <div className="divider">OR</div>
          <p className="signup-link">
            Don&apos;t have an account? <Link href="/signup">Sign up →</Link>
          </p>
        </div>

        {/* Tutor Login */}
        <div className={`tab-content${activeTab === 'tutor' ? ' active' : ''}`}>
          <form onSubmit={(e) => handleLogin(e, 'tutor')}>
            <div className="form-group">
              <label htmlFor="tutorEmail">Email</label>
              <input
                type="email"
                id="tutorEmail"
                name="email"
                placeholder="tutor@example.com"
                required
                value={tutorEmail}
                onChange={(e) => setTutorEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tutorPassword">Password</label>
              <input
                type="password"
                id="tutorPassword"
                name="password"
                placeholder="Enter your password"
                required
                value={tutorPassword}
                onChange={(e) => setTutorPassword(e.target.value)}
              />
              <div className="forgot-password">
                <a href="#" className="forgot-link">Forgot Password?</a>
              </div>
            </div>
            <div className="remember-me">
              <input
                type="checkbox"
                id="tutorRemember"
                checked={tutorRemember}
                onChange={(e) => setTutorRemember(e.target.checked)}
              />
              <label htmlFor="tutorRemember">Remember me</label>
            </div>
            <button type="submit" className="btn-submit">Login as Tutor</button>
          </form>
          <div className="divider">OR</div>
          <p className="signup-link">
            Don&apos;t have an account? <Link href="/signup">Sign up →</Link>
          </p>
        </div>

        <Link href="/" className="back-link">← Back to Home</Link>
      </div>
      </div>
    </>
  );
}
