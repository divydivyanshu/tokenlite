document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const nextBtns = document.querySelectorAll('.next-btn');
  const finishBtn = document.getElementById('finish-btn');
  let currentSlide = 0;

  function updateSlider() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev');
      if (index === currentSlide) {
        slide.classList.add('active');
      } else if (index < currentSlide) {
        slide.classList.add('prev');
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlider();
      }
    });
  });

  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
        window.close();
      } else {
        // Fallback for non-extension environment (e.g. testing in browser)
        window.location.href = 'https://chatgpt.com';
      }
    });
  }

  // Initialize
  updateSlider();
});
