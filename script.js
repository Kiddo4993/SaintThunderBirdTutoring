/* ====== Saint Thunderbird - Complete Working Script ====== */

(function () {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // ===== SMOOTH INTRO OVERLAY EXIT =====
  const intro = $('.intro-overlay');
  if (intro) {
    const closeIntro = () => {
      intro.style.transition = 'opacity 1s ease, transform 1s ease';
      intro.style.opacity = '0';
      intro.style.transform = 'scale(1.05)';

      setTimeout(() => {
        intro.style.display = 'none';
        intro.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }, 1000);
    };

    setTimeout(closeIntro, 4500);
    intro.style.cursor = 'pointer';
    intro.addEventListener('click', closeIntro);

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeIntro();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  }

  // ===== INTERSECTION OBSERVER =====
  const observerOptions = { threshold: 0.18, rootMargin: '0px 0px -50px 0px' };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealSelectors = [
    '.section-header',
    '.glass-card',
    '.stat',
    '.hero-badge',
    '.cta-group',
    '.hero h1',
    '.hero p'
  ];

  revealSelectors.forEach(sel => {
    $$(sel).forEach(el => {
      if (!el.classList.contains('visible')) {
        revealObserver.observe(el);
      }
    });
  });

  // ===== ANIMATED COUNTERS =====
  const counters = $$('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      if (el.dataset._animated) {
        counterObserver.unobserve(el);
        return;
      }

      const target = parseInt(el.getAttribute('data-target') || '0', 10);
      const duration = 2000;
      let frame = 0;
      const fps = 60;
      const totalFrames = (duration / 1000) * fps;

      const animate = () => {
        frame++;
        const progress = frame / totalFrames;
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);

        el.textContent = value.toLocaleString();

        if (frame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = target.toLocaleString();
          el.dataset._animated = 'true';
          counterObserver.unobserve(el);
        }
      };

      requestAnimationFrame(animate);
    });
  }, { threshold: 0.3 });

  counters.forEach(c => counterObserver.observe(c));

  // ===== PROGRESS BARS =====
  const progressFills = $$('.progress-fill');
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const fill = entry.target;
      if (fill.dataset._filled) {
        progressObserver.unobserve(fill);
        return;
      }

      const width = parseFloat(fill.getAttribute('data-width') || '100');

      setTimeout(() => {
        fill.style.width = width + '%';
        fill.style.background = 'linear-gradient(90deg, #ff8c00, #ffa500, #ff6b35)';
        fill.dataset._filled = 'true';
      }, 100);

      progressObserver.unobserve(fill);
    });
  }, { threshold: 0.2 });

  progressFills.forEach(f => progressObserver.observe(f));

  // ===== NAVIGATION =====
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ===== SMOOTH SCROLL =====
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = $(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== STAR GENERATOR =====
  const starsRoot = $('#stars');
  if (starsRoot && !starsRoot.dataset.generated) {
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const rnd = (min, max) => Math.random() * (max - min) + min;
      star.style.cssText = `
        left: ${rnd(0, 100)}%;
        top: ${rnd(0, 100)}%;
        width: ${rnd(1, 3)}px;
        height: ${rnd(1, 3)}px;
        animation-delay: ${rnd(0, 3)}s;
      `;
      starsRoot.appendChild(star);
    }
    starsRoot.dataset.generated = 'true';
  }

  // ===== SCROLL TO TOP BUTTON =====
  const scrollBtn = $('#scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== POPUP SYSTEM =====
  const popups = [
    {
      icon: '🎓',
      title: 'Welcome!',
      msg: 'Explore culturally responsive education for Indigenous students',
      btn: 'Learn More',
      link: '#about'
    },
    {
      icon: '500️⃣',
      title: 'Targeting 500+ Students',
      msg: 'Join our thriving community targeting over 15 Indigenous communities',
      btn: 'Join Us',
      link: '#students'
    },
    {
      icon: '💝',
      title: 'Completely Free',
      msg: 'All tutoring services are free for First Nations students',
      btn: 'Get Started',
      link: '#subjects'
    },
    {
      icon: '👨‍🏫',
      title: 'Become a Tutor',
      msg: 'Share your knowledge and make a lasting impact',
      btn: 'Apply Now',
      link: '#mentors'
    },
    {
      icon: '⚡',
      title: 'Expert Mentorship',
      msg: 'Learn from certified educators and indigenous community leaders',
      btn: 'Meet Our Team',
      link: '#mentors'
    },
    {
      icon: '🌟',
      title: '100% Success Rate',
      msg: 'Students are improving their grades with our personalized support',
      btn: 'View Subjects',
      link: '#subjects'
    },
    {
      icon: '🤝',
      title: 'Community First',
      msg: 'Join study groups and connect with fellow indigenous students',
      btn: 'Explore More',
      link: '#students'
    },
    {
      icon: '🏆',
      title: 'Celebrate Success',
      msg: 'We recognize every achievement and celebrate your growth',
      btn: 'Learn More',
      link: '#about'
    }
  ];

  let popupIndex = 0;
  let popupEl;

  function createPopup() {
    popupEl = document.createElement('div');
    popupEl.className = 'st-popup';
    popupEl.innerHTML = `
      <div class="st-popup-card">
        <button class="st-popup-close">×</button>
        <div class="st-popup-icon"></div>
        <h3 class="st-popup-title"></h3>
        <p class="st-popup-msg"></p>
        <a href="#" class="st-popup-btn"></a>
      </div>
    `;
    document.body.appendChild(popupEl);

    popupEl.querySelector('.st-popup-close').addEventListener('click', hidePopup);
    popupEl.addEventListener('click', (e) => {
      if (e.target === popupEl) hidePopup();
    });
  }

  function showPopup() {
    if (!popupEl) createPopup();

    const p = popups[popupIndex];
    popupEl.querySelector('.st-popup-icon').textContent = p.icon;
    popupEl.querySelector('.st-popup-title').textContent = p.title;
    popupEl.querySelector('.st-popup-msg').textContent = p.msg;
    popupEl.querySelector('.st-popup-btn').textContent = p.btn;
    popupEl.querySelector('.st-popup-btn').href = p.link;

    popupEl.classList.add('active');
    setTimeout(() => hidePopup(), 8000);
    popupIndex = (popupIndex + 1) % popups.length;
  }

  function hidePopup() {
    if (popupEl) popupEl.classList.remove('active');
  }

  setTimeout(showPopup, 6000);
  setInterval(() => {
    if (!popupEl || !popupEl.classList.contains('active')) {
      showPopup();
    }
  }, 25000);

  console.log('%c⚡ Saint Thunderbird', 'color: #d4a574; font-size: 20px; font-weight: bold;');

})();

