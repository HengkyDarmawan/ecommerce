/**
 * ============================================================
 * JAYA PC — WISHLIST.JS
 * Template Version : 1.0.0
 * Description      : Manajemen wishlist produk.
 *                    Simpan di localStorage, toggle button,
 *                    sync badge navbar, render halaman wishlist,
 *                    dan move to cart dari wishlist.
 * Stack            : jQuery 3.7.x
 * Dependency       : toast.js, cart.js (load sebelum wishlist.js)
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    storageKey  : 'jp_wishlist',
    wishlistPage: 'wishlist.html',
  };


  /* ──────────────────────────────────────────
   * 1. STORAGE — CRUD
   * ────────────────────────────────────────── */

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(CFG.storageKey)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(CFG.storageKey, JSON.stringify(list));
      $(window).trigger('jp:wishlist:updated', [list]);
    } catch (e) {
      console.warn('JP Wishlist: localStorage tidak tersedia.');
    }
  }

  function isInWishlist(id) {
    return getWishlist().some(function (item) {
      return item.id === id;
    });
  }


  /* ──────────────────────────────────────────
   * 2. TAMBAH KE WISHLIST
   * ────────────────────────────────────────── */

  function addToWishlist(product) {
    const list = getWishlist();

    if (isInWishlist(product.id)) return false;

    list.push({
      id      : product.id,
      name    : product.name,
      price   : product.price,
      image   : product.image   || '',
      brand   : product.brand   || '',
      addedAt : Date.now(),
    });

    saveWishlist(list);
    updateWishlistUI();

    jpToast.success(
      'Ditambahkan ke Wishlist',
      `<strong>${product.name}</strong> disimpan ke wishlist.`
    );

    return true;
  }


  /* ──────────────────────────────────────────
   * 3. HAPUS DARI WISHLIST
   * ────────────────────────────────────────── */

  function removeFromWishlist(id) {
    const list    = getWishlist();
    const index   = list.findIndex(function (i) { return i.id === id; });
    if (index === -1) return false;

    const removed = list.splice(index, 1)[0];
    saveWishlist(list);
    updateWishlistUI();
    updateWishlistButtons();

    jpToast.info('Dihapus dari Wishlist', `${removed.name} dihapus.`);
    return true;
  }


  /* ──────────────────────────────────────────
   * 4. TOGGLE WISHLIST
   * ────────────────────────────────────────── */

  function toggleWishlist(product) {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return false; // sekarang tidak ada di wishlist
    } else {
      addToWishlist(product);
      return true;  // sekarang ada di wishlist
    }
  }


  /* ──────────────────────────────────────────
   * 5. CLEAR WISHLIST
   * ────────────────────────────────────────── */

  function clearWishlist() {
    saveWishlist([]);
    updateWishlistUI();
    updateWishlistButtons();
    jpToast.info('Wishlist Dikosongkan', 'Semua produk telah dihapus dari wishlist.');
  }


  /* ──────────────────────────────────────────
   * 6. UPDATE WISHLIST UI — BADGE
   * ────────────────────────────────────────── */

  function updateWishlistUI() {
    const count = getWishlist().length;

    // Update badge navbar wishlist
    $('.jp-nav-badge[data-wishlist-badge]').each(function () {
      if (count > 0) {
        $(this).text(count > 99 ? '99+' : count).show();
      } else {
        $(this).hide();
      }
    });

    // Update teks count (jika ada)
    $('[data-wishlist-count]').text(count);
  }


  /* ──────────────────────────────────────────
   * 7. UPDATE SEMUA TOMBOL WISHLIST
   * Sinkronisasi state aktif/nonaktif semua tombol
   * ────────────────────────────────────────── */

  function updateWishlistButtons() {
    $('[data-jp-wishlist]').each(function () {
      const $btn = $(this);
      const id   = $btn.data('jp-wishlist');

      if (isInWishlist(id)) {
        $btn.addClass('active').attr('aria-label', 'Hapus dari wishlist');
        $btn.find('i')
          .removeClass('fa-regular')
          .addClass('fa-solid');
      } else {
        $btn.removeClass('active').attr('aria-label', 'Tambah ke wishlist');
        $btn.find('i')
          .removeClass('fa-solid')
          .addClass('fa-regular');
      }
    });
  }


  /* ──────────────────────────────────────────
   * 8. EVENT DELEGATION — TOGGLE BUTTON
   * Tombol [data-jp-wishlist] di seluruh halaman
   * ────────────────────────────────────────── */

  function initWishlistToggle() {
    $(document).on('click', '[data-jp-wishlist]', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const $btn  = $(this);
      const id    = $btn.data('jp-wishlist');

      if (!id) {
        console.warn('JP Wishlist: data-jp-wishlist id tidak ditemukan.');
        return;
      }

      // Ambil data produk dari data attribute tombol
      const product = {
        id    : id,
        name  : $btn.data('name')  || 'Produk',
        price : parseFloat($btn.data('price')) || 0,
        image : $btn.data('image') || '',
        brand : $btn.data('brand') || '',
      };

      // Animasi tombol
      $btn.addClass('jp-wishlist-animating');
      setTimeout(function () {
        $btn.removeClass('jp-wishlist-animating');
      }, 400);

      const added = toggleWishlist(product);

      // Update state tombol ini langsung
      if (added) {
        $btn.addClass('active').attr('aria-label', 'Hapus dari wishlist');
        $btn.find('i')
          .removeClass('fa-regular')
          .addClass('fa-solid');
      } else {
        $btn.removeClass('active').attr('aria-label', 'Tambah ke wishlist');
        $btn.find('i')
          .removeClass('fa-solid')
          .addClass('fa-regular');
      }

      // Update tombol wishlist lain untuk produk yang sama
      $(`[data-jp-wishlist="${id}"]`).not($btn).each(function () {
        if (added) {
          $(this).addClass('active');
          $(this).find('i').removeClass('fa-regular').addClass('fa-solid');
        } else {
          $(this).removeClass('active');
          $(this).find('i').removeClass('fa-solid').addClass('fa-regular');
        }
      });
    });
  }


  /* ──────────────────────────────────────────
   * 9. RENDER HALAMAN WISHLIST
   * Render grid produk di wishlist.html
   * ────────────────────────────────────────── */

  function renderWishlistPage() {
    const $wrap = $('#jpWishlistGrid');
    if (!$wrap.length) return;

    const list = getWishlist();

    if (!list.length) {
      $wrap.html(`
        <div class="col-12 text-center py-5">
          <i class="fa-regular fa-heart fa-3x text-muted-jp mb-4"></i>
          <h4 class="jp-section-title" style="font-size: var(--jp-text-xl);">
            Wishlist Masih Kosong
          </h4>
          <p class="text-muted-jp mb-4">
            Simpan produk favorit kamu untuk dibeli nanti.
          </p>
          <a href="shop.html" class="jp-btn jp-btn-primary">
            <i class="fa-solid fa-magnifying-glass"></i> Jelajahi Produk
          </a>
        </div>
      `);
      return;
    }

    let html = '';
    list.forEach(function (item) {
      html += `
        <div class="col-6 col-md-4 col-lg-3" data-wishlist-card="${item.id}">
          <div class="jp-product-card h-100">
            <div class="jp-product-card-img">
              <img src="${item.image || 'assets/images/products/placeholder.webp'}"
                   alt="${item.name}" loading="lazy">
              <div class="jp-product-card-badges"></div>
              <button class="jp-product-card-wishlist active"
                data-jp-wishlist="${item.id}"
                data-name="${item.name}"
                data-price="${item.price}"
                data-image="${item.image}"
                data-brand="${item.brand}"
                aria-label="Hapus dari wishlist">
                <i class="fa-solid fa-heart"></i>
              </button>
            </div>
            <div class="jp-product-card-body">
              <span class="jp-product-card-brand">${item.brand}</span>
              <h3 class="jp-product-card-name">
                <a href="product-detail.html?id=${item.id}">${item.name}</a>
              </h3>
              <div class="jp-product-card-price">
                <div class="jp-price jp-price-sale">
                  ${window.jpCart ? window.jpCart.formatPrice(item.price) : 'Rp ' + item.price.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
            <div class="jp-product-card-footer">
              <button class="jp-btn jp-btn-outline-primary jp-btn-sm"
                data-jp-move-to-cart="${item.id}"
                data-name="${item.name}"
                data-price="${item.price}"
                data-image="${item.image}"
                data-brand="${item.brand}">
                <i class="fa-solid fa-cart-plus"></i> Beli Sekarang
              </button>
              <button class="jp-btn jp-btn-ghost jp-btn-sm jp-btn-icon"
                data-jp-remove-wishlist="${item.id}"
                aria-label="Hapus dari wishlist">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    $wrap.html(html);

    // Update tombol setelah render
    updateWishlistButtons();
  }


  /* ──────────────────────────────────────────
   * 10. MOVE TO CART — DARI HALAMAN WISHLIST
   * ────────────────────────────────────────── */

  function initMoveToCart() {
    $(document).on('click', '[data-jp-move-to-cart]', function (e) {
      e.preventDefault();
      const $btn = $(this);

      const product = {
        id    : $btn.data('jp-move-to-cart'),
        name  : $btn.data('name')  || 'Produk',
        price : parseFloat($btn.data('price')) || 0,
        image : $btn.data('image') || '',
        brand : $btn.data('brand') || '',
        qty   : 1,
      };

      if (!product.id) return;

      // Tambah ke cart
      if (window.jpCart) {
        window.jpCart.add(product);
      }

      // Hapus dari wishlist
      removeFromWishlist(product.id);

      // Hapus card dari grid wishlist
      $(`[data-wishlist-card="${product.id}"]`).fadeOut(300, function () {
        $(this).remove();
        // Cek jika wishlist kosong
        if (!getWishlist().length) renderWishlistPage();
      });
    });
  }


  /* ──────────────────────────────────────────
   * 11. HAPUS DARI HALAMAN WISHLIST
   * ────────────────────────────────────────── */

  function initRemoveFromWishlistPage() {
    $(document).on('click', '[data-jp-remove-wishlist]', function (e) {
      e.preventDefault();
      const id   = $(this).data('jp-remove-wishlist');
      if (!id) return;

      removeFromWishlist(id);

      $(`[data-wishlist-card="${id}"]`).fadeOut(300, function () {
        $(this).remove();
        if (!getWishlist().length) renderWishlistPage();
      });
    });
  }


  /* ──────────────────────────────────────────
   * 12. SYNC ANTAR TAB
   * ────────────────────────────────────────── */

  function initStorageSync() {
    $(window).on('storage', function (e) {
      if (e.originalEvent.key === CFG.storageKey) {
        updateWishlistUI();
        updateWishlistButtons();
      }
    });
  }


  /* ──────────────────────────────────────────
   * 13. PUBLIC API
   * ────────────────────────────────────────── */

  window.jpWishlist = {
    add     : addToWishlist,
    remove  : removeFromWishlist,
    toggle  : toggleWishlist,
    clear   : clearWishlist,
    get     : getWishlist,
    has     : isInWishlist,
    refresh : function () {
      updateWishlistUI();
      updateWishlistButtons();
    },
  };


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initWishlistToggle();
    initMoveToCart();
    initRemoveFromWishlistPage();
    initStorageSync();

    // Init dari data storage yang sudah ada
    updateWishlistUI();
    updateWishlistButtons();

    // Render halaman wishlist jika sedang di sana
    renderWishlistPage();
  });

})(jQuery);
