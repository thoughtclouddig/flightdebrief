import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { getViewer } from "@/lib/viewer";

export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  return (
    <>
      <Nav viewer={viewer} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10 md:pt-8">
        {children}
      </main>
    </>
  );
}
