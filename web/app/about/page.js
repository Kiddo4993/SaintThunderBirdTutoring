import MarketingShell from "@/components/MarketingShell";

export const metadata = {
  title: "About Us - Saint Thunderbird Tutoring",
};

export default function AboutPage() {
  return (
    <MarketingShell activeNav="about">
      <div className="page-hero">
        <div className="mesh-gradient"></div>
        <div className="hero-content">
          <h1><span className="gradient-text">About</span> Saint Thunderbird</h1>
          <p>Empowering indigenous students through culturally responsive education</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">OUR PURPOSE</div>
            <h2 className="section-title">Student-to-Student <span className="gradient-text">Excellence</span></h2>
          </div>

          <div className="purpose-highlight">
            <h4>🎓 Non-Profit, Student-Led</h4>
            <p>Saint Thunderbird Tutoring is a student-to-student non-profit organization that introduces tutors and students, with a focus on providing academic support to First Nations children. Our tutors are passionate about education, and our students are committed to learning. Together, we create a community where knowledge flows freely and cultural understanding deepens.</p>
          </div>

          <div className="stats-mini">
            <div className="stat-mini">
              <div className="stat-mini-number">100%</div>
              <div className="stat-mini-label">Student-Led</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-number">500+</div>
              <div className="stat-mini-label">Students Served</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-number">Free</div>
              <div className="stat-mini-label">To All Students</div>
            </div>
          </div>

          <div style={{ marginTop: "8rem" }}>
            <div className="section-header">
              <div className="section-tag">WHO WE ARE</div>
              <h2 className="section-title">Our <span className="gradient-text">Foundation</span></h2>
            </div>
            <div className="grid">
              <div className="glass-card">
                <span className="card-icon">🌟</span>
                <h3>Our Mission</h3>
                <p>To provide culturally responsive education that honors indigenous traditions while preparing students for future success through accessible, high-quality tutoring and mentorship.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">👁️</span>
                <h3>Our Vision</h3>
                <p>A world where indigenous students thrive academically while maintaining strong connections to their cultural heritage, languages, and community values.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">💎</span>
                <h3>Our Values</h3>
                <p>Cultural respect, educational excellence, community empowerment, inclusivity, and sustainable growth through collaborative learning and mutual support.</p>
              </div>
            </div>
          </div>

          <div className="founder-section">
            <div className="section-header">
              <div className="section-tag">LEADERSHIP</div>
              <h2 className="section-title">Meet Our <span className="gradient-text">Founder</span></h2>
            </div>
            <div className="founder-card">
              <div className="founder-image">👤</div>
              <div className="founder-content">
                <h3>Dylan Duan</h3>
                <p className="founder-title">Founder</p>
                <p className="founder-bio">
                  Dylan Duan grew up in a family deeply committed to bridging understanding and communication with First Nations communities. His elder sister worked closely with indigenous communities, and his brother is an honorary member of Spuzzum First Nations, reflecting a profound family dedication to reconciliation and partnership.
                </p>
                <p className="founder-bio">
                  The history of fellowship and understanding between Asian communities and First Nations is embedded in Canadian history. Dylan carries forward this legacy of cross-cultural collaboration, building bridges through education and mutual respect. Saint Thunderbird Tutoring embodies his vision of student-led change and community empowerment.
                </p>
                <span className="heritage-badge">🤝 Building Bridges Through Education</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "8rem" }}>
            <h2 className="section-title">Why Choose <span className="gradient-text">Us</span></h2>
            <div className="grid subjects-grid" style={{ marginTop: "3rem" }}>
              <div className="glass-card">
                <span className="card-icon">🎯</span>
                <h3>Culturally Responsive</h3>
                <p>All our programs integrate indigenous knowledge, languages, and cultural practices into the learning experience, ensuring education that respects and celebrates heritage.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">🏆</span>
                <h3>Proven Results</h3>
                <p>100% of our students show significant academic improvement within the first semester of tutoring, with measurable gains in confidence and cultural pride.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">🤝</span>
                <h3>Community Driven</h3>
                <p>Led by indigenous educators and community members who understand the unique needs of our students, ensuring authentic and meaningful support.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">💝</span>
                <h3>Student-to-Student</h3>
                <p>Peer-led learning creates relatable connections where students feel understood, supported, and empowered to reach their full potential.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">🌍</span>
                <h3>Cross-Cultural Unity</h3>
                <p>Honoring the historical bonds between diverse communities while building new bridges for future generations of learners and leaders.</p>
              </div>
              <div className="glass-card">
                <span className="card-icon">⚡</span>
                <h3>Completely Free</h3>
                <p>As a non-profit organization, all our services are provided at no cost, ensuring every First Nations student has access to quality education.</p>
              </div>
            </div>
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
