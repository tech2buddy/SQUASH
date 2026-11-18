import PublicFooter from './PublicFooter';
import PublicHeader from './PublicHeader';
import { Wifi, Globe, ChevronRight, Clock, ArrowRight, Check, Sliders, Shield, Volume2, Smartphone, MapPin, FileText } from 'lucide-react';
import { usePageMeta } from './hooks/usePageMeta';
import { useRef, useState, type PointerEvent } from 'react';

export default function SquashHomepage() {
  usePageMeta({
    title: 'SQUASH — Real Humans. Real Devices.',
    description: 'SQUASH connects developers and startups with everyday South African testers on real hardware and real networks. Bug hunting, usability testing, and localization QA before launch.',
    path: '/',
  });

  const [activeNetwork, setActiveNetwork] = useState<'mtn' | 'vodacom' | 'telkom' | 'cellc'>('mtn');
  const [activeLanguage, setActiveLanguage] = useState('isiZulu');
  const [selectedSpec, setSelectedSpec] = useState<'bughunting' | 'usability' | 'lowdata' | 'localization'>('bughunting');
  const [testerCount, setTesterCount] = useState<number>(10);
  const heroGlowRef = useRef<HTMLDivElement>(null);

  const moveHeroGlow = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    heroGlowRef.current?.style.setProperty('left', `${event.clientX - bounds.left}px`);
    heroGlowRef.current?.style.setProperty('top', `${event.clientY - bounds.top}px`);
  };

  const networkSpecs = {
    mtn: { name: 'MTN', connection: 'Varies by tester', location: 'South Africa' },
    vodacom: { name: 'Vodacom', connection: 'Varies by tester', location: 'South Africa' },
    telkom: { name: 'Telkom', connection: 'Varies by tester', location: 'South Africa' },
    cellc: { name: 'Cell C', connection: 'Varies by tester', location: 'South Africa' },
  };
  const networkBrand = {
    mtn: { color: '#ffcc08', textColor: '#1d1d1f' },
    vodacom: { color: '#e60000', textColor: '#ffffff' },
    telkom: { color: '#0099d8', textColor: '#ffffff' },
    cellc: { color: '#f58220', textColor: '#ffffff' },
  };
  const activeNetworkBrand = networkBrand[activeNetwork];

  const saLanguageQuotes: Record<string, { quote: string; region: string }> = {
    isiZulu: { quote: 'Uhlelo lwakho luhamba kahle kakhulu emoyeni.', region: 'KZN & Gauteng' },
    isiXhosa: { quote: 'Isebenza ngaphandle kwezinkinga kwinethiwekhi.', region: 'Eastern Cape' },
    Afrikaans: { quote: 'Geen foute gevind nie. Baie goeie toepassing!', region: 'Western Cape' },
    'English (SA)': { quote: 'Smooth checkout flow on Vodacom LTE.', region: 'National' },
    Sepedi: { quote: 'Tshepediso e shoma gabotse kudu.', region: 'Limpopo' },
    Setswana: { quote: 'Tiriso e wela sentle fela bila Mathata.', region: 'North West' },
  };

  const specsData = {
    bughunting: {
      title: 'Bug Hunting',
      rate: 100,
      price: 'R100',
      unit: 'per tester',
      duration: '20 min avg session',
      minTesters: 5,
      description: 'Exploratory bug hunting across real iOS & Android hardware. Uncover edge-case crashes, layout breaks, and broken links.',
      features: ['Structured bug descriptions', 'Screenshots or video when supplied', 'Tester device details', 'Tester-selected severity'],
    },
    usability: {
      title: 'Usability & UX Flow',
      rate: 140,
      price: 'R140',
      unit: 'per tester',
      duration: '30 min avg session',
      minTesters: 5,
      description: 'Observe real human reactions to your onboarding funnel, checkout flow, and navigation usability.',
      features: ['Task outcomes', 'Written observations', 'Usability feedback', 'Executive summary'],
    },
    lowdata: {
      title: 'Low-Data & 2G/3G Testing',
      rate: 150,
      price: 'R150',
      unit: 'per tester',
      duration: '30 min avg session',
      minTesters: 3,
      description: 'Verify your product performance under authentic South African low-bandwidth network throttling.',
      features: ['Tester-reported network context', 'Load and offline observations', 'Written issue reports', 'Device details'],
    },
    localization: {
      title: 'Local Language QA',
      rate: 180,
      price: 'R180',
      unit: 'per tester',
      duration: '30 min avg session',
      minTesters: 3,
      description: 'Native speakers in South Africa test your app copy, currency formatting, and cultural nuance.',
      features: ['Language-specific feedback', 'Copy and formatting review', 'Written issue reports', 'Tester device context'],
    },
  };

  const calculatedTotal = specsData[selectedSpec].rate * Math.max(testerCount, specsData[selectedSpec].minTesters);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#1d1d1f] selection:text-white font-sans antialiased">
      <PublicHeader active="home" />

      <main>
        {/* Apple Signature Full-Bleed Hero Section */}
        <section
          className="relative min-h-[82vh] flex flex-col justify-start items-center pt-24 pb-32 sm:pt-28 sm:pb-40 overflow-hidden text-center bg-[#1d1d1f]"
          onPointerMove={moveHeroGlow}
        >
          {/* Full-Bleed Background Image Layer.
              Anchored to the bottom: the artwork keeps its console mock-up and
              red floor glow along the lower edge, and crops from the empty top
              instead — which is also where the headline sits. */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Deliberately soft. The source art is only 1672px wide, so it
                upscales badly on a full-bleed hero; a shallow depth-of-field
                blur reads as intentional and hides that. scale-110 covers the
                transparent edge the blur would otherwise feather in — the
                overhang has to beat the blur radius on the short axis too. */}
            <img
              src="/hero-bg-dashboard.jpg"
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-110 object-cover object-bottom blur-[5px] transition-all duration-700"
            />
            <div
              ref={heroGlowRef}
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,73,82,0.22)_0%,rgba(187,53,69,0.12)_35%,transparent_70%)] blur-3xl mix-blend-screen transition-[left,top] duration-700 ease-out motion-reduce:transition-none"
            />
            {/* Scrim behind the copy, and a bottom fade into the next section.
                Kept off the middle so the mock-up is not dulled. */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1d1d1f]/85 via-[#1d1d1f]/25 via-45% to-[#1d1d1f]/70" />
          </div>

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Eyebrow */}
            <p className="animate-fade-up text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#e63946]">
              SQUASH QA Network
            </p>

            {/* Hero Headline — white on dark */}
            <h1
              className="animate-fade-up mt-5 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-apple-tight leading-[1.05] max-w-4xl mx-auto"
              /* style.css has an unlayered `h1 { color: inherit }`, which beats a
                 layered `text-white` utility and would render this dark. */
              style={{ color: '#ffffff' }}
            >
              Squash bugs. <br className="hidden sm:inline" />
              Before your users do.
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up-delayed mt-6 text-base sm:text-lg text-white/65 max-w-2xl mx-auto font-medium leading-relaxed">
              Real South Africans test your product on real devices and send clear, reproducible bug
              reports before your customers ever see the problem.
            </p>

            {/* Action Buttons */}
            <div className="animate-fade-up-delayed mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <a
                href="/signup?role=developer&next=%2Fpost-job"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#e63946] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:bg-[#d62828] active:scale-98"
              >
                Post a test — From R100/tester
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </a>
              <a
                href="/signup?role=tester&next=%2Ftester-jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/20 bg-[rgba(255,255,255,0.06)] px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-[rgba(255,255,255,0.12)]"
              >
                Become a tester
              </a>
            </div>

            {/* Proof chips */}
            <div className="animate-fade-up-delayed mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { icon: Smartphone, label: 'Real devices' },
                { icon: MapPin, label: 'Local testers' },
                { icon: FileText, label: 'Structured bug reports' },
                { icon: Globe, label: '11 SA languages' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.06)] px-3.5 py-2 text-xs font-semibold text-white/80 backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5 text-[#e63946]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Apple Light Bento Grid */}
        <section className="py-20 bg-[#f2f2f5] border-t border-black/[0.06]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
                Engineered for South Africa.
              </h2>
              <p className="mt-3 text-base sm:text-xl text-[#86868b]">
                Built specifically to solve the real-world testing challenges of local devices, networks, and native languages.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Bento Card 1 (Large 2-Column): Real SA Networks Simulator */}
              <div className="lg:col-span-2 apple-interactive-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="h-10 w-10 rounded-xl text-white flex items-center justify-center shadow-2xs transition-colors duration-300"
                      style={{ backgroundColor: activeNetworkBrand.color, color: activeNetworkBrand.textColor }}
                    >
                      <Wifi className="h-5 w-5" />
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors duration-300"
                      style={{
                        backgroundColor: `${activeNetworkBrand.color}14`,
                        borderColor: `${activeNetworkBrand.color}33`,
                        color: activeNetworkBrand.color,
                      }}
                    >
                      Illustrative carrier selection
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
                    Test on South African networks.
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#86868b] max-w-xl leading-relaxed">
                    Test your app with real South Africans on local cellular network conditions to catch latency freezes before your users do.
                  </p>

                  <div className="mt-6 rounded-xl bg-[#f5f5f7] p-4 border border-black/[0.06]">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(['mtn', 'vodacom', 'telkom', 'cellc'] as const).map((net) => (
                        <button
                          key={net}
                          onClick={() => setActiveNetwork(net)}
                          className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition ${
                            activeNetwork === net
                              ? 'shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                          style={activeNetwork === net ? {
                            backgroundColor: networkBrand[net].color,
                            color: networkBrand[net].textColor,
                          } : undefined}
                        >
                          {net.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold uppercase">Carrier</div>
                        <div className="text-xs font-bold text-[#1d1d1f] mt-0.5">{networkSpecs[activeNetwork].name}</div>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold uppercase">Connection</div>
                        <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5" style={{ color: activeNetworkBrand.color }}>
                          <span className="h-1.5 w-1.5 rounded-full animate-ping-subtle" style={{ backgroundColor: activeNetworkBrand.color }} />
                          {networkSpecs[activeNetwork].connection}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold uppercase">Speed</div>
                        <div className="text-xs font-bold text-[#1d1d1f] mt-0.5">Recorded per test</div>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold uppercase">Region</div>
                        <div className="text-xs font-bold text-[#1d1d1f] mt-0.5">{networkSpecs[activeNetwork].location}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: 11 SA Languages with Speech Preview */}
              <div className="apple-interactive-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center mb-5 shadow-2xs">
                    <Globe className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1d1d1f]">
                    11 Official Languages.
                  </h3>
                  <p className="mt-1.5 text-xs text-[#86868b] leading-relaxed">
                    Verify translation nuances and copy accuracy with verified native speakers.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {Object.keys(saLanguageQuotes).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguage(lang)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
                          activeLanguage === lang
                            ? 'bg-[#16a34a] text-white shadow-xs'
                            : 'bg-[#f5f5f7] text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Native Speech Card Bubble */}
                  <div className="mt-4 rounded-xl bg-[#f5f5f7] p-3 border border-black/[0.06] text-left">
                    <div className="text-[10px] font-bold text-[#16803c] uppercase">
                      Native {activeLanguage} Feedback:
                    </div>
                    <div className="text-xs font-medium text-[#1d1d1f] italic mt-0.5">
                      "{saLanguageQuotes[activeLanguage]?.quote}"
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#86868b]">
                  <span>Region: <strong className="text-[#1d1d1f]">{saLanguageQuotes[activeLanguage]?.region}</strong></span>
                  <span className="text-[#16803c] font-semibold">Verified Native</span>
                </div>
              </div>

              {/* Bento Card 3: Interactive Audio Waveform & Screen Proof */}
              <div className="apple-interactive-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center mb-5 shadow-2xs">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1d1d1f]">
                    Screen & Audio Evidence.
                  </h3>
                  <p className="mt-1.5 text-xs text-[#86868b] leading-relaxed">
                    Testers submit structured findings and can attach screenshots or video as evidence.
                  </p>

                  {/* Example of evidence that a tester may attach. */}
                  <div className="mt-5 rounded-xl bg-[#f5f5f7] p-3.5 border border-black/[0.06] flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#e63946] text-white flex items-center justify-center shrink-0 shadow-sm"><FileText className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#1d1d1f] mb-1">
                        <span>Evidence attached by the tester</span>
                        <span className="text-[#e63946] text-[9px]">When available</span>
                      </div>
                      <div className="text-xs text-[#86868b]">Screenshots and video can help reproduce an issue.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#86868b]">
                  <span>Evidence Format</span>
                  <span className="text-[#e63946] font-semibold">Optional screenshot or video</span>
                </div>
              </div>

              {/* Bento Card 4 (Large 2-Column): Turnaround Speed */}
              <div className="lg:col-span-2 apple-interactive-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[#1d1d1f] text-white flex items-center justify-center mb-5 shadow-2xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
                    Structured reports from real testers.
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#86868b] max-w-xl leading-relaxed">
                    Receive task outcomes, written observations, bug reproduction steps, and evidence when testers attach it.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl bg-[#f5f5f7] p-3 text-center border border-black/[0.06]">
                      <div className="text-lg sm:text-xl font-extrabold text-amber-600">Task by task</div>
                      <div className="text-[10px] text-[#86868b] font-semibold mt-0.5">Structured outcomes</div>
                    </div>
                    <div className="rounded-xl bg-[#f5f5f7] p-3 text-center border border-black/[0.06]">
                      <div className="text-lg sm:text-xl font-extrabold text-[#1d1d1f]">Real testers</div>
                      <div className="text-[10px] text-[#86868b] font-semibold mt-0.5">Human feedback</div>
                    </div>
                    <div className="rounded-xl bg-[#f5f5f7] p-3 text-center border border-black/[0.06]">
                      <div className="text-lg sm:text-xl font-extrabold text-[#e63946]">R100 - R220</div>
                      <div className="text-[10px] text-[#86868b] font-semibold mt-0.5">Tester Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Developer ROI & Spec Sheet Calculator */}
        <section className="py-20 bg-[#f5f5f7] border-t border-black/[0.06]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-apple-tight text-[#1d1d1f]">
                Simple, transparent pricing.
              </h2>
              <p className="mt-3 text-base sm:text-xl text-[#86868b]">
                Calculate your exact job cost with single source of truth rates and zero subscription fees.
              </p>
            </div>

            {/* Apple Segmented Control Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1 rounded-full bg-slate-200/80 max-w-full overflow-x-auto">
                {(Object.keys(specsData) as Array<keyof typeof specsData>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSpec(key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      selectedSpec === key
                        ? 'bg-[#1d1d1f] text-white shadow-sm'
                        : 'text-[#86868b] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {specsData[key].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Spec Sheet & Interactive Volume Slider */}
            <div className="apple-interactive-card p-6 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                  <div className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700 mb-2.5">
                    {specsData[selectedSpec].duration}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] tracking-tight">
                    {specsData[selectedSpec].title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#86868b] leading-relaxed">
                    {specsData[selectedSpec].description}
                  </p>

                  {/* Interactive Tester Volume Slider */}
                  <div className="mt-6 p-4 rounded-xl bg-[#f5f5f7] border border-black/[0.06]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1d1d1f]">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-[#e63946]" />
                        Select Tester Volume:
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#e63946]">{testerCount} Testers</span>
                    </div>
                    <input
                      type="range"
                      min={specsData[selectedSpec].minTesters}
                      max={50}
                      step={1}
                      value={testerCount}
                      onChange={(e) => setTesterCount(parseInt(e.target.value, 10))}
                      className="mt-2.5 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#e63946]"
                    />
                    <div className="flex justify-between text-[10px] text-[#86868b] mt-1 font-semibold">
                      <span>{specsData[selectedSpec].minTesters} Min</span>
                      <span>25 Testers</span>
                      <span>50 Max</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {specsData[selectedSpec].features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs text-[#1d1d1f] font-medium">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculated Price Tile */}
                <div className="rounded-2xl bg-[#f5f5f7] p-6 text-center border border-black/[0.06] flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">Estimated Job Price</div>
                    <div className="mt-1.5 text-4xl sm:text-5xl font-extrabold text-[#1d1d1f] tracking-tight">
                      R{calculatedTotal.toLocaleString()}
                    </div>
                    <div className="mt-1.5 text-xs text-[#86868b] font-medium">
                      {testerCount} testers × {specsData[selectedSpec].price} / tester
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold">Testers requested</div>
                        <div className="text-xs font-bold text-[#1d1d1f] mt-0.5">{testerCount}</div>
                      </div>
                      <div className="rounded-lg bg-white p-2.5 border border-black/[0.06]">
                        <div className="text-[9px] text-[#86868b] font-semibold">Report format</div>
                        <div className="text-xs font-bold text-[#e63946] mt-0.5">Structured findings</div>
                      </div>
                    </div>
                  </div>

                  <a
                    href="/signup?role=developer&next=%2Fpost-job"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#e63946] px-5 py-3 text-xs font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-[#d62828] active:scale-98 transition"
                  >
                    Post Job with {testerCount} Testers (R{calculatedTotal})
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Apple Quality Seal & Founder Note */}
        <section className="py-20 bg-white border-t border-black/[0.06]">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 text-[#1d1d1f] mb-5">
              <Shield className="h-5.5 w-5.5 text-[#1d1d1f]" />
            </div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-[#1d1d1f] tracking-tight whitespace-nowrap">
              "Building a great app is hard; testing it shouldn't be."
            </h3>
            <p className="mt-3 text-xs sm:text-base text-[#86868b] max-w-2xl mx-auto leading-relaxed">
              SQUASH was created to give every South African startup and software engineering team access to enterprise-grade QA on real devices from day one.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#1d1d1f] text-white font-bold flex items-center justify-center text-xs">
                MK
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#1d1d1f]">M. Khosa</div>
                <div className="text-[10px] text-[#86868b]">Founder, SQUASH</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
