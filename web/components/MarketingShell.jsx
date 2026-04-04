"use client";

import { useState } from "react";
import SiteNav from "@/components/home/SiteNav";
import MarketingEffects from "@/components/MarketingEffects";
import InfoMenuLayer from "@/components/home/InfoMenuLayer";

export default function MarketingShell({ children, activeNav }) {
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);

  return (
    <>
      <SiteNav onInfoClick={() => setInfoMenuOpen((v) => !v)} activeNav={activeNav} />
      {children}
      <MarketingEffects />
      <InfoMenuLayer infoMenuOpen={infoMenuOpen} setInfoMenuOpen={setInfoMenuOpen} />
    </>
  );
}
