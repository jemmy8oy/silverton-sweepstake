import { BottomNavLinks } from "@/components/SiteNav";

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t-2 border-foreground bg-background px-1.5 py-2 md:hidden" aria-label="Mobile navigation">
      <BottomNavLinks />
    </nav>
  );
}
