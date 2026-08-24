import CanvasLayer from '@/components/canvas/CanvasLayer';
import SmoothScroll from '@/components/SmoothScroll';
import Preloader from '@/components/ui/Preloader';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import Hero from '@/components/sections/Hero';
import EventSection from '@/components/sections/EventSection';
import Team from '@/components/sections/Team';
import Finale from '@/components/sections/Finale';
import { EVENTS } from '@/data/events';

/**
 * The whole experience is one continuous document.
 *
 * Order matters: the WebGL layer mounts first and sits at z-0 for the entire
 * page, and every section below rides above it, publishing its own scroll
 * progress so the scene can react. Nothing here unmounts mid-journey.
 */
export default function Page() {
  return (
    <>
      <Preloader />
      <CanvasLayer />
      <Nav />

      <SmoothScroll>
        <main className="relative z-10">
          {/* 1 — arrival */}
          <Hero />

          {/* 2..6 — one universe per event */}
          {EVENTS.map((event, i) => (
            <EventSection key={event.id} event={event} index={i} />
          ))}

          {/* 7 — the people */}
          <Team />

          {/* 8 — convergence */}
          <Finale />
        </main>

        <Footer />
      </SmoothScroll>
    </>
  );
}
