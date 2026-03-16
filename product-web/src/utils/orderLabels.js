export const ORDER_STATUS_LABELS = {
  NEW: 'Новый',
  PROCESSING: 'В обработке',
  READY_FOR_PICKUP: 'Готов к получению',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменен'
};

export const DELIVERY_TYPE_LABELS = {
  COURIER: 'Курьер',
  PICKUP: 'Самовывоз'
};

export const PICKUP_PROVIDER_LABELS = {
  RUSSIAN_POST: 'Почта России',
  CDEK: 'СДЭК',
  YANDEX_MARKET: 'Яндекс Маркет',
  BOXBERRY: 'Boxberry'
};

export function getOrderStatusLabel(value) {
  return ORDER_STATUS_LABELS[value] || value;
}

export function getDeliveryTypeLabel(value) {
  return DELIVERY_TYPE_LABELS[value] || value;
}

export function getPickupProviderLabel(value) {
  return PICKUP_PROVIDER_LABELS[value] || value;
}