/* ====== MUSIC SYSTEM ====== */
let audioContext;
let isPlaying = false;

function setupMusicControls() {
  const volumeSlider = document.getElementById('volumeSlider');
  const musicToggle = document.getElementById('musicToggle');
  const volumeValue = document.getElementById('volumeValue');
  const collapseBtn = document.getElementById('collapseBtn');
  const musicControl = document.getElementById('musicControl');

  if (volumeSlider) {
    volumeSlider.addEventListener('input', function () {
      volumeValue.textContent = this.value + '%';
    });
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', toggleMusic);
  }

  // Collapse/expand functionality
  if (collapseBtn && musicControl) {
    collapseBtn.addEventListener('click', function () {
      const isCollapsed = musicControl.classList.toggle('collapsed');
      collapseBtn.textContent = isCollapsed ? '←' : '→';
    });
  }
}

function toggleMusic() {
  const btn = document.getElementById('musicToggle');

  if (!isPlaying) {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    audioContext.resume();
    isPlaying = true;
    btn.textContent = '⏸ Stop Music';
    playClassicalMusic();
  } else {
    isPlaying = false;
    btn.textContent = '▶ Play Music';
  }
}

function playClassicalMusic() {
  if (!isPlaying) return;

  const notes = [
    { freq: 329.63, duration: 0.6 },
    { freq: 349.23, duration: 0.6 },
    { freq: 392.00, duration: 0.9 },
    { freq: 349.23, duration: 0.6 },
    { freq: 329.63, duration: 0.6 },
    { freq: 293.66, duration: 0.9 },
    { freq: 261.63, duration: 0.6 },
    { freq: 293.66, duration: 0.6 },
    { freq: 329.63, duration: 0.9 },
  ];

  let delay = 0;
  notes.forEach(note => {
    setTimeout(() => {
      if (isPlaying) {
        playNote(note.freq, note.duration);
      }
    }, delay * 1000);
    delay += note.duration;
  });

  if (isPlaying) {
    setTimeout(() => playClassicalMusic(), delay * 1000);
  }
}

