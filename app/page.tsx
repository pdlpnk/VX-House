import { SiteHeader } from "@/components/navigation/site-header";
import { Hero } from "@/components/sections/hero";
import { InsidePlatform } from "@/components/sections/inside-platform";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <InsidePlatform />
      </main>
    </>
  );
}
