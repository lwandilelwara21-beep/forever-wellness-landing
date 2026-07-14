const WHATSAPP_NUMBER = '27655183942';
const STORAGE_KEYS = {
  cart: 'foreverStoreCart',
  orders: 'foreverStoreOrders',
  orderCounter: 'foreverStoreOrderCounter'
};

const storeData = window.FOREVER_STORE || { products: [], shipping: { deliveryOptions: [] }, disclaimers: {} };
const storeState = {
  searchTerm: '',
  activeFilter: 'all',
  cart: loadStoredJson(STORAGE_KEYS.cart, []),
  selectedProductId: null,
  lastFocusedElement: null,
  toastTimer: null
};

if (window.AOS) {
  AOS.init({
    once: true,
    duration: 700,
    easing: 'ease-out-cubic'
  });
}

const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

initContactForm();
initStorefront();

function initContactForm() {
  const form = document.querySelector('.contact-form');

  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() || 'there';
    const email = data.get('email')?.toString().trim() || '';
    const message = data.get('message')?.toString().trim() || 'I would like to know more about your products.';
    const whatsappNumber = form.dataset.whatsapp || WHATSAPP_NUMBER;
    const lowerMessage = message.toLowerCase();

    let response = `Hello Zimkhitha, my name is ${name}. I am interested in your Forever Living wellness products and would love your guidance.`;

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
      response += ' I would like to know more about product pricing and available options.';
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('delivery')) {
      response += ' I would like to know how to order, delivery options, and payment methods.';
    } else if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('routine')) {
      response += ' I would love help choosing a simple wellness routine that fits my lifestyle.';
    } else if (lowerMessage.includes('benefit') || lowerMessage.includes('help') || lowerMessage.includes('recommend')) {
      response += ' Please recommend the best product for my wellness goals and explain the benefits.';
    } else {
      response += ' Please guide me with the best options for me.';
    }

    if (email) {
      response += ` My email is ${email}.`;
    }

    response += ` My message: ${message}`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(response)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    form.reset();
  });
}

function initStorefront() {
  const productGrid = document.querySelector('#product-grid');
  const checkoutForm = document.querySelector('#checkout-form');

  if (!productGrid || !checkoutForm || !storeData.products.length) {
    return;
  }

  populateDeliveryOptions();
  bindStoreControls();
  renderCatalogue();
  renderCart();
  renderCheckoutSummary();
}

function bindStoreControls() {
  const searchInput = document.querySelector('#product-search');
  const filterButtons = document.querySelectorAll('.filter-chip');
  const clearFiltersButton = document.querySelector('#clear-filters');
  const productGrid = document.querySelector('#product-grid');
  const cartToggle = document.querySelector('#cart-toggle');
  const cartClose = document.querySelector('#cart-close');
  const clearCartButton = document.querySelector('#clear-cart');
  const cartCheckoutLink = document.querySelector('#cart-checkout-link');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');
  const modal = document.querySelector('#product-modal');
  const modalClose = document.querySelector('#modal-close');
  const checkoutForm = document.querySelector('#checkout-form');
  const deliveryMethod = document.querySelector('#delivery-method');

  searchInput?.addEventListener('input', (event) => {
    storeState.searchTerm = event.target.value.trim().toLowerCase();
    renderCatalogue();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      storeState.activeFilter = button.dataset.filter || 'all';
      updateActiveFilter();
      renderCatalogue();
    });
  });

  clearFiltersButton?.addEventListener('click', () => {
    storeState.searchTerm = '';
    storeState.activeFilter = 'all';
    const search = document.querySelector('#product-search');

    if (search) {
      search.value = '';
    }

    updateActiveFilter();
    renderCatalogue();
  });

  productGrid?.addEventListener('click', handleCatalogueClick);
  productGrid?.addEventListener('input', handleQuantityInput);

  cartToggle?.addEventListener('click', () => toggleCart(true));
  cartClose?.addEventListener('click', () => toggleCart(false));
  clearCartButton?.addEventListener('click', clearCart);
  cartCheckoutLink?.addEventListener('click', (event) => {
    if (!storeState.cart.length) {
      event.preventDefault();
      showToast('Your cart is empty. Add products before checkout.');
      return;
    }

    toggleCart(false);
  });

  drawerBackdrop?.addEventListener('click', () => {
    closeProductModal();
    toggleCart(false);
  });

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeProductModal();
    }
  });

  modalClose?.addEventListener('click', closeProductModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProductModal();
      toggleCart(false);
    }
  });

  document.querySelector('#cart-items')?.addEventListener('click', handleCartClick);
  document.querySelector('#modal-content')?.addEventListener('click', handleModalClick);
  document.querySelector('#modal-content')?.addEventListener('input', handleQuantityInput);

  checkoutForm?.addEventListener('submit', handleCheckoutSubmit);
  deliveryMethod?.addEventListener('change', renderCheckoutSummary);
}

