/**
 * ============================================================
 * JAYA PC — PAGES/CHECKOUT.JS
 * Template Version : 1.0.0
 * Description      : Script khusus halaman cart & checkout.
 *                    Render cart items, kalkulasi total,
 *                    coupon/voucher, form validasi checkout,
 *                    payment method selector, dan
 *                    order confirmation.
 * Stack            : jQuery 3.7.x
 * Dependency       : cart.js, toast.js, main.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    shippingFree   : 500000,    // minimum belanja gratis ongkir
    shippingCost   : 25000,     // ongkir default jika tidak gratis
    currency       : 'Rp',
    checkoutPage   : 'checkout.html',
    successPage    : 'checkout-success.html',
    coupons        : {
      'JAYAPC10'   : { type: 'percent', value: 10, label: 'Diskon 10%'        },
      'GAJIAN50'   : { type: 'percent', value: 50, label: 'Gajian Sale 50%',
                       maxDiscount: 500000                                      },
      'ONGKIRFREE' : { type: 'shipping', value: 0, label: 'Gratis Ongkir'     },
      'HEMAT50K'   : { type: 'fixed',   value: 50000, label: 'Potongan 50rb'  },
    },
  };

  let activeCoupon = null;


  /* ──────────────────────────────────────────
   * 1. FORMAT HARGA
   * ────────────────────────────────────────── */

  function fmt(num) {
    return CFG.currency + ' ' + Math.round(num).toLocaleString('id-ID');
  }


  /* ══════════════════════════════════════════
   * CART PAGE
   * ══════════════════════════════════════════ */

  /* ──────────────────────────────────────────
   * 2. RENDER CART ITEMS DI HALAMAN CART
   * ────────────────────────────────────────── */

  function renderCartPage() {
    const $wrap = $('#jpCartItemsList');
    if (!$wrap.length) return;

    if (typeof jpCart === 'undefined') return;

    const cart = jpCart.get();

    if (!cart.length) {
      // Empty state
      $wrap.html(`
        <div class="jp-cart-empty">
          <i class="fa-solid fa-bag-shopping jp-cart-empty-icon"></i>
          <h3 class="jp-cart-empty-title">Keranjang Masih Kosong</h3>
          <p class="jp-cart-empty-desc">
            Belum ada produk di keranjangmu.
            Yuk mulai belanja komponen PC terbaik!
          </p>
          <a href="shop.html" class="jp-btn jp-btn-primary">
            <i class="fa-solid fa-magnifying-glass"></i> Mulai Belanja
          </a>
        </div>
      `);
      updateSummary();
      return;
    }

    let html = '';
    cart.forEach(function (item) {
      html += `
        <div class="jp-cart-item" data-cart-item="${item.id}">
          <div class="jp-cart-item-check">
            <input type="checkbox" checked
                   aria-label="Pilih ${item.name}"
                   class="jp-cart-select-item">
          </div>
          <div class="jp-cart-item-img">
            <a href="product-detail.html?id=${item.id}">
              <img src="${item.image || 'https://placehold.co/80x80/F8FAFC/1E3A8A?text=IMG'}"
                   alt="${item.name}" loading="lazy">
            </a>
          </div>
          <div class="jp-cart-item-info">
            <div class="jp-cart-item-brand">${item.brand || ''}</div>
            <div class="jp-cart-item-name">
              <a href="product-detail.html?id=${item.id}">${item.name}</a>
            </div>
            <div class="jp-cart-item-variant">Garansi Resmi Distributor</div>
            <div class="jp-cart-item-actions">
              <div class="jp-qty-input">
                <button class="jp-qty-btn" data-action="minus"
                        data-cart-item="${item.id}" type="button">−</button>
                <input class="jp-qty-value" type="number"
                       value="${item.qty}" min="1" max="${item.maxStock || 99}"
                       aria-label="Jumlah ${item.name}">
                <button class="jp-qty-btn" data-action="plus"
                        data-cart-item="${item.id}" type="button">+</button>
              </div>
              <div class="jp-cart-item-subtotal">
                <span class="jp-cart-item-subtotal-label">Subtotal</span>
                <span class="jp-cart-item-subtotal-price"
                      data-item-subtotal="${item.id}">
                  ${fmt(item.price * item.qty)}
                </span>
              </div>
              <button class="jp-cart-item-remove"
                      data-jp-remove-cart="${item.id}"
                      aria-label="Hapus ${item.name} dari keranjang"
                      type="button">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="jp-cart-item-price-col">
            <div class="jp-cart-item-price">${fmt(item.price)}</div>
            <div class="jp-cart-item-price-original">/unit</div>
          </div>
        </div>
      `;
    });

    $wrap.html(html);
    updateSummary();
  }


  /* ──────────────────────────────────────────
   * 3. UPDATE ORDER SUMMARY KALKULASI
   * ────────────────────────────────────────── */

  function updateSummary() {
    if (typeof jpCart === 'undefined') return;

    const cart      = jpCart.get();
    const subtotal  = jpCart.getSubtotal();
    const itemCount = jpCart.getCount();

    // Hitung diskon coupon
    let discount = 0;
    let shipping = subtotal >= CFG.shippingFree ? 0 : CFG.shippingCost;

    if (activeCoupon) {
      if (activeCoupon.type === 'percent') {
        discount = subtotal * (activeCoupon.value / 100);
        if (activeCoupon.maxDiscount) {
          discount = Math.min(discount, activeCoupon.maxDiscount);
        }
      } else if (activeCoupon.type === 'fixed') {
        discount = activeCoupon.value;
      } else if (activeCoupon.type === 'shipping') {
        shipping = 0;
      }
    }

    const total = Math.max(0, subtotal - discount + shipping);

    // Update UI
    $('[data-summary-count]').text(itemCount + ' item');
    $('[data-summary-subtotal]').text(fmt(subtotal));
    $('[data-summary-discount]').text(discount > 0 ? '- ' + fmt(discount) : '-');
    $('[data-summary-shipping]').text(shipping === 0 ? 'GRATIS' : fmt(shipping));
    $('[data-summary-total]').text(fmt(total));

    // Update cart badge global
    jpCart.refresh();

    // Aktif/nonaktif tombol checkout
    const $checkoutBtn = $('#jpCheckoutBtn');
    if ($checkoutBtn.length) {
      $checkoutBtn.prop('disabled', !cart.length);
    }

    // Update subtotal per item
    cart.forEach(function (item) {
      $('[data-item-subtotal="' + item.id + '"]')
        .text(fmt(item.price * item.qty));
    });
  }


  /* ──────────────────────────────────────────
   * 4. COUPON / VOUCHER
   * ────────────────────────────────────────── */

  function initCoupon() {
    const $input    = $('#jpCouponInput');
    const $applyBtn = $('#jpApplyCoupon');
    const $feedback = $('#jpCouponFeedback');
    if (!$input.length) return;

    $applyBtn.on('click', function () {
      const code = $input.val().trim().toUpperCase();
      if (!code) return;

      const coupon = CFG.coupons[code];

      if (!coupon) {
        $feedback.html(`
          <div class="jp-coupon-applied" style="
            background: var(--jp-danger-subtle);
            border-color: var(--jp-danger);">
            <span style="color:var(--jp-danger); font-size:var(--jp-text-sm); font-weight:600;">
              <i class="fa-solid fa-circle-xmark"></i>
              Kode voucher tidak valid atau sudah kadaluarsa.
            </span>
          </div>
        `);
        return;
      }

      // Terapkan coupon
      activeCoupon = coupon;
      $feedback.html(`
        <div class="jp-coupon-applied">
          <span class="jp-coupon-applied-code">
            <i class="fa-solid fa-circle-check"></i>
            Voucher <strong>${code}</strong> — ${coupon.label} berhasil diterapkan!
          </span>
          <button class="jp-coupon-remove-btn" id="jpRemoveCoupon" type="button">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `);
      $input.val('').prop('disabled', true);
      $applyBtn.prop('disabled', true);

      updateSummary();

      if (typeof jpToast === 'function') {
        jpToast.success('Voucher Diterapkan!', coupon.label + ' berhasil dipakai.');
      }
    });

    // Enter key apply
    $input.on('keydown', function (e) {
      if (e.key === 'Enter') $applyBtn.trigger('click');
    });

    // Hapus coupon
    $(document).on('click', '#jpRemoveCoupon', function () {
      activeCoupon = null;
      $feedback.empty();
      $input.val('').prop('disabled', false);
      $applyBtn.prop('disabled', false);
      $input.focus();
      updateSummary();
      if (typeof jpToast === 'function') {
        jpToast.info('Voucher Dihapus', 'Voucher berhasil dihapus dari pesanan.');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 5. SELECT ALL CART ITEMS
   * ────────────────────────────────────────── */

  function initSelectAll() {
    $(document).on('change', '#jpSelectAll', function () {
      const checked = $(this).is(':checked');
      $('.jp-cart-select-item').prop('checked', checked);
    });

    $(document).on('change', '.jp-cart-select-item', function () {
      const total    = $('.jp-cart-select-item').length;
      const selected = $('.jp-cart-select-item:checked').length;
      $('#jpSelectAll').prop({
        checked       : selected === total,
        indeterminate : selected > 0 && selected < total,
      });
    });
  }


  /* ──────────────────────────────────────────
   * 6. QTY UPDATE — REAL-TIME SUMMARY
   * ────────────────────────────────────────── */

  function initCartQtyUpdate() {
    // Override cart.js qty update — re-render summary setiap perubahan
    $(window).on('jp:cart:updated', function () {
      updateSummary();
    });
  }


  /* ══════════════════════════════════════════
   * CHECKOUT PAGE
   * ══════════════════════════════════════════ */

  /* ──────────────────────────────────────────
   * 7. RENDER ORDER REVIEW DI CHECKOUT
   * Tampilkan ringkasan produk yang akan dibeli
   * ────────────────────────────────────────── */

  function renderCheckoutReview() {
    const $wrap = $('#jpCheckoutItems');
    if (!$wrap.length || typeof jpCart === 'undefined') return;

    const cart = jpCart.get();

    if (!cart.length) {
      window.location.href = 'cart.html';
      return;
    }

    let html = '';
    cart.forEach(function (item) {
      html += `
        <div class="jp-summary-row">
          <span class="jp-summary-label">
            ${item.name}
            <span style="color:var(--jp-gray-400);"> × ${item.qty}</span>
          </span>
          <span class="jp-summary-value">${fmt(item.price * item.qty)}</span>
        </div>
      `;
    });

    $wrap.html(html);
    updateSummary();
  }


  /* ──────────────────────────────────────────
   * 8. PAYMENT METHOD SELECTOR
   * ────────────────────────────────────────── */

  function initPaymentSelector() {
    $(document).on('change', '.jp-payment-option input[type="radio"]', function () {
      $('.jp-payment-option').removeClass('selected');
      $(this).closest('.jp-payment-option').addClass('selected');

      const method = $(this).val();

      // Tampilkan instruksi per metode pembayaran
      const instructions = {
        'bank_bca'   : 'Transfer ke BCA: 1234567890 a.n. PT Jaya PC Indonesia',
        'bank_mandiri': 'Transfer ke Mandiri: 0987654321 a.n. PT Jaya PC Indonesia',
        'gopay'      : 'Kamu akan diarahkan ke aplikasi GoPay setelah konfirmasi.',
        'ovo'        : 'Kamu akan diarahkan ke aplikasi OVO setelah konfirmasi.',
        'cod'        : 'Bayar tunai saat produk tiba. Tersedia area Jakarta & sekitarnya.',
        'cicilan'    : 'Cicilan 0% tersedia untuk kartu kredit BCA, Mandiri, BNI, BRI.',
      };

      const $instruction = $('#jpPaymentInstruction');
      if ($instruction.length && instructions[method]) {
        $instruction.html(`
          <div style="
            padding: var(--jp-space-3) var(--jp-space-4);
            background: var(--jp-primary-subtle);
            border: var(--jp-border-width) solid var(--jp-primary);
            border-radius: var(--jp-radius-md);
            font-size: var(--jp-text-sm);
            color: var(--jp-primary);
            margin-top: var(--jp-space-3);
          ">
            <i class="fa-solid fa-circle-info me-2"></i>
            ${instructions[method]}
          </div>
        `);
      }
    });

    // Select metode pertama secara default
    $('.jp-payment-option input[type="radio"]:first').trigger('change');
  }


  /* ──────────────────────────────────────────
   * 9. FORM VALIDASI CHECKOUT
   * ────────────────────────────────────────── */

  function initCheckoutForm() {
    const $form = $('#jpCheckoutForm');
    if (!$form.length) return;

    // Real-time validasi tiap field
    $form.find('.jp-form-control[required]').on('blur', function () {
      validateField($(this));
    });

    // Submit handler
    $form.on('submit', function (e) {
      e.preventDefault();

      let valid = true;
      $form.find('.jp-form-control[required]').each(function () {
        if (!validateField($(this))) valid = false;
      });

      // Cek payment method dipilih
      if (!$('.jp-payment-option input[type="radio"]:checked').length) {
        if (typeof jpToast === 'function') {
          jpToast.warning('Pilih Metode Pembayaran', 'Silakan pilih metode pembayaran terlebih dahulu.');
        }
        valid = false;
      }

      if (!valid) {
        if (typeof jpToast === 'function') {
          jpToast.error('Form Tidak Lengkap', 'Lengkapi semua field yang wajib diisi.');
        }
        // Scroll ke error pertama
        const $firstError = $form.find('.jp-form-control.is-invalid').first();
        if ($firstError.length) {
          const navH = parseInt(
            getComputedStyle(document.documentElement)
              .getPropertyValue('--jp-navbar-total') || '100'
          );
          $('html, body').animate(
            { scrollTop: $firstError.offset().top - navH - 20 },
            300
          );
        }
        return;
      }

      // Submit berhasil — loading state
      const $submitBtn = $form.find('[type="submit"]');
      const origText   = $submitBtn.html();
      $submitBtn.prop('disabled', true).html(
        '<i class="fa-solid fa-spinner fa-spin me-2"></i>Memproses Pesanan...'
      );

      // Simulasi proses order (ganti dengan API call asli)
      setTimeout(function () {
        // Kosongkan cart setelah order berhasil
        if (typeof jpCart !== 'undefined') {
          jpCart.clear();
        }

        if (typeof jpToast === 'function') {
          jpToast.success('Pesanan Berhasil!', 'Terima kasih! Pesananmu sedang diproses.');
        }

        // Redirect ke halaman success
        setTimeout(function () {
          window.location.href = CFG.successPage;
        }, 1500);

      }, 1800);
    });
  }


  /* ──────────────────────────────────────────
   * 10. VALIDASI FIELD INDIVIDUAL
   * ────────────────────────────────────────── */

  function validateField($field) {
    const val      = $field.val().trim();
    const type     = $field.attr('type') || 'text';
    const name     = $field.attr('name') || '';
    let   isValid  = true;
    let   errMsg   = '';

    // Required check
    if ($field.is('[required]') && !val) {
      isValid = false;
      errMsg  = 'Field ini wajib diisi.';
    }

    // Email validation
    if (type === 'email' && val) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(val)) {
        isValid = false;
        errMsg  = 'Format email tidak valid.';
      }
    }

    // Phone validation (Indonesia)
    if ((name === 'phone' || name === 'whatsapp') && val) {
      const phoneRe = /^(\+62|62|0)[0-9]{9,12}$/;
      if (!phoneRe.test(val.replace(/\s|-/g, ''))) {
        isValid = false;
        errMsg  = 'Nomor telepon tidak valid (contoh: 08123456789).';
      }
    }

    // Postal code (5 digit)
    if (name === 'postal_code' && val) {
      if (!/^\d{5}$/.test(val)) {
        isValid = false;
        errMsg  = 'Kode pos harus 5 digit angka.';
      }
    }

    // Update UI
    const $errEl = $field.next('.jp-invalid-feedback');

    if (isValid) {
      $field.removeClass('is-invalid').addClass('is-valid');
      $errEl.remove();
    } else {
      $field.removeClass('is-valid').addClass('is-invalid');
      if (!$errEl.length) {
        $field.after(`<div class="jp-invalid-feedback">${errMsg}</div>`);
      } else {
        $errEl.text(errMsg);
      }
    }

    return isValid;
  }


  /* ──────────────────────────────────────────
   * 11. CHECKOUT STEPS NAVIGATION
   * ────────────────────────────────────────── */

  function initCheckoutSteps() {
    const $steps    = $('.jp-checkout-step');
    const $panels   = $('.jp-checkout-panel');
    const $nextBtns = $('.jp-checkout-next');
    const $prevBtns = $('.jp-checkout-prev');
    let   current   = 0;

    if (!$steps.length || !$panels.length) return;

    function goToStep(index) {
      $steps.each(function (i) {
        $(this)
          .toggleClass('active',    i === index)
          .toggleClass('completed', i < index);
      });

      $panels.hide();
      $panels.eq(index).fadeIn(250);
      current = index;

      // Scroll ke atas form
      const navH = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--jp-navbar-total') || '100'
      );
      $('html, body').animate(
        { scrollTop: $('.jp-checkout-steps').offset().top - navH - 20 },
        300
      );
    }

    $nextBtns.on('click', function () {
      if (current < $panels.length - 1) goToStep(current + 1);
    });

    $prevBtns.on('click', function () {
      if (current > 0) goToStep(current - 1);
    });

    goToStep(0);
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {

    // ── Halaman Cart ──
    if ($('#jpCartItemsList').length) {
      renderCartPage();
      initCoupon();
      initSelectAll();
      initCartQtyUpdate();

      // Redirect ke checkout saat tombol diklik
      $('#jpCheckoutBtn').on('click', function () {
        if (typeof jpCart !== 'undefined' && jpCart.get().length) {
          window.location.href = CFG.checkoutPage;
        }
      });
    }

    // ── Halaman Checkout ──
    if ($('#jpCheckoutForm').length) {
      renderCheckoutReview();
      initPaymentSelector();
      initCheckoutForm();
      initCheckoutSteps();
      initCoupon();
    }

  });

})(jQuery);
