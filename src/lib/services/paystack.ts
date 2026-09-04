import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_dummy_key';
const PAYSTACK_BASE_URL = (process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co').replace(/\/$/, '');

function isMockMode(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY;
  return (
    process.env.PAYSTACK_MOCK_MODE === 'true' ||
    !key ||
    key === 'sk_test_dummy_key' ||
    key.startsWith('mock_')
  );
}

export interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees?: number;
    customer: {
      id: number;
      email: string;
      customer_code: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

export interface CreateRecipientParams {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}

export interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data: {
    recipient_code: string;
    type: string;
    name: string;
    details: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

export interface InitiateTransferParams {
  amountKobo: number;
  recipientCode: string;
  reference: string;
  reason?: string;
}

export interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: string; // 'success', 'pending', 'failed'
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

async function paystackRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${PAYSTACK_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => ({ status: false, message: 'Invalid JSON response from Paystack' }));

  if (!response.ok && !json.status) {
    throw new Error(json.message || `Paystack HTTP error ${response.status}`);
  }

  return json as T;
}

export class PaystackService {
  /**
   * Initializes a Paystack transaction and returns checkout URL.
   */
  static async initializeTransaction(params: InitializeTransactionParams): Promise<PaystackInitializeResponse['data']> {
    if (isMockMode()) {
      return {
        authorization_url: `https://checkout.paystack.com/mock-checkout-${params.reference}`,
        access_code: `mock_code_${params.reference}`,
        reference: params.reference,
      };
    }

    const payload = {
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    };

    const res = await paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.status || !res.data) {
      throw new Error(res.message || 'Failed to initialize Paystack transaction');
    }

    return res.data;
  }

  /**
   * Verifies a Paystack transaction server-side by reference.
   */
  static async verifyTransaction(reference: string): Promise<PaystackVerifyResponse['data']> {
    if (isMockMode()) {
      return {
        id: 100001,
        domain: 'test',
        status: 'success',
        reference,
        amount: 9000000,
        message: 'Mock verification success',
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: 'card',
        currency: 'NGN',
        ip_address: '127.0.0.1',
        metadata: {},
        fees: 750,
        customer: {
          id: 99,
          email: 'test@customer.com',
          customer_code: 'CUS_mock123',
        },
      };
    }

    const res = await paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    });

    if (!res.status || !res.data) {
      throw new Error(res.message || 'Failed to verify transaction with Paystack');
    }

    return res.data;
  }

  /**
   * Creates a Paystack transfer recipient for payouts.
   */
  static async createTransferRecipient(params: CreateRecipientParams): Promise<PaystackRecipientResponse['data']> {
    if (isMockMode()) {
      return {
        recipient_code: `RCP_mock_${Date.now()}`,
        type: 'nuban',
        name: params.name,
        details: {
          account_number: params.accountNumber,
          account_name: params.name,
          bank_code: params.bankCode,
          bank_name: 'Mock Bank',
        },
      };
    }

    const payload = {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency || 'NGN',
    };

    const res = await paystackRequest<PaystackRecipientResponse>('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.status || !res.data) {
      throw new Error(res.message || 'Failed to create transfer recipient');
    }

    return res.data;
  }

  /**
   * Initiates a withdrawal/transfer from Paystack.
   */
  static async initiateTransfer(params: InitiateTransferParams): Promise<PaystackTransferResponse['data']> {
    if (isMockMode()) {
      return {
        reference: params.reference,
        integration: 1001,
        domain: 'test',
        amount: params.amountKobo,
        currency: 'NGN',
        source: 'balance',
        reason: params.reason || 'Business withdrawal',
        recipient: 888,
        status: 'success',
        transfer_code: `TRF_mock_${Date.now()}`,
        id: 5001,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const payload = {
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason || 'Voxy Business Balance Withdrawal',
    };

    const res = await paystackRequest<PaystackTransferResponse>('/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.status || !res.data) {
      throw new Error(res.message || 'Failed to initiate transfer');
    }

    return res.data;
  }

  /**
   * Verifies the HMAC-SHA512 signature on incoming Paystack webhooks.
   */
  static verifyWebhookSignature(signature: string | null, rawBody: string): boolean {
    if (!signature) return false;
    if (isMockMode() && signature === 'valid_mock_signature') {
      return true;
    }

    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
    return hash === signature;
  }
}
