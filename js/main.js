// Fogadjokosan - Main JavaScript
// Minimal JS for essential interactions

document.addEventListener('DOMContentLoaded', function () {
  // Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
  }

  // Search Modal
  const searchToggle = document.querySelector('.search-toggle');
  const searchModal = document.querySelector('.search-modal');
  const searchClose = document.querySelector('.search-close');
  const searchInput = document.querySelector('.search-input');

  if (searchToggle && searchModal) {
    searchToggle.addEventListener('click', function () {
      searchModal.classList.add('active');
      setTimeout(() => searchInput?.focus(), 100);
    });

    searchClose?.addEventListener('click', function () {
      searchModal.classList.remove('active');
    });

    searchModal.addEventListener('click', function (e) {
      if (e.target === searchModal) {
        searchModal.classList.remove('active');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchModal.classList.contains('active')) {
        searchModal.classList.remove('active');
      }
    });
  }

  // Sticky Header Background
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe article and bookmaker cards
  document.querySelectorAll('.article-card, .bookmaker-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });

  // Dropdown menus (desktop)
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('mouseenter', function () {
      this.querySelector('.nav-dropdown-menu')?.classList.add('show');
    });

    dropdown.addEventListener('mouseleave', function () {
      this.querySelector('.nav-dropdown-menu')?.classList.remove('show');
    });
  });

  // Mobile dropdowns
  document.querySelectorAll('.mobile-nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const menu = this.nextElementSibling;
      menu?.classList.toggle('active');
      this.classList.toggle('active');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Lazy loading images
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  } else {
    // Fallback for browsers without native lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }
});
