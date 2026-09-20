import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Acceptable Use Policy" };

export default function AcceptableUsePage() {
  return <LegalPage
    title="Acceptable Use Policy"
    intro="SellCore is built for legitimate digital commerce. This policy describes activity that is not permitted on the platform."
    sections={[
      { title: "Illegal activity", body: <><p>Do not use SellCore to sell, distribute, facilitate or promote goods, services or activity that is unlawful where the merchant, customer or platform operates.</p></> },
      { title: "Fraud and deception", body: <><p>Do not use SellCore for payment fraud, impersonation, phishing, deceptive sales practices, stolen credentials, unauthorized account access, fake fulfillment, chargeback manipulation or other fraudulent conduct.</p></> },
      { title: "Malware and harmful code", body: <><p>Do not distribute malware, credential stealers, ransomware, destructive code, unauthorized surveillance software or files primarily intended to compromise systems or users.</p></> },
      { title: "Intellectual property and privacy", body: <><p>Do not sell or distribute content you do not have the right to use, or unlawfully disclose personal, confidential or proprietary information belonging to another person or organization.</p></> },
      { title: "Platform abuse", body: <><p>Do not attempt to bypass plan limits, compromise tenant isolation, interfere with platform availability, abuse APIs or webhooks, probe other merchants' data, or evade security controls.</p></> },
      { title: "Enforcement", body: <><p>SellCore may investigate reports, restrict content, suspend stores or accounts, preserve relevant records, and cooperate with payment providers or lawful requests where reasonably necessary to protect the platform and its users.</p></> },
    ]}
  />;
}
