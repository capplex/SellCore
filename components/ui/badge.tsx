import { ReactNode } from "react";
export function Badge({ children }: { children: ReactNode }) { return <span className="inline-flex rounded-full border border-[#3a1517] bg-[#18090a] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#ff7a80]">{children}</span>; }
