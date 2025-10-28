/* ====== Saint Thunderbird - Main Animations & Features ====== */

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

    // Auto-close after 4.5 seconds
    setTimeout(closeIntro, 4500);

    // Click anywhere to skip
    intro.style.cursor = 'pointer';
    intro.addEventListener('click', closeIntro);

    // ESC key to skip
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
      let start = 0;
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

  // ===== PROGRESS BARS WITH ORANGE =====
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

  // ===== ENHANCED SCROLL BUTTON =====
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

    // Prevent any default button behavior
    scrollBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== ENHANCED POPUP SYSTEM WITH VARIETY =====
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
      title: '500+ Students', 
      msg: 'Join our thriving community across 15 Indigenous communities', 
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
      title: '92% Success Rate', 
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

/* ====== Theme Toggle (Load First) ====== */
window.toggleTheme = function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  
  if (isLight) {
    try { localStorage.setItem('st-theme', 'light'); } catch {}
  } else {
    try { localStorage.setItem('st-theme', 'dark'); } catch {}
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
});