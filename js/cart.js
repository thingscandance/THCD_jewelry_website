const CART_KEY = "thcd_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, size) {
  const product = getProductById(productId);
  if (!product || !product.inStock) return false;

  const cart = getCart();
  const key = size ? `${productId}-${size}` : `${productId}`;
  if (cart.find(item => item.key === key)) return false;

  cart.push({ key, productId, size: size || null, qty: 1 });
  saveCart(cart);
  return true;
}

function removeFromCart(key) {
  const cart = getCart().filter(item => item.key !== key);
  saveCart(cart);
}

function updateQty(key, qty) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(key);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function getCartCount() {
  return getCart().length;
}

function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

document.addEventListener("DOMContentLoaded", updateCartUI);
