"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, ShoppingBag, Smartphone } from "lucide-react";
import type { StoreSection } from "@/components/dashboard/section-builder";

type PreviewProduct = { id: string; name: string; price: string };

type PreviewSettings = {
  accent: string;
  background: string;
  text: string;
  radius: string;
  font: string;
  headerStyle: string;
  cardStyle: string;
  productLayout: string;
  stylePreset: string;
  backgroundStyle: string;
  buttonStyle: string;
  motion: string;
};

const fonts: Record<string,string> = {
  Manrope: "var(--font-manrope), sans-serif",
  "Space Grotesk": "var(--font-space-grotesk), sans-serif",
  Sora: "var(--font-sora), sans-serif",
  "Plus Jakarta Sans": "var(--font-plus-jakarta-sans), sans-serif",
  "system-ui": "system-ui, sans-serif",
};

export function ThemeLivePreview({
  formId,
  storeName,
  storeDescription,
  initialSettings,
  initialSections,
  products,
}: {
  formId: string;
  storeName: string;
  storeDescription: string;
  initialSettings: PreviewSettings;
  initialSections: StoreSection[];
  products: PreviewProduct[];
}) {
  const [device,setDevice]=useState<"desktop"|"mobile">("desktop");
  const [settings,setSettings]=useState(initialSettings);
  const [sections,setSections]=useState(initialSections);

  useEffect(()=>{
    const form=document.getElementById(formId) as HTMLFormElement|null;
    if(!form)return;
    const sync=()=>{
      const data=new FormData(form);
      setSettings((current)=>({
        ...current,
        accent:String(data.get("accent")||current.accent),
        background:String(data.get("background")||current.background),
        text:String(data.get("text")||current.text),
        radius:String(data.get("radius")||current.radius),
        font:String(data.get("font")||current.font),
        headerStyle:String(data.get("headerStyle")||current.headerStyle),
        cardStyle:String(data.get("cardStyle")||current.cardStyle),
        productLayout:String(data.get("productLayout")||current.productLayout),
        stylePreset:String(data.get("stylePreset")||current.stylePreset),
        backgroundStyle:String(data.get("backgroundStyle")||current.backgroundStyle),
        buttonStyle:String(data.get("buttonStyle")||current.buttonStyle),
        motion:String(data.get("motion")||current.motion),
      }));
    };
    const sectionSync=(event:Event)=>setSections((event as CustomEvent<StoreSection[]>).detail);
    form.addEventListener("input",sync);
    form.addEventListener("change",sync);
    window.addEventListener("sellcore:theme-sections",sectionSync);
    return ()=>{
      form.removeEventListener("input",sync);
      form.removeEventListener("change",sync);
      window.removeEventListener("sellcore:theme-sections",sectionSync);
    };
  },[formId]);

  const previewStyle=useMemo(()=>({
    background:settings.background,
    color:settings.text,
    fontFamily:fonts[settings.font]||fonts.Manrope,
    "--accent":settings.accent,
    "--radius":settings.radius,
    "--store-bg":settings.background,
  }) as React.CSSProperties,[settings]);

  const productItems=products.length?products:[
    {id:"one",name:"Creator bundle",price:"$29.00"},
    {id:"two",name:"Pro license",price:"$49.00"},
    {id:"three",name:"Digital toolkit",price:"$19.00"},
  ];

  return <section className="overflow-hidden rounded-xl border border-sc-border bg-sc-card">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sc-border px-4 py-3">
      <div><h2 className="font-semibold">Live visual preview</h2><p className="text-xs text-sc-muted">Updates while you edit</p></div>
      <div className="flex rounded-lg border border-sc-border bg-[#080808] p-1">
        <button type="button" onClick={()=>setDevice("desktop")} aria-label="Desktop preview" className={`rounded-md p-2 ${device==="desktop"?"bg-[#242424] text-white":"text-sc-muted"}`}><Monitor size={15}/></button>
        <button type="button" onClick={()=>setDevice("mobile")} aria-label="Mobile preview" className={`rounded-md p-2 ${device==="mobile"?"bg-[#242424] text-white":"text-sc-muted"}`}><Smartphone size={15}/></button>
      </div>
    </div>
    <div className="overflow-auto bg-[#070707] p-4">
      <div
        style={previewStyle}
        data-store-theme={settings.stylePreset}
        data-store-background={settings.backgroundStyle}
        data-store-button={settings.buttonStyle}
        data-store-motion={settings.motion}
        data-card-style={settings.cardStyle}
        data-store-layout={settings.productLayout}
        className={`mx-auto min-h-[520px] overflow-hidden border border-white/10 shadow-2xl transition-[width] ${device==="mobile"?"w-[320px]":"w-full"}`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-semibold">{storeName}</span>
          <div className="flex items-center gap-4 text-[11px] opacity-60"><span>Catalog</span><span>About</span><ShoppingBag size={14}/></div>
        </header>
        <main>
          {sections.map((section)=>{
            if(section.type==="hero")return <section key={section.id} className="store-hero px-5 py-12">
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--accent)]">{section.eyebrow||"DIGITAL STOREFRONT"}</p>
              <h3 className="mt-3 text-4xl font-semibold leading-none tracking-tight">{section.heading||storeName}</h3>
              <p className="mt-4 max-w-xl text-sm leading-6 opacity-60">{section.text||storeDescription||"A storefront designed around your products."}</p>
              {section.buttonLabel&&<span className="mt-5 inline-flex rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white">{section.buttonLabel}</span>}
            </section>;
            if(section.type==="products")return <section key={section.id} className="px-5 py-8"><h3 className="mb-4 text-xl font-semibold">{section.heading||"Products"}</h3><div className="store-product-grid grid grid-cols-2 gap-3">{productItems.slice(0,device==="mobile"?2:4).map((product)=><article key={product.id} className="store-product-card overflow-hidden rounded-[var(--radius)] border border-white/10 bg-white/[.035]"><div className="aspect-[4/3] bg-gradient-to-br from-white/10 to-transparent"/><div className="p-3"><div className="text-xs font-medium">{product.name}</div><div className="mt-2 text-[11px] opacity-55">{product.price}</div></div></article>)}</div></section>;
            if(section.type==="rich_text")return <section key={section.id} className="px-5 py-8"><h3 className="text-xl font-semibold">{section.heading||"About us"}</h3><p className="mt-3 text-sm leading-6 opacity-60">{section.text||"Tell customers what makes your store different."}</p></section>;
            if(section.type==="reviews")return <section key={section.id} className="px-5 py-8"><h3 className="text-xl font-semibold">{section.heading||"Reviews"}</h3><div className="mt-4 rounded-[var(--radius)] border border-white/10 p-4 text-xs opacity-65">★★★★★ “Fast delivery and a great experience.”</div></section>;
            if(section.type==="faq")return <section key={section.id} className="px-5 py-8"><h3 className="text-xl font-semibold">{section.heading||"FAQ"}</h3><div className="mt-4 border-y border-white/10 py-3 text-xs opacity-65">{section.items?.[0]?.question||"How does delivery work?"}</div></section>;
            if(section.type==="spacer")return <div key={section.id} className={section.size==="lg"?"h-16":section.size==="sm"?"h-4":"h-8"}/>;
            return null;
          })}
        </main>
        <footer className="border-t border-white/10 px-5 py-5 text-[10px] opacity-50">{storeName} · Powered By SellCore</footer>
      </div>
    </div>
  </section>;
}
