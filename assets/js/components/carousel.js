/**
 * ============================================================
 * JAYA PC — CAROUSEL.JS
 * Template Version : 1.0.0
 * Description      : Logic carousel hero slider dan
 *                    product carousel (swiper).
 *                    Hero carousel custom dengan animasi
 *                    konten per-slide, product carousel
 *                    menggunakan Swiper.js.
 * Stack            : jQuery 3.7.x + Swiper 11.x
 * Dependency       : main.js (load sebelum main.js)
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    hero : {
      autoplay     : true,
      interval     : 5000,    // ms antar slide
      animDuration : 600,     // ms durasi transisi slide
      pauseOnHover : true,
    },
    product : {
      spaceBetween : 20,
      speed        : 400,
    },
  };


  /* ══════════════════════════════════════════
   * 1. HERO CAROUSEL
   * Custom carousel dengan animasi konten
   * ══════════════════════════════════════════ */

  function initHeroCarousel() {
    const $hero = $('.jp-hero-carousel');
    if (!$hero.length) return;

    const $slides     = $hero.find('.jp-hero-slide');
    const $dots       = $hero.find('.jp-hero-dot');
    const $prev       = $hero.find('.jp-hero-prev');
    const $next       = $hero.find('.jp-hero-next');
    const total       = $slides.length;
    let   current     = 0;
    let   autoplayTimer = null;
    let   isAnimating = false;

    if (total <= 1) {
      // Satu slide — sembunyikan kontrol
      $prev.hide();
      $next.hide();
      $dots.parent().hide();
      return;
    }

    /* ── Tampilkan slide ke index ── */
    function goTo(index, direction) {
      if (isAnimating || index === current) return;
      isAnimating = true;

      const $currentSlide = $slides.eq(current);
      const $nextSlide    = $slides.eq(index);

      // Tentukan arah animasi
      const fromRight = direction === 'next';

      // Posisi awal slide berikutnya
      $nextSlide
        .css({
          display   : 'flex',
          opacity   : 0,
          transform : `translateX(${fromRight ? '40px' : '-40px'})`,
        });

      // Animasi keluar slide saat ini
      $currentSlide.animate({ opacity: 0 }, CFG.hero.animDuration / 2, function () {
        $currentSlide.hide().css({ opacity: '', transform: '' });
      });

      // Animasi masuk slide berikutnya
      $nextSlide.animate({ opacity: 1 }, CFG.hero.animDuration, function () {
        $nextSlide.css({ transform: '' });
        isAnimating = false;
      });

      // Animasi konten teks dalam slide
      animateSlideContent($nextSlide);

      // Update dots
      $dots.removeClass('active');
      $dots.eq(index).addClass('active');

      current = index;
    }

    /* ── Animasi konten teks slide ── */
    function animateSlideContent($slide) {
      const $content  = $slide.find('.jp-hero-content');
      const $label    = $slide.find('.jp-hero-label');
      const $title    = $slide.find('.jp-hero-title');
      const $desc     = $slide.find('.jp-hero-desc');
      const $actions  = $slide.find('.jp-hero-actions');

      // Reset posisi
      [$label, $title, $desc, $actions].forEach(function ($el) {
        $el.css({ opacity: 0, transform: 'translateY(20px)' });
      });

      // Animasi berurutan dengan delay
      const delays = [0, 120, 240, 360];
      [$label, $title, $desc, $actions].forEach(function ($el, i) {
        setTimeout(function () {
          $el.animate({ opacity: 1 }, 400);
          $el.css('transform', 'translateY(0)');
        }, delays[i] + CFG.hero.animDuration / 2);
      });
    }

    /* ── Next slide ── */
    function next() {
      const nextIndex = (current + 1) % total;
      goTo(nextIndex, 'next');
    }

    /* ── Prev slide ── */
    function prev() {
      const prevIndex = (current - 1 + total) % total;
      goTo(prevIndex, 'prev');
    }

    /* ── Autoplay ── */
    function startAutoplay() {
      if (!CFG.hero.autoplay) return;
      stopAutoplay();
      autoplayTimer = setInterval(next, CFG.hero.interval);
    }

    function stopAutoplay() {
      clearInterval(autoplayTimer);
    }

    /* ── Event bindings ── */
    $next.on('click', function () {
      next();
      if (CFG.hero.autoplay) { stopAutoplay(); startAutoplay(); }
    });

    $prev.on('click', function () {
      prev();
      if (CFG.hero.autoplay) { stopAutoplay(); startAutoplay(); }
    });

    $dots.on('click', function () {
      const index     = $(this).index();
      const direction = index > current ? 'next' : 'prev';
      goTo(index, direction);
      if (CFG.hero.autoplay) { stopAutoplay(); startAutoplay(); }
    });

    // Pause on hover
    if (CFG.hero.pauseOnHover) {
      $hero.on('mouseenter', stopAutoplay);
      $hero.on('mouseleave', startAutoplay);
    }

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX   = 0;

    $hero[0].addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    $hero[0].addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          next();
        } else {
          prev();
        }
        if (CFG.hero.autoplay) { stopAutoplay(); startAutoplay(); }
      }
    }, { passive: true });

    // Keyboard arrow keys
    $(document).on('keydown.herocarousel', function (e) {
      if ($hero.is(':visible')) {
        if (e.key === 'ArrowLeft')  { prev(); stopAutoplay(); startAutoplay(); }
        if (e.key === 'ArrowRight') { next(); stopAutoplay(); startAutoplay(); }
      }
    });

    /* ── Init: tampilkan slide pertama ── */
    $slides.hide().css('opacity', '');
    $slides.first().css({ display: 'flex', opacity: 1 });
    $dots.first().addClass('active');
    animateSlideContent($slides.first());

    startAutoplay();
  }


  /* ══════════════════════════════════════════
   * 2. PRODUCT CAROUSEL — SWIPER
   * Carousel produk horizontal dengan Swiper.js
   * ══════════════════════════════════════════ */

  function initProductCarousels() {
    // Cek apakah Swiper tersedia
    if (typeof Swiper === 'undefined') {
      console.warn('JP Carousel: Swiper.js tidak ditemukan.');
      return;
    }

    /* ── Carousel produk umum ── */
    $('.jp-swiper-products').each(function () {
      new Swiper(this, {
        slidesPerView  : 2,
        spaceBetween   : CFG.product.spaceBetween,
        speed          : CFG.product.speed,
        grabCursor     : true,
        navigation     : {
          nextEl : $(this).siblings('.jp-swiper-next')[0],
          prevEl : $(this).siblings('.jp-swiper-prev')[0],
        },
        pagination     : {
          el        : $(this).siblings('.jp-swiper-pagination')[0],
          clickable : true,
        },
        breakpoints    : {
          576  : { slidesPerView: 2, spaceBetween: 16 },
          768  : { slidesPerView: 3, spaceBetween: 20 },
          992  : { slidesPerView: 4, spaceBetween: 20 },
          1200 : { slidesPerView: 4, spaceBetween: 24 },
        },
        a11y           : {
          prevSlideMessage : 'Produk sebelumnya',
          nextSlideMessage : 'Produk berikutnya',
        },
      });
    });

    /* ── Carousel brand / logo ── */
    $('.jp-swiper-brands').each(function () {
      new Swiper(this, {
        slidesPerView  : 3,
        spaceBetween   : 32,
        speed          : 600,
        loop           : true,
        autoplay       : {
          delay                : 0,
          disableOnInteraction : false,
        },
        freeMode       : {
          enabled    : true,
          momentum   : false,
        },
        breakpoints    : {
          480  : { slidesPerView: 4,  spaceBetween: 32 },
          768  : { slidesPerView: 6,  spaceBetween: 40 },
          992  : { slidesPerView: 8,  spaceBetween: 48 },
          1200 : { slidesPerView: 10, spaceBetween: 56 },
        },
      });
    });

    /* ── Carousel banner promo ── */
    $('.jp-swiper-banner').each(function () {
      new Swiper(this, {
        slidesPerView  : 1,
        spaceBetween   : 0,
        speed          : 600,
        loop           : true,
        effect         : 'fade',
        fadeEffect     : { crossFade: true },
        autoplay       : {
          delay                : 4000,
          disableOnInteraction : false,
        },
        pagination     : {
          el        : $(this).siblings('.jp-swiper-pagination')[0],
          clickable : true,
        },
      });
    });

    /* ── Product image gallery di halaman detail ── */
    const $galleryMain  = $('.jp-swiper-gallery-main');
    const $galleryThumbs = $('.jp-swiper-gallery-thumbs');

    if ($galleryMain.length && $galleryThumbs.length) {
      const swiperThumbs = new Swiper($galleryThumbs[0], {
        slidesPerView  : 5,
        spaceBetween   : 8,
        freeMode       : true,
        watchSlidesProgress: true,
        direction      : 'horizontal',
      });

      new Swiper($galleryMain[0], {
        spaceBetween   : 0,
        speed          : 400,
        loop           : true,
        thumbs         : { swiper: swiperThumbs },
        keyboard        : { enabled: true },
        zoom           : { maxRatio: 2 },
        a11y           : {
          prevSlideMessage : 'Gambar sebelumnya',
          nextSlideMessage : 'Gambar berikutnya',
        },
      });
    }
  }


  /* ══════════════════════════════════════════
   * 3. TABS PRODUCT SECTION
   * Tab filter produk (GPU / Processor / RAM dll)
   * ══════════════════════════════════════════ */

  function initProductTabs() {
    const $tabBtns = $('.jp-product-tab-btn');
    if (!$tabBtns.length) return;

    $tabBtns.on('click', function () {
      const $btn    = $(this);
      const target  = $btn.data('target');

      // Update active button
      $tabBtns.removeClass('active');
      $btn.addClass('active');

      // Sembunyikan semua panel
      const $panels = $btn.closest('.jp-product-tabs-wrap')
                          .find('.jp-product-tab-panel');
      $panels.hide().removeClass('active');

      // Tampilkan panel target dengan fade
      const $target = $('#' + target);
      $target.fadeIn(250).addClass('active');
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initHeroCarousel();
    initProductCarousels();
    initProductTabs();
  });

})(jQuery);
