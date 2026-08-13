import { SiteHeader } from "@/components/navigation/site-header";
import { AnalyticsLandingTracker } from "@/components/analytics/analytics-landing-tracker";
import { Benefits } from "@/components/sections/benefits";
import { Faq } from "@/components/sections/faq";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { InsidePlatform } from "@/components/sections/inside-platform";
import { ProductModel } from "@/components/sections/product-model";
import { Responsibility } from "@/components/sections/responsibility";
import { SiteFooter } from "@/components/sections/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VX House",
  url: siteUrl,
  description:
    "A private VX House account with direct access to a personal manager.",
  inLanguage: ["en", "ru", "tr", "az"],
  audience: {
    "@type": "Audience",
    audienceType: "Adults and partners",
  },
};

export default function Home() {
  return (
    <div className="public-site">
      <AnalyticsLandingTracker />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <ProductModel />
        <HowItWorks />
        <InsidePlatform />
        <Benefits />
        <Responsibility />
        <Faq />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  );
}
