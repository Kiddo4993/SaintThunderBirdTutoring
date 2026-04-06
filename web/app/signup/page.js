'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SUBJECTS = [
  { id: 'math', value: 'Mathematics', label: 'Mathematics' },
  { id: 'science', value: 'Sciences', label: 'Sciences' },
  { id: 'languages', value: 'Languages', label: 'Languages' },
  { id: 'social', value: 'Social Studies', label: 'Social Studies' },
  { id: 'tech', value: 'Technology', label: 'Technology' },
  { id: 'arts', value: 'Arts & Culture', label: 'Arts & Culture' },
];

export default function SignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('student');
  const [isLight, setIsLight] = useState(false);

  // Student form
  const [sFirstName, setSFirstName] = useState('');
  const [sLastName, setSLastName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sConfirm, setSConfirm] = useState('');
  const [sGrade, setSGrade] = useState('');
  const [sCommunity, setSCommunity] = useState('');
  const [sSubjects, setSSubjects] = useState([]);
  const [sGoals, setSGoals] = useState('');
  const [sTerms, setSTerms] = useState(false);

  // Tutor form
  const [tFirstName, setTFirstName] = useState('');
  const [tLastName, setTLastName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tConfirm, setTConfirm] = useState('');
  const [tEducation, setTEducation] = useState('');
  const [tSubjects, setTSubjects] = useState([]);
  const [tExperience, setTExperience] = useState('');
  const [tMotivation, setTMotivation] = useState('');
  const [tTerms, setTTerms] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.body.classList.add('light-mode');
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

  function toggleSubject(list, setList, value) {
    if (list.includes(value)) {
      setList(list.filter((s) => s !== value));
    } else {
      setList([...list, value]);
    }
  }

  async function submitSignup(payload, redirectPath) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      alert('❌ Error: ' + data.error);
      return;
    }
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push(redirectPath);
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    if (sPassword !== sConfirm) {
      alert('❌ Passwords do not match!');
      return;
    }
    const payload = {
      firstName: sFirstName,
      lastName: sLastName,
      email: sEmail,
      password: sPassword,
      userType: 'student',
    };
    try {
      alert('✅ Signup successful! Redirecting to dashboard...');
      await submitSignup(payload, '/student-dashboard');
    } catch (err) {
      alert('❌ Connection error: ' + err.message);
    }
  }

  async function handleTutorSubmit(e) {
    e.preventDefault();
    if (tPassword !== tConfirm) {
      alert('❌ Passwords do not match!');
      return;
    }
    if (tSubjects.length === 0) {
      alert('❌ Please select at least one subject you can teach!');
      return;
    }
    const payload = {
      firstName: tFirstName,
      lastName: tLastName,
      email: tEmail,
      password: tPassword,
      userType: 'tutor',
      tutorProfile: {
        subjects: tSubjects,
        educationLevel: tEducation,
        experience: tExperience,
        motivation: tMotivation,
      },
    };
    try {
      alert('✅ Application submitted! Admin review is required before tutor approval.');
      await submitSignup(payload, '/tutor-pending');
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
      <div className="signup-container">
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
          Join Saint Thunderbird
        </h1>
        <p className="subtitle">Create your account and start your learning journey</p>

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

        {/* Student Sign Up */}
        <div className={`tab-content${activeTab === 'student' ? ' active' : ''}`}>
          <div className="info-text">
            ✨ Join 500+ First Nations students receiving free, culturally responsive tutoring!
          </div>
          <form onSubmit={handleStudentSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studentFirstName">First Name</label>
                <input type="text" id="studentFirstName" required value={sFirstName} onChange={(e) => setSFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="studentLastName">Last Name</label>
                <input type="text" id="studentLastName" required value={sLastName} onChange={(e) => setSLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentEmail">Email Address</label>
              <input type="email" id="studentEmail" required value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studentPassword">Password</label>
                <input type="password" id="studentPassword" required minLength={8} value={sPassword} onChange={(e) => setSPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="studentConfirmPassword">Confirm Password</label>
                <input type="password" id="studentConfirmPassword" required value={sConfirm} onChange={(e) => setSConfirm(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentGrade">Grade Level</label>
              <select id="studentGrade" required value={sGrade} onChange={(e) => setSGrade(e.target.value)}>
                <option value="">Select Grade</option>
                <option value="elementary">Elementary (K-5)</option>
                <option value="middle">Middle School (6-8)</option>
                <option value="high">High School (9-12)</option>
                <option value="post-secondary">Post-Secondary</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="studentCommunity">Community/Nation (Optional)</label>
              <input type="text" id="studentCommunity" placeholder="e.g., Spuzzum First Nation" value={sCommunity} onChange={(e) => setSCommunity(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Subjects Interested In (Select Multiple)</label>
              <div className="subjects-grid">
                {SUBJECTS.map((s) => (
                  <div key={s.id} className="subject-item" onClick={() => toggleSubject(sSubjects, setSSubjects, s.value)}>
                    <input
                      type="checkbox"
                      id={`student-${s.id}`}
                      value={s.value}
                      checked={sSubjects.includes(s.value)}
                      onChange={() => toggleSubject(sSubjects, setSSubjects, s.value)}
                    />
                    <label htmlFor={`student-${s.id}`}>{s.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentGoals">Learning Goals (Optional)</label>
              <textarea id="studentGoals" placeholder="Tell us what you'd like to achieve..." value={sGoals} onChange={(e) => setSGoals(e.target.value)} />
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="studentTerms" required checked={sTerms} onChange={(e) => setSTerms(e.target.checked)} />
              <label htmlFor="studentTerms">
                I agree to the <Link href="/terms" className="link" target="_blank">terms and conditions</Link>
              </label>
            </div>

            <button type="submit" className="btn-submit">Sign Up as Student</button>
          </form>
        </div>

        {/* Tutor Sign Up */}
        <div className={`tab-content${activeTab === 'tutor' ? ' active' : ''}`}>
          <div className="info-text">
            🎓 Join 45+ dedicated tutors making a difference in First Nations education!
          </div>
          <form onSubmit={handleTutorSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tutorFirstName">First Name</label>
                <input type="text" id="tutorFirstName" required value={tFirstName} onChange={(e) => setTFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="tutorLastName">Last Name</label>
                <input type="text" id="tutorLastName" required value={tLastName} onChange={(e) => setTLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tutorEmail">Email Address</label>
              <input type="email" id="tutorEmail" required value={tEmail} onChange={(e) => setTEmail(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tutorPassword">Password</label>
                <input type="password" id="tutorPassword" required minLength={8} value={tPassword} onChange={(e) => setTPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="tutorConfirmPassword">Confirm Password</label>
                <input type="password" id="tutorConfirmPassword" required value={tConfirm} onChange={(e) => setTConfirm(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tutorEducation">Education Level</label>
              <select id="tutorEducation" required value={tEducation} onChange={(e) => setTEducation(e.target.value)}>
                <option value="">Select Education Level</option>
                <option value="high-school">High School Student</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate Student</option>
                <option value="professional">Professional/Teacher</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subjects You Can Teach (Select Multiple)</label>
              <div className="subjects-grid">
                {SUBJECTS.map((s) => (
                  <div key={s.id} className="subject-item" onClick={() => toggleSubject(tSubjects, setTSubjects, s.value)}>
                    <input
                      type="checkbox"
                      id={`tutor-${s.id}`}
                      value={s.value}
                      checked={tSubjects.includes(s.value)}
                      onChange={() => toggleSubject(tSubjects, setTSubjects, s.value)}
                    />
                    <label htmlFor={`tutor-${s.id}`}>{s.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tutorExperience">Teaching Experience</label>
              <textarea id="tutorExperience" placeholder="Tell us about your teaching or tutoring experience..." required value={tExperience} onChange={(e) => setTExperience(e.target.value)} />
            </div>

            <div className="form-group">
              <label htmlFor="tutorMotivation">Why Join Saint Thunderbird?</label>
              <textarea id="tutorMotivation" placeholder="Tell us what motivates you to tutor First Nations students..." required value={tMotivation} onChange={(e) => setTMotivation(e.target.value)} />
            </div>

            <div className="checkbox-group">
              <input type="checkbox" id="tutorTerms" required checked={tTerms} onChange={(e) => setTTerms(e.target.checked)} />
              <label htmlFor="tutorTerms">
                I agree to the <Link href="/terms" className="link" target="_blank">terms and conditions</Link>
              </label>
            </div>

            <button type="submit" className="btn-submit">Apply as Tutor</button>
          </form>
        </div>

        <div className="links-group">
          <Link href="/login" className="link">Already have an account? Log in →</Link>
          <Link href="/" className="link">← Back to Home</Link>
        </div>
      </div>
      </div>
    </>
  );
}