function playNote(frequency, duration) {
  if (!audioContext) return;

  const volumeSlider = document.getElementById('volumeSlider');
  const volume = volumeSlider ? volumeSlider.value / 100 : 0.3;

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.05 * volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001 * volume, audioContext.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + duration);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', setupMusicControls);

/* ====== Theme Toggle ====== */
window.toggleTheme = function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');

  if (isLight) {
    try { localStorage.setItem('st-theme', 'light'); } catch { }
  } else {
    try { localStorage.setItem('st-theme', 'dark'); } catch { }
  }

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = isLight ? '☀️' : '🌓';
  }
};

// Load saved theme immediately
try {
  const saved = localStorage.getItem('st-theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light-mode');
    document.body.classList.add('light-mode');
  }
} catch (e) {
  console.warn('Could not load theme');
}

// Update button when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn && document.body.classList.contains('light-mode')) {
    themeBtn.textContent = '☀️';
  }
  setupInfoTabs();
});

/* ====== PREMIUM INFO CARDS SYSTEM ====== */
const infoCards = [
  {
    icon: '🎓',
    title: 'Our Mission',
    subtitle: 'Empowering Through Education',
    description: 'Provide culturally responsive education that honors indigenous traditions while preparing students for future success through accessible, high-quality tutoring and mentorship.',
    highlight: 'Excellence meets Heritage',
    stats: ['Targeting 500+ Students', '100% Success Rate', 'Targeting 15 Communities']
  },
  {
    icon: '🌍',
    title: 'Serving Communities',
    subtitle: 'Across the Nation',
    description: 'We proudly serve indigenous students across 15 different First Nations communities spanning 3 provinces, bringing quality education directly to where our students live.',
    highlight: 'Coast to Coast Impact',
    stats: ['Targeting 15 Communities', 'Targeting 3 Provinces', 'Growing Daily']
  },
  {
    icon: '⚡',
    title: 'Targeting 500+ Students Strong',
    subtitle: 'A Growing Movement',
    description: 'Targeting over 500 indigenous students are currently enrolled and thriving with Saint Thunderbird. Each student receives personalized support tailored to their unique learning style and cultural background.',
    highlight: 'Every Student Matters',
    stats: ['Targeting 500+ Enrolled', '45% Growth YoY', 'Free Access']
  },
  {
    icon: '👨‍🏫',
    title: 'Expert Team',
    subtitle: 'Dedicated Educators',
    description: 'Our team of 45+ expert tutors includes certified teachers, university professors, indigenous community leaders, and successful professionals committed to student success.',
    highlight: 'Experts Who Care',
    stats: ['Targeting 45+ Tutors', 'All Certified', 'Community Leaders']
  },
  {
    icon: '🏆',
    title: '100% Success Rate',
    subtitle: 'Proven Results',
    description: 'Students consistently show significant academic improvement within the first semester. We measure success not just in grades, but in confidence, cultural pride, and personal growth.',
    highlight: 'Results That Matter',
    stats: ['100% Improve', 'Grade Increases', 'Confidence Boost']
  },
  {
    icon: '💝',
    title: 'Completely Free',
    subtitle: 'No Hidden Costs',
    description: 'All tutoring services are provided completely free to First Nations students. As a non-profit organization, we believe quality education should never be a financial burden.',
    highlight: 'Education for Everyone',
    stats: ['100% Free', 'No Fees', 'All Services Covered']
  },
  {
    icon: '🤝',
    title: 'Student-Led Non-Profit',
    subtitle: 'By Students, For Students',
    description: 'Founded on the principle that students understand student needs best. Saint Thunderbird is led by passionate young educators and community members dedicated to change.',
    highlight: 'Youth Leadership',
    stats: ['Student Founded', 'Community Driven', 'Growing Network']
  },
  {
    icon: '🌟',
    title: 'Cultural Pride',
    subtitle: 'Honoring Our Heritage',
    description: 'We celebrate and integrate indigenous knowledge, languages, and cultural perspectives into every aspect of learning. Education that strengthens identity, not diminishes it.',
    highlight: 'Heritage + Excellence',
    stats: ['Cultural Integration', 'Language Support', 'Tradition Honored']
  }
];

