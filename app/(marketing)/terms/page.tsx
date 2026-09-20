import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return <LegalPage
    title="Terms of Service"
    intro="These Terms govern access to and use of SellCore, including merchant dashboards, storefront infrastructure, developer tools and related platform services."
    sections={[
      { title: "1. Agreement", body: <><p>By creating an account, using SellCore, or operating a storefront through SellCore, you agree to these Terms and any policies incorporated by reference. If you use SellCore for a business or organization, you represent that you have authority to bind that entity.</p></> },
      { title: "2. Accounts and security", body: <><p>You are responsible for information submitted through your account, maintaining the security of your credentials, and activity performed by users you authorize. You must provide accurate account information and promptly update it when necessary.</p></> },
      { title: "3. Merchant responsibility", body: <><p>Merchants are responsible for their products, descriptions, pricing, taxes, customer communications, refunds, fulfillment, legal disclosures and compliance with laws that apply to their business. SellCore provides commerce infrastructure and is not the merchant of record for a merchant’s storefront unless expressly stated otherwise.</p></> },
      { title: "4. Platform plans and billing", body: <><p>Plan features, limits and prices may vary by subscription. Paid subscriptions renew according to the billing interval selected unless canceled. Changes to pricing or material plan terms will be communicated where required.</p></> },
      { title: "5. Payments", body: <><p>Payment processing may be provided by third parties such as Stripe. Merchants may be required to maintain a valid connected payment account. Third-party payment services are governed by their own terms and may impose additional eligibility, verification or compliance requirements.</p></> },
      { title: "6. Acceptable use", body: <><p>You may not use SellCore for unlawful activity, fraud, abuse, infringement, malware distribution, unauthorized access, prohibited financial activity, or content that violates our Acceptable Use Policy. We may restrict or suspend access where reasonably necessary to protect users, the platform, payment providers or third parties.</p></> },
      { title: "7. Intellectual property", body: <><p>You retain ownership of content you upload to SellCore. You grant SellCore the limited rights necessary to host, process, display and transmit that content to provide the service. SellCore software, branding, documentation and platform materials remain owned by SellCore or its licensors.</p></> },
      { title: "8. Availability and changes", body: <><p>We work to keep SellCore available and reliable, but uninterrupted operation is not guaranteed. We may update, replace or discontinue features as the platform evolves. Where reasonably possible, we will avoid changes that unnecessarily disrupt active merchants.</p></> },
      { title: "9. Suspension and termination", body: <><p>You may stop using SellCore at any time. We may suspend or terminate access for material violations, security risks, legal requirements, non-payment, fraud or abuse. Data retention and deletion may be subject to legal, security and operational requirements.</p></> },
      { title: "10. Disclaimers and liability", body: <><p>SellCore is provided on an “as is” and “as available” basis to the extent permitted by law. We do not guarantee that every merchant product, third-party integration or external service will operate without interruption. Liability limitations apply only to the extent permitted by applicable law and do not exclude rights that cannot lawfully be excluded.</p></> },
      { title: "11. Changes to these Terms", body: <><p>We may update these Terms as SellCore changes. Material updates will be reflected by the revision date and, where required, additional notice.</p></> },
      { title: "12. Contact", body: <><p>Questions about these Terms can be sent through SellCore support. Formal legal contact information should be maintained in SellCore’s business records and published here when finalized.</p></> },
    ]}
  />;
}
