
export interface PaymentInitiationResult {
  reference: string;
  authorizationUrl?: string;
  clientSecret?: string;
  accessCode?: string;
}

export interface PaymentProvider {
  initiate(
    args: {
      email: string;
      amount: number;
      currency: string;
      reference: string;
      metadata: Record<string, any>;
    }
  ): Promise<PaymentInitiationResult>;

  verify(reference: string): Promise<any>;

  handleWebhook(payload: any): Promise<void>;
}
