const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbz95bTitXDqUcaVK-GErTH7_fqnNkIr5WlqfAyvagouGaW1kSwJiFjPe2DNmdzTbCLXNA/exec'; // Live Google Sheets Web App URL

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const envelope = document.getElementById('envelope');
  const envelopeWrapper = document.getElementById('envelope-wrapper');
  const invitationContainer = document.getElementById('invitation-container');
  
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  
  const rsvpForm = document.getElementById('rsvp-form');
  const successMessage = document.getElementById('success-message');
  const successFeedbackText = document.getElementById('success-feedback-text');
  const editRsvpBtn = document.getElementById('rsvp-edit-btn');
  const resetRsvpBtn = document.getElementById('rsvp-reset-btn');
  const attendanceRadios = document.getElementsByName('attendance');
  const guestsCountGroup = document.getElementById('guests-count-group');

  // --- Background Music ---
  const musicControl = document.getElementById('music-control');
  const musicBtn = document.getElementById('music-btn');
  let audio = null;
  let isPlaying = false;

  // Initialize Audio player (royalty-free soft ambient wedding piano)
  function initAudio() {
    audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3d/Gymnopedie_No._1..ogg/Gymnopedie_No._1..ogg.mp3'); // Satie's Gymnopedie No. 1 Piano
    audio.loop = true;
    audio.volume = 0.4;
    musicControl.style.display = 'block';

    musicBtn.addEventListener('click', toggleMusic);
  }

  function toggleMusic() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      musicBtn.classList.remove('playing');
      musicBtn.querySelector('.music-icon').textContent = '♪';
    } else {
      audio.play().catch(err => console.log('Audio playback failed or was blocked by browser:', err));
      musicBtn.classList.add('playing');
      musicBtn.querySelector('.music-icon').textContent = '⏸';
    }
    isPlaying = !isPlaying;
  }

  // --- Envelope Opening Sequence ---
  envelope.addEventListener('click', () => {
    // 1. Open envelope flap (adds opened class)
    envelope.classList.add('opened');
    
    // Optional: Start music on user interaction
    try {
      initAudio();
      setTimeout(() => {
        // Autoplay music on open if allowed
        audio.play().then(() => {
          isPlaying = true;
          musicBtn.classList.add('playing');
          musicBtn.querySelector('.music-icon').textContent = '⏸';
        }).catch(err => {
          console.log("Autoplay blocked, user needs to click music button manually.");
        });
      }, 500);
    } catch(e) {
      console.warn("Audio initialization failed:", e);
    }

    // 2. Slide envelope away and show card
    setTimeout(() => {
      envelopeWrapper.classList.add('open');
      invitationContainer.classList.add('visible');
      
      // Trigger scroll checks to reveal hero
      setTimeout(() => {
        const heroSection = document.getElementById('hero');
        if (heroSection) heroSection.classList.add('active');
        handleScrollAnimations();
      }, 100);
    }, 1600);

    // Cinematic Confetti Popper Blast right as names fade in (2.0s)
    setTimeout(() => {
      try {
        triggerConfetti();
      } catch(e) {
        console.warn("Confetti blast failed:", e);
      }
    }, 2000);
  });

  // --- Countdown Timer ---
  // Target: August 9, 2026, 11:00 AM (using Local Time)
  const weddingDate = new Date('2026-08-09T11:00:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = weddingDate - now;

    if (difference <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      clearInterval(countdownInterval);
      return;
    }

    // Time calculations
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Update UI
    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown(); // Run immediately
  const countdownInterval = setInterval(updateCountdown, 1000);

  // --- Scroll-Triggered Reveal Animations ---
  const fadeElements = document.querySelectorAll('.fade-in');

  function handleScrollAnimations() {
    const triggerBottom = window.innerHeight * 0.85;

    fadeElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;

      if (elementTop < triggerBottom) {
        element.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleScrollAnimations);
  const phoneContainer = document.querySelector('.phone-container');
  if (phoneContainer) {
    phoneContainer.addEventListener('scroll', handleScrollAnimations);
  }

  // --- RSVP Dynamic Form Interactions ---
  // Hide/Show guest dropdown based on attendance
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'declined') {
        guestsCountGroup.style.display = 'none';
      } else {
        guestsCountGroup.style.display = 'flex';
      }
    });
  });



  // Handle Form Submission
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value.trim();
    const attendance = document.querySelector('input[name="attendance"]:checked').value;
    const guestsCount = attendance === 'attending' ? document.getElementById('guests-count').value : '0';
    const notes = document.getElementById('guest-notes').value.trim();

    const rsvpData = { name, attendance, guestsCount, notes, timestamp: new Date().toISOString() };
    
    // Save current user response to LocalStorage (for editing later)
    localStorage.setItem('wedding_rsvp_swaliha_ruwais', JSON.stringify(rsvpData));
    
    // Save/Update in global list of responses (Local backup)
    const listStr = localStorage.getItem('wedding_rsvps_list');
    let rsvpsList = listStr ? JSON.parse(listStr) : [];
    rsvpsList = rsvpsList.filter(item => item.name.toLowerCase() !== name.toLowerCase());
    rsvpsList.push(rsvpData);
    localStorage.setItem('wedding_rsvps_list', JSON.stringify(rsvpsList));
    
    // Save to Server Backend
    fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvpData)
    })
    .then(res => res.json())
    .then(data => {
      console.log('Saved to server:', data);
      if (isAdmin) renderAdminPanel();
    })
    .catch(err => {
      console.warn('Backend server offline, saved locally only:', err);
      if (isAdmin) renderAdminPanel();
    });

    // Save to Google Sheets if configured
    if (GOOGLE_SHEET_URL) {
      fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData)
      })
      .then(() => console.log('Saved to Google Sheets'))
      .catch(err => console.error('Error saving to Google Sheets:', err));
    }

    // Show visual confirmation
    showSuccessState(rsvpData);
  });

  function showSuccessState(data) {
    if (data.attendance === 'attending') {
      const guestText = data.guestsCount === '1' ? '1 guest' : `${data.guestsCount} guests`;
      successFeedbackText.textContent = `We are thrilled to celebrate with you, ${data.name}! We have noted your attendance for ${guestText}.`;
    } else {
      successFeedbackText.textContent = `Thank you for letting us know, ${data.name}. We will miss you, but we appreciate your blessings!`;
    }
    
    rsvpForm.style.display = 'none';
    successMessage.classList.add('visible');
  }

  // Edit/Change response
  editRsvpBtn.addEventListener('click', () => {
    // Populate form with existing data
    const savedData = localStorage.getItem('wedding_rsvp_swaliha_ruwais');
    if (savedData) {
      const data = JSON.parse(savedData);
      document.getElementById('guest-name').value = data.name;
      document.querySelector(`input[name="attendance"][value="${data.attendance}"]`).checked = true;
      
      if (data.attendance === 'declined') {
        guestsCountGroup.style.display = 'none';
      } else {
        guestsCountGroup.style.display = 'flex';
        document.getElementById('guests-count').value = data.guestsCount;
      }
      document.getElementById('guest-notes').value = data.notes;
    }

    // Toggle views
    successMessage.classList.remove('visible');
    rsvpForm.style.display = 'flex';
    rsvpForm.style.opacity = '1';
  });

  // Submit Another Response (Reset Form)
  resetRsvpBtn.addEventListener('click', () => {
    // Clear form inputs
    rsvpForm.reset();
    document.getElementById('guest-name').value = '';
    document.getElementById('guest-notes').value = '';
    document.querySelector('input[name="attendance"][value="attending"]').checked = true;
    guestsCountGroup.style.display = 'flex';
    document.getElementById('guests-count').value = '1';
    
    // Clear user's locked local storage key so page doesn't auto-lock to success on reload
    localStorage.removeItem('wedding_rsvp_swaliha_ruwais');

    // Toggle views
    successMessage.classList.remove('visible');
    rsvpForm.style.display = 'flex';
    rsvpForm.style.opacity = '1';
  });

  // --- RSVP Admin Panel Rendering ---
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === 'true';
  const adminPanel = document.getElementById('admin-panel');
  
  if (isAdmin && adminPanel) {
    adminPanel.style.display = 'block';
    renderAdminPanel();
    
    // Wire up Clear RSVPs button
    const clearBtn = document.getElementById('clear-rsvps-btn');
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all stored RSVP responses?')) {
        localStorage.removeItem('wedding_rsvps_list');
        fetch('/api/clear', { method: 'POST' })
          .then(() => {
            renderAdminPanel();
          })
          .catch(err => {
            console.error('Could not clear server database:', err);
            renderAdminPanel();
          });
      }
    });
  }

  function renderAdminPanel() {
    fetch('/api/responses')
      .then(res => res.json())
      .then(rsvps => {
        populateTable(rsvps);
      })
      .catch(err => {
        console.warn('Using local storage fallback for admin:', err);
        // Fallback to local storage list
        const listStr = localStorage.getItem('wedding_rsvps_list');
        const rsvps = listStr ? JSON.parse(listStr) : [];
        populateTable(rsvps);
      });
  }

  function populateTable(rsvps) {
    const tbody = document.getElementById('rsvp-table-body');
    tbody.innerHTML = '';
    
    let attendingCount = 0;
    let declinedCount = 0;
    let totalGuestsCount = 0;
    
    rsvps.forEach(rsvp => {
      const tr = document.createElement('tr');
      
      const statusText = rsvp.attendance === 'attending' ? 'Attending' : 'Declined';
      const statusClass = rsvp.attendance === 'attending' ? 'status-attending' : 'status-declined';
      const guestNum = rsvp.attendance === 'attending' ? rsvp.guestsCount : '0';
      
      tr.innerHTML = `
        <td><strong>${escapeHtml(rsvp.name)}</strong></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${rsvp.attendance === 'attending' ? guestNum : '-'}</td>
        <td class="notes-cell">${escapeHtml(rsvp.notes || '-')}</td>
      `;
      
      tbody.appendChild(tr);
      
      if (rsvp.attendance === 'attending') {
        attendingCount++;
        totalGuestsCount += parseInt(guestNum || 1, 10);
      } else {
        declinedCount++;
      }
    });
    
    document.getElementById('total-attending').textContent = attendingCount;
    document.getElementById('total-declined').textContent = declinedCount;
    document.getElementById('total-guests').textContent = totalGuestsCount;
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Canvas Confetti Popper Blast & Falling Hearts Animation ---
  function triggerConfetti() {
    const phoneContainer = document.querySelector('.phone-container');
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    phoneContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = phoneContainer.clientWidth;
    let height = canvas.height = phoneContainer.clientHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = phoneContainer.clientWidth;
      height = canvas.height = phoneContainer.clientHeight;
    });

    const colors = [
      '#D4AF37', // Gold
      '#EFC7B9', // Soft rose pink
      '#C2185B', // Ruby rose red
      '#FFFFFF', // White
      '#AA7C11', // Dark gold
      '#E2D7C5'  // Champagne
    ];

    class ConfettiParticle {
      constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        const rad = angle * Math.PI / 180;
        this.vx = Math.cos(rad) * speed;
        this.vy = Math.sin(rad) * speed;
        
        this.gravity = 0.35;
        this.friction = 0.985;
        
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 6 - 3;
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.005 + 0.006;
      }

      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.fadeSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    class HeartParticle {
      constructor(isInitial = false) {
        this.x = Math.random() * width;
        // If initial, distribute across height; otherwise spawn just above top
        this.y = isInitial ? Math.random() * height : -20;
        this.size = Math.random() * 8 + 6; // small hearts: 6px to 14px
        
        const heartColors = [
          '#FF6B8B', // Soft rose pink
          '#FF8DA1', // Light pink
          '#E91E63', // Deep rose
          '#FF4081', // Vivid pink
          '#FF1744'  // Soft red
        ];
        this.color = heartColors[Math.floor(Math.random() * heartColors.length)];
        
        // Gentle falling speed
        this.speedY = 0.8 + Math.random() * 1.2; // 0.8 to 2.0 px/frame
        this.speedX = (Math.random() - 0.5) * 0.5; // slight drift
        
        // Sway / spring season blossom effect
        this.swaySpeed = 0.01 + Math.random() * 0.02;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.swayRadius = 0.5 + Math.random() * 1.5;
        
        // Rotate slowly
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 1.5;
        this.opacity = 0.4 + Math.random() * 0.5; // gentle translucency
      }

      update() {
        this.y += this.speedY;
        this.swayAngle += this.swaySpeed;
        this.x += this.speedX + Math.sin(this.swayAngle) * 0.3;
        this.rotation += this.rotationSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        // Symmetrical bezier heart drawing path
        ctx.beginPath();
        const size = this.size;
        ctx.moveTo(0, -size / 4);
        ctx.bezierCurveTo(-size / 2, -size * 0.7, -size, -size * 0.3, 0, size * 0.8);
        ctx.bezierCurveTo(size, -size * 0.3, size / 2, -size * 0.7, 0, -size / 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = [];
    const heartParticles = [];
    const confettiCount = 100;

    // Left Popper (shoots up and right)
    for (let i = 0; i < confettiCount; i++) {
      const angle = -45 + (Math.random() * 30 - 15);
      const speed = 14 + Math.random() * 18;
      particles.push(new ConfettiParticle(0, height, angle, speed));
    }

    // Right Popper (shoots up and left)
    for (let i = 0; i < confettiCount; i++) {
      const angle = -135 + (Math.random() * 30 - 15);
      const speed = 14 + Math.random() * 18;
      particles.push(new ConfettiParticle(width, height, angle, speed));
    }

    // Spawn initial heart particles distributed down the screen
    for (let i = 0; i < 15; i++) {
      heartParticles.push(new HeartParticle(true));
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and draw confetti particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.opacity <= 0) {
          particles.splice(i, 1);
        }
      }

      // 2. Update and draw heart particles
      for (let i = heartParticles.length - 1; i >= 0; i--) {
        const h = heartParticles[i];
        h.update();
        h.draw();
        // Remove if off screen
        if (h.y > height + 20) {
          heartParticles.splice(i, 1);
        }
      }

      // 3. Continually spawn falling hearts
      if (heartParticles.length < 35) {
        if (Math.random() < 0.08) {
          heartParticles.push(new HeartParticle(false));
        }
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }
});
