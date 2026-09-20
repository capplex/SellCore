"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unzipSync } from "fflate";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const textExtensions=[".html",".htm",".css",".js",".ts",".tsx",".jsx",".json",".njk",".nunjucks",".liquid",".twig",".md"];

function cleanName(value:string){
  return value.trim().replace(/[\u0000-\u001f]/g,"").slice(0,80)||"Imported theme";
}

function decode(bytes:Uint8Array){
  return new TextDecoder("utf-8",{fatal:false}).decode(bytes);
}

function detectPlatform(files:string[],hint:string){
  if(hint&&hint!=="auto")return hint;
  const joined=files.join(" ").toLowerCase();
  if(joined.includes("nunjucks")||joined.includes(".njk")||joined.includes("sellauth"))return "sellauth";
  if(joined.includes("shoppex")||joined.includes("storefront.config")||joined.includes("vite.config"))return "shoppex";
  if(joined.includes("sellix"))return "sellix";
  if(joined.includes("sell.app")||joined.includes("sellapp"))return "sellapp";
  if(joined.includes("komerza"))return "komerza";
  if(joined.includes("sellhub"))return "sellhub";
  return "unknown";
}

function layoutFromSource(source:string){
  const lower=source.toLowerCase();
  const sections:any[]=[
    {id:"hero",type:"hero",eyebrow:"",heading:"",text:""},
    {id:"products",type:"products",heading:"Products"},
  ];
  if(lower.includes("review")||lower.includes("testimonial"))sections.push({id:"reviews",type:"reviews",heading:"Reviews"});
  if(lower.includes("faq"))sections.push({id:"faq",type:"faq",heading:"FAQ",items:[]});
  return sections;
}

export async function importThemeAction(formData:FormData){
  const {merchantId}=await requireMerchant();
  const storeId=String(formData.get("storeId"));
  const hint=String(formData.get("sourcePlatform")||"auto").toLowerCase();
  const file=formData.get("themeFile");

  if(!(file instanceof File))throw new Error("THEME_FILE_REQUIRED");
  if(file.size<=0||file.size>10*1024*1024)throw new Error("THEME_FILE_TOO_LARGE");

  const db=createSupabaseAdminClient();
  const {data:store}=await db.from("stores").select("id").eq("id",storeId).eq("merchant_id",merchantId).maybeSingle();
  if(!store)throw new Error("STORE_NOT_FOUND");

  const filename=file.name.toLowerCase();
  const bytes=new Uint8Array(await file.arrayBuffer());

  let platform=hint;
  let customCss="";
  let sourceFiles:Record<string,string>={};
  let sourceText="";
  let report:any={ imported:[], converted:[], warnings:[] };

  if(filename.endsWith(".json")){
    const parsed=JSON.parse(decode(bytes));
    const settings=typeof parsed.settings==="object"&&parsed.settings?parsed.settings:{};
    const home=Array.isArray(parsed.home)?parsed.home:Array.isArray(parsed.sections)?parsed.sections:layoutFromSource(JSON.stringify(parsed));
    customCss=typeof parsed.customCss==="string"?parsed.customCss.slice(0,200000):"";
    platform=platform==="auto"?"sellcore":platform;
    report.imported.push("JSON theme package");
    report.converted.push("Theme settings","Homepage sections");
    const {data:created,error}=await db.from("merchant_themes").insert({
      merchant_id:merchantId,
      store_id:storeId,
      name:cleanName(parsed.name||file.name.replace(/\.json$/i,"")),
      mode:"visual",
      source_platform:platform,
      settings,
      draft_layout:{home},
      published_layout:{home},
      custom_css:customCss,
      source_files:{},
      import_report:report,
      status:"draft",
    }).select("id").single();
    if(error||!created)throw new Error(error?.message||"THEME_IMPORT_FAILED");
    await db.from("theme_settings").update({custom_theme_id:created.id,settings}).eq("store_id",storeId);
    revalidatePath("/dashboard/themes");
    redirect("/dashboard/themes/"+created.id);
  }

  if(!filename.endsWith(".zip"))throw new Error("THEME_FILE_TYPE_UNSUPPORTED");

  const archive=unzipSync(bytes);
  const names=Object.keys(archive).filter((name)=>!name.endsWith("/"));
  platform=detectPlatform(names,hint);

  let storedBytes=0;
  const cssParts:string[]=[];
  const textParts:string[]=[];

  for(const name of names){
    const lower=name.toLowerCase();
    const ext=textExtensions.find((x)=>lower.endsWith(x));
    if(!ext)continue;
    const body=archive[name];
    if(!body||body.length>300000)continue;
    const text=decode(body);
    if(storedBytes<1200000){
      sourceFiles[name]=text.slice(0,150000);
      storedBytes+=sourceFiles[name].length;
    }
    if(lower.endsWith(".css"))cssParts.push(text);
    if(lower.endsWith(".html")||lower.endsWith(".htm")||lower.endsWith(".njk")||lower.endsWith(".nunjucks")||lower.endsWith(".liquid")||lower.endsWith(".twig")||lower.endsWith(".tsx")||lower.endsWith(".jsx"))textParts.push(text);
  }

  customCss=cssParts.join("\n\n").slice(0,200000);
  sourceText=textParts.join("\n").slice(0,500000);
  const home=layoutFromSource(sourceText);

  report={
    source_platform:platform,
    file_count:names.length,
    imported:[
      cssParts.length+" CSS file(s)",
      textParts.length+" template/source file(s)",
      Object.keys(sourceFiles).length+" text source file(s)",
    ],
    converted:[
      "Base storefront structure",
      "Product section",
      ...(sourceText.toLowerCase().includes("review")||sourceText.toLowerCase().includes("testimonial")?["Reviews section"]:[]),
      ...(sourceText.toLowerCase().includes("faq")?["FAQ section"]:[]),
      ...(customCss?["Custom CSS"]:[]),
    ],
    warnings:[
      "Imported JavaScript is preserved as source but is not executed automatically for security.",
      "Platform-specific template helpers are preserved in source files and may need manual conversion.",
    ],
  };

  const {data:current}=await db.from("theme_settings").select("theme_id,settings").eq("store_id",storeId).maybeSingle();
  const {data:created,error}=await db.from("merchant_themes").insert({
    merchant_id:merchantId,
    store_id:storeId,
    name:cleanName(file.name.replace(/\.zip$/i,"")),
    mode:"code",
    source_platform:platform,
    base_theme_id:current?.theme_id??null,
    settings:current?.settings??{},
    draft_layout:{home},
    published_layout:{home},
    custom_css:customCss,
    source_files:sourceFiles,
    import_report:report,
    status:"draft",
  }).select("id").single();

  if(error||!created)throw new Error(error?.message||"THEME_IMPORT_FAILED");

  await db.from("theme_settings").update({custom_theme_id:created.id}).eq("store_id",storeId);
  revalidatePath("/dashboard/themes");
  redirect("/dashboard/themes/"+created.id);
}
