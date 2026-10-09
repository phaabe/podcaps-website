/* Podcaps static shop cart — no backend, just localStorage + a mailto: checkout. */

const CART_KEY = "podcaps_cart";
const ORDER_EMAIL = "caps@pola.berlin";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartBadge();
}

function addToCart(slug, name, price, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find((item) => item.slug === slug);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ slug, name, price, qty });
  }
  saveCart(cart);
  renderCartPanel();
}

function changeQty(slug, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.slug === slug);
  if (!item) return;
  item.qty += delta;
  const next = item.qty > 0 ? cart : cart.filter((i) => i.slug !== slug);
  saveCart(next);
  renderCartPanel();
}

function removeFromCart(slug) {
  saveCart(getCart().filter((i) => i.slug !== slug));
  renderCartPanel();
}

function cartCount(cart) {
  return (cart || getCart()).reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal(cart) {
  return (cart || getCart()).reduce((sum, i) => sum + i.qty * i.price, 0);
}

function formatPrice(n) {
  return "€" + n.toFixed(2).replace(".", ",");
}

function renderCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

function buildOrderText(cart) {
  const lines = cart.map(
    (i) =>
      `${i.qty}x ${i.name} (${formatPrice(i.price)} each) = ${formatPrice(i.qty * i.price)}`
  );
  return (
    "Hi Podcaps,\n\n" +
    "I'd like to order the following caps:\n\n" +
    lines.join("\n") +
    "\n\nTotal: " +
    formatPrice(cartTotal(cart)) +
    "\n\nMy shipping address:\n[name]\n[street, number]\n[postcode, city]\n[country]\n\nThanks!"
  );
}

function buildMailto(cart) {
  const subject = encodeURIComponent("Podcaps order");
  const body = encodeURIComponent(buildOrderText(cart));
  return `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;
  window.location.href = buildMailto(cart);
}

function renderCartPanel() {
  const panel = document.getElementById("cart-items");
  if (!panel) return;

  const cart = getCart();
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const fallback = document.getElementById("order-fallback-text");

  if (cart.length === 0) {
    panel.innerHTML = '<p class="cart-empty">Your cart is empty. Go pick a cap.</p>';
    if (totalEl) totalEl.textContent = formatPrice(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (fallback) fallback.textContent = "";
    return;
  }

  panel.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-line">
        <img src="images/products/${item.slug}.jpg" alt="${item.name}">
        <div class="line-name">${item.name}</div>
        <div class="qty-control">
          <button onclick="changeQty('${item.slug}', -1)" aria-label="Decrease quantity">–</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.slug}', 1)" aria-label="Increase quantity">+</button>
        </div>
        <div class="line-price">${formatPrice(item.qty * item.price)}</div>
        <button class="line-remove" onclick="removeFromCart('${item.slug}')">remove</button>
      </div>`
    )
    .join("");

  if (totalEl) totalEl.textContent = formatPrice(cartTotal(cart));
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (fallback) fallback.textContent = buildOrderText(cart);
}

function stepQty(slug, delta) {
  const span = document.getElementById("qty-" + slug);
  if (!span) return;
  const next = Math.max(1, (parseInt(span.textContent, 10) || 1) + delta);
  span.textContent = next;
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartBadge();
  renderCartPanel();

  document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { slug, name, price } = btn.dataset;
      const qtyInput = document.getElementById("qty-" + slug);
      const qty = qtyInput ? parseInt(qtyInput.textContent, 10) || 1 : 1;
      addToCart(slug, name, parseFloat(price), qty);
      const original = btn.textContent;
      btn.textContent = "Added ✓";
      setTimeout(() => (btn.textContent = original), 1200);
    });
  });

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);
});
