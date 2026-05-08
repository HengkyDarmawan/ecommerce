/**
 * ============================================================
 * JAYA PC — PAGES/SHOP.JS
 * Template Version : 1.0.0
 * Description      : Script khusus halaman shop/listing.
 *                    Init filter dari URL, toolbar sort,
 *                    view toggle, URL query parsing,
 *                    load more / pagination, dan
 *                    breadcrumb dinamis dari query string.
 * Stack            : jQuery 3.7.x
 * Dependency       : product-filter.js, cart.js, wishlist.js,
 *                    toast.js, main.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    perPage      : 12,          // produk per halaman
    animDuration : 200,         // ms animasi filter
    searchParam  : 'q',         // query string pencarian
    catParam     : 'cat',       // query string kategori
    filterParam  : 'filter',    // query string filter spesial
  };

  /* Mapping kategori → label display */
  const CAT_LABELS = {
    gpu         : 'Graphics Card',
    cpu         : 'Processor',
    ram         : 'RAM DDR4 & DDR5',
    storage     : 'Storage SSD & HDD',
    motherboard : 'Motherboard',
    cooling     : 'CPU Cooler',
    psu         : 'Power Supply',
    case        : 'PC Case',
    monitor     : 'Monitor',
    aio         : 'All-in-One PC',
    workstation : 'PC Workstation',
    networking  : 'Networking',
    cctv        : 'CCTV Camera',
    software    : 'Software & Lisensi',
    aksesoris   : 'Aksesoris Gaming',
    prebuilt    : 'Pre-Built PC',
    'gaming-pc' : 'Gaming Point (Rakitan)',
    fullset     : 'PC Fullset + Monitor',
  };


  /* ──────────────────────────────────────────
   * 1. BACA QUERY STRING & UPDATE UI
   * Set judul halaman, breadcrumb, chip aktif
   * ────────────────────────────────────────── */

  function initFromQueryString() {
    const params  = new URLSearchParams(window.location.search);
    const query   = params.get(CFG.searchParam) || '';
    const cat     = params.get(CFG.catParam)    || '';
    const filter  = params.get(CFG.filterParam) || '';

    // Update page title
    if (query) {
      const $title = $('.jp-shop-page-title');
      if ($title.length) {
        $title.html('Hasil Pencarian: <span class="text-primary">"' + query + '"</span>');
      }
      // Update input pencarian di halaman
      $('#jpShopSearch').val(query);
    }

    if (cat && CAT_LABELS[cat]) {
      const $title = $('.jp-shop-page-title');
      if ($title.length) {
        $title.text(CAT_LABELS[cat]);
      }
      updateBreadcrumb(CAT_LABELS[cat]);
    }

    if (filter === 'sale') {
      const $title = $('.jp-shop-page-title');
      if ($title.length) {
        $title.html('<i class="fa-solid fa-fire text-danger"></i> On Sale — Diskon Spesial');
      }
    }

    // Aktifkan chip kategori yang sesuai
    if (cat) {
      $(`.jp-shop-cat-chip[href*="cat=${cat}"]`).addClass('active');
    }

    // Update count hasil saat pertama load
    updateResultCount();
  }


  /* ──────────────────────────────────────────
   * 2. UPDATE BREADCRUMB DINAMIS
   * ────────────────────────────────────────── */

  function updateBreadcrumb(label) {
    const $bc = $('.jp-breadcrumb-list');
    if (!$bc.length) return;

    // Hapus item terakhir jika bukan Home
    const $last = $bc.find('.jp-breadcrumb-item:last-child');
    if ($last.text().trim() !== 'Home' && $last.text().trim() !== 'Beranda') {
      $last.remove();
    }

    // Tambah item baru
    $bc.append(`
      <li class="jp-breadcrumb-item active" aria-current="page">
        ${label}
      </li>
    `);
  }


  /* ──────────────────────────────────────────
   * 3. UPDATE JUMLAH HASIL
   * ────────────────────────────────────────── */

  function updateResultCount() {
    const total   = $('.jp-product-card-wrap:visible').length;
    const $count  = $('[data-filter-count]');
    $count.text(total + ' produk');
  }


  /* ──────────────────────────────────────────
   * 4. FILTER ANIMASI — SEBELUM & SESUDAH
   * ────────────────────────────────────────── */

  function initFilterAnimation() {
    // Intercept apply filter dari product-filter.js
    // dengan hook pada event jp:filter:applied
    $(window).on('jp:filter:applied', function () {
      updateResultCount();
    });

    // Animasi card saat filter berubah
    $(document).on('change', '.jp-filter-checkbox, [name="jp-filter-rating"]', function () {
      const $cards = $('.jp-product-card-wrap');
      $cards.css({ opacity: 0.5, transition: 'opacity 150ms ease' });
      setTimeout(function () {
        $cards.css({ opacity: '', transition: '' });
      }, 300);
    });
  }


  /* ──────────────────────────────────────────
   * 5. SORT SELECT — SYNC DENGAN FILTER
   * ────────────────────────────────────────── */

  function initSortSelect() {
    const $select = $('#jpSortSelect');
    if (!$select.length) return;

    // Baca sort dari URL
    const params = new URLSearchParams(window.location.search);
    const sort   = params.get('sort') || 'terbaru';
    $select.val(sort);

    // Delegasikan ke product-filter.js via jpFilter.sort()
    $select.on('change', function () {
      const val = $(this).val();
      if (window.jpFilter) {
        window.jpFilter.sort(val);
      }
    });
  }


  /* ──────────────────────────────────────────
   * 6. VIEW TOGGLE — GRID / LIST
   * ────────────────────────────────────────── */

  function initViewToggle() {
    const $grid = $('#jpProductGrid');
    const $btns = $('[data-jp-view]');
    if (!$grid.length) return;

    $btns.on('click', function () {
      const view = $(this).data('jp-view');
      $btns.removeClass('active');
      $(this).addClass('active');

      if (view === 'list') {
        $grid.removeClass('jp-product-grid').addClass('jp-product-list');
      } else {
        $grid.removeClass('jp-product-list').addClass('jp-product-grid');
      }

      // Simpan preferensi view ke localStorage
      try {
        localStorage.setItem('jp_preferred_view', view);
      } catch (e) {}
    });

    // Restore view dari localStorage
    try {
      const savedView = localStorage.getItem('jp_preferred_view') || 'grid';
      if (savedView === 'list') {
        $('[data-jp-view="list"]').trigger('click');
      }
    } catch (e) {}
  }


  /* ──────────────────────────────────────────
   * 7. MOBILE FILTER BUTTON — BADGE UPDATE
   * Update badge jumlah filter aktif di tombol
   * ────────────────────────────────────────── */

  function initMobileFilterBadge() {
    function updateBadge() {
      if (!window.jpFilter) return;

      const state = window.jpFilter.state;
      let   count = 0;

      count += state.categories.length;
      count += state.brands.length;
      if (state.priceMin > 0 || state.priceMax < Infinity) count++;
      if (state.rating > 0) count++;

      const $badge = $('.jp-filter-badge');
      if (count > 0) {
        if (!$badge.length) {
          $('#jpMobileFilterBtn').append(
            `<span class="jp-filter-badge">${count}</span>`
          );
        } else {
          $badge.text(count);
        }
      } else {
        $badge.remove();
      }
    }

    // Update setiap kali filter berubah
    $(document).on('change', '.jp-filter-checkbox, [name="jp-filter-rating"], #jpPriceMin, #jpPriceMax',
      function () {
        setTimeout(updateBadge, 450); // tunggu debounce filter
      }
    );

    $(document).on('click', '#jpResetFilter, #jpResetAllFilters, #jpResetFilterEmpty',
      function () {
        setTimeout(updateBadge, 100);
      }
    );

    updateBadge(); // init
  }


  /* ──────────────────────────────────────────
   * 8. SHOP SEARCH — LIVE FILTER
   * Search bar di atas grid memfilter produk
   * ────────────────────────────────────────── */

  function initShopSearch() {
    const $input = $('#jpShopSearch');
    if (!$input.length) return;

    let searchTimer = null;

    $input.on('input', function () {
      const query = $(this).val().trim().toLowerCase();
      clearTimeout(searchTimer);

      searchTimer = setTimeout(function () {
        const $cards = $('.jp-product-card-wrap');

        if (!query) {
          $cards.show();
          updateResultCount();
          return;
        }

        let visible = 0;
        $cards.each(function () {
          const $card    = $(this);
          const name     = ($card.data('name')  || $card.find('.jp-product-card-name').text()).toLowerCase();
          const brand    = ($card.data('brand') || $card.find('.jp-product-card-brand').text()).toLowerCase();
          const category = ($card.data('category') || '').toLowerCase();
          const specs    = $card.find('.jp-spec-chip').map(function () {
            return $(this).text().toLowerCase();
          }).get().join(' ');

          const match = name.includes(query)     ||
                        brand.includes(query)    ||
                        category.includes(query) ||
                        specs.includes(query);

          if (match) {
            $card.show();
            visible++;
          } else {
            $card.hide();
          }
        });

        updateResultCount();

        // Empty state untuk search
        const $empty = $('#jpFilterEmpty');
        if (visible === 0) {
          if (!$empty.length) {
            $('#jpProductGrid').after(`
              <div id="jpFilterEmpty" class="jp-filter-empty text-center py-5">
                <i class="fa-solid fa-magnifying-glass fa-3x text-muted-jp mb-3"></i>
                <h5 class="mb-2">Tidak Ada Hasil</h5>
                <p class="text-muted-jp mb-4">
                  Tidak ditemukan produk untuk "<strong>${query}</strong>"
                </p>
                <button class="jp-btn jp-btn-outline-primary" id="jpClearShopSearch">
                  <i class="fa-solid fa-rotate-left"></i> Hapus Pencarian
                </button>
              </div>
            `);
          } else {
            $empty.show();
          }
        } else {
          $empty.hide();
        }

      }, 300);
    });

    // Tombol hapus pencarian
    $(document).on('click', '#jpClearShopSearch', function () {
      $input.val('').trigger('input').focus();
    });
  }


  /* ──────────────────────────────────────────
   * 9. LOAD MORE / PAGINATION
   * Tombol "Muat Lebih Banyak" atau halaman
   * ────────────────────────────────────────── */

  function initLoadMore() {
    const $btn = $('#jpLoadMore');
    if (!$btn.length) return;

    let page = 1;

    $btn.on('click', function () {
      page++;

      const $spinner = $('<i class="fa-solid fa-spinner fa-spin me-2"></i>');
      $btn.prop('disabled', true).prepend($spinner);

      // Simulasi load produk berikutnya (ganti dengan API call asli)
      setTimeout(function () {
        $spinner.remove();
        $btn.prop('disabled', false);

        // Cek jika tidak ada halaman berikutnya
        const totalPages = parseInt($btn.data('total-pages') || '1');
        if (page >= totalPages) {
          $btn.prop('disabled', true)
              .html('<i class="fa-solid fa-check me-2"></i>Semua produk sudah ditampilkan')
              .css('opacity', '0.6');
        }

        if (typeof jpToast === 'function') {
          jpToast.info('Dimuat', 'Produk halaman ' + page + ' ditampilkan.');
        }

      }, 800);
    });
  }


  /* ──────────────────────────────────────────
   * 10. FILTER ACCORDION — AUTO BUKA
   * Buka section filter yang relevan saat load
   * ────────────────────────────────────────── */

  function initFilterAutoOpen() {
    const params = new URLSearchParams(window.location.search);

    // Buka accordion brand jika ada filter brand
    if (params.get('brand')) {
      const $brandHeader = $('.jp-filter-header[data-target="filterBrand"]');
      if ($brandHeader.length) {
        $brandHeader.next('.jp-filter-body').show();
        $brandHeader.find('.jp-filter-toggle-icon')
          .css('transform', 'rotate(180deg)');
      }
    }

    // Buka accordion harga jika ada filter harga
    if (params.get('min') || params.get('max')) {
      const $priceHeader = $('.jp-filter-header[data-target="filterPrice"]');
      if ($priceHeader.length) {
        $priceHeader.next('.jp-filter-body').show();
        $priceHeader.find('.jp-filter-toggle-icon')
          .css('transform', 'rotate(180deg)');
      }
    }
  }


  /* ──────────────────────────────────────────
   * 11. COMPARE PRODUK (opsional)
   * Checkbox di card untuk komparasi
   * ────────────────────────────────────────── */

  function initProductCompare() {
    const maxCompare  = 3;
    let   compareList = [];

    $(document).on('change', '.jp-compare-checkbox', function () {
      const $cb  = $(this);
      const id   = $cb.val();
      const name = $cb.data('name') || 'Produk';

      if ($cb.is(':checked')) {
        if (compareList.length >= maxCompare) {
          $cb.prop('checked', false);
          if (typeof jpToast === 'function') {
            jpToast.warning(
              'Maksimal ' + maxCompare + ' Produk',
              'Hapus salah satu produk sebelum menambah yang baru.'
            );
          }
          return;
        }
        compareList.push({ id, name });
      } else {
        compareList = compareList.filter(function (p) {
          return p.id !== id;
        });
      }

      updateCompareBar(compareList);
    });

    function updateCompareBar(list) {
      const $bar = $('#jpCompareBar');
      if (!$bar.length) return;

      if (!list.length) {
        $bar.hide();
        return;
      }

      const names = list.map(function (p) { return p.name; }).join(', ');
      $bar.find('.jp-compare-names').text(names);
      $bar.show();

      $bar.find('#jpCompareBtn').toggle(list.length >= 2);
    }

    // Tutup compare bar
    $(document).on('click', '#jpCompareClose', function () {
      compareList = [];
      $('.jp-compare-checkbox').prop('checked', false);
      $('#jpCompareBar').hide();
    });
  }


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * Hanya aktif di halaman yang punya .jp-shop-layout
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    if (!$('.jp-shop-layout, #jpProductGrid').length) return;

    initFromQueryString();
    initFilterAnimation();
    initSortSelect();
    initViewToggle();
    initMobileFilterBadge();
    initShopSearch();
    initLoadMore();
    initFilterAutoOpen();
    initProductCompare();
  });

})(jQuery);
