export interface PaystackBank {
  name: string;
  code: string;
  slug?: string;
  active?: boolean;
}

export interface ResolveAccountResponse {
  account_number: string;
  account_name: string;
  bank_id?: number;
}

export interface PaystackRecipientResponse {
  recipient_code: string;
  name: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

export interface PaystackTransferResponse {
  transfer_code: string;
  reference: string;
  status: string;
  amount: number;
}

const DEFAULT_BANKS: PaystackBank[] = [
  { name: 'Access Bank', code: '044', active: true },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', active: true },
  { name: 'Zenith Bank', code: '057', active: true },
  { name: 'United Bank for Africa (UBA)', code: '033', active: true },
  { name: 'First Bank of Nigeria', code: '011', active: true },
  { name: 'Stanbic IBTC Bank', code: '221', active: true },
  { name: 'Sterling Bank', code: '232', active: true },
  { name: 'Fidelity Bank', code: '070', active: true },
  { name: 'Union Bank of Nigeria', code: '032', active: true },
  { name: 'Wema Bank (ALAT)', code: '035', active: true },
  { name: 'Kuda Microfinance Bank', code: '50211', active: true },
  { name: 'OPay Digital Services', code: '999992', active: true },
  { name: 'Palmpay', code: '999991', active: true },
  { name: 'Moniepoint MFB', code: '50515', active: true },
];

export class PaystackProvider {
  private secretKey: string;
  private isLiveOrTestKey: boolean;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    // A valid Paystack secret key starts with sk_test_ or sk_live_ and has length > 20
    this.isLiveOrTestKey = !!this.secretKey && 
      (this.secretKey.startsWith('sk_test_') || this.secretKey.startsWith('sk_live_')) &&
      !this.secretKey.includes('your_') &&
      !this.secretKey.includes('placeholder') &&
      this.secretKey.length > 20;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List supported commercial & microfinance banks
   */
  async getBankList(): Promise<PaystackBank[]> {
    if (!this.isLiveOrTestKey) {
      return DEFAULT_BANKS;
    }

    try {
      const response = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100', {
        headers: this.getHeaders(),
      });
      const data = await response.json() as any;

