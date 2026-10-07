import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';

function getRequestBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) {
    return `${proto}://${host}`;
  }
  return req.nextUrl?.origin || 'http://localhost:3000';
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCallbackHtml({
  status,
  reference,
  receiptNum = '',
  slug = '',
  redirectUrl,
  errorMessage = '',
}: {
  status: 'success' | 'failed';
  reference: string;
  receiptNum?: string;
  slug?: string;
  redirectUrl: string;
  errorMessage?: string;
}) {
  const isSuccess = status === 'success';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isSuccess ? 'Payment Successful' : 'Payment Issue'} • Voxy</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #060709;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: #0f1117;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 36px 28px;
      text-align: center;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .badge {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${isSuccess ? 'rgba(0, 209, 143, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      border: 1px solid ${isSuccess ? 'rgba(0, 209, 143, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      color: ${isSuccess ? '#00D18F' : '#ef4444'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      font-weight: bold;
      margin: 0 auto 20px;
    }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
    p { font-size: 13px; color: #a1a1aa; margin: 0; line-height: 1.5; }
    .ref {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #71717a;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 6px 10px;
      margin-top: 18px;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: ${isSuccess ? '#00D18F' : '#27272a'};
      color: ${isSuccess ? '#000000' : '#ffffff'};
      font-weight: 600;
      font-size: 13px;
      border-radius: 12px;
      text-decoration: none;
      transition: opacity 0.2s;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${isSuccess ? '✓' : '✕'}</div>
    <h1>${isSuccess ? 'Payment Completed!' : 'Payment Issue'}</h1>
    <p>${
      isSuccess
        ? 'Your payment was verified. Closing this window and returning to your chat...'
        : escapeHtml(errorMessage || 'We could not verify your payment. Returning to chat...')
    }</p>
    <div class="ref">Ref: ${escapeHtml(reference)}</div>
    <a href="${escapeHtml(redirectUrl)}" id="redirectBtn" class="btn" style="display:none;">Return to Chat</a>
  </div>
  <script>
    (function() {
      var payload = {
        type: '${isSuccess ? 'VOXY_PAYMENT_SUCCESS' : 'VOXY_PAYMENT_FAILED'}',
        reference: ${JSON.stringify(reference)},
        receipt: ${JSON.stringify(receiptNum)},
        slug: ${JSON.stringify(slug)},
        error: ${JSON.stringify(errorMessage)}
      };

      // 1. Post to opener if opened via window.open()
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
        }
      } catch (e) {}

      // 2. BroadcastChannel for cross-tab notifications
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          var bc = new BroadcastChannel('voxy_payment');
          bc.postMessage(payload);
          bc.close();
        }
      } catch (e) {}

      // 3. LocalStorage for reliable cross-window storage event
      try {
        localStorage.setItem('voxy_last_payment_event', JSON.stringify({
          ...payload,
          timestamp: Date.now()
        }));
      } catch (e) {}

      // If opened in a popup window, attempt to close
      var isPopup = Boolean(window.opener || window.name === 'voxy_payment_popup');
      if (isPopup) {
        setTimeout(function() {
          try {
            window.close();
          } catch(e) {}
          // If browser prevented window.close(), smoothly redirect as fallback
          setTimeout(function() {
            window.location.replace(${JSON.stringify(redirectUrl)});
          }, 350);
        }, 800);
      } else {
        // Fallback for regular tab redirect
        setTimeout(function() {
          window.location.replace(${JSON.stringify(redirectUrl)});
        }, 500);
      }

      // Show manual return button after 2.5s if script execution was paused
      setTimeout(function() {
        var btn = document.getElementById('redirectBtn');
        if (btn) btn.style.display = 'inline-block';
      }, 2500);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// GET /api/v1/payments/callback
// Paystack browser redirect callback route (Dynamic for all businesses)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const paramSlug = searchParams.get('businessSlug') || searchParams.get('slug');

  if (!reference) {
    return NextResponse.json({ status: 'ERROR', error: 'Missing payment reference' }, { status: 400 });
  }

  let slug = paramSlug || '';
  const baseUrl = getRequestBaseUrl(req);

  try {
    // Lookup payment and business to resolve slug dynamically
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { business: true, order: { include: { business: true } } },
    });

    if (payment?.business?.slug) {
      slug = payment.business.slug;
    } else if (payment?.order?.business?.slug) {
      slug = payment.order.business.slug;
    }

    const result = await PaymentService.verifyPayment(reference);

    const orderId = result.payment?.orderId;
    if (!slug && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { business: true },
      });
      if (order?.business?.slug) {
        slug = order.business.slug;
      }
    }

    const receiptNum = result.receipt?.receiptNumber || '';
    const redirectPath = slug ? `/${encodeURIComponent(slug)}/chat` : '/chat';
    const redirectUrl = `${baseUrl}${redirectPath}?payment=success&reference=${encodeURIComponent(reference)}&receipt=${encodeURIComponent(receiptNum)}`;

    return renderCallbackHtml({
      status: 'success',
      reference,
      receiptNum,
      slug,
      redirectUrl,
    });
  } catch (err: any) {
    console.error('[PaymentCallback] Verification error:', err?.message);

    if (!slug && reference) {
      const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { business: true, order: { include: { business: true } } },
      }).catch(() => null);
      slug = payment?.business?.slug || payment?.order?.business?.slug || '';
    }

    const redirectPath = slug ? `/${encodeURIComponent(slug)}/chat` : '/chat';
    const redirectUrl = `${baseUrl}${redirectPath}?payment=failed&reference=${encodeURIComponent(reference)}&error=${encodeURIComponent(err.message || 'Payment verification failed')}`;

    return renderCallbackHtml({
      status: 'failed',
      reference,
      slug,
      redirectUrl,
      errorMessage: err.message || 'Payment verification failed',
    });
  }
}