let currentCardIndex = 0;
let infoCardElement = null;
let cardTimeout = null;

function createInfoCard() {
  infoCardElement = document.createElement('div');
  infoCardElement.className = 'premium-info-card';
  infoCardElement.innerHTML = `
    <div class="premium-info-backdrop"></div>
    <div class="premium-info-content">
      <button class="premium-info-close">×</button>
      <div class="premium-info-icon"></div>
      <div class="premium-info-header">
        <h3 class="premium-info-title"></h3>
        <p class="premium-info-subtitle"></p>
      </div>
      <p class="premium-info-description"></p>
      <div class="premium-info-highlight"></div>
      <div class="premium-info-stats"></div>
      <div class="premium-info-footer">
        <button class="premium-info-prev">←</button>
        <span class="premium-info-counter"></span>
        <button class="premium-info-next">→</button>
      </div>
    </div>
  `;
  document.body.appendChild(infoCardElement);

  infoCardElement.querySelector('.premium-info-close').addEventListener('click', hideInfoCard);
  infoCardElement.querySelector('.premium-info-prev').addEventListener('click', () => changeCard(-1));
  infoCardElement.querySelector('.premium-info-next').addEventListener('click', () => changeCard(1));
  infoCardElement.querySelector('.premium-info-backdrop').addEventListener('click', hideInfoCard);
}

function showInfoCard() {
  if (!infoCardElement) createInfoCard();

  const card = infoCards[currentCardIndex];
  const closeBtn = infoCardElement.querySelector('.premium-info-close');
  const content = infoCardElement.querySelector('.premium-info-content');

  infoCardElement.querySelector('.premium-info-icon').textContent = card.icon;
  infoCardElement.querySelector('.premium-info-title').textContent = card.title;
  infoCardElement.querySelector('.premium-info-subtitle').textContent = card.subtitle;
  infoCardElement.querySelector('.premium-info-description').textContent = card.description;
  infoCardElement.querySelector('.premium-info-highlight').textContent = '✨ ' + card.highlight + ' ✨';

  const statsHtml = card.stats.map(stat => `<span class="stat-badge">${stat}</span>`).join('');
  infoCardElement.querySelector('.premium-info-stats').innerHTML = statsHtml;

  infoCardElement.querySelector('.premium-info-counter').textContent = `${currentCardIndex + 1}/${infoCards.length}`;

  closeBtn.style.opacity = '1';
  content.style.opacity = '1';
  infoCardElement.classList.add('active');

  clearTimeout(cardTimeout);
  cardTimeout = setTimeout(() => {
    closeBtn.style.opacity = '0';
    content.style.opacity = '0';
    setTimeout(() => hideInfoCard(), 300);
  }, 12000);
}

