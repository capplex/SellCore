import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return <LegalPage
    title="Disclaimer"
    intro="SellCore provides hosted commerce infrastructure. Merchants remain responsible for the products and services they offer through their storefronts."
    sections={[
      { title: "Independent merchants", body: <><p>A storefront powered by SellCore may be operated by an independent merchant. Unless SellCore is expressly identified as the seller, SellCore does not create, own, endorse, warrant or fulfill the merchant's products.</p></> },
      { title: "Third-party services", body: <><p>SellCore may integrate with payment processors, email providers, domain providers and other external services. Their availability, policies and actions are outside SellCore's direct control.</p></> },
      { title: "Platform information", body: <><p>Documentation, examples, dashboards and analytics are provided for operational purposes. Merchants should independently verify information that is important for tax, accounting, legal, security or compliance decisions.</p></> },
      { title: "No professional advice", body: <><p>SellCore documentation and platform materials are not legal, tax, accounting or financial advice. Merchants should obtain professional advice where appropriate for their circumstances.</p></> },
    ]}
  />;
}
