import { setUserRoleAction } from "@/lib/admin-actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MerchantUser = {
  email: string | null;
  display_name: string | null;
  platform_role: string | null;
};

type MerchantMember = {
  role: string;
  user_id: string;
  users: MerchantUser | MerchantUser[] | null;
};

type MerchantSubscription = {
  status?: string;
  platform_plans?: { name?: string } | { name?: string }[] | null;
};

export default async function Merchants() {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("merchants")
    .select("id,name,slug,created_at,merchant_members(role,user_id,users(email,display_name,platform_role)),merchant_subscriptions(status,platform_plans(name))")
    .order("created_at", { ascending: false })
    .limit(200);

  return <>
    <h1 className="text-2xl font-semibold">Merchants</h1>
    <div className="mt-5 space-y-3">
      {data?.map((merchant) => {
        const members = (merchant.merchant_members ?? []) as unknown as MerchantMember[];
        const subscriptions = (merchant.merchant_subscriptions ?? []) as unknown as MerchantSubscription[];
        const planRelation = subscriptions[0]?.platform_plans;
        const plan = Array.isArray(planRelation) ? planRelation[0] : planRelation;

        return <div key={merchant.id} className="rounded-xl border border-sc-border bg-sc-card p-4">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{merchant.name}</div>
              <div className="text-xs text-sc-muted">{merchant.slug}</div>
            </div>
            <div className="text-sm text-sc-secondary">{plan?.name ?? "No plan"}</div>
          </div>
          <div className="mt-3 space-y-2">
            {members.map((member) => {
              const user = Array.isArray(member.users) ? member.users[0] : member.users;
              return <div key={member.user_id} className="flex items-center justify-between rounded-lg border border-sc-border p-3 text-sm">
                <span>{user?.email ?? "Unknown user"} · {member.role}</span>
                <form action={setUserRoleAction} className="flex gap-2">
                  <input type="hidden" name="userId" value={member.user_id}/>
                  <select name="role" defaultValue={user?.platform_role ?? "user"} className="w-28 py-1">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="rounded border border-sc-border px-2">Save</button>
                </form>
              </div>;
            })}
          </div>
        </div>;
      })}
    </div>
  </>;
}
