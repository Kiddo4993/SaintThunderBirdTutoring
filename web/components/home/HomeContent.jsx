export default function HomeContent() {
  return (
    <>
      <div className="hero">
        <div className="stars" id="stars" />
        <div className="mesh-gradient" />
        <div className="hero-content">
          <div className="hero-badge">Empowering Indigenous Students</div>
          <h1>
            <span className="gradient-text">Excellence</span>
            <br />
            In Indigenous Education
          </h1>
          <p>
            Connecting indigenous and rural community students with expert volunteer tutors for academic
            success. Browse our courses and join our community of learners and educators.
          </p>
          <div className="cta-group">
            <a href="#subjects" className="btn btn-primary">
              View Courses →
            </a>
            <a href="#mentors" className="btn btn-secondary">
              Become a Tutor
            </a>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-tag">OVERVIEW</div>
          <h2 className="section-title">
            <span className="gradient-text">Welcome</span> To Saint Thunderbird
          </h2>
          <p className="section-subtitle">Data-driven excellence in indigenous education</p>
        </div>

        <div className="stats-grid subjects-grid mb-24">
          <div className="stat" data-percent="100">
            <div className="stat-number counter" data-target="500">
              0
            </div>
            <div className="stat-label">Students Enrolled</div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
            <p className="stat-subtext">Targeting</p>
          </div>

          <div className="stat" data-percent="60">
            <div className="stat-number counter" data-target="15">
              0
            </div>
            <div className="stat-label">Communities</div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
            <p className="stat-subtext">Targeting</p>
          </div>

          <div className="stat" data-percent="100">
            <div className="stat-number counter" data-target="100">
              0
            </div>
            <div className="stat-label">Success Rate</div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
            <p className="stat-subtext">Targeting</p>
          </div>

          <div className="stat" data-percent="85">
            <div className="stat-number counter" data-target="1200">
              0
            </div>
            <div className="stat-label">Monthly Sessions</div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
            <p className="stat-subtext">Targeting</p>
          </div>
        </div>

        <div className="mx-auto max-w-[1000px] my-16">
          <h3 className="mb-12 text-center text-3xl font-black uppercase">Subject Excellence</h3>
          <div className="grid gap-8">
            {["Mathematics", "Sciences", "Languages", "Technology"].map((label) => (
              <div key={label} className="glass-card p-8">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-bold">{label}</span>
                  <span className="font-bold text-[var(--beige)]">100%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" data-width="100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="subjects-grid mt-24 grid">
          <div className="glass-card">
            <span className="card-icon">🌟</span>
            <h3>About Us</h3>
            <p>
              We provide culturally responsive education that honors indigenous traditions while preparing
              students for future success through accessible, high-quality tutoring and mentorship programs.
            </p>
            <a
              href="#about"
              className="mt-4 inline-block font-bold text-[var(--beige)] no-underline hover:underline"
            >
              Learn More →
            </a>
          </div>
          <div className="glass-card">
            <span className="card-icon">📚</span>
            <h3>Our Subjects</h3>
            <p>
              From mathematics and sciences to languages and arts, we offer comprehensive tutoring across all
              core subjects with culturally relevant teaching methods and materials.
            </p>
            <a
              href="#subjects"
              className="mt-4 inline-block font-bold text-[var(--beige)] no-underline hover:underline"
            >
              View Subjects →
            </a>
          </div>
          <div className="glass-card">
            <span className="card-icon">👨‍🏫</span>
            <h3>Expert Mentors</h3>
            <p>
              Our team includes certified educators, indigenous community leaders, and career professionals
              dedicated to helping students achieve academic excellence and personal growth.
            </p>
            <a
              href="#mentors"
              className="mt-4 inline-block font-bold text-[var(--beige)] no-underline hover:underline"
            >
              Meet Our Team →
            </a>
          </div>
        </div>
      </div>

      <div id="students" className="section">
        <div className="section-header">
          <div className="section-tag">FOR STUDENTS</div>
          <h2 className="section-title">
            Your <span className="gradient-text">Journey</span>
          </h2>
          <p className="section-subtitle">Personalized support for every indigenous student</p>
        </div>
        <div className="subjects-grid grid">
          <div className="glass-card">
            <span className="card-icon">🎯</span>
            <h3>Personalized Learning</h3>
            <p>
              Each student receives a customized learning plan that adapts to their pace, learning style, and
              academic goals while honoring their cultural background.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">🤝</span>
            <h3>Peer Support</h3>
            <p>
              Join study groups and connect with fellow indigenous students for collaborative learning, mutual
              encouragement, and community building.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">🏆</span>
            <h3>Achievement Recognition</h3>
            <p>
              Celebrate your successes! We recognize academic achievements, cultural contributions, and personal
              growth throughout your educational journey.
            </p>
          </div>
        </div>
      </div>

      <div id="about" className="section">
        <div className="section-header">
          <div className="section-tag">WHO WE ARE</div>
          <h2 className="section-title">
            <span className="gradient-text">About</span> Us
          </h2>
          <p className="section-subtitle">
            Building bridges between heritage and innovation through transformative learning
          </p>
        </div>
        <div className="subjects-grid grid">
          <div className="glass-card">
            <span className="card-icon">🌟</span>
            <h3>Our Mission</h3>
            <p>
              To provide culturally responsive education that honors indigenous traditions while preparing
              students for future success through accessible, high-quality tutoring and mentorship.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">👁️</span>
            <h3>Our Vision</h3>
            <p>
              A world where indigenous students thrive academically while maintaining strong connections to their
              cultural heritage, languages, and community values.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">💎</span>
            <h3>Our Values</h3>
            <p>
              Cultural respect, educational excellence, community empowerment, inclusivity, and sustainable
              growth through collaborative learning and mutual support.
            </p>
          </div>
        </div>
      </div>

      <section id="subjects" className="section">
        <div className="section-header">
          <div className="section-tag">Subjects We Teach</div>
          <h2 className="section-title">
            Explore Our <span className="gradient-text">Tutoring Areas</span>
          </h2>
          <p className="section-subtitle">
            We support Indigenous students across a wide range of academic disciplines, empowering excellence
            through culturally grounded education.
          </p>
        </div>

        <div className="subjects-grid grid">
          {[
            ["📘", "English & Literature", "Strengthen communication, essay writing, and analytical reading through Indigenous perspectives and contemporary voices."],
            ["🧮", "Mathematics", "Master foundational to advanced math concepts with culturally relevant examples and step-by-step mentorship."],
            ["🧬", "Science", "Explore biology, chemistry, and physics while connecting traditional Indigenous knowledge with modern discoveries."],
            ["🌍", "Social Studies", "Understand history, geography, and social justice through inclusive and Indigenous-centered perspectives."],
            ["💻", "Computer Science", "Build digital skills, learn to code, and explore technology as a tool for creativity and community empowerment."],
            ["🎨", "Arts & Culture", "Express yourself through visual arts, music, and storytelling — celebrating Indigenous creativity and identity."],
          ].map(([icon, title, text]) => (
            <div key={title} className="glass-card">
              <span className="card-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div id="mentors" className="section">
        <div className="section-header">
          <div className="section-tag">OUR TEAM</div>
          <h2 className="section-title">
            Our <span className="gradient-text">Mentors</span>
          </h2>
        </div>

        <div className="stats-grid subjects-grid">
          <div className="stat">
            <div className="stat-number counter" data-target="500">
              0
            </div>
            <div className="stat-label">Active Students</div>
            <p className="stat-subtext">Targeting</p>
          </div>
          <div className="stat">
            <div className="stat-number counter" data-target="15">
              0
            </div>
            <div className="stat-label">Communities</div>
            <p className="stat-subtext">Targeting</p>
          </div>
          <div className="stat">
            <div className="stat-number counter" data-target="100">
              0
            </div>
            <div className="stat-label">Success Rate</div>
            <p className="stat-subtext">Targeting</p>
          </div>
          <div className="stat">
            <div className="stat-number counter" data-target="45">
              0
            </div>
            <div className="stat-label">Expert Tutors</div>
            <p className="stat-subtext">Targeting</p>
          </div>
        </div>

        <div className="subjects-grid mt-16 grid">
          <div className="glass-card">
            <span className="card-icon">👨‍🏫</span>
            <h3>Expert Educators</h3>
            <p>
              Certified teachers, university professors, and subject matter experts committed to culturally
              responsive education and student success.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">🌱</span>
            <h3>Community Leaders</h3>
            <p>
              Indigenous community members, elders, and cultural practitioners who share traditional knowledge
              and provide cultural guidance.
            </p>
          </div>
          <div className="glass-card">
            <span className="card-icon">💼</span>
            <h3>Career Professionals</h3>
            <p>
              Successful indigenous professionals from various fields who inspire students and share real-world
              experience and career insights.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-24 max-w-[800px] text-center">
          <h3 className="mb-6 text-5xl font-black uppercase tracking-wide">Become a Tutor</h3>
          <p className="mb-10 text-xl leading-relaxed text-[var(--beige-light)]">
            Share your knowledge, experience, and passion. Help shape the next generation of indigenous leaders
            and scholars. Apply today to join our community of dedicated educators.
          </p>
          <a href="/login.html" className="btn btn-primary">
            Apply to Tutor →
          </a>
        </div>
      </div>

      <button id="scrollTopBtn" type="button" title="Back to Top">
        ↑
      </button>

      <div className="music-control" id="musicControl">
        <div className="music-header">
          <div className="music-icon">🎵</div>
          <div className="music-title">Music</div>
          <button type="button" className="collapse-btn" id="collapseBtn">
            →
          </button>
        </div>

        <div className="music-panel">
          <input type="range" id="volumeSlider" className="volume-slider" min="0" max="100" defaultValue="30" />

          <div className="volume-label">
            <span>Soft</span>
            <span id="volumeValue">30%</span>
            <span>Intense</span>
          </div>

          <button type="button" className="music-toggle" id="musicToggle">
            ▶ Play Music
          </button>
        </div>
      </div>

      <footer>
        <p>© 2026 Saint Thunderbird Tutoring</p>
        <p>All coded, no website builder</p>
        <p>Empowering communities through education</p>
      </footer>
    </>
  );
}
