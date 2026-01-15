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

  // Background Visualization - Interactive Particle Network
  const createParticleBackground = (container) => {
    if (!container) return;

    // Check if canvas already exists
    if (container.querySelector('.bg-canvas')) return;

    // Ensure container is relative
    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === 'static') {
      container.style.position = 'relative';
    }
    // Only force overflow hidden if verified safe, but usually good for particles
    // container.style.overflow = 'hidden'; 
    if (computedStyle.zIndex === 'auto') {
      container.style.zIndex = '1';
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.classList.add('bg-canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.6';
    canvas.style.pointerEvents = 'none';
    container.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration
    const particleCount = window.innerWidth < 768 ? 20 : 40;
    const connectionDistance = 120;
    const mouseDistance = 150;

    // Mouse state
    const mouse = { x: null, y: null };

    // Resize handler
    const resize = () => {
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Mouse move handler
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    // Mouse leave handler
    container.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
        this.color = '#39FF14'; // Neon green
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction
        if (mouse.x != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseDistance) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseDistance - distance) / mouseDistance;

            // Attract but swirl
            const directionX = forceDirectionX * force * 0.5;
            const directionY = forceDirectionY * force * 0.5;

            this.vx += directionX;
            this.vy += directionY;

            // Limit speed
            const maxSpeed = 2;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > maxSpeed) {
              this.vx = (this.vx / speed) * maxSpeed;
              this.vy = (this.vy / speed) * maxSpeed;
            }
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    // Init
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation
    const animate = () => {
      if (!document.body.contains(canvas)) return;

      ctx.clearRect(0, 0, width, height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Connections
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = dx * dx + dy * dy;

          if (distance < connectionDistance * connectionDistance) {
            const opacity = 1 - (distance / (connectionDistance * connectionDistance));
            ctx.strokeStyle = `rgba(57, 255, 20, ${opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  };

  // Initialize backgrounds for elements with class 'particle-bg'
  document.querySelectorAll('.particle-bg').forEach(el => {
    createParticleBackground(el);
  });

  // Backward compatibility / explicit calls if needed
  const kaszinok = document.getElementById('kaszinok');
  if (kaszinok) createParticleBackground(kaszinok);

  const cikkek = document.getElementById('cikkek');
  if (cikkek) createParticleBackground(cikkek);

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
