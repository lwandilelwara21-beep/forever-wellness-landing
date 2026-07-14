const ADMIN_STORAGE_KEY = 'foreverStoreOrders';
const ORDER_STATUSES = [
  'Order Received',
  'Awaiting Payment',
  'Paid',
  'Processing',
  'Ready for Collection',
  'Dispatched',
  'Delivered',
  'Cancelled'
];

initAdminPreview();

function initAdminPreview() {
  const container = document.querySelector('#admin-orders');

  if (!container) {
    return;
  }

  renderOrders(container);
  container.addEventListener('click', handleAdminClick);
  container.addEventListener('change', handleAdminChange);
}

function renderOrders(container) {
  const orders = loadOrders();

  if (!orders.length) {
    container.innerHTML = `
      <div class="admin-order-card empty-state">
        <h2>No local test orders found.</h2>
        <p>Place an order from the landing page to preview it here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((order, index) => `
    <article class="admin-order-card" data-order-index="${index}">
      <div class="admin-order-actions">
        <div>
          <p class="eyebrow">${escapeHtml(order.orderNumber)}</p>
          <h2>${escapeHtml(`${order.customer.firstName} ${order.customer.lastName}`.trim())}</h2>
          <div class="admin-order-meta">
            <span>${escapeHtml(formatDate(order.createdAt))}</span>
            <span>${escapeHtml(order.totalLabel || 'Price to be confirmed')}</span>
          </div>
          <p class="admin-status">Payment: ${escapeHtml(order.paymentStatus)}</p>
          <p class="admin-status">Status: ${escapeHtml(order.orderStatus)}</p>
        </div>
        <div>
          <button type="button" class="btn btn-secondary" data-action="toggle-order">View Order</button>
        </div>
      </div>
      <div class="is-hidden" data-role="order-detail">
        <div class="summary-items">
          <div class="summary-item">
            <div>
              <strong>Email</strong>
              <span>${escapeHtml(order.customer.email)}</span>
            </div>
            <span>${escapeHtml(order.customer.mobile)}</span>
          </div>
          <div class="summary-item">
            <div>
              <strong>Delivery method</strong>
              <span>${escapeHtml(order.delivery.method)}</span>
            </div>
            <span>${escapeHtml(order.delivery.postalCode || '')}</span>
          </div>
          <div class="summary-item">
            <div>
              <strong>Address</strong>
              <span>${escapeHtml([order.delivery.streetAddress, order.delivery.suburb, order.delivery.city, order.delivery.province].filter(Boolean).join(', '))}</span>
            </div>
          </div>
        </div>
        <div class="detail-block">
          <h3>Products</h3>
          <ul>${order.items.map((item) => `<li>${escapeHtml(item.name)} x${item.quantity} - ${escapeHtml(item.priceLabel || 'Price to be confirmed')}</li>`).join('')}</ul>
        </div>
        <label>
          Order status
          <select class="admin-select" data-action="update-status">
            ${ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.orderStatus ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label>
      </div>
    </article>
  `).join('');
}

function handleAdminClick(event) {
  const button = event.target.closest('button[data-action="toggle-order"]');

  if (!button) {
    return;
  }

  const card = button.closest('[data-order-index]');
  const detail = card?.querySelector('[data-role="order-detail"]');

  if (!detail) {
    return;
  }

  const isHidden = detail.classList.toggle('is-hidden');
  button.textContent = isHidden ? 'View Order' : 'Hide Order';
}

function handleAdminChange(event) {
  const select = event.target.closest('select[data-action="update-status"]');

  if (!select) {
    return;
  }

  const card = select.closest('[data-order-index]');
  const orderIndex = Number.parseInt(card?.dataset.orderIndex || '-1', 10);
  const orders = loadOrders();

  if (orderIndex < 0 || !orders[orderIndex]) {
    return;
  }

  orders[orderIndex].orderStatus = select.value;
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(orders));
  renderOrders(document.querySelector('#admin-orders'));
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