function renderCatalogue() {
  const productGrid = document.querySelector('#product-grid');
  const storeCount = document.querySelector('.store-count');
  const filteredProducts = getFilteredProducts();

  if (!productGrid) {
    return;
  }

  if (!filteredProducts.length) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <h3>No products matched your search.</h3>
        <p>Try a different product name or clear the current filter.</p>
      </div>
    `;
  } else {
    productGrid.innerHTML = filteredProducts.map((product) => createProductCard(product)).join('');
  }

  if (storeCount) {
    storeCount.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} available in this view.`;
  }
}

function createProductCard(product) {
  const priceLabel = formatPrice(product.price);
  const stockLabel = product.stock || storeData.shipping.availabilityPlaceholder;
  const benefits = product.benefits.slice(0, 3).map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join('');
  const imageMarkup = product.image
    ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : '<div class="product-image-placeholder">Image requires manual confirmation</div>';
  const manualFlag = product.requiresManualConfirmation
    ? '<span class="product-flag">Manual confirmation required</span>'
    : '';

  return `
    <article class="store-card" data-product-id="${product.id}">
      <div class="store-card-media">
        ${imageMarkup}
        <span class="product-tag">${escapeHtml(product.category)}</span>
        ${manualFlag}
      </div>
      <div class="store-card-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.shortDescription)}</p>
        <ul class="benefit-list">${benefits}</ul>
        <div class="price-row">
          <div>
            <strong>${escapeHtml(priceLabel)}</strong>
            <span>${escapeHtml(stockLabel)}</span>
          </div>
        </div>
        <div class="quantity-row">
          ${renderQuantityControl(product.id, 1, 'card')}
        </div>
        <div class="store-card-actions">
          <button class="btn btn-primary add-cart-button" type="button" data-action="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
          <button class="btn btn-secondary" type="button" data-action="view-details" data-product-id="${product.id}">View Details</button>
        </div>
      </div>
    </article>
  `;
}

function renderQuantityControl(productId, quantity, context) {
  return `
    <div class="quantity-control" data-context="${context}" data-product-id="${productId}">
      <button type="button" class="quantity-button" data-action="decrease-quantity" aria-label="Decrease quantity">-</button>
      <input type="number" min="1" value="${quantity}" aria-label="Product quantity" />
      <button type="button" class="quantity-button" data-action="increase-quantity" aria-label="Increase quantity">+</button>
    </div>
  `;
}

function handleCatalogueClick(event) {
  const button = event.target.closest('button');
  const control = event.target.closest('.quantity-control');

  if (button?.dataset.action === 'view-details') {
    const product = getProductById(button.dataset.productId);

    if (product) {
      openProductModal(product);
    }
    return;
  }

  if (button?.dataset.action === 'add-to-cart') {
    const productId = button.dataset.productId;
    const quantityInput = button.closest('.store-card')?.querySelector('.quantity-control input');
    const quantity = normalizeQuantity(quantityInput?.value || 1);

    addToCart(productId, quantity);
    return;
  }

  if (!control || !button?.dataset.action) {
    return;
  }

  adjustQuantityControl(control, button.dataset.action);
}

function handleModalClick(event) {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  if (button.dataset.action === 'add-modal-to-cart') {
    const productId = button.dataset.productId;
    const quantityInput = document.querySelector('#modal-content .quantity-control input');
    const quantity = normalizeQuantity(quantityInput?.value || 1);

    addToCart(productId, quantity);
    closeProductModal();
    return;
  }

  const control = button.closest('.quantity-control');

  if (control && button.dataset.action) {
    adjustQuantityControl(control, button.dataset.action);
  }
}

