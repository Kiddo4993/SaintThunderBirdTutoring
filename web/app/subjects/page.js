import MarketingShell from "@/components/MarketingShell";

export const metadata = {
  title: "Subjects - Saint Thunderbird Tutoring",
};

export default function SubjectsPage() {
  return (
    <MarketingShell activeNav="subjects">
      <div className="page-hero">
        <div className="mesh-gradient"></div>
        <div className="hero-content">
          <h1><span className="gradient-text">Courses</span> We Offer</h1>
          <p>Comprehensive tutoring across all core subjects</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="grid subjects-grid">
            <div className="glass-card">
              <span className="card-icon">📐</span>
              <h3>Mathematics</h3>
              <p>From basic arithmetic to advanced calculus, we help students build confidence and master mathematical concepts through culturally relevant examples.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ Algebra &amp; Geometry</li>
                <li>✓ Trigonometry</li>
                <li>✓ Calculus</li>
                <li>✓ Statistics</li>
              </ul>
            </div>
            <div className="glass-card">
              <span className="card-icon">🔬</span>
              <h3>Science</h3>
              <p>Biology, chemistry, physics, and environmental science taught with connections to traditional ecological knowledge and indigenous perspectives.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ Biology</li>
                <li>✓ Chemistry</li>
                <li>✓ Physics</li>
                <li>✓ Environmental Science</li>
              </ul>
            </div>
            <div className="glass-card">
              <span className="card-icon">📖</span>
              <h3>Languages</h3>
              <p>English, indigenous languages, and language arts programs that celebrate multilingualism and preserve cultural linguistic heritage.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ English Literature</li>
                <li>✓ Writing Skills</li>
                <li>✓ Indigenous Languages</li>
                <li>✓ ESL Support</li>
              </ul>
            </div>
            <div className="glass-card">
              <span className="card-icon">🌍</span>
              <h3>Social Studies</h3>
              <p>History, geography, and civics taught through indigenous perspectives, highlighting contributions and addressing historical contexts.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ World History</li>
                <li>✓ Indigenous Studies</li>
                <li>✓ Geography</li>
                <li>✓ Civics</li>
              </ul>
            </div>
            <div className="glass-card">
              <span className="card-icon">💻</span>
              <h3>Technology</h3>
              <p>Computer science, coding, digital literacy, and media production skills for the modern world while promoting digital sovereignty.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ Programming Basics</li>
                <li>✓ Web Development</li>
                <li>✓ Digital Literacy</li>
                <li>✓ Media Production</li>
              </ul>
            </div>
            <div className="glass-card">
              <span className="card-icon">🎨</span>
              <h3>Arts &amp; Culture</h3>
              <p>Traditional arts, music, storytelling, and creative expression that strengthens cultural identity and artistic skills.</p>
              <ul style={{ marginTop: "1.5rem", color: "var(--beige-light)", listStyle: "none" }}>
                <li>✓ Traditional Arts</li>
                <li>✓ Music</li>
                <li>✓ Storytelling</li>
                <li>✓ Visual Arts</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "6rem" }}>
            <h2 className="section-title">Ready to <span className="gradient-text">Start Learning</span>?</h2>
            <p style={{ fontSize: "1.2rem", color: "var(--beige-light)", margin: "2rem 0" }}>Connect with our expert tutors today</p>
            <a href="/students" className="btn btn-primary">Enroll Now →</a>
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
