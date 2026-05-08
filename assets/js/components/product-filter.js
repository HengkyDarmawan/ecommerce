/**
 * ============================================================
 * JAYA PC — PRODUCT-FILTER.JS
 * Template Version : 1.0.0
 * Description      : Filter & sort produk di halaman shop.
 *                    Filter sidebar (brand, harga, kategori),
 *                    sort dropdown, toggle grid/list view,
 *                    URL query string sync, dan active filter tags.
 * Stack            : jQuery 3.7.x
 * Dependency       : main.js, toast.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    animDuration  : 200,          // ms durasi animasi filter
    debounce      : 400,          // ms debounce filter harga
    defaultSort   : 'terbaru',    // sort default
    gridClass     : 'jp-product-grid',
    listClass     : 'jp-product-list',
    cardSelector  : '.jp-product-card-wrap',
  };

  /* State filter aktif */
  let state = {
    categories : [],
    brands     : [],
    priceMin   : 0,
    priceMax   : Infinity,
    rating     : 0,
    sort       : CFG.defaultSort,
    view       : 'grid',          // 'grid' | 'list'
    page       : 1,
  };

  let priceDebounce = null;


  /* ──────────────────────────────────────────
   * 1. BACA STATE DARI URL
   * Sync filter dengan query string saat halaman load
   * ────────────────────────────────────────── */

  function readStateFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('cat'))      state.categories = params.get('cat').split(',').filter(Boolean);
    if (params.get('brand'))    state.brands      = params.get('brand').split(',').filter(Boolean);
    if (params.get('min'))      state.priceMin    = parseInt(params.get('min')) || 0;
    if (params.get('max'))      state.priceMax    = parseInt(params.get('max')) || Infinity;
    if (params.get('rating'))   state.rating      = parseInt(params.get('rating')) || 0;
    if (params.get('sort'))     state.sort        = params.get('sort') || CFG.defaultSort;
    if (params.get('view'))     state.view        = params.get('view') || 'grid';
    if (params.get('page'))     state.page        = parseInt(params.get('page')) || 1;
  }


  /* ──────────────────────────────────────────
   * 2. TULIS STATE KE URL
   * Update URL tanpa reload halaman
   * ────────────────────────────────────────── */

  function writeStateToURL() {
    const params = new URLSearchParams();

    if (state.categories.length)         params.set('cat',    state.categories.join(','));
    if (state.brands.length)             params.set('brand',  state.brands.join(','));
    if (state.priceMin > 0)              params.set('min',    state.priceMin);
    if (state.priceMax < Infinity)       params.set('max',    state.priceMax);
    if (state.rating > 0)                params.set('rating', state.rating);
    if (state.sort !== CFG.defaultSort)  params.set('sort',   state.sort);
    if (state.view !== 'grid')           params.set('view',   state.view);
    if (state.page > 1)                  params.set('page',   state.page);

    // Pertahankan query pencarian jika ada
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) params.set('q', q);

    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newURL);
  }


  /* ──────────────────────────────────────────
   * 3. APPLY FILTER KE PRODUK
   * Sembunyikan/tampilkan card sesuai state
   * ────────────────────────────────────────── */

  function applyFilters() {
    const $cards = $(CFG.cardSelector);
    let   visible = 0;

    $cards.each(function () {
      const $card    = $(this);
      const cardCat  = ($card.data('category') || '').toLowerCase();
      const cardBrand= ($card.data('brand')    || '').toLowerCase();
      const cardPrice= parseFloat($card.data('price')) || 0;
      const cardRating = parseFloat($card.data('rating')) || 0;

      let show = true;

      // Filter kategori
      if (state.categories.length) {
        show = show && state.categories.some(function (c) {
          return cardCat === c.toLowerCase();
        });
      }

      // Filter brand
      if (state.brands.length) {
        show = show && state.brands.some(function (b) {
          return cardBrand.includes(b.toLowerCase());
        });
      }

      // Filter harga
      if (state.priceMin > 0)        show = show && cardPrice >= state.priceMin;
      if (state.priceMax < Infinity) show = show && cardPrice <= state.priceMax;

      // Filter rating
      if (state.rating > 0) show = show && cardRating >= state.rating;

      if (show) {
        $card.show();
        visible++;
      } else {
        $card.hide();
      }
    });

    updateResultCount(visible);
    applySort();
    updateActiveFilterTags();
    writeStateToURL();

    // Empty state
    const $emptyState = $('#jpFilterEmpty');
    if (visible === 0) {
      if (!$emptyState.length) {
        $('#jpProductGrid').after(`
          <div id="jpFilterEmpty" class="jp-filter-empty text-center py-5">
            <i class="fa-solid fa-filter-circle-xmark fa-3x text-muted-jp mb-3"></i>
            <h5 class="mb-2">Tidak Ada Produk</h5>
            <p class="text-muted-jp mb-4">Coba ubah atau reset filter pencarian.</p>
            <button class="jp-btn jp-btn-outline-primary" id="jpResetFilterEmpty">
              <i class="fa-solid fa-rotate-left"></i> Reset Filter
            </button>
          </div>
        `);
      } else {
        $emptyState.show();
      }
    } else {
      $emptyState && $emptyState.hide();
    }
  }


  /* ──────────────────────────────────────────
   * 4. SORT PRODUK
   * ────────────────────────────────────────── */

  function applySort() {
    const $grid  = $('#jpProductGrid');
    const $cards = $grid.find(CFG.cardSelector).toArray();

    $cards.sort(function (a, b) {
      const $a = $(a);
      const $b = $(b);

      switch (state.sort) {
        case 'harga-asc':
          return (parseFloat($a.data('price')) || 0) - (parseFloat($b.data('price')) || 0);

        case 'harga-desc':
          return (parseFloat($b.data('price')) || 0) - (parseFloat($a.data('price')) || 0);

        case 'rating':
          return (parseFloat($b.data('rating')) || 0) - (parseFloat($a.data('rating')) || 0);

        case 'populer':
          return (parseInt($b.data('sold')) || 0) - (parseInt($a.data('sold')) || 0);

        case 'terbaru':
        default:
          return (parseInt($b.data('date')) || 0) - (parseInt($a.data('date')) || 0);
      }
    });

    // Re-append dalam urutan baru
    $cards.forEach(function (card) {
      $grid.append(card);
    });
  }


  /* ──────────────────────────────────────────
   * 5. UPDATE JUMLAH HASIL
   * ────────────────────────────────────────── */

  function updateResultCount(count) {
    $('[data-filter-count]').text(count + ' produk');
  }


  /* ──────────────────────────────────────────
   * 6. ACTIVE FILTER TAGS
   * Tampilkan tag filter aktif di atas grid
   * ────────────────────────────────────────── */

  function updateActiveFilterTags() {
    const $tagsWrap = $('#jpActiveFilters');
    if (!$tagsWrap.length) return;

    const tags = [];

    state.categories.forEach(function (c) {
      tags.push({ label: c, type: 'category', value: c });
    });

    state.brands.forEach(function (b) {
      tags.push({ label: b, type: 'brand', value: b });
    });

    if (state.priceMin > 0 || state.priceMax < Infinity) {
      const min = state.priceMin > 0 ? 'Rp ' + state.priceMin.toLocaleString('id-ID') : '0';
      const max = state.priceMax < Infinity ? 'Rp ' + state.priceMax.toLocaleString('id-ID') : '∞';
      tags.push({ label: min + ' – ' + max, type: 'price', value: 'price' });
    }

    if (state.rating > 0) {
      tags.push({ label: state.rating + '★ ke atas', type: 'rating', value: state.rating });
    }

    if (!tags.length) {
      $tagsWrap.hide().empty();
      return;
    }

    let html = '<div class="jp-active-filter-list">';
    tags.forEach(function (tag) {
      html += `
        <span class="jp-active-filter-tag" data-type="${tag.type}" data-value="${tag.value}">
          ${tag.label}
          <button type="button" aria-label="Hapus filter ${tag.label}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </span>
      `;
    });
    html += `
      <button class="jp-btn jp-btn-ghost jp-btn-sm" id="jpResetAllFilters">
        <i class="fa-solid fa-rotate-left"></i> Reset Semua
      </button>
    </div>`;

    $tagsWrap.html(html).show();

    // Hapus satu filter dari tag
    $tagsWrap.find('.jp-active-filter-tag button').on('click', function () {
      const $tag = $(this).closest('.jp-active-filter-tag');
      const type = $tag.data('type');
      const val  = String($tag.data('value'));

      if (type === 'category') {
        state.categories = state.categories.filter(function (c) { return c !== val; });
        $(`.jp-filter-checkbox[data-type="category"][value="${val}"]`).prop('checked', false);
      }
      if (type === 'brand') {
        state.brands = state.brands.filter(function (b) { return b !== val; });
        $(`.jp-filter-checkbox[data-type="brand"][value="${val}"]`).prop('checked', false);
      }
      if (type === 'price') {
        state.priceMin = 0;
        state.priceMax = Infinity;
        $('#jpPriceMin').val('');
        $('#jpPriceMax').val('');
      }
      if (type === 'rating') {
        state.rating = 0;
        $('[name="jp-filter-rating"]').prop('checked', false);
      }

      applyFilters();
    });
  }


  /* ──────────────────────────────────────────
   * 7. INIT FILTER CHECKBOX
   * Brand, kategori, kondisi, dll
   * ────────────────────────────────────────── */

  function initCheckboxFilters() {
    $(document).on('change', '.jp-filter-checkbox', function () {
      const $cb  = $(this);
      const type = $cb.data('type');
      const val  = $cb.val();

      if (type === 'category') {
        if ($cb.is(':checked')) {
          if (!state.categories.includes(val)) state.categories.push(val);
        } else {
          state.categories = state.categories.filter(function (c) { return c !== val; });
        }
      }

      if (type === 'brand') {
        if ($cb.is(':checked')) {
          if (!state.brands.includes(val)) state.brands.push(val);
        } else {
          state.brands = state.brands.filter(function (b) { return b !== val; });
        }
      }

      state.page = 1;
      applyFilters();
    });
  }


  /* ──────────────────────────────────────────
   * 8. INIT FILTER HARGA
   * Input min-max dengan debounce
   * ────────────────────────────────────────── */

  function initPriceFilter() {
    $(document).on('input', '#jpPriceMin, #jpPriceMax', function () {
      clearTimeout(priceDebounce);
      priceDebounce = setTimeout(function () {
        const min = parseInt($('#jpPriceMin').val()) || 0;
        const max = parseInt($('#jpPriceMax').val()) || Infinity;

        state.priceMin = min;
        state.priceMax = max > 0 ? max : Infinity;
        state.page     = 1;

        applyFilters();
      }, CFG.debounce);
    });
  }


  /* ──────────────────────────────────────────
   * 9. INIT FILTER RATING
   * ────────────────────────────────────────── */

  function initRatingFilter() {
    $(document).on('change', '[name="jp-filter-rating"]', function () {
      state.rating = parseInt($(this).val()) || 0;
      state.page   = 1;
      applyFilters();
    });
  }


  /* ──────────────────────────────────────────
   * 10. INIT SORT DROPDOWN
   * ────────────────────────────────────────── */

  function initSortDropdown() {
    $(document).on('change', '#jpSortSelect', function () {
      state.sort = $(this).val() || CFG.defaultSort;
      state.page = 1;
      applyFilters();
    });

    // Sync nilai dropdown dengan state dari URL
    if ($('#jpSortSelect').length) {
      $('#jpSortSelect').val(state.sort);
    }
  }


  /* ──────────────────────────────────────────
   * 11. INIT TOGGLE VIEW — GRID / LIST
   * ────────────────────────────────────────── */

  function initViewToggle() {
    const $grid = $('#jpProductGrid');
    if (!$grid.length) return;

    $(document).on('click', '[data-jp-view]', function () {
      const view = $(this).data('jp-view');
      state.view = view;

      $('[data-jp-view]').removeClass('active');
      $(this).addClass('active');

      if (view === 'list') {
        $grid.removeClass(CFG.gridClass).addClass(CFG.listClass);
      } else {
        $grid.removeClass(CFG.listClass).addClass(CFG.gridClass);
      }

      writeStateToURL();
    });

    // Terapkan view dari URL
    if (state.view === 'list') {
      $('[data-jp-view="list"]').addClass('active');
      $grid.removeClass(CFG.gridClass).addClass(CFG.listClass);
    } else {
      $('[data-jp-view="grid"]').addClass('active');
    }
  }


  /* ──────────────────────────────────────────
   * 12. RESET FILTER
   * ────────────────────────────────────────── */

  function resetFilters() {
    state.categories = [];
    state.brands     = [];
    state.priceMin   = 0;
    state.priceMax   = Infinity;
    state.rating     = 0;
    state.sort       = CFG.defaultSort;
    state.page       = 1;

    // Reset UI
    $('.jp-filter-checkbox').prop('checked', false);
    $('[name="jp-filter-rating"]').prop('checked', false);
    $('#jpPriceMin').val('');
    $('#jpPriceMax').val('');
    $('#jpSortSelect').val(CFG.defaultSort);

    applyFilters();
  }

  function initResetButtons() {
    $(document).on('click', '#jpResetFilter, #jpResetFilterEmpty, #jpResetAllFilters', function (e) {
      e.preventDefault();
      resetFilters();
    });
  }


  /* ──────────────────────────────────────────
   * 13. SYNC CHECKBOX DENGAN STATE URL
   * ────────────────────────────────────────── */

  function syncCheckboxesWithState() {
    state.categories.forEach(function (c) {
      $(`.jp-filter-checkbox[data-type="category"][value="${c}"]`).prop('checked', true);
    });

    state.brands.forEach(function (b) {
      $(`.jp-filter-checkbox[data-type="brand"][value="${b}"]`).prop('checked', true);
    });

    if (state.priceMin > 0)        $('#jpPriceMin').val(state.priceMin);
    if (state.priceMax < Infinity) $('#jpPriceMax').val(state.priceMax);
    if (state.rating > 0)          $(`[name="jp-filter-rating"][value="${state.rating}"]`).prop('checked', true);
  }


  /* ──────────────────────────────────────────
   * 14. FILTER ACCORDION SIDEBAR
   * Toggle buka/tutup section filter
   * ────────────────────────────────────────── */

  function initFilterAccordion() {
    $(document).on('click', '.jp-filter-header', function () {
      const $header = $(this);
      const $body   = $header.next('.jp-filter-body');
      const $icon   = $header.find('.jp-filter-toggle-icon');
      const isOpen  = $body.is(':visible');

      $body.slideToggle(CFG.animDuration);
      $icon.css('transform', isOpen ? 'rotate(0deg)' : 'rotate(180deg)');
    });
  }


  /* ──────────────────────────────────────────
   * 15. MOBILE FILTER OFFCANVAS
   * Tombol "Filter" di mobile membuka BS5 offcanvas
   * ────────────────────────────────────────── */

  function initMobileFilter() {
    const $btn        = $('#jpMobileFilterBtn');
    const offcanvasEl = document.getElementById('jpFilterOffcanvas');

    if (!$btn.length || !offcanvasEl) return;

    $btn.on('click', function () {
      const instance = new bootstrap.Offcanvas(offcanvasEl);
      instance.show();
    });

    // Terapkan filter dari offcanvas lalu tutup
    $(offcanvasEl).on('click', '#jpApplyMobileFilter', function () {
      const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
      if (instance) instance.hide();
      applyFilters();
    });
  }


  /* ──────────────────────────────────────────
   * 16. PUBLIC API
   * ────────────────────────────────────────── */

  window.jpFilter = {
    apply : applyFilters,
    reset : resetFilters,
    state : state,
    sort  : function (sortKey) {
      state.sort = sortKey;
      applyFilters();
    },
  };


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * Hanya aktif di halaman yang punya #jpProductGrid
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    if (!$('#jpProductGrid').length) return;

    readStateFromURL();
    syncCheckboxesWithState();

    initCheckboxFilters();
    initPriceFilter();
    initRatingFilter();
    initSortDropdown();
    initViewToggle();
    initResetButtons();
    initFilterAccordion();
    initMobileFilter();

    // Apply filter awal dari URL
    applyFilters();
  });

})(jQuery);
