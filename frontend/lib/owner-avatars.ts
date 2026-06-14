const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const OWNER_AVATAR_SRC: Record<string, string> = {
  // Drop files into `frontend/public/owners/` and point each owner at the public path here.
  Arnav: `${BASE_PATH}/owners/arnav.png`,
  Scarlett: `${BASE_PATH}/owners/scarlett.jpeg`,
  Riccardo: `${BASE_PATH}/owners/riccy.jpg`,
  James: `${BASE_PATH}/owners/james.jpg`,
  Noor: `${BASE_PATH}/owners/noor.jpg`,
  Ridge: `${BASE_PATH}/owners/ridge.png`,
  Ollie: `${BASE_PATH}/owners/ollie.jpeg`,
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
