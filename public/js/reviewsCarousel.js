const initializeReviewsCarousel = () => {
  document.querySelectorAll('[data-reviews-carousel]').forEach((carousel) => {
    const viewport = carousel.querySelector('.reviews-carousel__viewport');
    const slides = [...carousel.querySelectorAll('.reviews__card')];
    const previous = carousel.querySelector('[data-reviews-prev]');
    const next = carousel.querySelector('[data-reviews-next]');
    const current = carousel.querySelector('[data-reviews-current]');

    if (!viewport || slides.length < 2 || !previous || !next) return;

    const getMaxIndex = () => {
      const gap = Number.parseFloat(window.getComputedStyle(viewport).gap) || 0;
      const visibleSlides = Math.max(
        1,
        Math.floor(
          (viewport.clientWidth + gap) / (slides[0].clientWidth + gap),
        ),
      );
      return Math.max(0, slides.length - visibleSlides);
    };

    const getActiveIndex = () => {
      let closestIndex = 0;
      let closestDistance = Infinity;

      slides.forEach((slide, index) => {
        const slideStart = slide.offsetLeft - slides[0].offsetLeft;
        const distance = Math.abs(viewport.scrollLeft - slideStart);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    };

    const updateControls = () => {
      const activeIndex = getActiveIndex();
      if (current) current.textContent = String(activeIndex + 1);
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex >= getMaxIndex();
    };

    const moveTo = (index) => {
      const target = slides[Math.max(0, Math.min(index, getMaxIndex()))];
      viewport.scrollTo({
        left: target.offsetLeft - slides[0].offsetLeft,
        behavior: 'smooth',
      });
    };

    previous.addEventListener('click', () => moveTo(getActiveIndex() - 1));
    next.addEventListener('click', () => moveTo(getActiveIndex() + 1));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle('is-visible', entry.isIntersecting);
          });
        },
        { root: viewport, threshold: 0.55 },
      );
      slides.forEach((slide) => observer.observe(slide));
      window.requestAnimationFrame(() => carousel.classList.add('is-ready'));
    } else {
      slides.forEach((slide) => slide.classList.add('is-visible'));
    }

    let updateFrame;
    viewport.addEventListener('scroll', () => {
      window.cancelAnimationFrame(updateFrame);
      updateFrame = window.requestAnimationFrame(updateControls);
    });
    window.addEventListener('resize', updateControls);

    updateControls();
  });
};

export default initializeReviewsCarousel;
