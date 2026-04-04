import MarketingShell from "@/components/MarketingShell";

export const metadata = {
  title: "Become a Mentor - Saint Thunderbird Tutoring",
};

export default function MentorsPage() {
  return (
    <MarketingShell activeNav="mentors">
      <div className="page-hero">
        <div className="mesh-gradient"></div>
        <div className="hero-content">
          <h1>Become a <span className="gradient-text">Mentor</span></h1>
          <p>Shape the future of indigenous education</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="grid">
            <div className="glass-card">
              <span className="card-icon">👨‍🏫</span>
              <h3>Expert Educators</h3>
              <p>Certified teachers, university professors, and subject matter experts committed to culturally responsive education and student success.</p>
            </div>
            <div className="glass-card">
              <span className="card-icon">🌱</span>
              <h3>Community Leaders</h3>
              <p>Indigenous community members, elders, and cultural practitioners who share traditional knowledge and provide cultural guidance.</p>
            </div>
            <div className="glass-card">
              <span className="card-icon">💼</span>
              <h3>Career Professionals</h3>
              <p>Successful indigenous professionals from various fields who inspire students and share real-world experience and career insights.</p>
            </div>
          </div>

          <div style={{ marginTop: "8rem" }}>
            <h2 className="section-title">Why <span className="gradient-text">Mentor</span> With Us?</h2>
            <div className="grid subjects-grid" style={{ marginTop: "3rem" }}>
              <div className="glass-card">
                <span className="card-icon">💝</span>
                <h3>Make an Impact</h3>
                <p>Directly influence the academic success and personal development of indigenous students in your community.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">⏰</span>
                <h3>Flexible Schedule</h3>
                <p>Set your own hours and availability. Tutor as much or as little as your schedule allows.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">💰</span>
                <h3>Competitive Volunteering</h3>
                <p>Receive TONS of volunteer hours for your expertise and dedication to helping students succeed.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">📚</span>
                <h3>Professional Development</h3>
                <p>Access training resources and join a network of dedicated indigenous educators.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">🏅</span>
                <h3>Recognition</h3>
                <p>Be recognized as a valued member of our educational community making real change.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">🌍</span>
                <h3>Cultural Connection</h3>
                <p>Work within a framework that honors and integrates indigenous knowledge and perspectives.</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "6rem" }}>
            <h2 className="section-title">Ready to <span className="gradient-text">Make a Difference</span>?</h2>
            <p style={{ fontSize: "1.2rem", color: "var(--beige-light)", margin: "2rem 0" }}>Join our team of 45+ expert mentors shaping indigenous education</p>
            <a href="/login" className="btn btn-primary">Apply Now →</a>
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
