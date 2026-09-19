import Link from "next/link";
import { Logo } from "@/components/logo";
export default function AuthLayout({children}:{children:React.ReactNode}){return <main className="grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md"><Link href="/" className="mb-8 flex justify-center"><Logo/></Link><div className="rounded-2xl border border-sc-border bg-sc-card p-6 sm:p-8">{children}</div></div></main>}
