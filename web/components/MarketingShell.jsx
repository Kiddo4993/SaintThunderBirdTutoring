"use client";

import SiteNav from "@/components/home/SiteNav";
import MarketingEffects from "@/components/MarketingEffects";

export default function MarketingShell({ children, activeNav }) {
  return (
    <>
      <SiteNav onInfoClick={() => {}} activeNav={activeNav} />
      {children}
      <MarketingEffects />
    </>
  );
}
