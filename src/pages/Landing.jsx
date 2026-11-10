import Hero from '../components/landing/Hero.jsx';
import { Bento, Compare, Extension, Faq, FinalCta, HowItWorks, Marquee, Offline, Showcase, Stats } from '../components/landing/Sections.jsx';
import { caps } from '../lib/common/caps.js';

export default function Landing() {
  return (
    <div className="landing">
      <Hero />
      <Marquee />
      <Stats />
      <Showcase />
      <Bento />
      <HowItWorks />
      {!caps.isExtension && <Offline />}
      {!caps.isExtension && <Extension />}
      <Compare />
      <Faq />
      <FinalCta />
    </div>
  );
}