      if (data && data.status && Array.isArray(data.data)) {
        return data.data.map((b: any) => ({
          name: b.name,
          code: b.code,
          slug: b.slug,
          active: b.active,
        }));
      }
      return DEFAULT_BANKS;
    } catch (err: any) {
      console.warn('⚠️ Paystack live bank fetch failed, returning default banks:', err.message);
      return DEFAULT_BANKS;
    }
  }

  /**
   * Verify bank account number with Paystack NUBAN resolve API
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<ResolveAccountResponse> {
    const trimmedAcc = accountNumber.trim();
    const trimmedBank = bankCode.trim();

    if (!this.isLiveOrTestKey) {
      // Mock account resolution for testing
      const bank = DEFAULT_BANKS.find(b => b.code === trimmedBank);
      const bankTitle = bank ? bank.name.split(' ')[0].toUpperCase() : 'BANK';
      return {
        account_number: trimmedAcc,
        account_name: `JEQUEX VERIFIED MERCHANT (${bankTitle})`,
      };
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${trimmedAcc}&bank_code=${trimmedBank}`,
        {
          headers: this.getHeaders(),
        }
      );
      const data = await response.json() as any;

      if (data && data.status) {
        return {
          account_number: data.data.account_number,
          account_name: data.data.account_name,
        };
      }
      throw new Error(data?.message || 'Could not resolve account number');
    } catch (err: any) {
      throw new Error(`Paystack Account Resolution Error: ${err.message}`);
    }
  }

  /**
   * Create Paystack transfer recipient for payouts
   */
  async createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string,
    currency = 'NGN'
  ): Promise<PaystackRecipientResponse> {
    if (!this.isLiveOrTestKey) {
      return {
        recipient_code: `RCP_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        details: {
          account_number: accountNumber,
          account_name: name,
          bank_code: bankCode,
          bank_name: DEFAULT_BANKS.find(b => b.code === bankCode)?.name || 'Default Bank',
        },
      };
    }

    try {
      const response = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'nuban',
          name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency,
        }),
      });
      const data = await response.json() as any;

      if (data && data.status) {
        const d = data.data;
        return {
          recipient_code: d.recipient_code,
          name: d.name,
          details: {
            account_number: d.details.account_number,
            account_name: d.details.account_name,
            bank_code: d.details.bank_code,
            bank_name: d.details.bank_name,
          },
        };
      }
      throw new Error(data?.message || 'Failed to create transfer recipient');
    } catch (err: any) {
      throw new Error(`Paystack Create Recipient Error: ${err.message}`);
    }
  }

  /**
   * Initiate payout transfer to a merchant
   */
  async initiateTransfer(
    recipientCode: string,
    amount: number, // In main currency unit, e.g., 5000.00
    reference: string,
    reason: string,
    currency = 'NGN'
  ): Promise<PaystackTransferResponse> {
    const amountInKobo = Math.round(amount * 100);

    if (!this.isLiveOrTestKey) {
      return {
        transfer_code: `TRF_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        reference,
        status: 'success',
        amount,
      };
    }

    try {
      const response = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: 'balance',
          amount: amountInKobo,
          recipient: recipientCode,
          reason,
          reference,
          currency,
        }),
      });
      const data = await response.json() as any;

      if (data && data.status) {
        const d = data.data;
        return {
          transfer_code: d.transfer_code,
          reference: d.reference || reference,
          status: d.status || 'success',
          amount,
        };
      }
      throw new Error(data?.message || 'Transfer failed');
    } catch (err: any) {
      throw new Error(`Paystack Transfer Error: ${err.message}`);
    }
  }

  /**
   * Initialize customer transaction
   */
  async initializePayment(
    email: string,
    amount: number,
    reference: string,
    callbackUrl?: string,
    metadata?: Record<string, any>
  ): Promise<{ authorization_url: string; access_code: string; reference: string }> {
    const amountInKobo = Math.round(amount * 100);

    if (!this.isLiveOrTestKey) {
      return {
        authorization_url: `https://checkout.paystack.com/mock-pay?ref=${reference}`,
        access_code: `acc_${reference}`,
        reference,
      };
    }

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          reference,
          callback_url: callbackUrl,
          metadata,
        }),
      });
      const data = await response.json() as any;

      if (data && data.status) {
        return data.data;
      }
      throw new Error(data?.message || 'Payment initialization failed');
    } catch (err: any) {
      throw new Error(`Paystack Init Payment Error: ${err.message}`);
    }
  }

  /**
   * Verify customer payment transaction
   */
  async verifyPayment(reference: string): Promise<{ status: string; amount: number; reference: string; metadata?: any }> {
    if (!this.isLiveOrTestKey) {
      return {
        status: 'success',
        amount: 1000,
        reference,
        metadata: {},
      };
    }

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: this.getHeaders(),
      });
      const data = await response.json() as any;

      if (data && data.status) {
        const d = data.data;
        return {
          status: d.status,
          amount: d.amount / 100,
          reference: d.reference,
          metadata: d.metadata,
        };
      }
      throw new Error(data?.message || 'Verification failed');
    } catch (err: any) {
      throw new Error(`Paystack Verify Payment Error: ${err.message}`);
    }
  }

  /**
   * Refund transaction
   */
  async createRefund(
    transactionReference: string,
    amount?: number,
    merchantNote?: string
  ): Promise<{ status: string; refund_reference: string }> {
    if (!this.isLiveOrTestKey) {
      return {
        status: 'processed',
        refund_reference: `REF_mock_${Date.now()}`,
      };
    }

    try {
      const payload: any = {
        transaction: transactionReference,
        merchant_note: merchantNote || 'Customer refund requested',
      };
      if (amount) {
        payload.amount = Math.round(amount * 100);
      }

      const response = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json() as any;

      if (data && data.status) {
        return {
          status: data.data.status,
          refund_reference: data.data.reference || `REF_${Date.now()}`,
        };
      }
      throw new Error(data?.message || 'Refund failed');
    } catch (err: any) {
      throw new Error(`Paystack Refund Error: ${err.message}`);
    }
  }
}

export const paystackProvider = new PaystackProvider();
