import {
  Star,
  BookOpen,
  GraduationCap,
  Target,
  Users,
  Trophy,
  Sprout,
  Briefcase,
  BookMarked,
  Calculator,
  FlaskConical,
  Globe,
  Monitor,
  Palette,
  Eye,
  Gem,
} from "lucide-react";

const ICON = { size: 18, strokeWidth: 1.5, "aria-hidden": "true" };

const subjects = [
  {
    Icon: BookMarked,
    title: "English & Literature",
    text: "Strengthen communication, essay writing, and analytical reading through Indigenous perspectives and contemporary voices.",
  },
  {
    Icon: Calculator,
    title: "Mathematics",
    text: "Master foundational to advanced math concepts with culturally relevant examples and step-by-step mentorship.",
  },
  {
    Icon: FlaskConical,
    title: "Science",
    text: "Explore biology, chemistry, and physics while connecting traditional Indigenous knowledge with modern discoveries.",
  },
  {
    Icon: Globe,
    title: "Social Studies",
    text: "Understand history, geography, and social justice through inclusive and Indigenous-centered perspectives.",
  },
  {
    Icon: Monitor,
    title: "Computer Science",
    text: "Build digital skills, learn to code, and explore technology as a tool for creativity and community empowerment.",
  },
  {
    Icon: Palette,
    title: "Arts & Culture",
    text: "Express yourself through visual arts, music, and storytelling — celebrating Indigenous creativity and identity.",
  },
];

export default function HomeContent() {
  return (
    <>
      <div className="hero" id="main-content">
        <div className="stars" id="stars" />
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
        <div className="hero-blob hero-blob-3" aria-hidden="true" />
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
        <div className="container">
          <div className="section-header">
            <div className="section-tag">OVERVIEW</div>
            <h2 className="section-title">
              <span className="gradient-text">Welcome</span> To Saint Thunderbird
            </h2>
            <p className="section-subtitle">Data-driven excellence in indigenous education</p>
          </div>

          <div className="stats-grid subjects-grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4 mb-24">
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

          <div className="section-header" style={{ textAlign: "center" }}>
            <h3
              className="section-title"
              style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                textTransform: "uppercase",
                marginBottom: "3rem",
                textAlign: "center",
              }}
            >
              Subject Excellence
            </h3>
          </div>
          <div className="subjects-grid gap-8 !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4">
            {["Mathematics", "Sciences", "Languages", "Technology"].map((label) => (
              <div key={label} className="glass-card p-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="text-lg font-bold truncate">{label}</span>
                  <span className="font-bold text-[var(--beige)] shrink-0">100%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" data-width="100" />
                </div>
              </div>
            ))}
          </div>

          <div className="subjects-grid mt-24 grid">
            <div className="glass-card">
              <Star className="card-icon" {...ICON} />
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
              <BookOpen className="card-icon" {...ICON} />
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
              <GraduationCap className="card-icon" {...ICON} />
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
      </div>

      <div id="students" className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">FOR STUDENTS</div>
            <h2 className="section-title">
              Your <span className="gradient-text">Journey</span>
            </h2>
            <p className="section-subtitle">Personalized support for every indigenous student</p>
          </div>
          <div className="subjects-grid grid">
            <div className="glass-card">
              <Target className="card-icon" {...ICON} />
              <h3>Personalized Learning</h3>
              <p>
                Each student receives a customized learning plan that adapts to their pace, learning style, and
                academic goals while honoring their cultural background.
              </p>
            </div>
            <div className="glass-card">
              <Users className="card-icon" {...ICON} />
              <h3>Peer Support</h3>
              <p>
                Join study groups and connect with fellow indigenous students for collaborative learning, mutual
                encouragement, and community building.
              </p>
            </div>
            <div className="glass-card">
              <Trophy className="card-icon" {...ICON} />
              <h3>Achievement Recognition</h3>
              <p>
                Celebrate your successes! We recognize academic achievements, cultural contributions, and personal
                growth throughout your educational journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="section">
        <div className="container">
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
              <Star className="card-icon" {...ICON} />
              <h3>Our Mission</h3>
              <p>
                To provide culturally responsive education that honors indigenous traditions while preparing
                students for future success through accessible, high-quality tutoring and mentorship.
              </p>
            </div>
            <div className="glass-card">
              <Eye className="card-icon" {...ICON} />
              <h3>Our Vision</h3>
              <p>
                A world where indigenous students thrive academically while maintaining strong connections to their
                cultural heritage, languages, and community values.
              </p>
            </div>
            <div className="glass-card">
              <Gem className="card-icon" {...ICON} />
              <h3>Our Values</h3>
              <p>
                Cultural respect, educational excellence, community empowerment, inclusivity, and sustainable
                growth through collaborative learning and mutual support.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section id="subjects" className="section">
        <div className="container">
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
            {subjects.map(({ Icon, title, text }) => (
              <div key={title} className="glass-card">
                <Icon className="card-icon" {...ICON} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="mentors" className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">OUR TEAM</div>
            <h2 className="section-title">
              Our <span className="gradient-text">Mentors</span>
            </h2>
          </div>

          <div className="stats-grid subjects-grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4">
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
              <GraduationCap className="card-icon" {...ICON} />
              <h3>Expert Educators</h3>
              <p>
                Certified teachers, university professors, and subject matter experts committed to culturally
                responsive education and student success.
              </p>
            </div>
            <div className="glass-card">
              <Sprout className="card-icon" {...ICON} />
              <h3>Community Leaders</h3>
              <p>
                Indigenous community members, elders, and cultural practitioners who share traditional knowledge
                and provide cultural guidance.
              </p>
            </div>
            <div className="glass-card">
              <Briefcase className="card-icon" {...ICON} />
              <h3>Career Professionals</h3>
              <p>
                Successful indigenous professionals from various fields who inspire students and share real-world
                experience and career insights.
              </p>
            </div>
          </div>

          <div
            className="section-header mt-24"
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "4rem 2rem",
            }}
          >
            <h2 className="section-title" style={{ textAlign: "center", width: "100%" }}>
              Become a Tutor
            </h2>
            <p
              className="section-subtitle"
              style={{ marginBottom: "2.5rem", textAlign: "center", maxWidth: "600px" }}
            >
              Share your knowledge, experience, and passion. Help shape the next generation of indigenous leaders
              and scholars. Apply today to join our community of dedicated educators.
            </p>
            <a href="/signup" className="btn btn-primary">
              Apply to Tutor →
            </a>
          </div>
        </div>
      </div>

      <button id="scrollTopBtn" type="button" title="Back to Top" aria-label="Back to top">
        ↑
      </button>

      <footer>
        <p>© 2026 Saint Thunderbird Tutoring</p>
        <p>All coded, no website builder</p>
        <p>Empowering communities through education</p>
      </footer>
    </>
  );
}
