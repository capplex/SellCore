import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileCheck2 } from "lucide-react";

export const metadata: Metadata = { title: "Legal", description: "SellCore platform terms, privacy, refunds, acceptable use and disclaimer documents." };

const documents = [
  ["Terms of Service", "/terms", "The rules governing access to and use of the SellCore platform."],
  ["Privacy Policy", "/privacy", "How SellCore handles account, merchant, customer and operational data."],
  ["Refund Policy", "/refunds", "How platform subscription and merchant-store purchase refunds are handled."],
  ["Acceptable Use Policy", "/acceptable-use", "The products, content and activity that are not permitted on SellCore."],
  ["Disclaimer", "/disclaimer", "Important limitations and responsibilities for platform and merchant activity."],
];

export default function LegalIndex() {
  return <main className="mx-auto max-w-6xl px-5 py-20">
    <p className="text-xs font-semibold uppercase tracking-[.18em] text-sc-red">SellCore legal</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">Legal documents.</h1>
    <p className="mt-5 max-w-2xl text-lg leading-8 text-sc-secondary">Policies for the SellCore platform, merchant workspaces and customer-facing commerce flows.</p>
    <div className="mt-12 grid gap-4 md:grid-cols-2">
      {documents.map(([title, href, description]) => <Link key={href} href={href} className="group rounded-xl border border-sc-border bg-sc-card p-6 transition hover:border-[#4a2427]">
        <FileCheck2 size={20} className="text-sc-red"/>
        <h2 className="mt-6 text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-sc-secondary">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm text-[#ff8085]">Read document <ArrowRight size={14} className="transition group-hover:translate-x-1"/></span>
      </Link>)}
    </div>
  </main>;
}
