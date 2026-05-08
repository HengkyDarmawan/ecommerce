/**
 * ============================================================
 * JAYA PC — SEARCH.JS
 * Template Version : 1.0.0
 * Description      : Live search dengan autocomplete dropdown.
 *                    Debounce input, highlight keyword,
 *                    riwayat pencarian di localStorage,
 *                    navigasi keyboard, dan overlay mobile.
 * Stack            : jQuery 3.7.x
 * Dependency       : toast.js (opsional), main.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    debounce      : 350,          // ms debounce input
    minChars      : 2,            // min karakter sebelum search
    maxResults    : 8,            // max hasil ditampilkan
    maxHistory    : 6,            // max riwayat disimpan
    historyKey    : 'jp_search_history',
    searchPage    : 'shop.html',  // halaman hasil pencarian
    searchParam   : 'q',          // query string parameter
    apiEndpoint   : null,         // null = pakai data dummy / set URL API
  };

  let debounceTimer = null;
  let activeIndex   = -1;        // index item aktif saat navigasi keyboard


  /* ──────────────────────────────────────────
   * 1. RIWAYAT PENCARIAN
   * ────────────────────────────────────────── */

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(CFG.historyKey)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(query) {
    if (!query || query.length < CFG.minChars) return;

    let history = getHistory();

    // Hapus duplikat (case-insensitive)
    history = history.filter(function (h) {
      return h.toLowerCase() !== query.toLowerCase();
    });

    // Tambah di awal
    history.unshift(query);

    // Batasi jumlah
    history = history.slice(0, CFG.maxHistory);

    try {
      localStorage.setItem(CFG.historyKey, JSON.stringify(history));
    } catch (e) {}
  }

  function clearHistory() {
    try {
      localStorage.removeItem(CFG.historyKey);
    } catch (e) {}
  }


  /* ──────────────────────────────────────────
   * 2. BUILD DROPDOWN HTML
   * ────────────────────────────────────────── */

  function buildResultItem(item, query) {
    const highlighted = highlightKeyword(item.name, query);
    const price       = item.price
      ? '<span class="jp-search-price jp-price-sale">Rp ' + item.price.toLocaleString('id-ID') + '</span>'
      : '';

    return `
      <a href="${item.url || CFG.searchPage + '?id=' + item.id}"
         class="jp-search-item"
         data-index="${item._index || 0}">
        <div class="jp-search-item-img">
          <img src="${item.image || 'assets/images/products/placeholder.webp'}"
               alt="${item.name}" loading="lazy">
        </div>
        <div class="jp-search-item-info">
          <span class="jp-search-item-brand">${item.brand || ''}</span>
          <span class="jp-search-item-name">${highlighted}</span>
          ${price}
        </div>
        ${item.badge ? `<span class="jp-badge jp-badge-${item.badge.type}">${item.badge.label}</span>` : ''}
      </a>
    `;
  }

  function buildHistoryItem(query) {
    return `
      <button class="jp-search-history-item" type="button" data-query="${query}">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>${query}</span>
      </button>
    `;
  }

  function buildCategoryItem(cat) {
    return `
      <a href="${cat.url}" class="jp-search-category-item">
        <i class="fa-solid ${cat.icon}"></i>
        <span>${cat.name}</span>
        <span class="jp-search-cat-count">${cat.count} produk</span>
      </a>
    `;
  }

  /* Highlight keyword dalam teks */
  function highlightKeyword(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<mark class="jp-search-highlight">$1</mark>');
  }


  /* ──────────────────────────────────────────
   * 3. FETCH / SIMULATE HASIL PENCARIAN
   * ────────────────────────────────────────── */

  function fetchResults(query, callback) {
    if (CFG.apiEndpoint) {
      // Mode API real
      $.ajax({
        url      : CFG.apiEndpoint,
        data     : { q: query, limit: CFG.maxResults },
        dataType : 'json',
        success  : callback,
        error    : function () { callback([]); },
      });
    } else {
      // Mode demo — kembalikan data dummy sesuai query
      const dummyData = [
        { id: '1', name: 'RTX 4090 24GB GDDR6X',          brand: 'NVIDIA GeForce', price: 22500000, image: '', badge: { type: 'flagship', label: 'FLAGSHIP' } },
        { id: '2', name: 'RTX 4080 Super 16GB OC',        brand: 'NVIDIA GeForce', price: 14500000, image: '', badge: { type: 'sale',     label: 'SALE -8%'  } },
        { id: '3', name: 'Ryzen 9 9950X',                 brand: 'AMD',            price: 11200000, image: '', badge: { type: 'new',      label: 'TERBARU'   } },
        { id: '4', name: 'Core i9-14900K',                brand: 'Intel',          price: 8900000,  image: '', badge: null },
        { id: '5', name: 'ROG STRIX X670E-E Gaming WiFi', brand: 'ASUS ROG',       price: 5800000,  image: '', badge: null },
        { id: '6', name: 'DDR5 32GB 6000MHz G.Skill',     brand: 'G.Skill',        price: 2100000,  image: '', badge: null },
        { id: '7', name: 'Samsung 990 Pro 2TB NVMe',      brand: 'Samsung',        price: 3200000,  image: '', badge: null },
        { id: '8', name: 'Corsair RM1000x 1000W Gold',    brand: 'Corsair',        price: 2800000,  image: '', badge: null },
        { id: '9', name: 'Noctua NH-D15 CPU Cooler',      brand: 'Noctua',         price: 1450000,  image: '', badge: null },
        { id: '10', name: 'Lian Li PC-O11 Dynamic EVO',   brand: 'Lian Li',        price: 1900000,  image: '', badge: null },
      ];

      const q       = query.toLowerCase();
      const results = dummyData
        .filter(function (item) {
          return item.name.toLowerCase().includes(q) ||
                 item.brand.toLowerCase().includes(q);
        })
        .slice(0, CFG.maxResults)
        .map(function (item, i) {
          item._index = i;
          return item;
        });

      // Simulasi delay API
      setTimeout(function () { callback(results); }, 150);
    }
  }


  /* ──────────────────────────────────────────
   * 4. RENDER DROPDOWN
   * ────────────────────────────────────────── */

  function renderDropdown($input, results, query) {
    const $wrap    = $input.closest('.jp-search-wrap');
    let   $dropdown = $wrap.find('.jp-search-dropdown');

    if (!$dropdown.length) {
      $dropdown = $('<div class="jp-search-dropdown"></div>');
      $wrap.append($dropdown);
    }

    $dropdown.empty();
    activeIndex = -1;

    if (!query || query.length < CFG.minChars) {
      // Tampilkan riwayat & kategori populer
      const history = getHistory();

      if (history.length) {
        let historyHtml = `
          <div class="jp-search-section">
            <div class="jp-search-section-header">
              <span>Pencarian Terakhir</span>
              <button class="jp-search-clear-history" type="button">Hapus</button>
            </div>
        `;
        history.forEach(function (h) { historyHtml += buildHistoryItem(h); });
        historyHtml += '</div>';
        $dropdown.append(historyHtml);
      }

      // Kategori populer
      const categories = [
        { name: 'Graphics Card', icon: 'fa-microchip',    count: '120+', url: 'shop.html?cat=gpu'         },
        { name: 'Processor',     icon: 'fa-cpu',          count: '80+',  url: 'shop.html?cat=cpu'         },
        { name: 'RAM DDR5',      icon: 'fa-memory',       count: '45+',  url: 'shop.html?cat=ram'         },
        { name: 'SSD NVMe',      icon: 'fa-hard-drive',   count: '60+',  url: 'shop.html?cat=storage'     },
        { name: 'Pre-Built PC',  icon: 'fa-desktop',      count: '30+',  url: 'shop.html?cat=prebuilt'    },
      ];

      let catHtml = '<div class="jp-search-section"><div class="jp-search-section-header"><span>Kategori Populer</span></div>';
      categories.forEach(function (cat) { catHtml += buildCategoryItem(cat); });
      catHtml += '</div>';
      $dropdown.append(catHtml);

      showDropdown($dropdown);
      return;
    }

    if (!results.length) {
      $dropdown.html(`
        <div class="jp-search-empty">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>Tidak ada hasil untuk <strong>"${query}"</strong></p>
          <a href="${CFG.searchPage}?${CFG.searchParam}=${encodeURIComponent(query)}"
             class="jp-btn jp-btn-outline-primary jp-btn-sm">
            Cari di Semua Produk
          </a>
        </div>
      `);
      showDropdown($dropdown);
      return;
    }

    // Hasil pencarian
    let html = '<div class="jp-search-section"><div class="jp-search-section-header"><span>Produk</span></div>';
    results.forEach(function (item) { html += buildResultItem(item, query); });
    html += '</div>';

    // Link lihat semua hasil
    html += `
      <a href="${CFG.searchPage}?${CFG.searchParam}=${encodeURIComponent(query)}"
         class="jp-search-see-all">
        <i class="fa-solid fa-search"></i>
        Lihat semua hasil untuk "<strong>${query}</strong>"
      </a>
    `;

    $dropdown.html(html);
    showDropdown($dropdown);
  }

  function showDropdown($dropdown) {
    $dropdown.addClass('active');
  }

  function hideDropdown($dropdown) {
    if ($dropdown) {
      $dropdown.removeClass('active');
    } else {
      $('.jp-search-dropdown').removeClass('active');
    }
    activeIndex = -1;
  }


  /* ──────────────────────────────────────────
   * 5. NAVIGASI KEYBOARD DALAM DROPDOWN
   * ────────────────────────────────────────── */

  function navigateDropdown($input, direction) {
    const $wrap     = $input.closest('.jp-search-wrap');
    const $dropdown = $wrap.find('.jp-search-dropdown');
    const $items    = $dropdown.find('.jp-search-item, .jp-search-history-item, .jp-search-see-all');

    if (!$items.length) return;

    $items.removeClass('jp-search-focused');

    if (direction === 'down') {
      activeIndex = Math.min(activeIndex + 1, $items.length - 1);
    } else {
      activeIndex = Math.max(activeIndex - 1, -1);
    }

    if (activeIndex >= 0) {
      const $active = $items.eq(activeIndex);
      $active.addClass('jp-search-focused');
      $active.get(0).scrollIntoView({ block: 'nearest' });

      // Update input dengan teks item history
      if ($active.hasClass('jp-search-history-item')) {
        $input.val($active.data('query'));
      }
    } else {
      $input.val($input.data('original-query') || $input.val());
    }
  }


  /* ──────────────────────────────────────────
   * 6. INIT SEARCH INPUT
   * ────────────────────────────────────────── */

  function initSearchInput($input) {
    if ($input.data('jp-search-init')) return;
    $input.data('jp-search-init', true);

    const $wrap = $input.closest('.jp-search-wrap');

    /* ── Input — debounce ── */
    $input.on('input.jpsearch', function () {
      const query = $(this).val().trim();
      $input.data('original-query', query);
      activeIndex = -1;

      clearTimeout(debounceTimer);

      if (query.length < CFG.minChars) {
        renderDropdown($input, [], '');
        return;
      }

      // Loading indicator
      const $dropdown = $wrap.find('.jp-search-dropdown');
      if ($dropdown.length) {
        $dropdown.html('<div class="jp-search-loading"><i class="fa-solid fa-spinner fa-spin"></i> Mencari...</div>');
        showDropdown($dropdown);
      }

      debounceTimer = setTimeout(function () {
        fetchResults(query, function (results) {
          renderDropdown($input, results, query);
        });
      }, CFG.debounce);
    });

    /* ── Focus — tampilkan riwayat ── */
    $input.on('focus.jpsearch', function () {
      const query = $(this).val().trim();
      renderDropdown($input, [], query.length >= CFG.minChars ? null : '');

      if (query.length >= CFG.minChars) {
        fetchResults(query, function (results) {
          renderDropdown($input, results, query);
        });
      }
    });

    /* ── Keyboard navigation ── */
    $input.on('keydown.jpsearch', function (e) {
      const $dropdown = $wrap.find('.jp-search-dropdown');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          navigateDropdown($input, 'down');
          break;

        case 'ArrowUp':
          e.preventDefault();
          navigateDropdown($input, 'up');
          break;

        case 'Enter':
          e.preventDefault();
          const $focused = $dropdown.find('.jp-search-focused');

          if ($focused.length) {
            if ($focused.hasClass('jp-search-history-item')) {
              const q = $focused.data('query');
              $input.val(q);
              saveHistory(q);
              window.location.href = CFG.searchPage + '?' + CFG.searchParam + '=' + encodeURIComponent(q);
            } else {
              $focused[0].click();
            }
          } else {
            const query = $input.val().trim();
            if (query.length >= CFG.minChars) {
              saveHistory(query);
              window.location.href = CFG.searchPage + '?' + CFG.searchParam + '=' + encodeURIComponent(query);
            }
          }
          break;

        case 'Escape':
          hideDropdown($dropdown);
          $input.blur();
          break;
      }
    });

    /* ── Klik item hasil ── */
    $(document).on('click.jpsearch', '.jp-search-item, .jp-search-see-all', function () {
      const query = $input.val().trim();
      saveHistory(query);
    });

    /* ── Klik item riwayat ── */
    $(document).on('click.jpsearch', '.jp-search-history-item', function () {
      const query = $(this).data('query');
      $input.val(query);
      saveHistory(query);
      window.location.href = CFG.searchPage + '?' + CFG.searchParam + '=' + encodeURIComponent(query);
    });

    /* ── Hapus riwayat ── */
    $(document).on('click.jpsearch', '.jp-search-clear-history', function (e) {
      e.stopPropagation();
      clearHistory();
      renderDropdown($input, [], '');
    });

    /* ── Tutup saat klik di luar ── */
    $(document).on('click.jpsearch', function (e) {
      if (!$(e.target).closest('.jp-search-wrap').length) {
        hideDropdown();
      }
    });
  }


  /* ──────────────────────────────────────────
   * 7. INIT SEMUA SEARCH INPUT DI HALAMAN
   * ────────────────────────────────────────── */

  function initAllSearchInputs() {
    // Search navbar desktop
    $('.jp-navbar-search input').each(function () {
      const $input = $(this);
      const $wrap  = $input.parent();
      if (!$wrap.hasClass('jp-search-wrap')) {
        $wrap.addClass('jp-search-wrap');
      }
      initSearchInput($input);
    });

    // Search di offcanvas mobile
    $('#jpMobileSearch input').each(function () {
      const $input = $(this);
      const $wrap  = $input.parent();
      if (!$wrap.hasClass('jp-search-wrap')) {
        $wrap.addClass('jp-search-wrap');
      }
      initSearchInput($input);
    });

    // Search di halaman shop
    $('#jpShopSearch').each(function () {
      const $input = $(this);
      const $wrap  = $input.parent();
      if (!$wrap.hasClass('jp-search-wrap')) {
        $wrap.addClass('jp-search-wrap');
      }
      initSearchInput($input);
    });
  }


  /* ──────────────────────────────────────────
   * 8. INJECT CSS DROPDOWN (sekali)
   * ────────────────────────────────────────── */

  function injectSearchStyles() {
    if ($('#jp-search-styles').length) return;

    $('<style id="jp-search-styles">')
      .text(`
        .jp-search-wrap { position: relative; }

        .jp-search-dropdown {
          position        : absolute;
          top             : calc(100% + 8px);
          left            : 0;
          right           : 0;
          background      : var(--jp-white);
          border          : var(--jp-border-width) solid var(--jp-border-color);
          border-radius   : var(--jp-radius-xl);
          box-shadow      : var(--jp-shadow-xl);
          z-index         : var(--jp-z-dropdown);
          max-height      : 480px;
          overflow-y      : auto;
          display         : none;
          min-width       : 320px;
        }

        .jp-search-dropdown.active { display: block; }

        .jp-search-section { padding: 12px 0; border-bottom: var(--jp-border-width) solid var(--jp-border-color); }
        .jp-search-section:last-child { border-bottom: none; }

        .jp-search-section-header {
          display         : flex;
          align-items     : center;
          justify-content : space-between;
          padding         : 0 16px 8px;
          font-size       : var(--jp-text-xs);
          font-weight     : var(--jp-fw-semibold);
          color           : var(--jp-gray-400);
          text-transform  : uppercase;
          letter-spacing  : var(--jp-ls-wider);
        }

        .jp-search-clear-history {
          background  : none;
          border      : none;
          font-size   : var(--jp-text-xs);
          color       : var(--jp-primary);
          cursor      : pointer;
          padding     : 0;
          font-weight : var(--jp-fw-medium);
        }

        .jp-search-item {
          display         : flex;
          align-items     : center;
          gap             : 12px;
          padding         : 10px 16px;
          text-decoration : none;
          transition      : background-color var(--jp-transition-fast);
        }

        .jp-search-item:hover,
        .jp-search-item.jp-search-focused {
          background-color: var(--jp-primary-subtle);
        }

        .jp-search-item-img {
          width           : 44px;
          height          : 44px;
          border-radius   : var(--jp-radius-md);
          background      : var(--jp-gray-50);
          border          : var(--jp-border-width) solid var(--jp-border-color);
          overflow        : hidden;
          flex-shrink     : 0;
          display         : flex;
          align-items     : center;
          justify-content : center;
        }

        .jp-search-item-img img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }

        .jp-search-item-info { flex: 1; min-width: 0; }
        .jp-search-item-brand { display: block; font-size: 10px; font-weight: var(--jp-fw-semibold); color: var(--jp-primary); text-transform: uppercase; letter-spacing: var(--jp-ls-wider); }
        .jp-search-item-name  { display: block; font-size: var(--jp-text-sm); font-weight: var(--jp-fw-medium); color: var(--jp-gray-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .jp-search-price      { display: block; font-size: var(--jp-text-sm); font-weight: var(--jp-fw-bold); margin-top: 2px; }

        mark.jp-search-highlight { background: rgba(249,115,22,0.20); color: var(--jp-accent-dark); border-radius: 2px; padding: 0 2px; }

        .jp-search-history-item {
          display      : flex;
          align-items  : center;
          gap          : 10px;
          width        : 100%;
          padding      : 9px 16px;
          background   : none;
          border       : none;
          font-size    : var(--jp-text-sm);
          color        : var(--jp-gray-700);
          cursor       : pointer;
          text-align   : left;
          transition   : background-color var(--jp-transition-fast);
        }

        .jp-search-history-item:hover,
        .jp-search-history-item.jp-search-focused { background-color: var(--jp-primary-subtle); }
        .jp-search-history-item i { color: var(--jp-gray-400); font-size: var(--jp-text-sm); flex-shrink: 0; }

        .jp-search-category-item {
          display         : flex;
          align-items     : center;
          gap             : 10px;
          padding         : 9px 16px;
          text-decoration : none;
          font-size       : var(--jp-text-sm);
          color           : var(--jp-gray-700);
          transition      : background-color var(--jp-transition-fast);
        }

        .jp-search-category-item:hover { background-color: var(--jp-primary-subtle); color: var(--jp-primary); }
        .jp-search-category-item i { color: var(--jp-primary); width: 16px; text-align: center; }
        .jp-search-cat-count { margin-left: auto; font-size: var(--jp-text-xs); color: var(--jp-gray-400); }

        .jp-search-see-all {
          display         : flex;
          align-items     : center;
          gap             : 8px;
          padding         : 12px 16px;
          font-size       : var(--jp-text-sm);
          font-weight     : var(--jp-fw-semibold);
          color           : var(--jp-primary);
          text-decoration : none;
          border-top      : var(--jp-border-width) solid var(--jp-border-color);
          transition      : background-color var(--jp-transition-fast);
        }

        .jp-search-see-all:hover { background-color: var(--jp-primary-subtle); }

        .jp-search-empty {
          padding    : 32px 16px;
          text-align : center;
          color      : var(--jp-gray-500);
        }

        .jp-search-empty i   { font-size: 32px; color: var(--jp-gray-300); margin-bottom: 12px; display: block; }
        .jp-search-empty p   { margin-bottom: 16px; font-size: var(--jp-text-sm); }

        .jp-search-loading {
          padding    : 20px 16px;
          text-align : center;
          font-size  : var(--jp-text-sm);
          color      : var(--jp-gray-500);
        }
      `)
      .appendTo('head');
  }


  /* ──────────────────────────────────────────
   * 9. PUBLIC API
   * ────────────────────────────────────────── */

  window.jpSearch = {
    init        : initSearchInput,
    getHistory  : getHistory,
    clearHistory: clearHistory,
    saveHistory : saveHistory,
  };


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    injectSearchStyles();
    initAllSearchInputs();
  });

})(jQuery);
