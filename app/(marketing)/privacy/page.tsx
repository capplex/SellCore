import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalPage
    title="Privacy Policy"
    intro="This policy explains how SellCore handles personal information when people use the SellCore platform, merchant dashboard, storefront infrastructure and related services."
    sections={[
      { title: "1. Information we collect", body: <><p>We may collect account information such as email address, display name, authentication data and account settings; merchant information such as store details, team membership and billing status; customer and order information processed on behalf of merchants; technical data such as IP address, device/browser information, logs and security events; and information submitted through support or developer tools.</p></> },
      { title: "2. How we use information", body: <><p>We use information to provide and secure SellCore, authenticate users, operate merchant storefronts, process platform billing, support merchants and customers, detect abuse, maintain logs, improve reliability, comply with legal obligations and communicate service-related information.</p></> },
      { title: "3. Merchant storefront data", body: <><p>For data submitted by customers to an independent merchant storefront, the merchant determines how that customer data is used for the merchant's business. SellCore processes that information to provide the platform. Merchants remain responsible for their own privacy notices and lawful processing obligations.</p></> },
      { title: "4. Service providers", body: <><p>SellCore may rely on infrastructure, authentication, database, payment, email, analytics, security and hosting providers. Those providers receive information only as needed to perform services for SellCore and are subject to their own legal and contractual obligations.</p></> },
      { title: "5. Payments", body: <><p>Payment providers such as Stripe may collect and process payment information directly. SellCore does not need to store complete card numbers to operate the platform.</p></> },
      { title: "6. Cookies and local storage", body: <><p>SellCore may use cookies or similar storage for authentication, security, storefront carts, preferences and essential platform functionality. Additional analytics or optional tracking should be disclosed and controlled as required by applicable law.</p></> },
      { title: "7. Retention", body: <><p>We retain information for as long as reasonably necessary to provide SellCore, maintain security and audit records, resolve disputes, comply with legal obligations and support legitimate business needs. Retention periods can differ by data category.</p></> },
      { title: "8. Security", body: <><p>SellCore uses technical and organizational safeguards intended to protect platform data, including access controls, tenant isolation, encrypted secrets and restricted file access where appropriate. No online service can guarantee absolute security.</p></> },
      { title: "9. Your rights", body: <><p>Depending on where you live, you may have rights to access, correct, delete, restrict or export certain personal information, or object to certain processing. Requests may be subject to identity verification and legal exceptions.</p></> },
      { title: "10. International processing", body: <><p>SellCore and its service providers may process information in more than one country. Where required, appropriate safeguards should be used for international transfers of personal information.</p></> },
      { title: "11. Changes", body: <><p>We may update this Privacy Policy to reflect changes to SellCore, service providers or legal requirements. The revision date above indicates the latest version.</p></> },
      { title: "12. Contact", body: <><p>Privacy questions and rights requests can be submitted through SellCore support. A dedicated privacy contact can be added here when the final business contact details are confirmed.</p></> },
    ]}
  />;
}
