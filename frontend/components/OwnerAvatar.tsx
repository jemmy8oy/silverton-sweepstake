import { ownerAvatarSrc, ownerInitials } from "@/lib/owner-avatars";
import type { ReactNode } from "react";

type OwnerAvatarProps = {
  owner: string;
  className: string;
  children?: ReactNode;
};

export default function OwnerAvatar({ owner, className, children }: OwnerAvatarProps) {
  const src = ownerAvatarSrc(owner);

  return (
    <div className={src ? `${className} has-image` : className} aria-hidden="true">
      {src ? <img src={src} alt="" className="owner-avatar-image" loading="lazy" /> : <span className="owner-avatar-fallback">{ownerInitials(owner || "?")}</span>}
      {children}
    </div>
  );
}
