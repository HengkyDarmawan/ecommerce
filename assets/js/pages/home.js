/**
 * ============================================================
 * JAYA PC — PAGES/HOME.JS
 * Template Version : 1.0.0
 * Description      : Script khusus halaman homepage.
 *                    Init hero carousel, product tabs,
 *                    PC builder widget, newsletter,
 *                    dan section-specific interactions.
 *                    Semua logic global ada di main.js
 *                    dan component JS masing-masing.
 * Stack            : jQuery 3.7.x
 * Dependency       : toast.js, cart.js, wishlist.js,
 *                    carousel.js, pc-builder.js, main.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * 1. HERO STAT COUNTER — TRIGGER SAAT VISIBLE
   * Angka naik animasi saat stat bar masuk viewport
   * ────────────────────────────────────────── */

  function initHeroStats() {
    const $statsBar = $('.jp-hero-stats');
    if (!$statsBar.length) return;

    // Counter sudah dihandle oleh main.js initCounterAnimation()
    // Fungsi ini hanya memastikan stat bar langsung animate
    // karena letaknya di bawah hero (langsung terlihat saat load)
    setTimeout(function () {
      $('[data-jp-counter]').each(function () {
        const $el      = $(this);
        const target   = parseFloat($el.data('jp-counter'));
        const suffix   = $el.data('jp-suffix')   || '';
        const decimals = parseInt($el.data('jp-decimals') || '0');
        const duration = 1800;
        const step     = target / (duration / 16);
        let   current  = 0;

        // Hanya animate jika masih menampilkan value awal (belum dianimasikan)
        if ($el.text().indexOf(target.toFixed(decimals)) !== -1) return;

        const timer = setInterval(function () {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          $el.text(current.toFixed(decimals) + suffix);
        }, 16);
      });
    }, 800);
  }


  /* ──────────────────────────────────────────
   * 2. PRODUK UNGGULAN — ACTIVE TAB STYLING
   * Sync style Bootstrap tabs dengan jp-btn style
   * ────────────────────────────────────────── */

  function initProductTabStyling() {
    const $tabBtns = $('.jp-product-tab-btn');
    if (!$tabBtns.length) return;

    $tabBtns.on('click', function () {
      const $btn = $(this);

      // Reset semua ke outline style
      $tabBtns.each(function () {
        const $b = $(this);

        // Jaga style khusus tombol Sale (merah)
        if ($b.data('target') === 'tabSale') {
          $b.css({
            'background-color' : '',
            'border-color'     : '',
            'color'            : '',
          });
          $b.removeClass('jp-btn-primary')
            .addClass('jp-btn-outline-primary');
          $b.css({
            'background' : 'transparent',
            'color'      : 'var(--jp-danger)',
            'border-color': 'var(--jp-danger)',
          });
        } else {
          $b.removeClass('jp-btn-primary')
            .addClass('jp-btn-outline-primary');
          $b.css({ background: '', color: '', 'border-color': '' });
        }
      });

      // Set tombol yang diklik jadi aktif
      if ($btn.data('target') === 'tabSale') {
        $btn.css({
          'background-color' : 'var(--jp-danger)',
          'border-color'     : 'var(--jp-danger)',
          'color'            : '#fff',
        });
      } else {
        $btn.removeClass('jp-btn-outline-primary')
            .addClass('jp-btn-primary')
            .css({ background: '', color: '', 'border-color': '' });
      }
    });
  }


  /* ──────────────────────────────────────────
   * 3. BRAND SECTION — HOVER EFEK PRODUK
   * Tampilkan quick-view info saat hover card
   * ────────────────────────────────────────── */

  function initProductCardHover() {
    // Wishlist button tooltip on hover
    $(document).on('mouseenter', '.jp-product-card-wishlist', function () {
      const $btn    = $(this);
      const isActive = $btn.hasClass('active');
      $btn.attr('title', isActive ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist');
    });
  }


  /* ──────────────────────────────────────────
   * 4. CONFIGURATOR WIDGET — HOMEPAGE
   * Sinkronisasi state pilihan dengan visual
   * ────────────────────────────────────────── */

  function initConfiguratorWidget() {
    const $widget = $('#jpBuilderWidget');
    if (!$widget.length) return;

    // Default: set nilai awal yang aktif ke state builder
    const $activeBudget    = $widget.find('[data-budget].active');
    const $activeKebutuhan = $widget.find('[data-kebutuhan].active');

    if ($activeBudget.length && window.jpBuilder) {
      window.jpBuilder.state.budget = $activeBudget.data('budget');
    }
    if ($activeKebutuhan.length && window.jpBuilder) {
      window.jpBuilder.state.kebutuhan = $activeKebutuhan.data('kebutuhan');
    }

    // Animasi tombol saat dipilih
    $widget.on('click', '.jp-config-option', function () {
      const $btn = $(this);
      $btn.addClass('jp-config-selected');
      setTimeout(function () {
        $btn.removeClass('jp-config-selected');
      }, 300);
    });
  }


  /* ──────────────────────────────────────────
   * 5. WHY US — STAGGER ANIMATION
   * Delay animasi per card berurutan
   * ────────────────────────────────────────── */

  function initWhyUsAnimation() {
    const $cards = $('.jp-why-grid .jp-why-card');
    if (!$cards.length) return;

    $cards.each(function (i) {
      const delay = (i % 4) * 100; // delay berurutan dalam satu baris
      $(this).attr('data-jp-delay', delay);
    });
  }


  /* ──────────────────────────────────────────
   * 6. TESTIMONIAL — AUTO SCROLL (opsional)
   * Scroll testimonial di mobile jika 1 kolom
   * ────────────────────────────────────════ */

  function initTestimonialScroll() {
    // Hanya aktif di layar mobile
    if ($(window).width() > 575) return;

    const $grid = $('.jp-testimonial-grid');
    if (!$grid.length) return;

    // Convert grid ke swiper jika Swiper tersedia
    if (typeof Swiper === 'undefined') return;

    $grid.addClass('swiper-wrapper');
    $grid.find('.jp-testimonial-card').addClass('swiper-slide');
    $grid.closest('section').find('.jp-testimonial-grid').wrap(
      '<div class="swiper jp-swiper-testimonial"></div>'
    );

    new Swiper('.jp-swiper-testimonial', {
      slidesPerView : 1.1,
      spaceBetween  : 16,
      grabCursor    : true,
      pagination    : {
        el        : '.jp-testimonial-pagination',
        clickable : true,
      },
    });
  }


  /* ──────────────────────────────────────────
   * 7. NEWSLETTER — FEEDBACK VISUAL
   * Animasi sukses setelah subscribe
   * ────────────────────────────────────────── */

  function initNewsletterFeedback() {
    const $input = $('#jpNewsletterEmail');
    const $btn   = $('#jpNewsletterSubmit');

    if (!$input.length || !$btn.length) return;

    // Real-time validasi saat blur
    $input.on('blur', function () {
      const email = $(this).val().trim();
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && !regex.test(email)) {
        $(this).css('border-color', 'rgba(220,38,38,0.5)');
      } else {
        $(this).css('border-color', '');
      }
    });

    $input.on('focus', function () {
      $(this).css('border-color', '');
    });

    // Override submit handler dengan feedback animasi
    $btn.off('click').on('click', function () {
      const email = $input.val().trim();
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || !regex.test(email)) {
        $input.css('border-color', 'rgba(220,38,38,0.5)');
        $input.focus();
        if (typeof jpToast === 'function') {
          jpToast.warning('Email Tidak Valid', 'Masukkan alamat email yang benar.');
        }
        return;
      }

      // Loading state tombol
      const origText = $btn.html();
      $btn.prop('disabled', true)
          .html('<i class="fa-solid fa-spinner fa-spin"></i>');

      // Simulasi API call
      setTimeout(function () {
        $btn.prop('disabled', false).html(
          '<i class="fa-solid fa-check"></i> Berhasil!'
        );
        $btn.css('background-color', 'var(--jp-success)');

        $input.val('').css('border-color', '');

        if (typeof jpToast === 'function') {
          jpToast.success(
            'Berhasil Subscribe!',
            'Terima kasih! Kamu akan mendapat info promo terbaru.'
          );
        }

        // Reset tombol setelah 3 detik
        setTimeout(function () {
          $btn.html(origText).css('background-color', '');
        }, 3000);

      }, 900);
    });
  }


  /* ──────────────────────────────────────────
   * 8. STICKY NAVBAR — HOMEPAGE SPECIFIC
   * Tambah class saat melewati hero
   * ────────────────────────────────────────── */

  function initNavbarHeroSync() {
    const $hero   = $('#jpHero');
    const $navbar = $('#jpNavbar');
    if (!$hero.length || !$navbar.length) return;

    $(window).on('scroll.homehero', function () {
      const heroBottom = $hero.offset().top + $hero.outerHeight() - 64;
      const scrollTop  = $(window).scrollTop();

      if (scrollTop > heroBottom) {
        $navbar.addClass('past-hero');
      } else {
        $navbar.removeClass('past-hero');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 9. BRAND MARQUEE — HOVER PAUSE
   * Sudah dihandle di components.css via CSS,
   * ini untuk aksesibilitas focus pause
   * ────────────────────────────────────────── */

  function initBrandMarqueePause() {
    const $track = $('.jp-brand-track');
    if (!$track.length) return;

    $track.find('.jp-brand-item').on('focus', function () {
      $track.css('animation-play-state', 'paused');
    }).on('blur', function () {
      $track.css('animation-play-state', 'running');
    });
  }


  /* ──────────────────────────────────────────
   * 10. QUICK HIGHLIGHT — SCROLL TO CONFIG
   * Tombol "Rakit PC" di hero scroll ke section
   * ────────────────────────────────────────── */

  function initScrollToConfig() {
    // Tombol di hero yang mengarah ke #jpConfigSection
    $(document).on('click', 'a[href="#jpConfigSection"]', function (e) {
      e.preventDefault();

      const $target = $('#jpConfigSection');
      if (!$target.length) return;

      const navH    = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--jp-navbar-total') || '100'
      );

      $('html, body').animate(
        { scrollTop: $target.offset().top - navH - 16 },
        400
      );

      // Highlight widget setelah scroll
      setTimeout(function () {
        $('#jpBuilderWidget').css({
          'box-shadow' : '0 0 0 4px rgba(30, 58, 138, 0.15)',
          transition   : 'box-shadow 300ms ease',
        });
        setTimeout(function () {
          $('#jpBuilderWidget').css('box-shadow', '');
        }, 1500);
      }, 500);
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initHeroStats();
    initProductTabStyling();
    initProductCardHover();
    initConfiguratorWidget();
    initWhyUsAnimation();
    initNewsletterFeedback();
    initNavbarHeroSync();
    initBrandMarqueePause();
    initScrollToConfig();

    // Testimonial swiper hanya di mobile — defer sedikit
    setTimeout(initTestimonialScroll, 300);
  });

})(jQuery);
