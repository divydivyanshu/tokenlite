document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const nextBtns = document.querySelectorAll('.next-btn');
  const finishBtn = document.getElementById('finish-btn');
  const progressFill = document.querySelector('.progress-fill');
  const logoImg = document.getElementById('logo-img');
  let currentSlide = 0;

  // Set logo image source properly for Chrome extension
  if (logoImg) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      logoImg.src = chrome.runtime.getURL('icons/icon128.png');
    } else {
      // Fallback for testing in browser
      logoImg.src = '../icons/icon128.png';
    }
  }

  // Glitch effect utility
  function triggerGlitch(element, intensity = 2) {
    if (!element) return;
    
    const originalX = 0;
    const glitchColors = ['#ff003c', '#0094ff', '#00ff9d'];
    
    element.style.transition = 'none';
    
    // Apply glitch effect
    for (let i = 0; i < intensity; i++) {
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 3;
        const color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
        
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        element.style.color = color;
      }, i * 50);
    }
    
    // Reset
    setTimeout(() => {
      element.style.transition = 'transform 0.2s ease, color 0.2s ease';
      element.style.transform = `translate(${originalX}px, 0)`;
      element.style.color = '';
    }, intensity * 50 + 100);
  }

  // Typewriter effect for terminal
  function typewriterEffect() {
    const terminalLines = document.querySelectorAll('.terminal-line:last-child');
    if (!terminalLines.length) return;
    
    const lastLine = terminalLines[terminalLines.length - 1];
    const command = lastLine.querySelector('.command.blink');
    if (!command) return;
    
    command.style.animation = 'none';
    setTimeout(() => {
      command.style.animation = 'blink 1s step-end infinite';
    }, 100);
  }

  function updateSlider() {
    // Update slides
    slides.forEach((slide, index) => {
      slide.classList.remove('active');
      if (index === currentSlide) {
        slide.classList.add('active');
      }
    });

    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });

    // Update progress bar
    const progress = ((currentSlide + 1) / slides.length) * 100;
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    // Trigger animations on slide change
    if (currentSlide === 2) {
      setTimeout(typewriterEffect, 300);
    }

    // Add subtle entrance animations
    const activeSlide = slides[currentSlide];
    if (activeSlide) {
      const elements = activeSlide.querySelectorAll('.badge, .workflow-step, .instruction, .feature');
      elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
          el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, 100 + i * 80);
      });
    }
  }

  // Next button click handlers
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        // Trigger glitch on button
        triggerGlitch(btn.querySelector('.btn-text'));
        
        // Add slight delay for glitch effect
        setTimeout(() => {
          currentSlide++;
          updateSlider();
        }, 200);
      }
    });
  });

  // Glitch trigger on hover for all glitch-trigger buttons
  document.querySelectorAll('.glitch-trigger').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const text = btn.querySelector('.btn-text');
      if (text) {
        triggerGlitch(text, 1);
      }
    });
  });

  // Glitch effect on badge with data-glitch attribute
  const glitchBadges = document.querySelectorAll('.badge.bad .badge-value[data-glitch]');
  glitchBadges.forEach(badge => {
    setInterval(() => {
      const glitchValue = badge.getAttribute('data-glitch');
      const glitchedValue = glitchValue.split('').map(char => {
        if (Math.random() > 0.9) {
          return Math.floor(Math.random() * 10);
        }
        return char;
      }).join('');
      
      badge.textContent = glitchedValue;
      
      setTimeout(() => {
        badge.textContent = glitchValue;
      }, 100);
    }, 3000);
  });

  // Finish button
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      // Enhanced glitch effect on final click
      const text = finishBtn.querySelector('.btn-text');
      if (text) {
        triggerGlitch(text, 4);
      }
      
      // Ripple effect
      finishBtn.style.overflow = 'visible';
      const ripple = document.createElement('div');
      ripple.style.position = 'absolute';
      ripple.style.width = '1px';
      ripple.style.height = '1px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'var(--accent)';
      ripple.style.opacity = '0.6';
      ripple.style.transform = 'translate(-50%, -50%)';
      finishBtn.appendChild(ripple);
      
      setTimeout(() => {
        ripple.style.transition = 'all 0.6s ease';
        ripple.style.width = '400px';
        ripple.style.height = '400px';
        ripple.style.opacity = '0';
      }, 10);
      
      // Open ChatGPT after animation
      setTimeout(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: 'https://chatgpt.com' });
          window.close();
        } else {
          // Fallback for non-extension environment (e.g. testing in browser)
          window.location.href = 'https://chatgpt.com';
        }
      }, 600);
    });
  }

  // Initialize
  updateSlider();
  
  // Initial entrance animation
  setTimeout(() => {
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.6s ease';
  }, 100);
  
  // Set initial body opacity
  document.body.style.opacity = '0';
});

// Add some interactive glitch effects on mouse move
document.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  const scanline = document.querySelector('.scanline');
  if (scanline) {
    scanline.style.transform = `translateY(${y * 8}px)`;
  }
});
