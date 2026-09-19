import { NextResponse } from "next/server";
import { dispatchPendingWebhooks } from "@/lib/webhooks/outgoing";
import { serverEnv } from "@/lib/env";
export async function POST(req:Request){const secret=serverEnv().CRON_SECRET;if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});const count=await dispatchPendingWebhooks();return NextResponse.json({processed:count});}
