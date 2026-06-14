const OWNER_AVATAR_SRC: Record<string, string> = {
  // Drop files into `frontend/public/owners/` and point each owner at the public path here.
  // Example:
  Arnav: "/owners/arnav.png",
  Scarlett: "/owners/scarlett.jpeg",
  Riccardo: "/owners/riccy.jpg",
  James: "/owners/james.jpg",
  Noor: "/owners/noor.jpg",
  Ridge: "/owners/ridge.png",
  Ollie: "/owners/ollie.jpeg"
};

export function ownerAvatarSrc(owner: string): string | null {
  return OWNER_AVATAR_SRC[owner] ?? null;
}

export function ownerInitials(owner: string): string {
  return owner
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
