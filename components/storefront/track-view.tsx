"use client";
import { useEffect } from "react";
export function TrackView({storeSlug,productId}:{storeSlug:string;productId?:string}){useEffect(()=>{void fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({storeSlug,eventType:productId?"product_view":"store_view",productId})})},[storeSlug,productId]);return null;}
