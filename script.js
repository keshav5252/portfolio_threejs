// ─── THREE.JS BACKGROUND ───────────────────────────────────
const canvas = document.getElementById('bg-canvas');

// Detect mobile early
const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

// On very low-end or small devices, skip Three.js entirely for performance
const skipThreeJS = window.innerWidth < 380;

if (!skipThreeJS) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    camera.position.z = 30;

    const particleCount = isMobile ? 250 : 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const lime = Math.random() > 0.7;
      colors[i * 3]     = lime ? 0.72 : 0.17;
      colors[i * 3 + 1] = lime ? 1.0  : 0.07;
      colors[i * 3 + 2] = lime ? 0.21 : 0.30;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.4 : 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const geoms = [];
    if (!isMobile) {
      const shapes = [new THREE.TetrahedronGeometry(2), new THREE.OctahedronGeometry(1.5), new THREE.IcosahedronGeometry(1.8)];
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xb8ff35, wireframe: true, transparent: true, opacity: 0.05 });
      for (let i = 0; i < 6; i++) {
        const mesh = new THREE.Mesh(shapes[i % shapes.length], wireMat);
        mesh.position.set((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*30-10);
        mesh.userData = {
          rX: (Math.random()-0.5)*0.005, rY: (Math.random()-0.5)*0.005,
          fA: Math.random()*0.5+0.2, fF: Math.random()*0.5+0.2, fO: Math.random()*Math.PI*2
        };
        scene.add(mesh);
        geoms.push(mesh);
      }
    }

    let scrollY = 0, mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0, clock = 0;
    let tiltX = 0, tiltY = 0;
    let rafActive = true;

    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    if (!isMobile) {
      window.addEventListener('mousemove', e => {
        targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetMY = -(e.clientY / window.innerHeight - 0.5) * 2;
      });
    }

    if (window.DeviceOrientationEvent && isMobile) {
      window.addEventListener('deviceorientation', e => {
        tiltX = (e.gamma || 0) / 45;
        tiltY = (e.beta  || 0) / 90;
      }, { passive: true });
    }

    // Pause animation when tab is not visible (saves battery)
    document.addEventListener('visibilitychange', () => {
      rafActive = !document.hidden;
      if (rafActive) animate();
    });

    function animate() {
      if (!rafActive) return;
      requestAnimationFrame(animate);
      clock += 0.008;

      if (!isMobile) {
        mouseX += (targetMX - mouseX) * 0.05;
        mouseY += (targetMY - mouseY) * 0.05;
      }

      const mx = isMobile ? tiltX * 0.4 : mouseX;
      const my = isMobile ? tiltY * 0.2 : mouseY;

      particles.rotation.y = clock * 0.04 + mx * 0.08;
      particles.rotation.x = my * 0.04;
      camera.position.y = -scrollY * 0.01;
      if (!isMobile) camera.position.x = mx * 2;

      geoms.forEach(g => {
        g.rotation.x += g.userData.rX;
        g.rotation.y += g.userData.rY;
        g.position.y += Math.sin(clock * g.userData.fF + g.userData.fO) * g.userData.fA * 0.02;
      });

      renderer.render(scene, camera);
    }
    animate();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 200);
    }, { passive: true });

  } catch (e) {
    // Three.js failed silently — background just stays dark
    console.warn('Three.js unavailable:', e);
  }
} else {
  // Hide canvas on very small/old devices
  if (canvas) canvas.style.display = 'none';
}

// ─── CURSOR (desktop) ────────────────────────────────────
const cur = document.getElementById('cursor');
const curRing = document.getElementById('cursor-ring');
let cx = 0, cy = 0, rx = 0, ry = 0;

if (cur && window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; });
  (function animCursor() {
    rx += (cx - rx) * 0.12; ry += (cy - ry) * 0.12;
    cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
    curRing.style.left = rx + 'px'; curRing.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  })();
  document.querySelectorAll('a, button, .skill-card, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cur.style.width = '20px'; cur.style.height = '20px';
      curRing.style.width = '60px'; curRing.style.height = '60px';
      curRing.style.opacity = '0.8';
    });
    el.addEventListener('mouseleave', () => {
      cur.style.width = '12px'; cur.style.height = '12px';
      curRing.style.width = '40px'; curRing.style.height = '40px';
      curRing.style.opacity = '0.5';
    });
  });
}

// ─── SCROLL PROGRESS ────────────────────────────────────
const progressBar = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  if (max > 0) {
    progressBar.style.width = ((window.scrollY / max) * 100) + '%';
  }
}, { passive: true });

// ─── INTERSECTION OBSERVER ───────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

// ─── COUNTER ANIMATION ───────────────────────────────────
const counters = document.querySelectorAll('[data-count]');
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseInt(el.dataset.count);
      let current = 0;
      const step = Math.max(1, Math.floor(target / 30));
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + (target >= 10 ? '+' : '');
        if (current >= target) clearInterval(timer);
      }, 40);
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObs.observe(c));

// ─── MOBILE MENU ─────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}
function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.remove('open');
  ham.classList.remove('open');
  document.body.style.overflow = '';
}

// Close mobile menu on escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileMenu();
});

// ─── ACTIVE BOTTOM NAV ───────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const mobItems = document.querySelectorAll('.mob-nav-item');
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      mobItems.forEach(i => i.style.color = '');
      const active = document.querySelector(`.mob-nav-item[href="#${e.target.id}"]`);
      if (active) active.style.color = 'var(--lime)';
    }
  });
}, { threshold: 0.5 });
sections.forEach(s => navObs.observe(s));

// ─── TOUCH RIPPLE ────────────────────────────────────────
if ('ontouchstart' in window) {
  document.querySelectorAll('.skill-card, .project-card, .contact-link').forEach(el => {
    el.addEventListener('touchstart', function(e) {
      const touch = e.touches[0];
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('div');
      Object.assign(ripple.style, {
        position: 'absolute',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'rgba(184,255,53,0.25)',
        pointerEvents: 'none',
        left: (touch.clientX - rect.left) + 'px',
        top: (touch.clientY - rect.top) + 'px',
        transform: 'translate(-50%,-50%) scale(0)',
        animation: 'rippleAnim 0.6s ease-out forwards',
        zIndex: '10'
      });
      el.style.position = 'relative';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }, { passive: true });
  });

  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = '@keyframes rippleAnim { to { transform: translate(-50%,-50%) scale(40); opacity: 0; } }';
  document.head.appendChild(rippleStyle);
}