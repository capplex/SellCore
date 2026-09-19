import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant="primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"secondary"|"ghost"|"danger" }) {
  const styles = variant === "primary" ? "bg-sc-red hover:bg-sc-bright text-white" : variant === "secondary" ? "bg-[#161616] hover:bg-[#202020] border border-sc-border" : variant === "danger" ? "bg-red-950 border border-red-800 text-red-200" : "hover:bg-[#151515] text-sc-secondary";
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50", styles, className)} {...props}/>;
}
