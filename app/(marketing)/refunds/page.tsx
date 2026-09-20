import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return <LegalPage
    title="Refund Policy"
    intro="This policy covers fees paid directly to SellCore for use of the SellCore platform. Purchases made from independent merchants are governed by the merchant's own refund policy."
    sections={[
      { title: "SellCore subscription fees", body: <><p>Unless required by applicable law or expressly stated otherwise, paid SellCore plan fees are non-refundable once a billing period begins. Canceling a subscription stops future renewal but does not automatically refund the current billing period.</p></> },
      { title: "Duplicate or incorrect charges", body: <><p>If you believe SellCore charged you more than once for the same platform subscription, charged an incorrect amount, or continued billing after a confirmed cancellation, contact SellCore support so the transaction can be reviewed.</p></> },
      { title: "Merchant storefront purchases", body: <><p>SellCore does not set the refund rules for products sold by independent merchants. Customers seeking a refund for a merchant product should contact that merchant using the support details displayed by the store. Payment disputes may also be subject to the rules of the relevant payment provider.</p></> },
      { title: "Abuse and chargebacks", body: <><p>Fraudulent disputes, intentional chargeback abuse or attempts to obtain both the service and a reversal may result in account restrictions where permitted by law. Legitimate billing disputes should be raised with support first whenever practical.</p></> },
      { title: "Legal rights", body: <><p>Nothing in this policy removes refund, cancellation or consumer rights that cannot lawfully be waived in your jurisdiction.</p></> },
    ]}
  />;
}
