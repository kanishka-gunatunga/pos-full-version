
const TAG = "[order-edit-refund]";

export function debugOrderEditRefund(step: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  if (data && Object.keys(data).length > 0) {
    console.debug(TAG, step, data);
  } else {
    console.debug(TAG, step);
  }
}
