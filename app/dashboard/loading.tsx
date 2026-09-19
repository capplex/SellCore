import { Skeleton } from "@/components/ui/skeleton";
export default function Loading(){return <div className="space-y-5"><Skeleton className="h-9 w-52"/><div className="grid gap-4 md:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28"/>)}</div><Skeleton className="h-72"/></div>}
