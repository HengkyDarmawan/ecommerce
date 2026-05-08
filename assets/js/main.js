/**
 * ============================================================
 * JAYA PC — MAIN.JS
 * Template Version : 1.0.0
 * Description      : Entry point utama JavaScript.
 *                    Inisialisasi global, navbar scroll effect,
 *                    back-to-top button, WA float, dan
 *                    semua Bootstrap component global.
 *                    Selalu load PALING TERAKHIR setelah
 *                    semua component JS lainnya.
 * Stack            : jQuery 3.7.x + Bootstrap 5.3
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG GLOBAL
   * ────────────────────────────────────────── */

  const JP = {
    scrollThreshold : 80,       // px scroll sebelum navbar berubah
    toTopThreshold  : 300,      // px scroll sebelum tombol back-to-top muncul
    animDuration    : 250,      // ms durasi animasi default
    breakpoints     : {
      mobile : 575,
      tablet : 991,
      desktop: 1200,
    },
  };


  /* ──────────────────────────────────────────
   * 🧭 NAVBAR SCROLL EFFECT
   * Tambah class .scrolled saat halaman di-scroll
   * ────────────────────────────────────────── */

  function initNavbarScroll() {
    const $navbar = $('.jp-navbar');
    if (!$navbar.length) return;

    function onScroll() {
      if ($(window).scrollTop() > JP.scrollThreshold) {
        $navbar.addClass('scrolled');
      } else {
        $navbar.removeClass('scrolled');
      }
    }

    $(window).on('scroll.navbar', onScroll);
    onScroll(); // cek posisi awal
  }


  /* ──────────────────────────────────────────
   * 🔝 BACK TO TOP BUTTON
   * ────────────────────────────────────────── */

  function initBackToTop() {
    const $btn = $('.jp-back-to-top');
    if (!$btn.length) return;

    // Tampilkan / sembunyikan berdasarkan scroll
    $(window).on('scroll.backtop', function () {
      if ($(this).scrollTop() > JP.toTopThreshold) {
        $btn.addClass('visible');
      } else {
        $btn.removeClass('visible');
      }
    });

    // Scroll ke atas saat diklik
    $btn.on('click', function () {
      $('html, body').animate({ scrollTop: 0 }, JP.animDuration);
    });
  }


  /* ──────────────────────────────────────────
   * 💬 WHATSAPP FLOAT BUTTON
   * Sembunyikan saat scroll ke footer
   * ────────────────────────────────────────── */

  function initWaFloat() {
    const $wa     = $('.jp-wa-float');
    const $footer = $('.jp-footer');
    if (!$wa.length || !$footer.length) return;

    $(window).on('scroll.wa', function () {
      const scrollBottom = $(window).scrollTop() + $(window).height();
      const footerTop    = $footer.offset().top;

      if (scrollBottom > footerTop + 60) {
        $wa.css('opacity', '0').css('pointer-events', 'none');
      } else {
        $wa.css('opacity', '1').css('pointer-events', 'auto');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 🏁 BOOTSTRAP GLOBAL COMPONENTS INIT
   * Tooltip, Popover, Offcanvas, Dropdown
   * ────────────────────────────────────────── */

  function initBootstrapComponents() {

    // Tooltip — aktifkan semua elemen dengan data-bs-toggle="tooltip"
    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipEls.forEach(function (el) {
      new bootstrap.Tooltip(el, {
        trigger : 'hover focus',
      });
    });

    // Popover — aktifkan semua elemen dengan data-bs-toggle="popover"
    const popoverEls = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverEls.forEach(function (el) {
      new bootstrap.Popover(el);
    });

  }


  /* ──────────────────────────────────────────
   * 🖱️ SMOOTH ANCHOR SCROLL
   * Untuk link internal #section dengan offset navbar
   * ────────────────────────────────────────── */

  function initSmoothScroll() {
    $(document).on('click', 'a[href^="#"]', function (e) {
      const target = $(this).attr('href');
      if (target === '#' || target === '#!') return;

      const $target = $(target);
      if (!$target.length) return;

      e.preventDefault();

      const navbarHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--jp-navbar-total') || '100'
      );

      const offsetTop = $target.offset().top - navbarHeight - 16;

      $('html, body').animate({ scrollTop: offsetTop }, JP.animDuration);
    });
  }


  /* ──────────────────────────────────────────
   * 🖼️ LAZY IMAGE LOADING
   * Native lazy load + fallback untuk img[data-src]
   * ────────────────────────────────────────── */

  function initLazyImages() {
    // Gunakan IntersectionObserver jika tersedia
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-src]');

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img    = entry.target;
            img.src      = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin : '100px 0px',
        threshold  : 0.01,
      });

      lazyImages.forEach(function (img) {
        observer.observe(img);
      });
    } else {
      // Fallback: load semua langsung
      $('img[data-src]').each(function () {
        $(this).attr('src', $(this).data('src'));
        $(this).removeAttr('data-src');
      });
    }
  }


  /* ──────────────────────────────────────────
   * ✨ ANIMATE ON SCROLL
   * Tambah class .jp-animated saat elemen masuk viewport
   * ────────────────────────────────────────── */

  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const animEls = document.querySelectorAll('[data-jp-animate]');
    if (!animEls.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el    = entry.target;
          const delay = el.dataset.jpDelay || '0';

          setTimeout(function () {
            el.classList.add('jp-animated');
          }, parseInt(delay));

          observer.unobserve(el);
        }
      });
    }, {
      rootMargin : '0px 0px -60px 0px',
      threshold  : 0.1,
    });

    animEls.forEach(function (el) {
      observer.observe(el);
    });
  }


  /* ──────────────────────────────────────────
   * 📋 COPY TO CLIPBOARD
   * Untuk tombol salin nomor rekening dll
   * ────────────────────────────────────────── */

  function initClipboard() {
    $(document).on('click', '[data-jp-copy]', function () {
      const text = $(this).data('jp-copy');
      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        // Toast notifikasi salin berhasil
        if (typeof jpToast === 'function') {
          jpToast('Disalin!', text + ' berhasil disalin.', 'success');
        }
      }).catch(function () {
        // Fallback untuk browser lama
        const $temp = $('<input>');
        $('body').append($temp);
        $temp.val(text).select();
        document.execCommand('copy');
        $temp.remove();
      });
    });
  }


  /* ──────────────────────────────────────────
   * 📱 OFFCANVAS MOBILE MENU
   * Inisialisasi offcanvas menu untuk mobile
   * ────────────────────────────────────────── */

  function initMobileMenu() {
    const offcanvasEl = document.getElementById('jpMobileMenu');
    if (!offcanvasEl) return;

    // Tutup offcanvas saat link diklik
    $(offcanvasEl).on('click', '.jp-mobile-nav-link', function () {
      const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
      if (offcanvasInstance) offcanvasInstance.hide();
    });
  }


  /* ──────────────────────────────────────────
   * 🔢 COUNTER ANIMATION
   * Angka naik secara animasi saat masuk viewport
   * (dipakai di hero stat, why us, dsb)
   * ────────────────────────────────────────── */

  function initCounterAnimation() {
    if (!('IntersectionObserver' in window)) return;

    const counters = document.querySelectorAll('[data-jp-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        const el      = entry.target;
        const target  = parseFloat(el.dataset.jpCounter);
        const suffix  = el.dataset.jpSuffix  || '';
        const prefix  = el.dataset.jpPrefix  || '';
        const duration= parseInt(el.dataset.jpDuration || '1500');
        const decimals= parseInt(el.dataset.jpDecimals || '0');
        const start   = 0;
        const step    = (target - start) / (duration / 16);
        let   current = start;

        const timer = setInterval(function () {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = prefix + current.toFixed(decimals) + suffix;
        }, 16);

        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }


  /* ──────────────────────────────────────────
   * 🎨 ACTIVE NAV LINK
   * Tandai nav link aktif berdasarkan URL saat ini
   * ────────────────────────────────────────── */

  function initActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    $('.jp-nav-link, .jp-mobile-nav-link, .jp-footer-links a').each(function () {
      const href = $(this).attr('href');
      if (!href) return;

      const linkPath = href.split('/').pop();
      if (linkPath === currentPath) {
        $(this).addClass('active');

        // Jika link ada di dalam dropdown, tambahkan active ke parent juga
        const $parentLink = $(this).closest('.jp-nav-item').find('> .jp-nav-link');
        if ($parentLink.length && !$parentLink.hasClass('active')) {
          $parentLink.addClass('active');
        }
      }
    });
  }


  /* ──────────────────────────────────────────
   * 🔍 SEARCH OVERLAY TOGGLE
   * Untuk icon search di mobile
   * ────────────────────────────────────────── */

  function initSearchOverlay() {
    const $overlay = $('#jpSearchOverlay');
    const $input   = $overlay.find('input');

    // Buka overlay
    $(document).on('click', '#jpSearchToggle', function () {
      $overlay.addClass('active');
      setTimeout(function () { $input.focus(); }, 200);
    });

    // Tutup overlay dengan tombol close atau ESC
    $(document).on('click', '#jpSearchClose', function () {
      $overlay.removeClass('active');
    });

    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $overlay.hasClass('active')) {
        $overlay.removeClass('active');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {

    // Core
    initNavbarScroll();
    initBackToTop();
    initWaFloat();
    initBootstrapComponents();
    initSmoothScroll();

    // Performance
    initLazyImages();

    // UX Enhancement
    initScrollAnimations();
    initCounterAnimation();
    initClipboard();
    initMobileMenu();
    initActiveNavLink();
    initSearchOverlay();

    // Log versi di console (hanya development)
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      console.log('%c JAYA PC Template v1.0.0 ', 'background:#1E3A8A;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;');
      console.log('%c Stack: Bootstrap 5.3 + jQuery 3.7 ', 'background:#F97316;color:#fff;padding:4px 8px;border-radius:4px;');
    }

  });

})(jQuery);
