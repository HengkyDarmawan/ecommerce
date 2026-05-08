/**
 * ============================================================
 * JAYA PC — NAVBAR.JS
 * Template Version : 1.0.0
 * Description      : Semua logic navbar.
 *                    Mega dropdown hover + keyboard nav,
 *                    sticky behavior, mobile offcanvas menu,
 *                    search bar autocomplete trigger,
 *                    dan accordion mobile sub-menu.
 * Stack            : jQuery 3.7.x + Bootstrap 5.3
 * Dependency       : main.js (load sebelum main.js)
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    hoverDelay    : 120,   // ms delay sebelum dropdown terbuka
    hoverOutDelay : 200,   // ms delay sebelum dropdown tertutup
    mobileBreak   : 991,   // px batas mobile / desktop
  };

  let hoverTimer = null;


  /* ──────────────────────────────────────────
   * 1. MEGA DROPDOWN — HOVER DESKTOP
   * Buka/tutup mega dropdown saat hover
   * dengan delay agar tidak flicker
   * ────────────────────────────────────────── */

  function initMegaDropdown() {
    const $items = $('.jp-nav-item');
    if (!$items.length) return;

    $items.each(function () {
      const $item     = $(this);
      const $dropdown = $item.find('.jp-mega-dropdown');
      if (!$dropdown.length) return;

      // Mouse enter nav item — buka dropdown
      $item.on('mouseenter.megadrop', function () {
        if ($(window).width() <= CFG.mobileBreak) return;

        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          // Tutup semua dropdown lain dulu
          $('.jp-mega-dropdown').not($dropdown).each(function () {
            closeDropdown($(this));
          });
          openDropdown($dropdown);
        }, CFG.hoverDelay);
      });

      // Mouse leave nav item — tutup dropdown
      $item.on('mouseleave.megadrop', function () {
        if ($(window).width() <= CFG.mobileBreak) return;

        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          closeDropdown($dropdown);
        }, CFG.hoverOutDelay);
      });

      // Tetap terbuka saat mouse masuk ke dropdown
      $dropdown.on('mouseenter.megadrop', function () {
        clearTimeout(hoverTimer);
      });

      $dropdown.on('mouseleave.megadrop', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          closeDropdown($dropdown);
        }, CFG.hoverOutDelay);
      });
    });

    // Tutup semua dropdown saat klik di luar
    $(document).on('click.megadrop', function (e) {
      if (!$(e.target).closest('.jp-nav-item').length) {
        $('.jp-mega-dropdown').each(function () {
          closeDropdown($(this));
        });
      }
    });
  }

  function openDropdown($dropdown) {
    $dropdown
      .css('opacity', '')
      .css('visibility', '')
      .css('transform', '')
      .css('pointer-events', '');

    $dropdown.closest('.jp-nav-item')
      .find('.jp-nav-link .fa-chevron-down')
      .css('transform', 'rotate(180deg)');
  }

  function closeDropdown($dropdown) {
    $dropdown.css({
      opacity       : '',
      visibility    : '',
      transform     : '',
      'pointer-events': '',
    });

    $dropdown.closest('.jp-nav-item')
      .find('.jp-nav-link .fa-chevron-down')
      .css('transform', '');
  }


  /* ──────────────────────────────────────────
   * 2. MEGA DROPDOWN — KEYBOARD NAVIGATION
   * Aksesibilitas: Tab, Enter, Escape, Arrow
   * ────────────────────────────────────────── */

  function initDropdownKeyboard() {
    // Buka dengan Enter pada nav-link yang punya dropdown
    $(document).on('keydown.navkbd', '.jp-nav-link', function (e) {
      const $item     = $(this).closest('.jp-nav-item');
      const $dropdown = $item.find('.jp-mega-dropdown');
      if (!$dropdown.length) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = $dropdown.css('opacity') === '1';
        if (isOpen) {
          closeDropdown($dropdown);
        } else {
          openDropdown($dropdown);
          $dropdown.find('.jp-mega-item').first().focus();
        }
      }

      if (e.key === 'Escape') {
        closeDropdown($dropdown);
        $(this).focus();
      }
    });

    // Navigasi Arrow dalam dropdown
    $(document).on('keydown.navkbd', '.jp-mega-item', function (e) {
      const $items = $(this).closest('.jp-mega-dropdown').find('.jp-mega-item');
      const index  = $items.index(this);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        $items.eq(index + 1).focus();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        $items.eq(index - 1).focus();
      }

      if (e.key === 'Escape') {
        const $dropdown = $(this).closest('.jp-mega-dropdown');
        closeDropdown($dropdown);
        $dropdown.closest('.jp-nav-item').find('.jp-nav-link').focus();
      }

      if (e.key === 'Tab') {
        const $dropdown = $(this).closest('.jp-mega-dropdown');
        // Tutup dropdown jika Tab keluar dari dropdown
        if (!e.shiftKey && index === $items.length - 1) {
          closeDropdown($dropdown);
        }
      }
    });
  }


  /* ──────────────────────────────────────────
   * 3. MOBILE OFFCANVAS MENU
   * Build struktur HTML offcanvas dari nav desktop
   * ────────────────────────────────────────── */

  function initMobileOffcanvas() {
    const $offcanvasBody = $('#jpMobileMenu .offcanvas-body');
    if (!$offcanvasBody.length) return;

    // Jika konten mobile menu sudah ada di HTML, skip build otomatis
    if ($offcanvasBody.find('.jp-mobile-nav').length) return;

    const $mobileNav = $('<ul class="jp-mobile-nav list-unstyled mb-0"></ul>');

    // Clone struktur dari desktop nav
    $('.jp-nav-menu > .jp-nav-item').each(function () {
      const $desktopItem   = $(this);
      const $desktopLink   = $desktopItem.find('> .jp-nav-link');
      const $megaDropdown  = $desktopItem.find('.jp-mega-dropdown');
      const hasDropdown    = $megaDropdown.length > 0;

      const $mobileItem = $('<li class="jp-mobile-nav-item"></li>');

      if (hasDropdown) {
        // Link dengan sub-menu — tambah chevron toggle
        const $mobileLink = $(`
          <button class="jp-mobile-nav-link jp-mobile-nav-toggle" type="button">
            ${$desktopLink.html()}
          </button>
        `);

        const uid        = 'mobileSubmenu_' + Math.random().toString(36).slice(2, 7);
        const $subMenu   = $('<ul class="jp-mobile-submenu list-unstyled"></ul>');
        $subMenu.attr('id', uid);

        // Ambil item dari mega dropdown
        $megaDropdown.find('.jp-mega-item').each(function () {
          const $megaItem = $(this);
          const href      = $megaItem.attr('href') || '#';
          const title     = $megaItem.find('.jp-mega-item-title').text().trim();

          if (!title) return;

          $subMenu.append(`
            <li>
              <a href="${href}" class="jp-mobile-nav-link jp-mobile-subnav-link">
                ${title}
              </a>
            </li>
          `);
        });

        $mobileLink.on('click', function () {
          const $btn      = $(this);
          const $sub      = $btn.next('.jp-mobile-submenu');
          const isOpen    = $sub.hasClass('show');

          // Tutup semua sub menu lain
          $('.jp-mobile-submenu.show').not($sub).slideUp(200).removeClass('show');
          $('.jp-mobile-nav-toggle.open').not($btn).removeClass('open');

          if (isOpen) {
            $sub.slideUp(200).removeClass('show');
            $btn.removeClass('open');
          } else {
            $sub.slideDown(200).addClass('show');
            $btn.addClass('open');
          }
        });

        $mobileItem.append($mobileLink).append($subMenu);

      } else {
        // Link biasa
        const href  = $desktopLink.attr('href') || '#';
        const html  = $desktopLink.html();
        const cls   = $desktopLink.hasClass('sale') ? ' sale' : '';

        $mobileItem.append(`
          <a href="${href}" class="jp-mobile-nav-link${cls}">${html}</a>
        `);
      }

      $mobileNav.append($mobileItem);
    });

    $offcanvasBody.prepend($mobileNav);
  }


  /* ──────────────────────────────────────────
   * 4. MOBILE SEARCH BAR
   * Search bar di dalam offcanvas
   * ────────────────────────────────────────── */

  function initMobileSearch() {
    const $offcanvasSearch = $('#jpMobileSearch');
    if (!$offcanvasSearch.length) return;

    // Focus input saat offcanvas terbuka
    $('#jpMobileMenu').on('shown.bs.offcanvas', function () {
      $offcanvasSearch.find('input').focus();
    });

    // Submit pencarian
    $offcanvasSearch.on('submit', function (e) {
      e.preventDefault();
      const query = $(this).find('input').val().trim();
      if (!query) return;
      window.location.href = 'shop.html?q=' + encodeURIComponent(query);
    });
  }


  /* ──────────────────────────────────────────
   * 5. NAVBAR SEARCH — DESKTOP
   * Submit form pencarian di navbar desktop
   * ────────────────────────────────────────── */

  function initDesktopSearch() {
    const $searchWrap = $('.jp-navbar-search');
    if (!$searchWrap.length) return;

    // Submit dengan Enter
    $searchWrap.find('input').on('keydown', function (e) {
      if (e.key === 'Enter') {
        const query = $(this).val().trim();
        if (!query) return;
        window.location.href = 'shop.html?q=' + encodeURIComponent(query);
      }
    });

    // Klik icon search
    $searchWrap.find('.jp-navbar-search-icon').on('click', function () {
      const query = $searchWrap.find('input').val().trim();
      if (!query) {
        $searchWrap.find('input').focus();
        return;
      }
      window.location.href = 'shop.html?q=' + encodeURIComponent(query);
    });
  }


  /* ──────────────────────────────────────────
   * 6. TOPBAR MARQUEE — PAUSE ON FOCUS
   * Aksesibilitas: pause marquee saat ada
   * elemen di dalam mendapat fokus keyboard
   * ────────────────────────────────────────── */

  function initTopbarAccessibility() {
    const $track = $('.jp-topbar-marquee-track');
    if (!$track.length) return;

    $track.find('a').on('focus', function () {
      $track.css('animation-play-state', 'paused');
    });

    $track.find('a').on('blur', function () {
      $track.css('animation-play-state', 'running');
    });
  }


  /* ──────────────────────────────────────────
   * 7. WINDOW RESIZE — CLEANUP
   * Reset state dropdown saat resize ke desktop
   * ────────────────────────────────────────── */

  function initResizeHandler() {
    let resizeTimer;

    $(window).on('resize.navbar', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const w = $(window).width();

        // Saat resize ke desktop, tutup offcanvas jika masih terbuka
        if (w > CFG.mobileBreak) {
          const offcanvasEl = document.getElementById('jpMobileMenu');
          if (offcanvasEl) {
            const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (instance) instance.hide();
          }

          // Reset semua submenu mobile
          $('.jp-mobile-submenu').hide().removeClass('show');
          $('.jp-mobile-nav-toggle').removeClass('open');
        }

        // Saat resize ke mobile, tutup semua dropdown desktop
        if (w <= CFG.mobileBreak) {
          $('.jp-mega-dropdown').each(function () {
            closeDropdown($(this));
          });
        }

      }, 150);
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initMegaDropdown();
    initDropdownKeyboard();
    initMobileOffcanvas();
    initMobileSearch();
    initDesktopSearch();
    initTopbarAccessibility();
    initResizeHandler();
  });

})(jQuery);
