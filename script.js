


/* ====== Non-destructive fixes for your original file ======
   - Theme toggle function (toggleTheme)
   - Intro overlay removal after animation
   - IntersectionObservers to add .visible to elements
   - Counters and progress bar animations
   - Nav scrolled class
   - Small star generator for #stars (non-intrusive)
   Paste this block BEFORE </body>.
===========================================================*/

(function () {
  // --- Helper: safe query
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // --- Theme toggle function (used by your button onclick="toggleTheme()")
  window.toggleTheme = function toggleTheme() {
    document.body.classList.toggle('light-mode');
    // store preference
    if (document.body.classList.contains('light-mode')) {
      try { localStorage.setItem('st-theme', 'light'); } catch {}
    } else {
      try { localStorage.setItem('st-theme', 'dark'); } catch {}
    }
  };

  // Apply saved theme on load
  try {
    const saved = localStorage.getItem('st-theme');
    if (saved === 'light') document.body.classList.add('light-mode');
    if (saved === 'dark') document.body.classList.remove('light-mode');
  } catch (e) { /* ignore localStorage errors */ }

  // --- Intro overlay handling
  const intro = document.querySelector('.intro-overlay') || document.getElementById('popupOverlay');
  if (intro) {
    // If it's the CSS animated overlay (.intro-overlay) we wait for its animationend.
    // Otherwise for popupOverlay we listen for a close button as in your file earlier.
    const finishOverlay = () => {
      try {
        // Add class to hide and then remove from DOM after a short delay to avoid covering click events
        intro.classList.add('hidden');
        // also ensure it's removed from flow
        setTimeout(() => {
          intro.style.display = 'none';
          // accessibility: restore focus to body
          document.body.removeAttribute('aria-hidden');
        }, 600);
      } catch (e) { /* ignore */ }
    };

    // If CSS animation ends (for .intro-overlay)
    intro.addEventListener('animationend', (ev) => {
      // Many overlays use chained animations; we simply hide when an animation finishes (safe)
      finishOverlay();
    }, { once: true });

    // In case animationend doesn't fire (some browsers), fallback timer (matches your CSS timings)
    setTimeout(() => {
      if (getComputedStyle(intro).display !== 'none') finishOverlay();
    }, 6000); // slightly longer than your CSS 4.5s+1s

    // If your popupOverlay uses a close button with id closePopup, hook it
    const closeBtn = document.getElementById('closePopup');
    if (closeBtn) closeBtn.addEventListener('click', finishOverlay);
  }

  // --- IntersectionObserver to add .visible to many elements while preserving CSS animations
  const ioOptions = { threshold: 0.18 };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        // once visible, unobserve to avoid repeated firing
        revealObserver.unobserve(e.target);
      }
    });
  }, ioOptions);

  // target lists: section headers, glass-cards, stats, hero badge, cta, nav links maybe
  const revealSelectors = [
    '.section-header',
    '.glass-card',
    '.stat',
    '.hero-badge',
    '.cta-group',
    '.hero h1', '.hero p'
  ];
  revealSelectors.forEach(sel => {
    $$(sel).forEach(el => {
      // if element already visible because of CSS, skip
      if (!el.classList.contains('visible')) revealObserver.observe(el);
    });
  });

  // Also ensure elements that were set to opacity:0 in CSS start visible if you want them visible immediately.
  // You asked to keep animations, so we rely on the observer above for in-view reveals.

  // --- Counters (animate from 0 to data-target)
  const counters = $$('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset._animated) { counterObserver.unobserve(el); return; }
      const target = parseInt(el.getAttribute('data-target') || el.textContent || '0', 10) || 0;
      const durationMs = 1600;
      const fps = 60;
      const totalFrames = Math.round((durationMs / 1000) * fps);
      let frame = 0;
      const start = 0;
      const step = () => {
        frame++;
        const progress = frame / totalFrames;
        // easeOutQuad
        const eased = 1 - (1 - progress) * (1 - progress);
        const value = Math.round(start + (target - start) * eased);
        el.textContent = value.toLocaleString();
        if (frame < totalFrames) requestAnimationFrame(step);
        else {
          el.textContent = target.toLocaleString();
          el.dataset._animated = 'true';
          counterObserver.unobserve(el);
        }
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.3 });

  counters.forEach(c => counterObserver.observe(c));

  // --- Progress bars: animate width to data-width when in view
  const progressBars = $$('.progress-bar');
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      if (bar.dataset._filled) { progressObserver.unobserve(bar); return; }
      const width = parseFloat(bar.getAttribute('data-width') || bar.dataset.width || '0') || 0;
      // apply width with transition (CSS already has transition for width on .progress-bar? if not, set inline)
      bar.style.transition = 'width 1200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      // set a tiny timeout to ensure transition runs
      setTimeout(() => bar.style.width = width + '%', 40);
      bar.classList.add('visible');
      bar.dataset._filled = 'true';
      progressObserver.unobserve(bar);
    });
  }, { threshold: 0.2 });
  progressBars.forEach(b => progressObserver.observe(b));

  // --- Nav scrolled behavior
  const nav = document.getElementById('nav') || document.querySelector('nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 48) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // init once
  onScroll();

  // --- Simple star generator for #stars (non-destructive, small)
  const starsRoot = document.getElementById('stars');
  if (starsRoot && !starsRoot.dataset.generated) {
    const count = 40;
    const rnd = (min, max) => Math.random() * (max - min) + min;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.left = `${rnd(0, 100)}%`;
      s.style.top = `${rnd(0, 100)}%`;
      s.style.width = s.style.height = `${rnd(1, 3)}px`;
      s.style.animationDelay = `${rnd(0, 3)}s`;
      s.style.opacity = `${rnd(0.1, 0.9)}`;
      starsRoot.appendChild(s);
    }
    starsRoot.dataset.generated = 'true';
  }

  // --- Accessibility: allow skipping overlay with Escape key (if overlay present)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (intro && getComputedStyle(intro).display !== 'none') {
        intro.classList.add('hidden');
        setTimeout(() => intro.style.display = 'none', 300);
      }
    }
  });

  // -- End of script
})();
// ===== Scroll to Top Script =====
const scrollBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', () => {
// Show button after scrolling down 250px
if (window.scrollY > 250) {
    scrollBtn.style.opacity = '1';
    scrollBtn.style.pointerEvents = 'auto';
} else {
    scrollBtn.style.opacity = '0';
    scrollBtn.style.pointerEvents = 'none';
}
});

// Smooth scroll to top on click
scrollBtn.addEventListener('click', () => {
window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Hide overlay on load =====
window.addEventListener('load', () => {
const overlay = document.querySelector('.intro-overlay, #popupOverlay');
if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.add('hidden');
}
});

