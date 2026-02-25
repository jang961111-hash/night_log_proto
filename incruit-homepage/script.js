// ============================================================
//  INCRUIT WORKS – Landing Page Script
// ============================================================

// ---------- Tab card click → scroll to solution section ----------
const solCards = document.querySelectorAll('.sol-card');

solCards.forEach(function (card) {
  card.addEventListener('click', function () {
    const targetId = card.dataset.target;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (target) {
      const headerH = document.querySelector('.site-header').offsetHeight || 60;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }

    // Active state
    solCards.forEach(function (c) { c.classList.remove('active'); });
    card.classList.add('active');
  });
});

// ---------- Scroll-to-top button ----------
const scrollTopBtn = document.getElementById('scroll-top-btn');

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- Scroll reveal ----------
const revealNodes = document.querySelectorAll('.reveal:not(.is-visible)');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  revealNodes.forEach(function (node) { observer.observe(node); });
} else {
  revealNodes.forEach(function (node) { node.classList.add('is-visible'); });
}

// ---------- Header scroll shadow ----------
const header = document.querySelector('.site-header');

window.addEventListener('scroll', function () {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 2px 16px rgba(63, 128, 234, 0.1)';
  } else {
    header.style.boxShadow = '0 1px 8px rgba(63, 128, 234, 0.06)';
  }
}, { passive: true });
