const API_URL = import.meta.env.VITE_API_URL || 'https://gavrilov-retail-store.matstart.ru';

function getHeaders(isJson = true) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(options.body ? true : false),
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.messages) ? data.messages.join(', ') : data.message || 'Ошибка запроса';
    throw new Error(message);
  }

  return data;
}

async function requestText(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(false),
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return '';
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.messages) ? data.messages.join(', ') : data.message || 'Ошибка запроса';
    throw new Error(message);
  }

  return response.text();
}

export const api = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),

  getCategories: () => request('/api/categories'),
  createCategory: (payload) => request('/api/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  getProducts: (params = '') => request(`/api/products${params}`),
  getProductsCount: (params = {}) => {
    const search = new URLSearchParams();
    if (params.activeOnly != null) search.set('activeOnly', String(params.activeOnly));
    const qs = search.toString();
    return request(`/api/products/count${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/api/products/${id}`),
  createProduct: (payload) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),

  getCart: () => request('/api/cart'),
  upsertCartItem: (productId, qty) => request(`/api/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ qty }) }),
  removeCartItem: (productId) => request(`/api/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => request('/api/cart', { method: 'DELETE' }),
  previewCart: (payload) => request('/api/cart/preview', { method: 'POST', body: JSON.stringify(payload) }),
  createOrder: (payload) => request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () => request('/api/orders/my'),
  getMyOrder: (id) => request(`/api/orders/my/${id}`),
  getOrders: () => request('/api/orders'),
  getOrderByPickupCode: (code) => request(`/api/orders/pickup/${encodeURIComponent(code)}`),
  updateOrderStatus: (id, payload) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getMyOrderPickupBarcode: (id) => requestText(`/api/orders/my/${id}/pickup-code/barcode`),

  getPickupPoints: () => request('/api/pickup-points'),
  getPickupPointsCount: () => request('/api/pickup-points/count'),
  getPickupPointsAdmin: () => request('/api/pickup-points/admin'),
  createPickupPoint: (payload) => request('/api/pickup-points', { method: 'POST', body: JSON.stringify(payload) }),
  updatePickupPoint: (id, payload) => request(`/api/pickup-points/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePickupPoint: (id) => request(`/api/pickup-points/${id}`, { method: 'DELETE' }),

  getUsers: () => request('/api/users'),
  updateUserRole: (id, payload) => request(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(payload) }),

  askAssistant: (payload) => request('/api/assistant/ask', { method: 'POST', body: JSON.stringify(payload) }),
  getAssistantQuota: () => request('/api/assistant/quota'),
  listAssistantMessages: (params = {}) => {
    const search = new URLSearchParams();
    if (params.sinceId != null) search.set('sinceId', String(params.sinceId));
    if (params.limit != null) search.set('limit', String(params.limit));
    const qs = search.toString();
    return request(`/api/assistant/messages${qs ? `?${qs}` : ''}`);
  },
  sendAssistantMessage: (payload) => request('/api/assistant/messages', { method: 'POST', body: JSON.stringify(payload) })
};
