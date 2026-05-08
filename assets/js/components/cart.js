/**
 * ============================================================
 * JAYA PC — CART.JS
 * Template Version : 1.0.0
 * Description      : Manajemen keranjang belanja.
 *                    Simpan di localStorage, sync antar tab,
 *                    update badge, mini cart dropdown,
 *                    dan integrasi toast notifikasi.
 * Stack            : jQuery 3.7.x
 * Dependency       : toast.js (load sebelum cart.js)
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    storageKey  : 'jp_cart',          // key localStorage
    maxQty      : 99,                 // max qty per item
    minQty      : 1,                  // min qty per item
    currency    : 'Rp',               // prefix mata uang
    cartPage    : 'cart.html',        // halaman cart
    checkoutPage: 'checkout.html',    // halaman checkout
  };


  /* ──────────────────────────────────────────
   * 1. CART STORAGE — CRUD
   * ────────────────────────────────────────── */

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CFG.storageKey)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CFG.storageKey, JSON.stringify(cart));
      // Dispatch event agar tab lain bisa sync
      $(window).trigger('jp:cart:updated', [cart]);
    } catch (e) {
      console.warn('JP Cart: localStorage tidak tersedia.');
    }
  }

  function getCartItem(id) {
    return getCart().find(function (item) {
      return item.id === id;
    });
  }


  /* ──────────────────────────────────────────
   * 2. TAMBAH ITEM KE CART
   * ────────────────────────────────────────── */

  function addToCart(product) {
    /**
     * product = {
     *   id       : string,
     *   name     : string,
     *   price    : number,
     *   image    : string,
     *   brand    : string,
     *   qty      : number (opsional, default 1)
     *   maxStock : number (opsional)
     * }
     */
    const cart    = getCart();
    const qty     = parseInt(product.qty) || 1;
    const existing = cart.find(function (i) { return i.id === product.id; });

    if (existing) {
      const newQty = existing.qty + qty;

      if (product.maxStock && newQty > product.maxStock) {
        jpToast.warning('Stok Terbatas', `Maksimal ${product.maxStock} unit untuk produk ini.`);
        return false;
      }

      existing.qty = Math.min(newQty, CFG.maxQty);
    } else {
      cart.push({
        id       : product.id,
        name     : product.name,
        price    : product.price,
        image    : product.image    || '',
        brand    : product.brand    || '',
        qty      : Math.min(qty, CFG.maxQty),
        maxStock : product.maxStock || CFG.maxQty,
        addedAt  : Date.now(),
      });
    }

    saveCart(cart);
    updateCartUI();

    jpToast.success(
      'Ditambahkan ke Keranjang',
      `<strong>${product.name}</strong> berhasil ditambahkan.`
    );

    return true;
  }


  /* ──────────────────────────────────────────
   * 3. HAPUS ITEM DARI CART
   * ────────────────────────────────────────── */

  function removeFromCart(id) {
    const cart    = getCart();
    const index   = cart.findIndex(function (i) { return i.id === id; });

    if (index === -1) return false;

    const removed = cart.splice(index, 1)[0];
    saveCart(cart);
    updateCartUI();
    renderMiniCart();

    jpToast.info('Dihapus', `${removed.name} dihapus dari keranjang.`);
    return true;
  }


  /* ──────────────────────────────────────────
   * 4. UPDATE QUANTITY
   * ────────────────────────────────────────── */

  function updateQty(id, qty) {
    const cart    = getCart();
    const item    = cart.find(function (i) { return i.id === id; });
    if (!item) return false;

    const newQty = Math.max(CFG.minQty, Math.min(parseInt(qty) || 1, item.maxStock || CFG.maxQty));

    if (newQty === item.qty) return false;

    item.qty = newQty;
    saveCart(cart);
    updateCartUI();
    renderMiniCart();

    return true;
  }


  /* ──────────────────────────────────────────
   * 5. CLEAR CART
   * ────────────────────────────────────────── */

  function clearCart() {
    saveCart([]);
    updateCartUI();
    renderMiniCart();
    jpToast.info('Keranjang Dikosongkan', 'Semua produk telah dihapus.');
  }


  /* ──────────────────────────────────────────
   * 6. KALKULASI
   * ────────────────────────────────────────── */

  function getCartCount() {
    return getCart().reduce(function (acc, item) {
      return acc + item.qty;
    }, 0);
  }

  function getCartSubtotal() {
    return getCart().reduce(function (acc, item) {
      return acc + (item.price * item.qty);
    }, 0);
  }

  function formatPrice(number) {
    return CFG.currency + ' ' + number.toLocaleString('id-ID');
  }


  /* ──────────────────────────────────────────
   * 7. UPDATE CART UI — BADGE & COUNT
   * ────────────────────────────────────────── */

  function updateCartUI() {
    const count = getCartCount();

    // Update semua badge keranjang
    $('.jp-nav-badge[data-cart-badge]').each(function () {
      if (count > 0) {
        $(this).text(count > 99 ? '99+' : count).show();
      } else {
        $(this).hide();
      }
    });

    // Update teks jumlah item (jika ada)
    $('[data-cart-count]').text(count);

    // Update subtotal (jika ada di header/mini cart)
    $('[data-cart-subtotal]').text(formatPrice(getCartSubtotal()));

    // Animasi bounce badge
    const $badge = $('.jp-nav-badge[data-cart-badge]');
    $badge.addClass('jp-badge-bounce');
    setTimeout(function () { $badge.removeClass('jp-badge-bounce'); }, 400);
  }


  /* ──────────────────────────────────────────
   * 8. MINI CART DROPDOWN
   * Render konten mini cart di navbar
   * ────────────────────────────────────────── */

  function renderMiniCart() {
    const $miniCart = $('#jpMiniCart');
    if (!$miniCart.length) return;

    const cart = getCart();
    const $body = $miniCart.find('.jp-mini-cart-body');

    if (!cart.length) {
      $body.html(`
        <div class="jp-mini-cart-empty text-center py-4">
          <i class="fa-solid fa-cart-shopping fa-2x text-muted-jp mb-3"></i>
          <p class="mb-0 text-muted-jp">Keranjang masih kosong</p>
        </div>
      `);
      $miniCart.find('.jp-mini-cart-footer').hide();
      return;
    }

    let html = '';
    cart.forEach(function (item) {
      html += `
        <div class="jp-mini-cart-item" data-id="${item.id}">
          <div class="jp-mini-cart-img">
            <img src="${item.image || 'assets/images/products/placeholder.webp'}"
                 alt="${item.name}" loading="lazy">
          </div>
          <div class="jp-mini-cart-info">
            <p class="jp-mini-cart-name">${item.name}</p>
            <p class="jp-mini-cart-brand">${item.brand}</p>
            <div class="jp-mini-cart-price-row">
              <span class="jp-price jp-price-sale">${formatPrice(item.price)}</span>
              <span class="jp-mini-cart-qty">× ${item.qty}</span>
            </div>
          </div>
          <button class="jp-mini-cart-remove" data-id="${item.id}"
                  aria-label="Hapus ${item.name}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
    });

    $body.html(html);

    // Update subtotal footer
    $miniCart.find('[data-mini-subtotal]').text(formatPrice(getCartSubtotal()));
    $miniCart.find('[data-mini-count]').text(getCartCount() + ' item');
    $miniCart.find('.jp-mini-cart-footer').show();

    // Hapus item dari mini cart
    $body.find('.jp-mini-cart-remove').on('click', function (e) {
      e.stopPropagation();
      removeFromCart($(this).data('id'));
    });
  }


  /* ──────────────────────────────────────────
   * 9. EVENT DELEGATION — ADD TO CART BUTTONS
   * Tombol [data-jp-add-cart] di seluruh halaman
   * ────────────────────────────────────────── */

  function initAddToCartButtons() {
    $(document).on('click', '[data-jp-add-cart]', function (e) {
      e.preventDefault();

      const $btn = $(this);

      // Ambil data produk dari data attribute
      const product = {
        id      : $btn.data('id')       || '',
        name    : $btn.data('name')     || 'Produk',
        price   : parseFloat($btn.data('price'))    || 0,
        image   : $btn.data('image')    || '',
        brand   : $btn.data('brand')    || '',
        qty     : parseInt($btn.data('qty')) || 1,
        maxStock: parseInt($btn.data('stock')) || CFG.maxQty,
      };

      if (!product.id) {
        console.warn('JP Cart: data-id tidak ditemukan pada tombol.');
        return;
      }

      // Loading state tombol
      const originalHtml = $btn.html();
      $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>');

      // Simulasi delay network (hapus di production jika API real)
      setTimeout(function () {
        const success = addToCart(product);
        $btn.prop('disabled', false).html(originalHtml);

        if (success) {
          // Animasi icon cart
          $btn.addClass('jp-btn-added');
          setTimeout(function () { $btn.removeClass('jp-btn-added'); }, 1500);
        }
      }, 300);
    });
  }


  /* ──────────────────────────────────────────
   * 10. EVENT DELEGATION — QTY STEPPER
   * Input qty di halaman cart dan product detail
   * ────────────────────────────────────────── */

  function initQtyStepper() {
    // Tombol + / -
    $(document).on('click', '.jp-qty-btn', function () {
      const $btn   = $(this);
      const $input = $btn.closest('.jp-qty-input').find('.jp-qty-value');
      const id     = $btn.closest('[data-cart-item]').data('cart-item');
      const action = $btn.data('action');
      let   val    = parseInt($input.val()) || 1;

      if (action === 'plus')  val = Math.min(val + 1, CFG.maxQty);
      if (action === 'minus') val = Math.max(val - 1, CFG.minQty);

      $input.val(val);

      // Jika ada id cart item, update cart
      if (id) updateQty(id, val);
    });

    // Input manual
    $(document).on('change', '.jp-qty-value', function () {
      const $input = $(this);
      const id     = $input.closest('[data-cart-item]').data('cart-item');
      let   val    = parseInt($input.val()) || CFG.minQty;

      val = Math.max(CFG.minQty, Math.min(val, CFG.maxQty));
      $input.val(val);

      if (id) updateQty(id, val);
    });
  }


  /* ──────────────────────────────────────────
   * 11. EVENT DELEGATION — REMOVE FROM CART
   * Tombol [data-jp-remove-cart] di halaman cart
   * ────────────────────────────────────────── */

  function initRemoveButtons() {
    $(document).on('click', '[data-jp-remove-cart]', function (e) {
      e.preventDefault();
      const id = $(this).data('jp-remove-cart');
      if (!id) return;

      // Konfirmasi singkat via animasi sebelum hapus
      const $row = $(this).closest('[data-cart-item]');
      $row.css({ opacity: 0.4, 'pointer-events': 'none' });

      setTimeout(function () {
        removeFromCart(id);
        $row.remove();
      }, 200);
    });
  }


  /* ──────────────────────────────────────────
   * 12. CLEAR CART BUTTON
   * ────────────────────────────────────────── */

  function initClearCartButton() {
    $(document).on('click', '[data-jp-clear-cart]', function (e) {
      e.preventDefault();
      if (confirm('Kosongkan semua keranjang?')) {
        clearCart();
        // Reload halaman cart jika sedang di sana
        if (window.location.pathname.includes(CFG.cartPage)) {
          location.reload();
        }
      }
    });
  }


  /* ──────────────────────────────────────────
   * 13. SYNC ANTAR TAB (storage event)
   * ────────────────────────────────────────── */

  function initStorageSync() {
    $(window).on('storage', function (e) {
      if (e.originalEvent.key === CFG.storageKey) {
        updateCartUI();
        renderMiniCart();
      }
    });
  }


  /* ──────────────────────────────────────────
   * 14. PUBLIC API
   * Expose fungsi untuk dipakai file JS lain
   * ────────────────────────────────────────── */

  window.jpCart = {
    add       : addToCart,
    remove    : removeFromCart,
    updateQty : updateQty,
    clear     : clearCart,
    get       : getCart,
    getItem   : getCartItem,
    getCount  : getCartCount,
    getSubtotal: getCartSubtotal,
    formatPrice: formatPrice,
    refresh   : function () {
      updateCartUI();
      renderMiniCart();
    },
  };


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initAddToCartButtons();
    initQtyStepper();
    initRemoveButtons();
    initClearCartButton();
    initStorageSync();

    // Init UI dari data yang sudah ada di storage
    updateCartUI();
    renderMiniCart();
  });

})(jQuery);
