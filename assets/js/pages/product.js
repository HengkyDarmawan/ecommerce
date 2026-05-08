/**
 * ============================================================
 * JAYA PC — PAGES/PRODUCT.JS
 * Template Version : 1.0.0
 * Description      : Script khusus halaman product detail.
 *                    Gallery thumbnail switch, zoom,
 *                    sticky cart bar, detail tabs,
 *                    review rating bars, qty stepper,
 *                    dan share produk.
 * Stack            : jQuery 3.7.x
 * Dependency       : cart.js, wishlist.js, toast.js, main.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * 1. GALLERY — THUMBNAIL SWITCH
   * Klik thumbnail → update gambar utama
   * ────────────────────────────────────────── */

  function initGallery() {
    const $mainImg   = $('#jpGalleryMain img');
    const $thumbs    = $('.jp-gallery-thumb');
    if (!$mainImg.length || !$thumbs.length) return;

    $thumbs.on('click', function () {
      const $thumb = $(this);
      const imgSrc = $thumb.find('img').attr('src');
      const imgAlt = $thumb.find('img').attr('alt') || '';

      // Update gambar utama dengan fade
      $mainImg.animate({ opacity: 0 }, 150, function () {
        $mainImg.attr('src', imgSrc).attr('alt', imgAlt);
        $mainImg.animate({ opacity: 1 }, 150);
      });

      // Update active state thumbnail
      $thumbs.removeClass('active');
      $thumb.addClass('active');
    });

    // Set thumbnail pertama aktif
    $thumbs.first().addClass('active');
  }


  /* ──────────────────────────────────────────
   * 2. GALLERY — ZOOM ON CLICK (lightbox sederhana)
   * ────────────────────────────────────────── */

  function initGalleryZoom() {
    const $galleryMain = $('#jpGalleryMain');
    if (!$galleryMain.length) return;

    // Buat overlay lightbox
    const $lightbox = $(`
      <div id="jpLightbox" style="
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.92);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: zoom-out;
        padding: 20px;
      ">
        <img id="jpLightboxImg" style="
          max-width: 90vw; max-height: 90vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
        " alt="">
        <button id="jpLightboxClose" style="
          position: absolute; top: 20px; right: 24px;
          background: rgba(255,255,255,0.15);
          border: none; color: #fff;
          width: 40px; height: 40px;
          border-radius: 50%; font-size: 20px;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
        ">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `);

    $('body').append($lightbox);

    // Buka lightbox saat klik gambar utama
    $galleryMain.on('click', function () {
      const src = $(this).find('img').attr('src');
      const alt = $(this).find('img').attr('alt') || '';
      $('#jpLightboxImg').attr('src', src).attr('alt', alt);
      $lightbox.css('display', 'flex').hide().fadeIn(200);
      $('body').css('overflow', 'hidden');
    });

    // Tutup lightbox
    $lightbox.on('click', function (e) {
      if ($(e.target).is($lightbox) || $(e.target).closest('#jpLightboxClose').length) {
        $lightbox.fadeOut(200);
        $('body').css('overflow', '');
      }
    });

    // Tutup dengan ESC
    $(document).on('keydown.lightbox', function (e) {
      if (e.key === 'Escape' && $lightbox.is(':visible')) {
        $lightbox.fadeOut(200);
        $('body').css('overflow', '');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 3. STICKY ADD-TO-CART BAR
   * Muncul saat tombol utama scroll keluar view
   * ────────────────────────────────────────── */

  function initStickyCartBar() {
    const $stickyBar = $('.jp-sticky-cart-bar');
    const $mainBtn   = $('#jpMainAddCart');
    if (!$stickyBar.length || !$mainBtn.length) return;

    $(window).on('scroll.stickybar', function () {
      const mainBtnBottom = $mainBtn.offset().top + $mainBtn.outerHeight();
      const scrollTop     = $(window).scrollTop() + $(window).height();

      if ($(window).scrollTop() > mainBtnBottom) {
        $stickyBar.addClass('visible');
      } else {
        $stickyBar.removeClass('visible');
      }
    });

    // Sync add to cart dari sticky bar
    $('#jpStickyAddCart').on('click', function () {
      $('#jpMainAddCart').trigger('click');
    });
  }


  /* ──────────────────────────────────────────
   * 4. PRODUCT DETAIL TABS
   * Deskripsi / Spesifikasi / Ulasan
   * ────────────────────────────────────────── */

  function initDetailTabs() {
    const $tabBtns    = $('.jp-detail-tab-btn');
    const $tabContent = $('.jp-detail-tab-content');
    if (!$tabBtns.length) return;

    $tabBtns.on('click', function () {
      const $btn    = $(this);
      const target  = $btn.data('target');

      $tabBtns.removeClass('active');
      $btn.addClass('active');

      $tabContent.removeClass('active').hide();
      $('#' + target).addClass('active').fadeIn(200);

      // Scroll ke tab jika di mobile
      if ($(window).width() <= 575) {
        const navH = parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--jp-navbar-total') || '100'
        );
        $('html, body').animate(
          { scrollTop: $('.jp-detail-tabs').offset().top - navH - 16 },
          300
        );
      }
    });

    // Review tab: scroll ke form tulis ulasan
    $(document).on('click', '.jp-product-review-count', function () {
      const $reviewTab = $('[data-target="tabReviews"]');
      if ($reviewTab.length) {
        $reviewTab.trigger('click');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 5. REVIEW RATING BARS — ANIMASI
   * Animasi bar fill saat tab ulasan dibuka
   * ────────────────────────────────────────── */

  function initReviewBars() {
    function animateBars() {
      $('.jp-review-bar-fill').each(function () {
        const target = $(this).data('width') || $(this).attr('style')
          .match(/width:\s*(\d+)%/)?.[1] || '0';
        $(this).css('width', '0%').animate({ width: target + '%' }, 800);
      });
    }

    // Animate saat tab ulasan pertama kali dibuka
    let reviewAnimated = false;
    $(document).on('click', '[data-target="tabReviews"]', function () {
      if (!reviewAnimated) {
        setTimeout(animateBars, 200);
        reviewAnimated = true;
      }
    });
  }


  /* ──────────────────────────────────────────
   * 6. QTY STEPPER — PRODUCT PAGE
   * Sync qty ke sticky bar dan tombol utama
   * ────────────────────────────────────────── */

  function initProductQty() {
    const $qtyInput  = $('#jpProductQty');
    const $minusBtn  = $('#jpQtyMinus');
    const $plusBtn   = $('#jpQtyPlus');
    const maxStock   = parseInt($('#jpMainAddCart').data('stock') || '99');
    const minQty     = 1;

    if (!$qtyInput.length) return;

    function updateQtyDisplay(val) {
      $qtyInput.val(val);
      // Sync ke data-qty di tombol cart
      $('#jpMainAddCart, #jpStickyAddCart').attr('data-qty', val);
      // Disable minus jika qty = 1
      $minusBtn.prop('disabled', val <= minQty);
      // Disable plus jika qty = maxStock
      $plusBtn.prop('disabled', val >= maxStock);
    }

    $minusBtn.on('click', function () {
      const cur = parseInt($qtyInput.val()) || 1;
      if (cur > minQty) updateQtyDisplay(cur - 1);
    });

    $plusBtn.on('click', function () {
      const cur = parseInt($qtyInput.val()) || 1;
      if (cur < maxStock) updateQtyDisplay(cur + 1);
    });

    $qtyInput.on('change', function () {
      let val = parseInt($(this).val()) || minQty;
      val     = Math.max(minQty, Math.min(val, maxStock));
      updateQtyDisplay(val);
    });

    // Init
    updateQtyDisplay(parseInt($qtyInput.val()) || 1);
  }


  /* ──────────────────────────────────────────
   * 7. SHARE PRODUK
   * Tombol share native browser / copy link
   * ────────────────────────────────────────── */

  function initProductShare() {
    $(document).on('click', '#jpShareProduct', function () {
      const title = $('.jp-product-title').text().trim();
      const url   = window.location.href;

      if (navigator.share) {
        navigator.share({
          title : title + ' — Jaya PC',
          text  : 'Cek produk ini di Jaya PC!',
          url   : url,
        }).catch(function () {});
      } else {
        // Fallback: copy link
        navigator.clipboard.writeText(url).then(function () {
          if (typeof jpToast === 'function') {
            jpToast.success('Link Disalin!', 'Link produk berhasil disalin ke clipboard.');
          }
        });
      }
    });

    // Share via WhatsApp
    $(document).on('click', '#jpShareWA', function () {
      const title = $('.jp-product-title').text().trim();
      const price = $('.jp-product-price-main').text().trim();
      const url   = window.location.href;
      const msg   = encodeURIComponent(
        'Halo Jaya PC, saya tertarik dengan produk:\n' +
        title + '\nHarga: ' + price + '\n' + url
      );
      window.open('https://wa.me/6281280097479?text=' + msg, '_blank', 'noopener');
    });
  }


  /* ──────────────────────────────────────────
   * 8. REVIEW FORM — STAR RATING INTERAKTIF
   * ────────────────────────────────────────── */

  function initReviewForm() {
    const $stars = $('.jp-review-star-input');
    if (!$stars.length) return;

    $stars.on('mouseenter', function () {
      const val = parseInt($(this).data('value'));
      $stars.each(function (i) {
        $(this).find('i')
          .toggleClass('fa-solid',   i < val)
          .toggleClass('fa-regular', i >= val);
      });
    });

    $stars.on('mouseleave', function () {
      const selected = parseInt($('[name="reviewRating"]:checked').val() || '0');
      $stars.each(function (i) {
        $(this).find('i')
          .toggleClass('fa-solid',   i < selected)
          .toggleClass('fa-regular', i >= selected);
      });
    });

    $stars.on('click', function () {
      const val = $(this).data('value');
      $('[name="reviewRating"]').val(val);
      $stars.each(function (i) {
        $(this).find('i')
          .toggleClass('fa-solid',   i < val)
          .toggleClass('fa-regular', i >= val);
      });
    });

    // Submit review
    $('#jpReviewForm').on('submit', function (e) {
      e.preventDefault();

      const rating  = parseInt($('[name="reviewRating"]').val() || '0');
      const comment = $('#jpReviewComment').val().trim();
      const name    = $('#jpReviewName').val().trim();

      if (!rating) {
        if (typeof jpToast === 'function') {
          jpToast.warning('Pilih Rating', 'Silakan pilih rating bintang terlebih dahulu.');
        }
        return;
      }

      if (!comment || comment.length < 10) {
        if (typeof jpToast === 'function') {
          jpToast.warning('Ulasan Terlalu Pendek', 'Tulis ulasan minimal 10 karakter.');
        }
        return;
      }

      // Simulasi submit
      const $btn = $('#jpReviewSubmitBtn');
      $btn.prop('disabled', true).html(
        '<i class="fa-solid fa-spinner fa-spin me-2"></i>Mengirim...'
      );

      setTimeout(function () {
        $btn.prop('disabled', false).html(
          '<i class="fa-solid fa-paper-plane me-2"></i>Kirim Ulasan'
        );
        if (typeof jpToast === 'function') {
          jpToast.success(
            'Ulasan Terkirim!',
            'Terima kasih ' + (name || 'kamu') + '! Ulasanmu sedang direview.'
          );
        }
        $('#jpReviewForm')[0].reset();
        $('[name="reviewRating"]').val('0');
        $stars.find('i').removeClass('fa-solid').addClass('fa-regular');
      }, 1000);
    });
  }


  /* ──────────────────────────────────────────
   * 9. ADD TO CART — PRODUCT PAGE OVERRIDE
   * Override tombol cart untuk ambil qty dari input
   * ────────────────────────────────────────── */

  function initProductAddToCart() {
    $('#jpMainAddCart').on('click', function () {
      const $btn   = $(this);
      const qty    = parseInt($('#jpProductQty').val()) || 1;

      const product = {
        id    : $btn.data('id')    || '',
        name  : $btn.data('name')  || $('.jp-product-title').text().trim(),
        price : parseFloat($btn.data('price'))  || 0,
        image : $btn.data('image') || $('#jpGalleryMain img').attr('src') || '',
        brand : $btn.data('brand') || $('.jp-product-brand-label').text().trim(),
        qty   : qty,
        maxStock: parseInt($btn.data('stock')) || 99,
      };

      if (!product.id) {
        console.warn('JP Product: data-id tidak ditemukan.');
        return;
      }

      if (typeof jpCart === 'undefined') {
        console.warn('JP Product: jpCart tidak ditemukan.');
        return;
      }

      // Loading state
      const origHtml = $btn.html();
      $btn.prop('disabled', true).html(
        '<i class="fa-solid fa-spinner fa-spin"></i> Menambahkan...'
      );

      setTimeout(function () {
        const success = jpCart.add(product);
        $btn.prop('disabled', false);

        if (success) {
          $btn.html('<i class="fa-solid fa-check"></i> Ditambahkan!');
          $btn.css('background-color', 'var(--jp-success)');
          setTimeout(function () {
            $btn.html(origHtml).css('background-color', '');
          }, 2000);
        } else {
          $btn.html(origHtml);
        }
      }, 400);
    });
  }


  /* ──────────────────────────────────────────
   * 10. BELI SEKARANG — LANGSUNG KE CHECKOUT
   * ────────────────────────────────────────── */

  function initBuyNow() {
    $('#jpBuyNow').on('click', function () {
      const $addBtn = $('#jpMainAddCart');
      const product = {
        id    : $addBtn.data('id')    || '',
        name  : $addBtn.data('name')  || $('.jp-product-title').text().trim(),
        price : parseFloat($addBtn.data('price')) || 0,
        image : $addBtn.data('image') || $('#jpGalleryMain img').attr('src') || '',
        brand : $addBtn.data('brand') || $('.jp-product-brand-label').text().trim(),
        qty   : parseInt($('#jpProductQty').val()) || 1,
      };

      if (!product.id || typeof jpCart === 'undefined') return;

      jpCart.add(product);

      // Langsung redirect ke cart
      setTimeout(function () {
        window.location.href = 'cart.html';
      }, 300);
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * Hanya aktif di halaman yang punya .jp-product-detail-wrap
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    if (!$('.jp-product-detail-wrap, #jpGalleryMain').length) return;

    initGallery();
    initGalleryZoom();
    initStickyCartBar();
    initDetailTabs();
    initReviewBars();
    initProductQty();
    initProductShare();
    initReviewForm();
    initProductAddToCart();
    initBuyNow();
  });

})(jQuery);
