import Image from "next/image";
export function Logo({ size=34, label=true }: { size?:number; label?:boolean }) { return <div className="inline-flex items-center gap-2.5"><Image src="/assets/sellcore-logo.png" alt="SellCore" width={size} height={size} className="object-contain" priority/>{label && <span className="font-semibold tracking-tight">SELLCORE</span>}</div>; }
