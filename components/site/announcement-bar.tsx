import { PiStarFourFill } from "react-icons/pi";

const MESSAGE = "Free shipping in Dibrugarh";
const REPEATS = 8; // enough copies that one track is wider than any viewport

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: REPEATS }, (_, i) => (
        <span key={i} className="flex items-center gap-6 pr-6">
          <span>{MESSAGE}</span>
          <PiStarFourFill className="size-2.5 text-brand-cream/70" />
        </span>
      ))}
    </div>
  );
}

/** Thin scrolling strip above the navbar. Pauses on hover; static under reduced motion. */
export function AnnouncementBar() {
  return (
    <div className="overflow-hidden bg-brand-red text-brand-cream">
      <p className="sr-only">{MESSAGE}</p>
      <div
        aria-hidden
        className="flex w-max animate-marquee py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase hover:[animation-play-state:paused]"
      >
        <Track />
        <Track />
      </div>
    </div>
  );
}
