import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { ActionTrio } from "@/components/sections/ActionTrio";
import { CargoScene } from "@/components/sections/CargoScene";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SmartLoad } from "@/components/sections/SmartLoad";
import { Trust } from "@/components/sections/Trust";

/**
 * Section order lives here and nowhere else. ActionTrio sits directly under the
 * hero so Contact / Register / Know More are impossible to miss.
 *
 * `VideoBackdrop` is a sibling here, not nested inside `Hero` — it needs to sit
 * outside Hero's `isolate`d stacking context to paint behind every section, not
 * just Hero's own.
 */
export default function Home() {
  return (
    <>
      <VideoBackdrop />
      <Navbar />
      <main id="main">
        <Hero />
        <ActionTrio />
        <CargoScene />
        <HowItWorks />
        <SmartLoad />
        <Trust />
      </main>
      <Footer />
    </>
  );
}
