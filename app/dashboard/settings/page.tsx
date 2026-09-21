import Image from "next/image";
import { getDashboardContext } from "@/lib/dashboard-context";
import { updateStoreAction, addTeamMemberAction } from "@/lib/merchant-actions";
import { changePasswordAction } from "@/lib/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { updateStoreBrandingAction } from "@/lib/store-branding-actions";
import { storeAssetPublicUrl } from "@/lib/storefront";
import { EmptyState } from "@/components/ui/empty-state";

export default async function Settings(){
  const ctx=await getDashboardContext();
  if(!ctx.store)return <EmptyState title="No store"/>;
  const [{data:s},{data:members}]=await Promise.all([
    ctx.db.from("store_settings").select("*").eq("store_id",ctx.store.id).single(),
    ctx.db.from("merchant_members").select("role,user_id,users(email,display_name)").eq("merchant_id",ctx.merchantId),
  ]);
  const logoUrl=s?.logo_path?storeAssetPublicUrl(s.logo_path):null;
  const faviconUrl=s?.favicon_path?storeAssetPublicUrl(s.favicon_path):null;

  return <>
    <h1 className="text-2xl font-semibold">Settings</h1>
    <p className="mt-1 text-sm text-sc-secondary">General store configuration, branding, customer behavior and team access.</p>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <form action={updateStoreAction} className="rounded-xl border border-sc-border bg-sc-card p-5">
          <input type="hidden" name="storeId" value={ctx.store.id}/>
          <h2 className="font-semibold">General</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">Store name<input name="name" defaultValue={ctx.store.name} required/></label>
            <label className="text-sm">Description<textarea name="description" rows={4} defaultValue={ctx.store.description??""}/></label>
            <label className="text-sm">Currency<input name="currency" maxLength={3} defaultValue={ctx.store.default_currency||"USD"}/></label>
            <label className="text-sm">SEO title<input name="title" defaultValue={s?.title??ctx.store.name}/></label>
            <label className="text-sm">Meta description<textarea name="metaDescription" rows={3} defaultValue={s?.meta_description??""}/></label>
            <label className="text-sm">Support email<input name="supportEmail" type="email" defaultValue={s?.support_email??""}/></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" name="verifiedReviewsOnly" defaultChecked={s?.verified_reviews_only??true}/> Require verified purchase for public reviews</label>
            <button className="rounded-lg bg-sc-red px-4 py-2 text-sm">Save settings</button>
          </div>
        </form>

        <form action={updateStoreBrandingAction} className="rounded-xl border border-sc-border bg-sc-card p-5">
          <input type="hidden" name="storeId" value={ctx.store.id}/>
          <h2 className="font-semibold">Store branding</h2>
          <p className="mt-1 text-sm text-sc-secondary">Upload your own storefront logo and browser favicon.</p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-sc-border bg-[#0a0a0a] p-4">
              <div className="text-sm font-medium">Logo</div>
              <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-sc-border bg-[#080808] p-3">
                {logoUrl?<Image src={logoUrl} alt="Current store logo" width={240} height={96} className="max-h-16 w-auto object-contain"/>:<span className="text-xs text-sc-muted">No logo uploaded</span>}
              </div>
              <input className="mt-3" type="file" name="logo" accept="image/png,image/jpeg,image/webp"/>
              <p className="mt-2 text-xs text-sc-muted">PNG, JPG or WebP. Max 2 MB.</p>
              {logoUrl&&<label className="mt-3 flex items-center gap-2 text-xs text-sc-secondary"><input type="checkbox" name="removeLogo" className="h-4 w-4"/> Remove current logo</label>}
            </div>

            <div className="rounded-xl border border-sc-border bg-[#0a0a0a] p-4">
              <div className="text-sm font-medium">Favicon</div>
              <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-sc-border bg-[#080808] p-3">
                {faviconUrl?<Image src={faviconUrl} alt="Current store favicon" width={64} height={64} className="h-12 w-12 object-contain"/>:<span className="text-xs text-sc-muted">No favicon uploaded</span>}
              </div>
              <input className="mt-3" type="file" name="favicon" accept="image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon"/>
              <p className="mt-2 text-xs text-sc-muted">PNG, JPG, WebP or ICO. Max 512 KB.</p>
              {faviconUrl&&<label className="mt-3 flex items-center gap-2 text-xs text-sc-secondary"><input type="checkbox" name="removeFavicon" className="h-4 w-4"/> Remove current favicon</label>}
            </div>
          </div>

          <button className="mt-5 rounded-lg bg-sc-red px-4 py-2 text-sm font-medium">Save branding</button>
        </form>
      </div>

      <div className="space-y-5">
        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
          <h2 className="font-semibold">Password</h2>
          <p className="mt-1 text-sm text-sc-secondary">Signed in with a magic link? Set or change your password here whenever you want.</p>
          <div className="mt-4"><AuthForm mode="reset" action={changePasswordAction}/></div>
        </section>

        <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Team</h2>
        <div className="mt-4 space-y-2">{members?.map(m=><div key={m.user_id} className="rounded-lg border border-sc-border p-3 text-sm"><div>{(Array.isArray(m.users)?m.users[0]?.display_name:(m.users as {display_name?:string}|null)?.display_name)||(Array.isArray(m.users)?m.users[0]?.email:(m.users as {email?:string}|null)?.email)}</div><div className="text-xs text-sc-muted">{m.role}</div></div>)}</div>
        <form action={addTeamMemberAction} className="mt-4 space-y-2">
          <input type="email" name="email" required placeholder="Existing SellCore user email"/>
          <select name="role"><option value="staff">Staff</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select>
          <button className="w-full rounded-lg border border-sc-border px-3 py-2 text-sm">Add member</button>
        </form>
        </section>
      </div>
    </div>
  </>;
}
