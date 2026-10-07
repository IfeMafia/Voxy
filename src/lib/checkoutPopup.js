/**
 * Helper to open Paystack or checkout links in a dedicated, centered popup window.
 * If the browser blocks popups, gracefully falls back to opening in a standard new tab.
 * 
 * @param {string} url - Checkout URL
 * @returns {Window | null}
 */
export function openPaymentPopup(url) {
  if (typeof window === "undefined" || !url) return null;

  const width = 520;
  const height = 760;

  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const innerWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const innerHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = dualScreenLeft + Math.max(0, (innerWidth - width) / 2);
  const top = dualScreenTop + Math.max(0, (innerHeight - height) / 2);

  try {
    const popup = window.open(
      url,
      "voxy_payment_popup",
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`
    );

    if (popup && !popup.closed) {
      popup.focus();
      return popup;
    }
  } catch (err) {
    console.warn("[CheckoutPopup] Pop-up blocked or failed to open:", err);
  }

  // Fallback to normal new tab if popup is blocked
  return window.open(url, "_blank", "noopener,noreferrer");
}