function handleQuantityInput(event) {
  if (event.target.matches('.quantity-control input')) {
    event.target.value = normalizeQuantity(event.target.value);
  }
}

function adjustQuantityControl(control, action) {
  const input = control.querySelector('input');
  const currentValue = normalizeQuantity(input.value);
  const nextValue = action === 'decrease-quantity'
    ? Math.max(1, currentValue - 1)
    : currentValue + 1;

  input.value = nextValue;
}

function openProductModal(product) {
  const modal = document.querySelector('#product-modal');
  const modalContent = document.querySelector('#modal-content');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');
  const disclaimer = getDisclaimerCopy(product.disclaimerType);
  const manualNote = product.sourceNote
    ? `<p class="modal-note">${escapeHtml(product.sourceNote)}</p>`
    : '';

  if (!modal || !modalContent) {
    return;
  }

  storeState.lastFocusedElement = document.activeElement;
  storeState.selectedProductId = product.id;

  modalContent.innerHTML = `
    <div class="modal-layout">
      <div class="modal-image-wrap">
        ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" />` : '<div class="product-image-placeholder large">Image requires manual confirmation</div>'}
      </div>
      <div class="modal-copy">
        <p class="eyebrow">Product details</p>
        <h2 id="modal-title">${escapeHtml(product.name)}</h2>
        <p class="modal-sku">${escapeHtml(product.sku || 'SKU to be confirmed')}</p>
        <p>${escapeHtml(product.shortDescription)}</p>
        <div class="detail-block">
          <h3>Fast Facts</h3>
          <ul>${product.fastFacts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>
        </div>
        <div class="detail-block">
          <h3>Product Benefits</h3>
          <ul>${product.benefits.map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join('')}</ul>
        </div>
        <div class="detail-block">
          <h3>Product notice</h3>
          <p>${escapeHtml(disclaimer)}</p>
        </div>
        ${manualNote}
        <div class="modal-footer-actions">
          ${renderQuantityControl(product.id, 1, 'modal')}
          <button class="btn btn-primary" type="button" data-action="add-modal-to-cart" data-product-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  modal.hidden = false;
  modal.classList.add('is-open');
  drawerBackdrop.hidden = false;
  document.body.classList.add('overlay-open');
  document.querySelector('#modal-close')?.focus();
}

function closeProductModal() {
  const modal = document.querySelector('#product-modal');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');
  const cartDrawer = document.querySelector('#cart-drawer');

  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  modal.classList.remove('is-open');
  storeState.selectedProductId = null;

  if (!cartDrawer?.classList.contains('is-open')) {
    drawerBackdrop.hidden = true;
    document.body.classList.remove('overlay-open');
  }

  storeState.lastFocusedElement?.focus?.();
}

function toggleCart(shouldOpen) {
  const drawer = document.querySelector('#cart-drawer');
  const toggle = document.querySelector('#cart-toggle');
  const drawerBackdrop = document.querySelector('#drawer-backdrop');

  if (!drawer || !toggle) {
    return;
  }

  drawer.classList.toggle('is-open', shouldOpen);
  drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

  if (shouldOpen) {
    drawerBackdrop.hidden = false;
    document.body.classList.add('overlay-open');
    document.querySelector('#cart-close')?.focus();
  } else if (document.querySelector('#product-modal')?.hidden !== false) {
    drawerBackdrop.hidden = true;
    document.body.classList.remove('overlay-open');
  }
}

function addToCart(productId, quantity) {
  const product = getProductById(productId);

  if (!product) {
    return;
  }

  const existingItem = storeState.cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    storeState.cart.push({ productId, quantity });
  }

  persistCart();
  renderCart();
  renderCheckoutSummary();
  showToast(`${product.name} added to cart.`);
}

function handleCartClick(event) {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  const productId = button.dataset.productId;

  if (button.dataset.action === 'remove-cart-item') {
    removeCartItem(productId);
    return;
  }

  if (button.dataset.action === 'increase-cart-item') {
    updateCartItem(productId, 1);
    return;
  }

  if (button.dataset.action === 'decrease-cart-item') {
    updateCartItem(productId, -1);
  }
}

