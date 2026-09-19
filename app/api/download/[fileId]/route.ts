import { NextRequest,NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { createAuthorizedDownload } from "@/lib/storage";
export async function GET(req:NextRequest,{params}:{params:Promise<{fileId:string}>}){const user=await getUser();if(!user)return NextResponse.redirect(new URL("/login?next=/account",req.url));try{const {fileId}=await params;const url=await createAuthorizedDownload(fileId,user.id);return NextResponse.redirect(url);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"DOWNLOAD_FAILED"},{status:403});}}
