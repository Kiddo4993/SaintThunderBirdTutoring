"use client";

import { useState } from "react";
import HomeEffects from "./HomeEffects";
import SiteNav from "./SiteNav";

export default function HomeClient({ children }) {
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);

  return (
    <>
      <SiteNav onInfoClick={() => setInfoMenuOpen((v) => !v)} />
      {children}
      <HomeEffects infoMenuOpen={infoMenuOpen} setInfoMenuOpen={setInfoMenuOpen} />
    </>
  );
}
