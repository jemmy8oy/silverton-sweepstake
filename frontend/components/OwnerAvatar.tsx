import Image from "next/image";
import { ownerAvatarSrc, ownerInitials } from "@/lib/owner-avatars";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type OwnerAvatarProps = {
  owner: string;
  className: string;
  children?: ReactNode;
};

export default function OwnerAvatar({ owner, className, children }: OwnerAvatarProps) {
  const src = ownerAvatarSrc(owner);

  return (
    <div className={cn("relative overflow-hidden", src ? "bg-secondary" : "bg-primary text-primary-foreground", className)} aria-hidden="true">
      {src ? (
        <Image src={src} alt="" fill sizes="104px" className="object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.14em]">
          {ownerInitials(owner || "?")}
        </span>
      )}
      {children}
    </div>
  );
}
