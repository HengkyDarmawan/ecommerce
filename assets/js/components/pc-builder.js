/**
 * ============================================================
 * JAYA PC — PC-BUILDER.JS
 * Template Version : 1.0.0
 * Description      : Logic PC Configurator / Rakit PC.
 *                    Step-by-step pilih budget & kebutuhan,
 *                    tampilkan rekomendasi, kalkulasi total,
 *                    pilih komponen manual, dan add semua ke cart.
 * Stack            : jQuery 3.7.x
 * Dependency       : toast.js, cart.js
 * ============================================================
 */

(function ($) {
  'use strict';

  /* ──────────────────────────────────────────
   * ⚙️ CONFIG
   * ────────────────────────────────────────── */

  const CFG = {
    animDuration : 300,
    currency     : 'Rp',
    steps        : ['budget', 'kebutuhan', 'rekomendasi'],
  };

  /* State builder */
  let state = {
    currentStep  : 0,
    budget       : null,   // '3-5jt' | '5-10jt' | '10-20jt' | '20jt+'
    kebutuhan    : null,   // 'gaming' | 'kreator' | 'office' | 'workstation'
    rekomendasi  : null,   // object paket yang dipilih
    components   : {},     // { cpu: {...}, gpu: {...}, ram: {...}, ... }
  };

  /* ──────────────────────────────────────────
   * 1. DATA PAKET REKOMENDASI
   * ────────────────────────────────────────── */

  const PACKAGES = {
    /* ── Gaming ── */
    'gaming-3-5jt': {
      label      : 'Gaming Entry — Rp 3–5 Juta',
      totalPrice : 4200000,
      badge      : { type: 'value', label: 'BEST VALUE' },
      components : {
        cpu  : { id: 'ryzen5-5600',    name: 'AMD Ryzen 5 5600',        price: 1350000,  brand: 'AMD',       image: '' },
        gpu  : { id: 'rx6600-8gb',     name: 'AMD Radeon RX 6600 8GB',  price: 1900000,  brand: 'AMD Radeon',image: '' },
        ram  : { id: 'ddr4-16gb-3200', name: 'RAM DDR4 16GB 3200MHz',   price: 420000,   brand: 'Generic',   image: '' },
        ssd  : { id: 'ssd-256gb',      name: 'SSD NVMe 256GB',          price: 280000,   brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-550w',       name: 'PSU 550W 80+ Bronze',     price: 350000,   brand: 'Corsair',   image: '' },
      },
    },
    'gaming-5-10jt': {
      label      : 'Gaming Mid-Range — Rp 5–10 Juta',
      totalPrice : 7800000,
      badge      : { type: 'hot', label: 'BEST SELLER' },
      components : {
        cpu  : { id: 'ryzen5-7600x',   name: 'AMD Ryzen 5 7600X',         price: 2800000,  brand: 'AMD',       image: '' },
        gpu  : { id: 'rtx4060-8gb',    name: 'NVIDIA RTX 4060 8GB',       price: 3500000,  brand: 'NVIDIA',    image: '' },
        ram  : { id: 'ddr5-16gb-6000', name: 'RAM DDR5 16GB 6000MHz',     price: 850000,   brand: 'G.Skill',   image: '' },
        ssd  : { id: 'ssd-512gb-nvme', name: 'SSD NVMe 512GB Samsung',    price: 650000,   brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-650w-gold',  name: 'PSU 650W 80+ Gold',         price: 750000,   brand: 'Corsair',   image: '' },
        mobo : { id: 'b650-mobo',      name: 'Motherboard B650M',         price: 1200000,  brand: 'ASUS',      image: '' },
      },
    },
    'gaming-10-20jt': {
      label      : 'Gaming High-End — Rp 10–20 Juta',
      totalPrice : 14500000,
      badge      : { type: 'flagship', label: 'FLAGSHIP' },
      components : {
        cpu  : { id: 'ryzen7-7800x3d', name: 'AMD Ryzen 7 7800X3D',       price: 4200000,  brand: 'AMD',       image: '' },
        gpu  : { id: 'rtx4070-12gb',   name: 'NVIDIA RTX 4070 12GB',      price: 6500000,  brand: 'NVIDIA',    image: '' },
        ram  : { id: 'ddr5-32gb-6000', name: 'RAM DDR5 32GB 6000MHz',     price: 1500000,  brand: 'G.Skill',   image: '' },
        ssd  : { id: 'ssd-1tb-nvme',   name: 'SSD NVMe 1TB Samsung 990',  price: 1200000,  brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-750w-gold',  name: 'PSU 750W 80+ Gold',         price: 950000,   brand: 'Seasonic',  image: '' },
        mobo : { id: 'x670e-mobo',     name: 'Motherboard X670E',         price: 2800000,  brand: 'ASUS ROG',  image: '' },
        case : { id: 'case-atx-mid',   name: 'PC Case ATX Mid-Tower',     price: 850000,   brand: 'Lian Li',   image: '' },
      },
    },
    'gaming-20jt+': {
      label      : 'Gaming Extreme — Rp 20 Juta+',
      totalPrice : 28000000,
      badge      : { type: 'new', label: 'ULTRA' },
      components : {
        cpu  : { id: 'ryzen9-9950x',   name: 'AMD Ryzen 9 9950X',         price: 11200000, brand: 'AMD',       image: '' },
        gpu  : { id: 'rtx4090-24gb',   name: 'NVIDIA RTX 4090 24GB',      price: 22500000, brand: 'NVIDIA',    image: '' },
        ram  : { id: 'ddr5-64gb-6400', name: 'RAM DDR5 64GB 6400MHz',     price: 2800000,  brand: 'G.Skill',   image: '' },
        ssd  : { id: 'ssd-2tb-nvme',   name: 'SSD NVMe 2TB Samsung 990P', price: 3200000,  brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-1000w-plat', name: 'PSU 1000W 80+ Platinum',    price: 2500000,  brand: 'Corsair',   image: '' },
        mobo : { id: 'x670e-hero',     name: 'ROG Crosshair X670E Hero',  price: 7200000,  brand: 'ASUS ROG',  image: '' },
        case : { id: 'case-o11d-evo',  name: 'Lian Li PC-O11 Dynamic EVO',price: 1900000,  brand: 'Lian Li',   image: '' },
        cool : { id: 'nh-d15',         name: 'Noctua NH-D15 CPU Cooler',  price: 1450000,  brand: 'Noctua',    image: '' },
      },
    },

    /* ── Office (sama budget, komponen berbeda) ── */
    'office-3-5jt': {
      label      : 'Office Entry — Rp 3–5 Juta',
      totalPrice : 3800000,
      badge      : { type: 'value', label: 'BEST VALUE' },
      components : {
        cpu  : { id: 'i3-12100',       name: 'Intel Core i3-12100',        price: 1200000, brand: 'Intel',     image: '' },
        ram  : { id: 'ddr4-8gb-3200',  name: 'RAM DDR4 8GB 3200MHz',       price: 220000,  brand: 'Generic',   image: '' },
        ssd  : { id: 'ssd-256gb',      name: 'SSD NVMe 256GB',             price: 280000,  brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-450w',       name: 'PSU 450W 80+ Bronze',        price: 280000,  brand: 'Cooler Master', image: '' },
        mobo : { id: 'h610-mobo',      name: 'Motherboard H610M',          price: 850000,  brand: 'MSI',       image: '' },
      },
    },

    /* ── Kreator ── */
    'kreator-10-20jt': {
      label      : 'Creator Workstation — Rp 10–20 Juta',
      totalPrice : 16800000,
      badge      : { type: 'office', label: 'CREATOR' },
      components : {
        cpu  : { id: 'i9-14900k',      name: 'Intel Core i9-14900K',       price: 8900000, brand: 'Intel',     image: '' },
        gpu  : { id: 'rtx4070ti-16gb', name: 'NVIDIA RTX 4070 Ti 16GB',    price: 8500000, brand: 'NVIDIA',    image: '' },
        ram  : { id: 'ddr5-64gb',      name: 'RAM DDR5 64GB 5600MHz',      price: 2100000, brand: 'Corsair',   image: '' },
        ssd  : { id: 'ssd-2tb-nvme',   name: 'SSD NVMe 2TB Samsung 990P',  price: 3200000, brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-850w-gold',  name: 'PSU 850W 80+ Gold',          price: 1200000, brand: 'Seasonic',  image: '' },
      },
    },

    /* Fallback default untuk kombinasi yang tidak ada */
    'default': {
      label      : 'Paket Rekomendasi',
      totalPrice : 5000000,
      badge      : null,
      components : {
        cpu  : { id: 'ryzen5-5600',    name: 'AMD Ryzen 5 5600',           price: 1350000, brand: 'AMD',       image: '' },
        ram  : { id: 'ddr4-16gb-3200', name: 'RAM DDR4 16GB 3200MHz',      price: 420000,  brand: 'Generic',   image: '' },
        ssd  : { id: 'ssd-256gb',      name: 'SSD NVMe 256GB',             price: 280000,  brand: 'Samsung',   image: '' },
        psu  : { id: 'psu-550w',       name: 'PSU 550W 80+ Bronze',        price: 350000,  brand: 'Corsair',   image: '' },
      },
    },
  };


  /* ──────────────────────────────────────────
   * 2. HELPER — FORMAT HARGA
   * ────────────────────────────────────────── */

  function formatPrice(num) {
    return CFG.currency + ' ' + num.toLocaleString('id-ID');
  }

  function getPackageKey() {
    const key = state.kebutuhan + '-' + state.budget;
    return PACKAGES[key] ? key : 'default';
  }


  /* ──────────────────────────────────────────
   * 3. STEP NAVIGATION
   * ────────────────────────────────────────── */

  function goToStep(stepIndex) {
    const $steps    = $('.jp-builder-step');
    const $panels   = $('.jp-builder-panel');
    const $progress = $('.jp-builder-progress-step');

    // Update step indicator
    $progress.each(function (i) {
      $(this)
        .toggleClass('active',    i === stepIndex)
        .toggleClass('completed', i < stepIndex);
    });

    // Animasi panel
    const $current = $panels.filter(':visible');
    const $next    = $panels.eq(stepIndex);

    if ($current.length && !$current.is($next)) {
      $current.fadeOut(CFG.animDuration / 2, function () {
        $next.fadeIn(CFG.animDuration / 2);
        scrollToBuilder();
      });
    } else {
      $next.show();
      scrollToBuilder();
    }

    state.currentStep = stepIndex;
    updateNavigationButtons();
  }

  function scrollToBuilder() {
    const $builder = $('#jpPcBuilder');
    if (!$builder.length) return;

    const navH = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--jp-navbar-total') || '100'
    );

    $('html, body').animate(
      { scrollTop: $builder.offset().top - navH - 20 },
      CFG.animDuration
    );
  }

  function updateNavigationButtons() {
    const $prevBtn = $('#jpBuilderPrev');
    const $nextBtn = $('#jpBuilderNext');

    $prevBtn.toggle(state.currentStep > 0);
    $nextBtn.text(
      state.currentStep === CFG.steps.length - 1
        ? 'Selesai'
        : 'Lanjut →'
    );
  }


  /* ──────────────────────────────────────────
   * 4. RENDER PANEL REKOMENDASI
   * ────────────────────────────────────────── */

  function renderRekomendasi() {
    const $panel = $('#jpBuilderPanelRekomendasi');
    if (!$panel.length) return;

    const key     = getPackageKey();
    const pkg     = PACKAGES[key];
    state.rekomendasi = pkg;
    state.components  = { ...pkg.components };

    let compHtml = '';
    Object.entries(pkg.components).forEach(function ([slot, comp]) {
      compHtml += `
        <div class="jp-builder-comp-row" data-slot="${slot}">
          <div class="jp-builder-comp-slot">${slot.toUpperCase()}</div>
          <div class="jp-builder-comp-info">
            <span class="jp-builder-comp-brand">${comp.brand}</span>
            <span class="jp-builder-comp-name">${comp.name}</span>
          </div>
          <div class="jp-builder-comp-price">${formatPrice(comp.price)}</div>
        </div>
      `;
    });

    const badgeHtml = pkg.badge
      ? `<span class="jp-badge jp-badge-${pkg.badge.type}">${pkg.badge.label}</span>`
      : '';

    $panel.html(`
      <div class="jp-builder-pkg-header">
        <div class="d-flex align-items-center gap-3 mb-4">
          ${badgeHtml}
          <h4 class="jp-builder-pkg-title mb-0">${pkg.label}</h4>
        </div>
        <p class="text-muted-jp mb-4">
          Paket rekomendasi terbaik untuk kebutuhan
          <strong>${state.kebutuhan}</strong> dengan budget
          <strong>${state.budget}</strong>.
        </p>
      </div>
      <div class="jp-builder-comp-list mb-5">
        ${compHtml}
      </div>
      <div class="jp-builder-total-row">
        <span class="jp-builder-total-label">Estimasi Total</span>
        <span class="jp-builder-total-price jp-price jp-price-sale">
          ${formatPrice(pkg.totalPrice)}
        </span>
      </div>
      <div class="jp-builder-pkg-actions mt-5">
        <button class="jp-btn jp-btn-accent jp-btn-lg" id="jpBuilderAddAllCart">
          <i class="fa-solid fa-cart-plus"></i> Tambah Semua ke Keranjang
        </button>
        <a href="pc-builder.html" class="jp-btn jp-btn-outline-primary jp-btn-lg">
          <i class="fa-solid fa-sliders"></i> Kustomisasi Komponen
        </a>
        <a href="https://wa.me/6281280097479?text=${encodeURIComponent('Halo Jaya PC, saya ingin konsultasi rakit PC ' + state.kebutuhan + ' budget ' + state.budget)}"
           class="jp-btn jp-btn-wa jp-btn-lg" target="_blank" rel="noopener">
          <i class="fa-brands fa-whatsapp"></i> Konsultasi via WA
        </a>
      </div>
    `);
  }


  /* ──────────────────────────────────────────
   * 5. INIT WIDGET BUILDER (di homepage)
   * Widget sederhana step 1-2 di section homepage
   * ────────────────────────────────────────── */

  function initHomepageWidget() {
    const $widget = $('#jpBuilderWidget');
    if (!$widget.length) return;

    /* ── Pilih Budget ── */
    $widget.on('click', '.jp-config-option[data-budget]', function () {
      $widget.find('[data-budget]').removeClass('active');
      $(this).addClass('active');
      state.budget = $(this).data('budget');
    });

    /* ── Pilih Kebutuhan ── */
    $widget.on('click', '.jp-config-option[data-kebutuhan]', function () {
      $widget.find('[data-kebutuhan]').removeClass('active');
      $(this).addClass('active');
      state.kebutuhan = $(this).data('kebutuhan');
    });

    /* ── Tombol Lihat Rekomendasi ── */
    $widget.on('click', '#jpWidgetSubmit', function () {
      if (!state.budget) {
        jpToast.warning('Pilih Budget', 'Silakan pilih budget terlebih dahulu.');
        return;
      }
      if (!state.kebutuhan) {
        jpToast.warning('Pilih Kebutuhan', 'Silakan pilih kebutuhan PC kamu.');
        return;
      }

      const key = state.kebutuhan + '-' + state.budget;
      const pkg = PACKAGES[key] || PACKAGES['default'];

      window.location.href = 'pc-builder.html?budget=' +
        encodeURIComponent(state.budget) +
        '&kebutuhan=' +
        encodeURIComponent(state.kebutuhan);
    });
  }


  /* ──────────────────────────────────────────
   * 6. INIT FULL PC BUILDER PAGE
   * Halaman pc-builder.html — step lengkap
   * ────────────────────────────────────────── */

  function initBuilderPage() {
    const $builder = $('#jpPcBuilder');
    if (!$builder.length) return;

    // Baca parameter dari URL jika ada (redirect dari homepage widget)
    const params = new URLSearchParams(window.location.search);
    if (params.get('budget'))    state.budget    = params.get('budget');
    if (params.get('kebutuhan')) state.kebutuhan = params.get('kebutuhan');

    // Sync pilihan dari URL ke UI
    if (state.budget) {
      $(`[data-budget="${state.budget}"]`).addClass('active');
    }
    if (state.kebutuhan) {
      $(`[data-kebutuhan="${state.kebutuhan}"]`).addClass('active');
    }

    // Jika sudah ada budget & kebutuhan dari URL — langsung ke step rekomendasi
    if (state.budget && state.kebutuhan) {
      renderRekomendasi();
      goToStep(2);
    } else {
      goToStep(0);
    }

    /* ── Pilih Budget ── */
    $builder.on('click', '[data-budget]', function () {
      $builder.find('[data-budget]').removeClass('active');
      $(this).addClass('active');
      state.budget = $(this).data('budget');
    });

    /* ── Pilih Kebutuhan ── */
    $builder.on('click', '[data-kebutuhan]', function () {
      $builder.find('[data-kebutuhan]').removeClass('active');
      $(this).addClass('active');
      state.kebutuhan = $(this).data('kebutuhan');
    });

    /* ── Tombol Next ── */
    $('#jpBuilderNext').on('click', function () {
      if (state.currentStep === 0) {
        if (!state.budget) {
          jpToast.warning('Pilih Budget', 'Silakan pilih range budget kamu.');
          return;
        }
        goToStep(1);
        return;
      }

      if (state.currentStep === 1) {
        if (!state.kebutuhan) {
          jpToast.warning('Pilih Kebutuhan', 'Silakan pilih kebutuhan PC kamu.');
          return;
        }
        renderRekomendasi();
        goToStep(2);
        return;
      }

      // Step terakhir — selesai
      if (state.currentStep === 2) {
        window.location.href = 'cart.html';
      }
    });

    /* ── Tombol Prev ── */
    $('#jpBuilderPrev').on('click', function () {
      if (state.currentStep > 0) {
        goToStep(state.currentStep - 1);
      }
    });

    /* ── Tambah Semua ke Cart ── */
    $(document).on('click', '#jpBuilderAddAllCart', function () {
      if (!window.jpCart) {
        jpToast.error('Error', 'Modul cart tidak ditemukan.');
        return;
      }

      const components = state.components;
      if (!Object.keys(components).length) {
        jpToast.warning('Kosong', 'Tidak ada komponen untuk ditambahkan.');
        return;
      }

      let addedCount = 0;
      Object.values(components).forEach(function (comp) {
        if (comp && comp.id) {
          window.jpCart.add({
            id    : comp.id,
            name  : comp.name,
            price : comp.price,
            image : comp.image || '',
            brand : comp.brand || '',
            qty   : 1,
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        jpToast.success(
          'Ditambahkan ke Keranjang!',
          addedCount + ' komponen berhasil ditambahkan.'
        );

        // Animasi tombol
        const $btn = $('#jpBuilderAddAllCart');
        $btn.prop('disabled', true)
            .html('<i class="fa-solid fa-check"></i> Ditambahkan!');

        setTimeout(function () {
          $btn.prop('disabled', false)
              .html('<i class="fa-solid fa-cart-plus"></i> Tambah Semua ke Keranjang');
        }, 2500);
      }
    });

    /* ── Reset Builder ── */
    $(document).on('click', '#jpBuilderReset', function () {
      state.budget     = null;
      state.kebutuhan  = null;
      state.rekomendasi = null;
      state.components = {};

      $('[data-budget], [data-kebutuhan]').removeClass('active');
      $('#jpBuilderPanelRekomendasi').empty();

      goToStep(0);
      jpToast.info('Builder Direset', 'Silakan mulai konfigurasi dari awal.');
    });
  }


  /* ──────────────────────────────────────────
   * 7. KOMPONEN MANUAL — PC BUILDER PAGE
   * Pilih/ganti komponen satu per satu
   * ────────────────────────────────────────── */

  function initManualComponentPicker() {
    // Tombol ganti komponen per slot
    $(document).on('click', '[data-jp-pick-component]', function () {
      const slot = $(this).data('jp-pick-component');
      const $modal = $('#jpComponentModal');

      if (!$modal.length) return;

      // Set slot aktif di modal
      $modal.data('active-slot', slot);
      $modal.find('.jp-modal-slot-title').text('Pilih ' + slot.toUpperCase());

      // Tampilkan modal BS5
      const modal = new bootstrap.Modal($modal[0]);
      modal.show();
    });

    // Konfirmasi pilih komponen dari modal
    $(document).on('click', '.jp-comp-pick-btn', function () {
      const $btn   = $(this);
      const $modal = $('#jpComponentModal');
      const slot   = $modal.data('active-slot');

      const comp = {
        id    : $btn.data('id'),
        name  : $btn.data('name'),
        price : parseFloat($btn.data('price')) || 0,
        brand : $btn.data('brand') || '',
        image : $btn.data('image') || '',
      };

      // Update state
      state.components[slot] = comp;

      // Update tampilan row komponen
      const $row = $(`.jp-builder-comp-row[data-slot="${slot}"]`);
      $row.find('.jp-builder-comp-name').text(comp.name);
      $row.find('.jp-builder-comp-brand').text(comp.brand);
      $row.find('.jp-builder-comp-price').text(formatPrice(comp.price));

      // Recalculate total
      recalculateTotal();

      // Tutup modal
      bootstrap.Modal.getInstance($modal[0]).hide();

      jpToast.success('Komponen Diubah', comp.name + ' dipilih untuk slot ' + slot.toUpperCase() + '.');
    });
  }


  /* ──────────────────────────────────────────
   * 8. RECALCULATE TOTAL
   * ────────────────────────────────────────── */

  function recalculateTotal() {
    const total = Object.values(state.components).reduce(function (acc, comp) {
      return acc + (parseFloat(comp.price) || 0);
    }, 0);

    $('.jp-builder-total-price').text(formatPrice(total));
    state.rekomendasi && (state.rekomendasi.totalPrice = total);
  }


  /* ──────────────────────────────────────────
   * 9. PUBLIC API
   * ────────────────────────────────────────── */

  window.jpBuilder = {
    state      : state,
    getPackage : function () { return PACKAGES[getPackageKey()]; },
    reset      : function () {
      state.budget     = null;
      state.kebutuhan  = null;
      state.rekomendasi = null;
      state.components = {};
      goToStep(0);
    },
  };


  /* ──────────────────────────────────────────
   * 📦 DOCUMENT READY — INIT SEMUA
   * ────────────────────────────────────────── */

  $(document).ready(function () {
    initHomepageWidget();
    initBuilderPage();
    initManualComponentPicker();
  });

})(jQuery);
