import { PageFlip } from 'page-flip';

document.addEventListener('DOMContentLoaded', () => {
  const flipbookEl = document.getElementById('flipbook');
  const loader = document.getElementById('loader');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const pageCurrent = document.getElementById('page-current');
  const pageTotal = document.getElementById('page-total');

  const modal = document.getElementById('instruction-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');

  btnCloseModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  const totalPages = 44;
  // Now using highly optimized local WebP images!
  const imageFolder = '/data-optimized/';
  const imageExtension = '.webp';

  // 1. Identify base dimensions from the first image
  const img = new Image();
  img.src = `${imageFolder}1${imageExtension}`;

  img.onload = () => {
    const baseWidth = img.naturalWidth;
    const baseHeight = img.naturalHeight;
    console.log(`Base Dimensions Loaded: ${baseWidth}x${baseHeight}`);

    loader.style.display = 'none';
    flipbookEl.style.display = 'block';

    const pageDivs = [];

    // 2. Build the DOM nodes cleanly using lazy-loading images
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.dataset.pageNum = pageNum;

      const imgEl = document.createElement('img');
      imgEl.src = `${imageFolder}${pageNum}${imageExtension}`;
      imgEl.className = 'page-image';
      imgEl.loading = 'lazy'; // Let the browser handle lazy loading automatically!
      imgEl.style.width = '100%';
      imgEl.style.height = '100%';
      imgEl.style.objectFit = 'contain';

      const shadowDiv = document.createElement('div');
      shadowDiv.className = 'page-fold';

      pageDiv.appendChild(imgEl);
      pageDiv.appendChild(shadowDiv);
      flipbookEl.appendChild(pageDiv);
      pageDivs.push(pageDiv);
    }

    const wrapper = document.getElementById('flipbook-wrapper');

    // 3. Perfect Aspect Ratio Resizer
    const updateDimensions = () => {
      // Calculate sizes safely based on the actual container bounds (fixes 100vh system ui bugs)
      const flipContainer = document.querySelector('.flipbook-container');
      const containerWidth = flipContainer ? flipContainer.clientWidth : window.innerWidth;
      const containerHeight = flipContainer ? flipContainer.clientHeight : window.innerHeight;

      let availWidth = containerWidth * 0.90;
      let availHeight = containerHeight * 0.95;

      // page-flip triggers portrait mode if container width < minWidth * 2
      // We will set our minWidth to 260, so threshold is 520.
      const isPortrait = availWidth < 520;

      if (isPortrait) {
        // On mobile portrait, we use maximum screen width
        availWidth = containerWidth * 0.95;
        // Leave space for bottom pill controls
        availHeight = containerHeight - 120;
      }

      // Calculate aspect ratio of the physical book. 
      // If portrait, it's 1 page wide. If landscape, it's 2 pages wide.
      const bookRatio = isPortrait ? (baseWidth / baseHeight) : ((baseWidth * 2) / baseHeight);

      const availRatio = availWidth / availHeight;

      let finalWidth, finalHeight;
      if (availRatio > bookRatio) {
        // Available space is wider than needed -> constrained by height
        finalHeight = availHeight;
        finalWidth = availHeight * bookRatio;
      } else {
        // Available space is taller than needed -> constrained by width
        finalWidth = availWidth;
        finalHeight = availWidth / bookRatio;
      }

      // Safeguard to ensure wrapper never shrinks below the engine's minWidth to avoid clipping
      if (isPortrait && finalWidth < 260) {
        finalWidth = 260;
        finalHeight = 260 / bookRatio;
      }

      // Apply the mathematical perfection to our rigid wrapper
      wrapper.style.width = `${finalWidth}px`;
      wrapper.style.height = `${finalHeight}px`;
    };

    // Calculate initial dimensions before PageFlip starts loading (auto-detect based on screen)
    updateDimensions();

    // 4. Initialize PageFlip telling it to stretch EXACTLY to our carefully calculated wrapper
    const pageFlip = new PageFlip(flipbookEl, {
      width: baseWidth,
      height: baseHeight,
      size: 'stretch', // Stretches perfectly to our wrapper without distortion!
      minWidth: 260, // Matches 520 threshold perfectly
      maxWidth: 10000, // Virtually disabled so our wrapper enforces the bounds
      minHeight: 260,
      maxHeight: 10000,
      maxShadowOpacity: 0.5,
      showCover: true,
      usePortrait: true, // Automatically switch to single page on vertical screens (mobile)
      mobileScrollSupport: false,
      flippingTime: 1000, // 1 second flipping time
    });

    pageFlip.loadFromHTML(pageDivs);

    // Initial Cover Centering helper
    const updateCentering = (currentIndex) => {
      if (pageFlip.getOrientation() === 'portrait') {
        flipbookEl.style.transform = 'translateX(0)';
        return;
      }

      if (currentIndex === 0) {
        flipbookEl.style.transform = 'translateX(-25%)';
      } else if (currentIndex === totalPages - 1) {
        flipbookEl.style.transform = 'translateX(25%)';
      } else {
        flipbookEl.style.transform = 'translateX(0)';
      }
    };

    flipbookEl.style.transition = 'transform 1s ease-in-out';
    updateCentering(pageFlip.getCurrentPageIndex());

    // Bind to window resize to maintain perfect aspect ratio constantly
    window.addEventListener('resize', () => {
      updateDimensions();
      // Force the flipbook physics engine to re-calculate its boundaries to match our new wrapper
      if (typeof pageFlip.update === 'function') {
        pageFlip.update();
      }
      updateCentering(pageFlip.getCurrentPageIndex());
    });

    pageTotal.textContent = totalPages;
    pageCurrent.textContent = pageFlip.getCurrentPageIndex() + 1;

    pageFlip.on('flip', (e) => {
      const currentIndex = e.data;
      pageCurrent.textContent = currentIndex + 1;

      updateCentering(currentIndex);

      pageDivs.forEach((page, idx) => {
        page.classList.remove('page-left', 'page-right');
        if (idx < currentIndex) {
          page.classList.add('page-left');
        } else if (idx > currentIndex) {
          page.classList.add('page-right');
        }
      });
    });

    pageFlip.on('changeOrientation', (e) => {
      updateCentering(pageFlip.getCurrentPageIndex());
    });

    // Control Buttons
    btnPrev.addEventListener('click', () => pageFlip.flipPrev());
    btnNext.addEventListener('click', () => pageFlip.flipNext());

    setTimeout(() => {
      modal.classList.add('active');
    }, 500);
  };

  img.onerror = () => {
    loader.innerHTML = `<p style="color: red;">Error: Could not find image files in public/data/</p>`;
  };
});
