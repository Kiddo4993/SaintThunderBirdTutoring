import MarketingShell from "@/components/MarketingShell";

export const metadata = {
  title: "For Students - Saint Thunderbird Tutoring",
};

export default function StudentsPage() {
  return (
    <MarketingShell activeNav="students">
      <div className="page-hero">
        <div className="mesh-gradient"></div>
        <div className="hero-content">
          <h1>Your Learning <span className="gradient-text">Journey</span></h1>
          <p>Personalized support for every indigenous student</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="grid">
            <div className="glass-card">
              <span className="card-icon">🎯</span>
              <h3>Personalized Learning</h3>
              <p>Each student receives a customized learning plan that adapts to their pace, learning style, and academic goals while honoring their cultural background.</p>
            </div>
            <div className="glass-card">
              <span className="card-icon">🤝</span>
              <h3>Peer Support</h3>
              <p>Join study groups and connect with fellow indigenous students for collaborative learning, mutual encouragement, and community building.</p>
            </div>
            <div className="glass-card">
              <span className="card-icon">🏆</span>
              <h3>Achievement Recognition</h3>
              <p>Celebrate your successes! We recognize academic achievements, cultural contributions, and personal growth throughout your educational journey.</p>
            </div>
          </div>

          <div style={{ marginTop: "8rem" }}>
            <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
            <div className="grid" style={{ marginTop: "3rem" }}>
              <div className="glass-card">
                <h3 style={{ color: "var(--beige)", fontSize: "3rem", marginBottom: "1rem" }}>1</h3>
                <h3>Sign Up</h3>
                <p>Create your account and tell us about your learning goals, preferred subjects, and schedule.</p>
              </div>
              <div className="glass-card">
                <h3 style={{ color: "var(--beige)", fontSize: "3rem", marginBottom: "1rem" }}>2</h3>
                <h3>Get Matched</h3>
                <p>We pair you with expert tutors who specialize in your subject areas and understand your cultural background.</p>
              </div>
              <div className="glass-card">
                <h3 style={{ color: "var(--beige)", fontSize: "3rem", marginBottom: "1rem" }}>3</h3>
                <h3>Start Learning</h3>
                <p>Begin one-on-one or group sessions and track your progress towards academic excellence.</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "6rem" }}>
            <h2 className="section-title">Ready to <span className="gradient-text">Excel</span>?</h2>
            <p style={{ fontSize: "1.2rem", color: "var(--beige-light)", margin: "2rem 0" }}>Join 500+ students already thriving with Saint Thunderbird</p>
            <a href="/login" className="btn btn-primary">Get Started →</a>
          </div>
        </div>
      </div>

      <footer>
        <p>© 2025 Saint Thunderbird Tutoring</p>
        <p>All coded, no website builder</p>
        <p>Empowering communities through education</p>
      </footer>

      <button id="scrollTopBtn" title="Back to Top">↑</button>
    </MarketingShell>
  );
}
