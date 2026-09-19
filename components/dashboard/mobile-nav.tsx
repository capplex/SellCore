"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { dashboardNav } from "@/components/dashboard/sidebar";

export function MobileNav(){
  const [open,setOpen]=useState(false);
  return <>
    <button onClick={()=>setOpen(true)} className="rounded-md p-2 text-sc-secondary lg:hidden" aria-label="Open navigation"><Menu size={19}/></button>
    {open&&<div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation overlay" onClick={()=>setOpen(false)} className="absolute inset-0 bg-black/70"/><aside className="absolute inset-y-0 left-0 w-[82vw] max-w-72 border-r border-sc-border bg-[#080808] p-4"><div className="mb-4 flex items-center justify-between"><span className="font-semibold">SellCore</span><button onClick={()=>setOpen(false)} aria-label="Close navigation" className="rounded-md p-2"><X size={18}/></button></div><nav className="space-y-1">{dashboardNav.map(([label,href,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sc-secondary hover:bg-[#121212] hover:text-white"><Icon size={16}/>{label}</Link>)}</nav></aside></div>}
  </>;
}
