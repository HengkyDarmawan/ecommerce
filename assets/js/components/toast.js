/**
 * ============================================================
 * JAYA PC — TOAST.JS
 * Template Version : 1.0.0
 * Description      : Sistem notifikasi toast global.
 *                    Expose fungsi window.jpToast() yang bisa
 *                    dipanggil dari file JS manapun.
 *                    Support 4 tipe: info, success, error, warning.
 *                    Auto-dismiss, manual close, max queue 5.
 * Stack            : jQuery 3.7.x
 * Dependency       : Load sebelum cart.js, wishlist.js, dll
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    duration  : 3500,   // ms sebelum auto-dismiss
    maxToasts : 5,      // maksimal toast tampil bersamaan
    position  : 'bottom-right', // bottom-right | bottom-left | top-right | top-left
  };

  /* ──────────────────────────────────────────
   * 🗺️ ICON & LABEL PER TIPE
   * ────────────────────────────────────────── */

  const TYPES = {
    info    : { icon: 'fa-circle-info',   label: 'Info'      },
    success : { icon: 'fa-circle-check',  label: 'Berhasil'  },
    error   : { icon: 'fa-circle-xmark',  label: 'Gagal'     },
    warning : { icon: 'fa-triangle-exclamation', label: 'Perhatian' },
  };


  /* ──────────────────────────────────────────
   * 1. PASTIKAN CONTAINER ADA
   * ────────────────────────────────────────── */

  function getContainer() {
    let $container = $('.jp-toast-container');

    if (!$container.length) {
      $container = $('<div class="jp-toast-container" role="region" aria-label="Notifikasi" aria-live="polite"></div>');
      $('body').append($container);
    }

    return $container;
  }


  /* ──────────────────────────────────────────
   * 2. BUILD HTML TOAST
   * ────────────────────────────────────────── */

  function buildToast(title, message, type) {
    const safeType  = TYPES[type] ? type : 'info';
    const typeData  = TYPES[safeType];
    const uid       = 'jpToast_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    const $toast = $(`
      <div class="jp-toast ${safeType}" role="alert" aria-atomic="true" id="${uid}">
        <div class="jp-toast-icon">
          <i class="fa-solid ${typeData.icon}"></i>
        </div>
        <div class="jp-toast-body">
          <div class="jp-toast-title">${title || typeData.label}</div>
          ${message ? `<div class="jp-toast-msg">${message}</div>` : ''}
        </div>
        <button class="jp-toast-close" aria-label="Tutup notifikasi">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="jp-toast-progress"></div>
      </div>
    `);

    return { $toast, uid };
  }


  /* ──────────────────────────────────────────
   * 3. TAMPILKAN TOAST
   * ────────────────────────────────────────── */

  function showToast(title, message, type, duration) {
    const $container  = getContainer();
    const autoDismiss = duration !== 0 ? (duration || CFG.duration) : 0;

    // Batasi jumlah toast yang tampil
    const $existing = $container.find('.jp-toast');
    if ($existing.length >= CFG.maxToasts) {
      dismissToast($existing.first());
    }

    const { $toast, uid } = buildToast(title, message, type);

    // Append ke container
    $container.append($toast);

    // Animasi progress bar jika auto-dismiss
    if (autoDismiss > 0) {
      $toast.find('.jp-toast-progress').css({
        position        : 'absolute',
        bottom          : 0,
        left            : 0,
        height          : '3px',
        width           : '100%',
        background      : 'rgba(255,255,255,0.30)',
        borderRadius    : '0 0 var(--jp-radius-lg) var(--jp-radius-lg)',
        transition      : `width ${autoDismiss}ms linear`,
      });

      // Trigger progress shrink setelah render
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          $toast.find('.jp-toast-progress').css('width', '0%');
        });
      });

      // Auto dismiss
      $toast.data('timer', setTimeout(function () {
        dismissToast($toast);
      }, autoDismiss));
    }

    // Tombol close manual
    $toast.find('.jp-toast-close').on('click', function () {
      clearTimeout($toast.data('timer'));
      dismissToast($toast);
    });

    // Pause timer saat hover
    $toast.on('mouseenter', function () {
      clearTimeout($toast.data('timer'));
      $toast.find('.jp-toast-progress').css('transition', 'none');
    });

    $toast.on('mouseleave', function () {
      if (autoDismiss > 0) {
        const remaining = getRemainingTime($toast, autoDismiss);
        $toast.find('.jp-toast-progress').css({
          transition : `width ${remaining}ms linear`,
          width      : '0%',
        });
        $toast.data('timer', setTimeout(function () {
          dismissToast($toast);
        }, remaining));
      }
    });

    return uid;
  }


  /* ──────────────────────────────────────────
   * 4. DISMISS TOAST
   * ────────────────────────────────────────── */

  function dismissToast($toast) {
    if (!$toast.length || $toast.data('dismissing')) return;
    $toast.data('dismissing', true);

    $toast.css({
      animation : 'jp-toast-out 0.25s ease forwards',
    });

    setTimeout(function () {
      $toast.remove();
    }, 260);
  }

  // Estimasi sisa waktu dari progress bar width
  function getRemainingTime($toast, totalDuration) {
    const $bar     = $toast.find('.jp-toast-progress');
    const widthStr = $bar.css('width');
    const barWidth = parseFloat(widthStr) || 0;
    const total    = $bar.parent().outerWidth() || 1;
    const ratio    = barWidth / total;
    return Math.max(300, ratio * totalDuration);
  }


  /* ──────────────────────────────────────────
   * 5. DISMISS BY ID
   * ────────────────────────────────────────── */

  function dismissById(uid) {
    const $toast = $('#' + uid);
    if ($toast.length) dismissToast($toast);
  }


  /* ──────────────────────────────────────────
   * 6. DISMISS ALL
   * ────────────────────────────────────────── */

  function dismissAll() {
    $('.jp-toast').each(function () {
      dismissToast($(this));
    });
  }


  /* ──────────────────────────────────────────
   * 7. CSS ANIMASI KELUAR (inject sekali)
   * ────────────────────────────────────────── */

  function injectOutAnimation() {
    if ($('#jp-toast-styles').length) return;

    $('<style id="jp-toast-styles">')
      .text(`
        @keyframes jp-toast-out {
          from { opacity: 1; transform: translateX(0);     max-height: 200px; margin-bottom: 12px; }
          to   { opacity: 0; transform: translateX(110%);  max-height: 0;     margin-bottom: 0;   }
        }
        .jp-toast { position: relative; overflow: hidden; }
      `)
      .appendTo('head');
  }


  /* ──────────────────────────────────────────
   * 8. SHORTCUT HELPERS
   * ────────────────────────────────────────── */

  /**
   * Tampilkan toast notifikasi
   * @param {string} title    - Judul toast
   * @param {string} message  - Pesan opsional
   * @param {string} type     - 'info' | 'success' | 'error' | 'warning'
   * @param {number} duration - ms auto-dismiss (0 = tidak auto-dismiss)
   * @returns {string}        - ID unik toast (untuk dismiss manual)
   *
   * Contoh penggunaan:
   *   jpToast('Berhasil!', 'Produk ditambahkan ke keranjang.', 'success');
   *   jpToast('Gagal', 'Stok tidak tersedia.', 'error', 0);
   *   jpToast('Info', 'Flash sale dimulai!', 'info', 5000);
   */
  window.jpToast = function (title, message, type, duration) {
    return showToast(title, message, type, duration);
  };

  window.jpToast.success = function (title, message, duration) {
    return showToast(title, message, 'success', duration);
  };

  window.jpToast.error = function (title, message, duration) {
    return showToast(title, message, 'error', duration);
  };

  window.jpToast.warning = function (title, message, duration) {
    return showToast(title, message, 'warning', duration);
  };

  window.jpToast.info = function (title, message, duration) {
    return showToast(title, message, 'info', duration);
  };

  window.jpToast.dismiss = dismissById;
  window.jpToast.dismissAll = dismissAll;


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    injectOutAnimation();
    getContainer(); // pastikan container ada di DOM
  });

})(jQuery);
