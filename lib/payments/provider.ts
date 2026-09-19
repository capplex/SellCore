import "server-only";

/**
 * Boundary for merchant payment providers. Stripe is the production adapter in
 * this repository. Additional providers must implement equivalent server-side
 * verification rather than being simulated in the storefront.
 */
export interface MerchantPaymentProvider {
  readonly id: string;
  createCheckout(input: unknown): Promise<{ url: string; providerSessionId: string }>;
  refund(input: { providerPaymentId: string; amountMinor?: number }): Promise<{ providerRefundId: string }>;
  verifyWebhook(rawBody: string, signature: string): Promise<unknown>;
}