function updateCartItem(productId, delta) {
  const item = storeState.cart.find((entry) => entry.productId === productId);

  if (!item) {
    return;
  }

  item.quantity = Math.max(0, item.quantity + delta);
  storeState.cart = storeState.cart.filter((entry) => entry.quantity > 0);
  persistCart();
  renderCart();
  renderCheckoutSummary();
}

function removeCartItem(productId) {
  storeState.cart = storeState.cart.filter((item) => item.productId !== productId);
  persistCart();
  renderCart();
  renderCheckoutSummary();
}

function clearCart() {
  storeState.cart = [];
  persistCart();
  renderCart();
  renderCheckoutSummary();
  showToast('Cart cleared.');
}

function renderCart() {
  const cartItems = document.querySelector('#cart-items');
  const cartCountBadge = document.querySelector('#cart-count-badge');
  const cartItemCount = document.querySelector('#cart-item-count');
  const cartSubtotal = document.querySelector('#cart-subtotal');
  const cartDeliveryFee = document.querySelector('#cart-delivery-fee');
  const cartTotal = document.querySelector('#cart-total');
  const pricing = calculatePricing();
  const itemCount = getCartItemCount();

  if (cartItems) {
    if (!storeState.cart.length) {
      cartItems.innerHTML = `
        <div class="empty-state compact">
          <h3>Your cart is empty.</h3>
          <p>Add products from the catalogue to continue.</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = storeState.cart.map((item) => createCartItemMarkup(item)).join('');
    }
  }

  if (cartCountBadge) {
    cartCountBadge.textContent = itemCount;
  }

  if (cartItemCount) {
    cartItemCount.textContent = `${itemCount}`;
  }

  if (cartSubtotal) {
    cartSubtotal.textContent = pricing.subtotalLabel;
  }

  if (cartDeliveryFee) {
    cartDeliveryFee.textContent = pricing.deliveryLabel;
  }

  if (cartTotal) {
    cartTotal.textContent = pricing.totalLabel;
  }
}

function createCartItemMarkup(item) {
  const product = getProductById(item.productId);

  if (!product) {
    return '';
  }

  return `
    <article class="cart-item">
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(formatPrice(product.price))}</p>
      </div>
      <div class="cart-item-actions">
        <div class="cart-stepper">
          <button type="button" data-action="decrease-cart-item" data-product-id="${product.id}" aria-label="Decrease quantity">-</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase-cart-item" data-product-id="${product.id}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="text-button" data-action="remove-cart-item" data-product-id="${product.id}">Remove</button>
      </div>
    </article>
  `;
}

function populateDeliveryOptions() {
  const select = document.querySelector('#delivery-method');

  if (!select) {
    return;
  }

  const options = [
    '<option value="">Select delivery method</option>',
    ...storeData.shipping.deliveryOptions.map(
      (option) => `<option value="${option.id}">${escapeHtml(option.label)}</option>`
    )
  ];

  select.innerHTML = options.join('');
}

function renderCheckoutSummary() {
  const orderItems = document.querySelector('#checkout-order-items');
  const subtotal = document.querySelector('#checkout-subtotal');
  const delivery = document.querySelector('#checkout-delivery');
  const total = document.querySelector('#checkout-total');
  const pricing = calculatePricing();

  if (orderItems) {
    if (!storeState.cart.length) {
      orderItems.innerHTML = `
        <div class="empty-state compact">
          <h3>No products selected yet.</h3>
          <p>Your cart summary will appear here.</p>
        </div>
      `;
    } else {
      orderItems.innerHTML = storeState.cart.map((item) => {
        const product = getProductById(item.productId);

        if (!product) {
          return '';
        }

        return `
          <div class="summary-item">
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(formatPrice(product.price))}</span>
            </div>
            <span>x${item.quantity}</span>
          </div>
        `;
      }).join('');
    }
  }

  if (subtotal) {
    subtotal.textContent = pricing.subtotalLabel;
  }

  if (delivery) {
    delivery.textContent = pricing.deliveryLabel;
  }

  if (total) {
    total.textContent = pricing.totalLabel;
  }
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;

  if (!storeState.cart.length) {
    showToast('Your cart is empty. Add products before placing an order.');
    toggleCart(true);
    return;
  }

  if (!form.reportValidity()) {
    return;
  }

  const deliveryMethod = getSelectedDeliveryOption();

  if (!deliveryMethod) {
    showToast('Please select a delivery method.');
    return;
  }

  const formData = new FormData(form);
  const pricing = calculatePricing();
  const orderNumber = generateOrderNumber();
  const order = {
    orderNumber,
    createdAt: new Date().toISOString(),
    customer: {
      firstName: formData.get('firstName')?.toString().trim() || '',
      lastName: formData.get('lastName')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      mobile: formData.get('mobile')?.toString().trim() || ''
    },
    delivery: {
      streetAddress: formData.get('streetAddress')?.toString().trim() || '',
      suburb: formData.get('suburb')?.toString().trim() || '',
      city: formData.get('city')?.toString().trim() || '',
      province: formData.get('province')?.toString().trim() || '',
      postalCode: formData.get('postalCode')?.toString().trim() || '',
      method: deliveryMethod.label,
      notes: formData.get('deliveryNotes')?.toString().trim() || '',
      updatesConsent: formData.get('orderUpdatesConsent') === 'on'
    },
    items: storeState.cart.map((item) => {
      const product = getProductById(item.productId);
      return {
        productId: item.productId,
        name: product?.name || item.productId,
        sku: product?.sku || null,
        quantity: item.quantity,
        price: product?.price ?? null,
        priceLabel: formatPrice(product?.price ?? null)
      };
    }),
    subtotal: pricing.subtotalValue,
    subtotalLabel: pricing.subtotalLabel,
    deliveryFee: pricing.deliveryValue,
    deliveryFeeLabel: pricing.deliveryLabel,
    total: pricing.totalValue,
    totalLabel: pricing.totalLabel,
    paymentStatus: 'Pending Payment',
    orderStatus: 'Order Received'
  };

  // Future secure backend integration point:
  // 1. Send the order payload to a protected server endpoint.
  // 2. Create the Yoco checkout session on the server.
  // 3. Save the order to a database and listen for payment webhooks.
  saveOrder(order);

  // Future automation hooks belong on the server:
  // - invoice generation
  // - email notifications
  // - WhatsApp transactional confirmations
  // - owner alerts
  // - status tracking and webhook logs
  form.reset();
  storeState.cart = [];
  persistCart();
  renderCart();
  renderCheckoutSummary();
  showOrderConfirmation(order);
}

function showOrderConfirmation(order) {
  const section = document.querySelector('#order-confirmation');
  const content = document.querySelector('#confirmation-content');
  const whatsappLink = document.querySelector('#confirmation-whatsapp');

  if (!section || !content || !whatsappLink) {
    return;
  }

  const itemMarkup = order.items.map((item) => `
    <li>
      <strong>${escapeHtml(item.name)}</strong>
      <span>Qty ${item.quantity}</span>
      <span>${escapeHtml(item.priceLabel)}</span>
    </li>
  `).join('');
  const addressParts = [order.delivery.streetAddress, order.delivery.suburb, order.delivery.city, order.delivery.province, order.delivery.postalCode]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');

  content.innerHTML = `
    <div class="confirmation-grid">
      <div class="confirmation-panel">
        <h3>Order details</h3>
        <p><strong>Order number:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p><strong>Date:</strong> ${escapeHtml(formatDate(order.createdAt))}</p>
        <p><strong>Payment status:</strong> ${escapeHtml(order.paymentStatus)}</p>
        <p><strong>Order status:</strong> ${escapeHtml(order.orderStatus)}</p>
      </div>
      <div class="confirmation-panel">
        <h3>Delivery details</h3>
        <p><strong>Name:</strong> ${escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`.trim())}</p>
        <p><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>
        <p><strong>Mobile:</strong> ${escapeHtml(order.customer.mobile)}</p>
        <p><strong>Method:</strong> ${escapeHtml(order.delivery.method)}</p>
        <p><strong>Address:</strong> ${addressParts || 'Address captured at checkout'}</p>
      </div>
    </div>
    <div class="confirmation-panel full-width">
      <h3>Order summary</h3>
      <ul class="confirmation-list">${itemMarkup}</ul>
      <p><strong>Subtotal:</strong> ${escapeHtml(order.subtotalLabel)}</p>
      <p><strong>Delivery fee:</strong> ${escapeHtml(order.deliveryFeeLabel)}</p>
      <p><strong>Total:</strong> ${escapeHtml(order.totalLabel)}</p>
      <p>Further payment or delivery instructions will follow after your order is reviewed.</p>
    </div>
  `;

  whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, I have a query regarding order ${order.orderNumber}.`)}`;
  section.classList.remove('is-hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveOrder(order) {
  const orders = loadStoredJson(STORAGE_KEYS.orders, []);
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function generateOrderNumber() {
  const currentYear = new Date().getFullYear();
  const currentCounter = Number.parseInt(localStorage.getItem(STORAGE_KEYS.orderCounter) || '0', 10) + 1;

  localStorage.setItem(STORAGE_KEYS.orderCounter, String(currentCounter));

  return `FL-${currentYear}-${String(currentCounter).padStart(4, '0')}`;
}

function calculatePricing() {
  const selectedDelivery = getSelectedDeliveryOption();
  const pricedItems = storeState.cart.map((item) => {
    const product = getProductById(item.productId);
    return {
      quantity: item.quantity,
      price: typeof product?.price === 'number' ? product.price : null
    };
  });
  const allPriced = pricedItems.length > 0 && pricedItems.every((item) => typeof item.price === 'number');
  const subtotalValue = allPriced
    ? pricedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : null;
  const deliveryValue = typeof selectedDelivery?.fee === 'number' ? selectedDelivery.fee : null;
  const totalValue = subtotalValue !== null && deliveryValue !== null ? subtotalValue + deliveryValue : null;

  return {
    subtotalValue,
    subtotalLabel: subtotalValue !== null ? formatCurrency(subtotalValue) : formatPrice(null),
    deliveryValue,
    deliveryLabel: deliveryValue !== null ? formatCurrency(deliveryValue) : (selectedDelivery?.feeLabel || 'Delivery fee to be confirmed'),
    totalValue,
    totalLabel: totalValue !== null ? formatCurrency(totalValue) : formatPrice(null)
  };
}

function getSelectedDeliveryOption() {
  const selectedValue = document.querySelector('#delivery-method')?.value;
  return storeData.shipping.deliveryOptions.find((option) => option.id === selectedValue) || null;
}

function getFilteredProducts() {
  return storeData.products.filter((product) => {
    const matchesFilter = storeState.activeFilter === 'all'
      || product.category === storeState.activeFilter
      || product.categoryAliases?.includes(storeState.activeFilter);
    const haystack = [product.name, product.category, ...(product.categoryAliases || [])].join(' ').toLowerCase();
    const matchesSearch = !storeState.searchTerm || haystack.includes(storeState.searchTerm);

    return matchesFilter && matchesSearch;
  });
}

function getProductById(productId) {
  return storeData.products.find((product) => product.id === productId) || null;
}

function getCartItemCount() {
  return storeState.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function persistCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(storeState.cart));
}

function loadStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function updateActiveFilter() {
  document.querySelectorAll('.filter-chip').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === storeState.activeFilter);
  });
}

function showToast(message) {
  const toast = document.querySelector('#toast');

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(storeState.toastTimer);
  storeState.toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2200);
}

function formatPrice(price) {
  return typeof price === 'number' ? formatCurrency(price) : (storeData.shipping.pricePlaceholder || 'Price to be confirmed');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: storeData.shipping.currency || 'ZAR'
  }).format(value);
}

function getDisclaimerCopy(disclaimerType) {
  if (disclaimerType === 'weightManagement') {
    return storeData.disclaimers.weightManagement;
  }

  if (disclaimerType === 'cosmetic') {
    return storeData.disclaimers.cosmetic;
  }

  return storeData.disclaimers.dietary || storeData.disclaimers.informational;
}

function normalizeQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
