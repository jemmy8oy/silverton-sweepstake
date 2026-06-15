import Image from "next/image";
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
      {src ? (
        <Image src={src} alt="" fill sizes="104px" className="owner-avatar-image" />
      ) : (
        <span className="owner-avatar-fallback">{ownerInitials(owner || "?")}</span>
      )}
      {children}
    </div>
  );
}
