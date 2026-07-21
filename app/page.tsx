import { SiteHeader } from "@/components/navigation/site-header";
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
    "Платформа лояльности и сотрудничества для совершеннолетних пользователей в Турции и Азербайджане.",
  inLanguage: "ru",
  audience: {
    "@type": "Audience",
    audienceType: "Совершеннолетние пользователи и партнёры",
    geographicArea: [
      { "@type": "Country", name: "Турция" },
      { "@type": "Country", name: "Азербайджан" },
    ],
  },
};

export default function Home() {
  return (
    <div className="public-site">
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
