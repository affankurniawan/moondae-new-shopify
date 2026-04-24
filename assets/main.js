/* ============================================
   MOONDAE — Shopify Theme JavaScript
   ============================================ */

(function() {
  'use strict';

  /* ---- Utility: Toast Notification ---- */
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ---- Hero Slider ---- */
  function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (slides.length < 2) return;

    let current = 0;
    let timer;

    function goTo(i) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (i + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }

    function start() {
      timer = setInterval(function() { goTo(current + 1); }, 5000);
    }

    dots.forEach(function(d, i) {
      d.addEventListener('click', function() {
        clearInterval(timer);
        goTo(i);
        start();
      });
    });

    start();
  }

  /* ---- Mobile Menu ---- */
  function initMobileMenu() {
    const openBtns = document.querySelectorAll('[data-open-mobile-menu]');
    const closeBtns = document.querySelectorAll('[data-close-mobile-menu]');
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;

    openBtns.forEach(function(btn) {
      btn.addEventListener('click', function() { menu.classList.add('open'); });
    });
    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() { menu.classList.remove('open'); });
    });

    // Also open via hamburger
    var hamburger = document.querySelector('.hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', function() { menu.classList.add('open'); });
    }
  }

  /* ---- Search Overlay ---- */
  function initSearch() {
    var openBtns = document.querySelectorAll('[data-open-search], .search-btn');
    var closeBtns = document.querySelectorAll('[data-close-search]');
    var overlay = document.getElementById('search-overlay');
    if (!overlay) return;

    openBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.classList.add('open');
        var input = overlay.querySelector('input');
        if (input) input.focus();
      });
    });
    closeBtns.forEach(function(btn) {
      btn.addEventListener('click', function() { overlay.classList.remove('open'); });
    });
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') overlay.classList.remove('open');
    });
  }

  /* ---- Cart Drawer ---- */
  function initCartDrawer() {
    var openBtns = document.querySelectorAll('[data-open-cart], .cart-btn');
    var closeBtns = document.querySelectorAll('[data-close-cart]');
    var drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    function openCart() { drawer.classList.add('open'); }
    function closeCart() { drawer.classList.remove('open'); }

    openBtns.forEach(function(btn) { btn.addEventListener('click', openCart); });
    closeBtns.forEach(function(btn) { btn.addEventListener('click', closeCart); });
  }

  /* ---- Cart AJAX ---- */
  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function(el) {
      el.textContent = count;
    });
  }

  function addToCart(formData) {
    return fetch(window.Moondae.routes.cart_add_url + '.js', {
      method: 'POST',
      body: formData
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      showToast('Ditambahkan ke keranjang \u2713');
      // Update cart count
      fetch(window.Moondae.routes.cart_url + '.js')
        .then(function(r) { return r.json(); })
        .then(function(cart) { updateCartCount(cart.item_count); });
      return data;
    })
    .catch(function(err) {
      console.error('Cart error:', err);
      showToast('Gagal menambahkan ke keranjang');
    });
  }

  /* ---- Product Form (Add to Cart) ---- */
  function initProductForm() {
    var forms = document.querySelectorAll('[data-product-form]');
    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Sync qty
        var qtyNum = form.querySelector('[data-qty]');
        var qtyInput = form.querySelector('[data-qty-input]');
        if (qtyNum && qtyInput) {
          qtyInput.value = qtyNum.textContent;
        }

        var formData = new FormData(form);
        addToCart(formData);
      });
    });
  }

  /* ---- Quantity Controls ---- */
  function initQtyControls() {
    document.querySelectorAll('.qty-control').forEach(function(ctrl) {
      var minus = ctrl.querySelector('.qty-minus');
      var plus = ctrl.querySelector('.qty-plus');
      var num = ctrl.querySelector('.qty-num');
      if (!num) return;

      if (minus) {
        minus.addEventListener('click', function(e) {
          e.preventDefault();
          var v = parseInt(num.textContent);
          if (v > 1) {
            num.textContent = v - 1;
            var input = ctrl.closest('form')?.querySelector('[data-qty-input]');
            if (input) input.value = v - 1;
          }

          // Cart line update
          var line = this.getAttribute('data-line');
          if (line && this.getAttribute('data-action') === 'decrease') {
            updateCartLine(parseInt(line), v - 1);
          }
        });
      }
      if (plus) {
        plus.addEventListener('click', function(e) {
          e.preventDefault();
          var v = parseInt(num.textContent);
          num.textContent = v + 1;
          var input = ctrl.closest('form')?.querySelector('[data-qty-input]');
          if (input) input.value = v + 1;

          var line = this.getAttribute('data-line');
          if (line && this.getAttribute('data-action') === 'increase') {
            updateCartLine(parseInt(line), v + 1);
          }
        });
      }
    });
  }

  function updateCartLine(line, qty) {
    fetch(window.Moondae.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty })
    })
    .then(function(r) { return r.json(); })
    .then(function(cart) {
      updateCartCount(cart.item_count);
      var total = document.querySelector('[data-cart-total]');
      if (total) total.textContent = Shopify.formatMoney(cart.total_price, window.Moondae.money_format);
      if (qty === 0) location.reload();
    });
  }

  /* ---- Carousel ---- */
  function initCarousel() {
    var track = document.querySelector('[data-carousel]');
    var prevBtn = document.querySelector('[data-carousel-prev]');
    var nextBtn = document.querySelector('[data-carousel-next]');
    if (!track) return;

    var pos = 0;

    function getSlide() {
      var card = track.querySelector('.product-card');
      if (!card) return 0;
      return card.getBoundingClientRect().width + 20;
    }

    function maxPos() {
      var cards = track.querySelectorAll('.product-card');
      var visible = window.innerWidth > 1024 ? 4 : window.innerWidth > 768 ? 3 : 2;
      return Math.max(0, (cards.length - visible) * getSlide());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        pos = Math.min(pos + getSlide(), maxPos());
        track.style.transform = 'translateX(-' + pos + 'px)';
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        pos = Math.max(0, pos - getSlide());
        track.style.transform = 'translateX(-' + pos + 'px)';
      });
    }
  }

  /* ---- Product Gallery (PDP) ---- */
  function initGallery() {
    var thumbs = document.querySelectorAll('.gallery-thumb[data-image-url]');
    var mainImg = document.getElementById('main-product-image');

    thumbs.forEach(function(thumb) {
      thumb.addEventListener('click', function() {
        thumbs.forEach(function(t) { t.classList.remove('active'); });
        thumb.classList.add('active');
        if (mainImg) {
          mainImg.src = thumb.getAttribute('data-image-url');
        }
      });
    });
  }

  /* ---- PDP Tabs ---- */
  function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    var tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var target = btn.getAttribute('data-tab');
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        tabContents.forEach(function(c) { c.classList.remove('active'); });
        btn.classList.add('active');
        var el = document.getElementById(target);
        if (el) el.classList.add('active');
      });
    });
  }

  /* ---- Color Swatches ---- */
  function initSwatches() {
    document.querySelectorAll('.color-swatch').forEach(function(sw) {
      sw.addEventListener('click', function() {
        var group = sw.closest('.color-selector');
        if (group) {
          group.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
        }
        sw.classList.add('active');

        // Update label
        var container = sw.closest('[data-color-group]');
        if (container) {
          var span = container.querySelector('[data-option-value]');
          if (span) span.textContent = ' \u2014 ' + sw.getAttribute('data-name');
        }

        // TODO: Update variant ID based on selected options
        // This would need variant matching logic based on your product structure
      });
    });
  }

  /* ---- Filter Tags ---- */
  function initFilterTags() {
    document.querySelectorAll('.filter-tag').forEach(function(tag) {
      tag.addEventListener('click', function(e) {
        // Only prevent default if it's a button, not a link
        if (tag.tagName !== 'A') {
          e.preventDefault();
          var group = tag.closest('.filter-tags');
          if (group) {
            group.querySelectorAll('.filter-tag').forEach(function(t) { t.classList.remove('active'); });
          }
          tag.classList.add('active');
        }
      });
    });
  }

  /* ---- Active Nav ---- */
  function initActiveNav() {
    var links = document.querySelectorAll('.nav-main a');
    var path = window.location.pathname;

    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href && path.indexOf(href) === 0 && href !== '/') {
        link.classList.add('active');
      } else if (href === '/' && path === '/') {
        link.classList.add('active');
      }
    });
  }

  /* ---- Newsletter Forms ---- */
  function initNewsletter() {
    document.querySelectorAll('.email-form').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        // Let Shopify handle the form submission naturally
        // Toast will show on page reload if posted_successfully
      });
    });
  }

  /* ---- Image Placeholder Gradients ---- */
  function initPlaceholders() {
    var GRAD = [
      'linear-gradient(145deg,#CDC3BD 0%,#B2998A 100%)',
      'linear-gradient(145deg,#B2998A 0%,#695242 100%)',
      'linear-gradient(145deg,#E5E0D6 0%,#CDC3BD 100%)',
      'linear-gradient(145deg,#CDC3BD 0%,#232D3F 100%)',
      'linear-gradient(145deg,#B2998A 0%,#232D3F 100%)'
    ];
    document.querySelectorAll('.img-placeholder').forEach(function(el, i) {
      el.style.background = GRAD[i % GRAD.length];
    });
    document.querySelectorAll('.ig-placeholder').forEach(function(el, i) {
      el.style.background = GRAD[(i + 1) % GRAD.length];
    });
  }

  /* ---- Initialize Everything ---- */
  document.addEventListener('DOMContentLoaded', function() {
    initHeroSlider();
    initMobileMenu();
    initSearch();
    initCartDrawer();
    initProductForm();
    initQtyControls();
    initCarousel();
    initGallery();
    initTabs();
    initSwatches();
    initFilterTags();
    initActiveNav();
    initNewsletter();
    initPlaceholders();
  });

  // Expose globally for use in Liquid templates
  window.MoondaeTheme = {
    showToast: showToast,
    addToCart: addToCart,
    updateCartCount: updateCartCount
  };

})();
