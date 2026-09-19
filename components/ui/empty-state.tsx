import { ReactNode } from "react";
export function EmptyState({ title, children }: { title:string; children?:ReactNode }) { return <div className="rounded-xl border border-dashed border-[#2c2c2c] p-10 text-center"><h3 className="font-semibold">{title}</h3>{children && <div className="mt-2 text-sm text-sc-secondary">{children}</div>}</div>; }
