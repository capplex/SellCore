"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

export type StoreSection = {
  id: string;
  type: "hero" | "rich_text" | "products" | "reviews" | "faq" | "spacer";
  heading?: string;
  text?: string;
  eyebrow?: string;
  buttonLabel?: string;
  buttonHref?: string;
  size?: "sm" | "md" | "lg";
  items?: { question: string; answer: string }[];
};

function makeSection(type: StoreSection["type"]): StoreSection {
  return { id: crypto.randomUUID(), type, heading: "", text: "", items: type === "faq" ? [{ question: "", answer: "" }] : undefined };
}

export function SectionBuilder({ name, initialSections }: { name: string; initialSections: StoreSection[] }) {
  const [sections, setSections] = useState<StoreSection[]>(initialSections);
  const serialized = useMemo(() => JSON.stringify(sections), [sections]);

  useEffect(()=>{
    window.dispatchEvent(new CustomEvent("sellcore:theme-sections",{detail:sections}));
  },[sections]);

  function patch(id: string, patch: Partial<StoreSection>) {
    setSections((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }
  function move(index: number, direction: -1 | 1) {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }
  function remove(id: string) {
    setSections((items) => items.filter((item) => item.id !== id));
  }

  return <div className="space-y-3">
    <input type="hidden" name={name} value={serialized} />
    {sections.map((section, index) => <div key={section.id} className="rounded-xl border border-sc-border bg-[#0b0b0b] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={section.type} onChange={(e) => patch(section.id, { type: e.target.value as StoreSection["type"] })} className="max-w-44">
          <option value="hero">Hero</option>
          <option value="rich_text">Text</option>
          <option value="products">Products</option>
          <option value="reviews">Reviews</option>
          <option value="faq">FAQ</option>
          <option value="spacer">Spacer</option>
        </select>
        <div className="ml-auto flex gap-1">
          <button type="button" onClick={() => move(index, -1)} className="rounded-md border border-sc-border p-2" aria-label="Move section up"><ArrowUp size={14}/></button>
          <button type="button" onClick={() => move(index, 1)} className="rounded-md border border-sc-border p-2" aria-label="Move section down"><ArrowDown size={14}/></button>
          <button type="button" onClick={() => remove(section.id)} className="rounded-md border border-red-950 p-2 text-red-300" aria-label="Delete section"><Trash2 size={14}/></button>
        </div>
      </div>

      {section.type === "hero" && <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input value={section.eyebrow ?? ""} onChange={(e) => patch(section.id, { eyebrow: e.target.value })} placeholder="Eyebrow" />
        <input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} placeholder="Heading (leave blank for store name)" />
        <textarea value={section.text ?? ""} onChange={(e) => patch(section.id, { text: e.target.value })} placeholder="Hero text (leave blank for store description)" rows={3} className="md:col-span-2" />
        <input value={section.buttonLabel ?? ""} onChange={(e) => patch(section.id, { buttonLabel: e.target.value })} placeholder="Button label" />
        <input value={section.buttonHref ?? ""} onChange={(e) => patch(section.id, { buttonHref: e.target.value })} placeholder="Button link" />
      </div>}

      {section.type === "rich_text" && <div className="mt-4 grid gap-3">
        <input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} placeholder="Heading" />
        <textarea value={section.text ?? ""} onChange={(e) => patch(section.id, { text: e.target.value })} placeholder="Text" rows={6} />
      </div>}

      {(section.type === "products" || section.type === "reviews") && <div className="mt-4">
        <input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} placeholder={section.type === "products" ? "Products heading" : "Reviews heading"} />
      </div>}

      {section.type === "faq" && <div className="mt-4 space-y-3">
        <input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} placeholder="FAQ heading" />
        {(section.items ?? []).map((item, itemIndex) => <div key={itemIndex} className="grid gap-2 rounded-lg border border-sc-border p-3">
          <input value={item.question} onChange={(e) => {
            const items = [...(section.items ?? [])];
            items[itemIndex] = { ...items[itemIndex], question: e.target.value };
            patch(section.id, { items });
          }} placeholder="Question" />
          <textarea value={item.answer} onChange={(e) => {
            const items = [...(section.items ?? [])];
            items[itemIndex] = { ...items[itemIndex], answer: e.target.value };
            patch(section.id, { items });
          }} placeholder="Answer" rows={3} />
        </div>)}
        <button type="button" onClick={() => patch(section.id, { items: [...(section.items ?? []), { question: "", answer: "" }] })} className="rounded-lg border border-sc-border px-3 py-2 text-sm">Add FAQ item</button>
      </div>}

      {section.type === "spacer" && <div className="mt-4">
        <select value={section.size ?? "md"} onChange={(e) => patch(section.id, { size: e.target.value as "sm"|"md"|"lg" })} className="max-w-44"><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select>
      </div>}
    </div>)}

    <div className="flex flex-wrap gap-2">
      {(["hero","rich_text","products","reviews","faq","spacer"] as StoreSection["type"][]).map((type) =>
        <button key={type} type="button" onClick={() => setSections((items) => [...items, makeSection(type)])} className="inline-flex items-center gap-2 rounded-lg border border-sc-border px-3 py-2 text-sm"><Plus size={14}/>{type.replace("_"," ")}</button>
      )}
    </div>
  </div>;
}