function hideInfoCard() {
  if (infoCardElement) {
    infoCardElement.classList.remove('active');
    clearTimeout(cardTimeout);
  }
}

function changeCard(direction) {
  currentCardIndex += direction;
  if (currentCardIndex >= infoCards.length) currentCardIndex = 0;
  if (currentCardIndex < 0) currentCardIndex = infoCards.length - 1;
  showInfoCard();
}

function setupInfoTabs() {
  // Removed auto-popup - only shows on user interaction now
}

/* ====== INFO MENU SYSTEM ====== */
let infoMenuElement = null;

function toggleInfoMenu() {
  if (!infoMenuElement) createInfoMenu();
  infoMenuElement.classList.toggle('active');
}

function createInfoMenu() {
  infoMenuElement = document.createElement('div');
  infoMenuElement.className = 'info-menu-dropdown';

  let html = '<div class="info-menu-stripes">☰</div>';
  html += '<div class="info-menu-content">';

  infoCards.forEach((card, index) => {
    html += `
      <div class="info-menu-item" onclick="openDetailedCard(${index})">
        <span class="menu-item-icon">${card.icon}</span>
        <div class="menu-item-text">
          <div class="menu-item-title">${card.title}</div>
          <div class="menu-item-subtitle">${card.subtitle}</div>
        </div>
        <span class="menu-item-arrow">→</span>
      </div>
    `;
  });

  html += '</div>';
  infoMenuElement.innerHTML = html;

  document.body.appendChild(infoMenuElement);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.info-menu-btn') && !e.target.closest('.info-menu-dropdown')) {
      infoMenuElement.classList.remove('active');
    }
  });
}

function openDetailedCard(index) {
  currentCardIndex = index;
  showInfoCard();
  if (infoMenuElement) infoMenuElement.classList.remove('active');
}
/* ====== DYNAMIC DATA LOADING (Add this to the bottom of script.js) ====== */

document.addEventListener('DOMContentLoaded', () => {
  loadTutors();
});

async function loadTutors() {
  // 1. Find the container where you want the boxes to appear
  const container = document.getElementById('tutors-container');

  // If this page doesn't have the container, stop running (prevents errors)
  if (!container) return;

  try {
    // 2. Fetch data from the backend
    // Note: You need to be logged in (have a token) for this to work
    const token = localStorage.getItem('token');

    const response = await fetch('/api/tutor/available-tutors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      // 3. Clear any placeholder text
      container.innerHTML = '';

      // 4. Generate a box for each tutor
      if (data.tutors.length === 0) {
        container.innerHTML = '<p>No tutors available right now.</p>';
        return;
      }

      data.tutors.forEach(tutor => {
        const subjects = tutor.tutorProfile?.subjects?.join(', ') || 'General Help';
        const bio = tutor.tutorProfile?.bio || 'Ready to help you learn!';

        const card = `
                  <div class="glass-card tutor-card">
                      <div class="tutor-header">
                          <div class="tutor-avatar">${tutor.firstName.charAt(0)}</div>
                          <div>
                              <h3>${tutor.firstName} ${tutor.lastName}</h3>
                              <span class="subject-badge">${subjects}</span>
                          </div>
                      </div>
                      <p class="tutor-bio">${bio}</p>
                      <button onclick="requestTutor('${tutor._id}')" class="btn-primary">Request Help</button>
                  </div>
              `;
        container.innerHTML += card;
      });
    }
  } catch (error) {
    console.error('Error loading tutors:', error);
  }
}

// Function to handle the "Request Help" button click
function requestTutor(tutorId) {
  // Store the ID so we know who they chose, then redirect to request form
  localStorage.setItem('selectedTutorId', tutorId);
  window.location.href = 'request-help.html';
}