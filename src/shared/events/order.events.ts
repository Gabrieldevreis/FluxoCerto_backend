export const ORDER_EVENTS = {
  CONFIRMED: 'order.confirmed',
  CANCELLED: 'order.cancelled',
  DONE: 'order.done',
} as const;

export interface OrderConfirmedPayload {
  orderId: string;
  tableNumber: number;
  waiterId: string;
  total: number;
  items: Array<{
    orderItemId: string;
    menuItemId: string;
    recipeId: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface OrderCancelledPayload {
  orderId: string;
  tableNumber: number;
  reason?: string;
}

export interface OrderDonePayload {
  orderId: string;
  tableNumber: number;
}
