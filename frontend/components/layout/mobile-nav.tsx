import { BottomNavLinks } from "@/components/SiteNav";

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around bg-white px-1.5 shadow-md md:hidden" aria-label="Mobile navigation">
      <BottomNavLinks />
    </nav>
  );
}
