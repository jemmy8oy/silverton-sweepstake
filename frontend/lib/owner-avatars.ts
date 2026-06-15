const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const OWNER_AVATAR_SRC: Record<string, string> = {
  // Public-dir paths, including basePath: next/image's optimizer resolves the
  // `url` param against the served origin, and the static files live under
  // basePath. (next/image does NOT prepend basePath to the optimizer url here,
  // so it must be included or the optimizer 400s.)
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
