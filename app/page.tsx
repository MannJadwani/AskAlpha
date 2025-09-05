
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Play, Check, Shield, RefreshCw, BarChart3, Zap, Sparkles, Download, Layout, Cog, PieChart, Search, Bell, Database, BookOpen, Rocket, Plug, Box, Lock, Settings, Users, Briefcase, Newspaper, Building2, Globe } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ShinyButton } from "@/components/magicui/shiny-button";
import Iphone15Pro from "@/components/magicui/iphone-15-pro";
import { Safari } from "@/components/magicui/safari";
import { FloatingDock } from "@/components/ui/floating-dock";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import FlowingMenu from "./components/ui/jsrepo/FlowingMenu/FlowingMenu";
import ScrollReveal from "./components/ui/jsrepo/ScrollReveal/ScrollReveal";

// 3D background (client-only)


const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs tracking-wide text-zinc-300 backdrop-blur transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105">
    {children}
  </span>
);

// ShinyButton is used everywhere on the landing page (primary and ghost variants via className overrides)

const Glow = ({ className = "" }) => (
  <div className={`pointer-events-none absolute blur-2xl ${className}`} />
);

const SectionTitle = ({ eyebrow, title, cta }: { eyebrow?: string; title: string; cta?: React.ReactNode }) => (
  <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
    <div>
      {eyebrow && <div className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-400">{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-100 leading-tight">{title}</h2>
    </div>
    {cta && <div className="w-full sm:w-auto">{cta}</div>}
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:scale-[1.02] hover:-translate-y-1 ${className}`}>
    <div className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl [mask-image:radial-gradient(circle_at_60%_-10%,rgba(255,255,255,0.25),transparent_60%)]" />
    {children}
  </div>
);

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm text-zinc-300"><Check className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />{children}</li>
);

type GridItemProps = {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
};

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <motion.li 
      className={`min-h-[12rem] sm:min-h-[14rem] list-none ${area}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3 transition-all duration-300 hover:border-white/20 hover:shadow-lg">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          variant="blue"
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-4 sm:gap-6 overflow-hidden rounded-xl p-4 sm:p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D] transition-all duration-300 hover:shadow-[0px_0px_40px_0px_#2D2D2D]">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2 transition-all duration-300 hover:border-gray-500 hover:bg-white/5">
              {icon}
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-lg/[1.25rem] sm:text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem] dark:text-white transition-colors duration-300 hover:text-white">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] sm:text-sm/[1.125rem] text-black md:text-base/[1.375rem] dark:text-neutral-400 [&_b]:md:font-semibold [&_strong]:md:font-semibold transition-colors duration-300 hover:text-neutral-300">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  );
};

export default function AskAlphaLanding() {
  const [heroInput, setHeroInput] = useState("");
  
  const handleAnalyzeClick = () => {
    const q = heroInput.trim();
    if (!q) return;
    const params = new URLSearchParams({ symbol: q });
    window.location.href = `/recommendation?${params.toString()}`;
  };

  const handleDownloadReport = () => {
    // Navigate to pricing page for report download
    window.location.href = '/pricing';
  };

  const handleTryFreeAnalysis = () => {
    // Scroll to hero section or navigate to recommendation page
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/recommendation';
    }
  };

  const handleGetReport = () => {
    // Navigate to pricing page
    window.location.href = '/pricing';
  };

  const handleExplorePersonas = () => {
    // Scroll to personas section
    const personasSection = document.getElementById('personas');
    if (personasSection) {
      personasSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBrowseTemplates = () => {
    // Scroll to templates section
    const templatesSection = document.getElementById('templates');
    if (templatesSection) {
      templatesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const flowingMenuItems = [
    { link: '#', text: 'Mojave', image: 'https://picsum.photos/600/400?random=1' },
    { link: '#', text: 'Sonoma', image: 'https://picsum.photos/600/400?random=2' },
    { link: '#', text: 'Monterey', image: 'https://picsum.photos/600/400?random=3' },
    { link: '#', text: 'Sequoia', image: 'https://picsum.photos/600/400?random=4' }
  ];
  // Inline SVG mocks to showcase UI inside device frames (mobile + desktop)
  const mobileSvg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' width='390' height='844'>
    <defs>
      <clipPath id='mobileRoundedCorners'>
        <rect x='0' y='0' width='390' height='844' rx='55' ry='55'/>
      </clipPath>
    </defs>
    <rect width='390' height='844' fill='#0b0d12' clip-path='url(#mobileRoundedCorners)'/>
    <text x='24' y='60' fill='#e5e7eb' font-size='16' font-family='Inter, Arial'>Watchlist</text>
    <g>
      <rect x='20' y='84' rx='12' ry='12' width='350' height='44' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='36' y='112' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>AAPL</text>
      <text x='320' y='112' fill='#fca5a5' font-size='12' font-family='Inter, Arial'>▼0.7%</text>
    </g>
    <g>
      <rect x='20' y='136' rx='12' ry='12' width='350' height='44' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='36' y='164' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>TCS.NS</text>
      <text x='320' y='164' fill='#86efac' font-size='12' font-family='Inter, Arial'>▲1.2%</text>
    </g>
    <g>
      <rect x='20' y='188' rx='12' ry='12' width='350' height='44' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='36' y='216' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>TSLA</text>
      <text x='320' y='216' fill='#fca5a5' font-size='12' font-family='Inter, Arial'>▼0.7%</text>
    </g>
    <g>
      <rect x='20' y='240' rx='12' ry='12' width='350' height='44' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='36' y='268' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>HDFCBANK.NS</text>
      <text x='300' y='268' fill='#86efac' font-size='12' font-family='Inter, Arial'>▲1.2%</text>
    </g>
    <g>
      <rect x='20' y='292' rx='12' ry='12' width='350' height='44' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='36' y='320' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>MSFT</text>
      <text x='320' y='320' fill='#86efac' font-size='12' font-family='Inter, Arial'>▲0.6%</text>
    </g>
    <rect x='20' y='360' rx='14' ry='14' width='350' height='160' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
    <text x='32' y='384' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>P/E</text>
    <text x='92' y='384' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>RSI</text>
    <text x='152' y='384' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>Sharpe</text>
  </svg>`;
  const mobileMock = `data:image/svg+xml;utf8,${encodeURIComponent(mobileSvg)}`;

  const desktopSvg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'>
    <rect width='1200' height='700' fill='#0b0d12'/>
    <rect x='24' y='24' width='260' height='652' rx='16' fill='rgba(255,255,255,0.04)' stroke='rgba(255,255,255,0.1)'/>
    <text x='40' y='60' fill='#e5e7eb' font-size='16' font-family='Inter, Arial'>Watchlist</text>
    <g>
      <rect x='32' y='76' rx='10' ry='10' width='240' height='40' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='48' y='100' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>AAPL</text>
      <text x='234' y='100' fill='#fca5a5' font-size='12' font-family='Inter, Arial' text-anchor='end'>▼0.7%</text>
    </g>
    <g>
      <rect x='32' y='122' rx='10' ry='10' width='240' height='40' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='48' y='146' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>TCS.NS</text>
      <text x='234' y='146' fill='#86efac' font-size='12' font-family='Inter, Arial' text-anchor='end'>▲1.2%</text>
    </g>
    <g>
      <rect x='32' y='168' rx='10' ry='10' width='240' height='40' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='48' y='192' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>TSLA</text>
      <text x='234' y='192' fill='#fca5a5' font-size='12' font-family='Inter, Arial' text-anchor='end'>▼0.7%</text>
    </g>
    <g>
      <rect x='32' y='214' rx='10' ry='10' width='240' height='40' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='48' y='238' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>HDFCBANK.NS</text>
      <text x='234' y='238' fill='#86efac' font-size='12' font-family='Inter, Arial' text-anchor='end'>▲1.2%</text>
    </g>
    <g>
      <rect x='32' y='260' rx='10' ry='10' width='240' height='40' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
      <text x='48' y='284' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>MSFT</text>
      <text x='234' y='284' fill='#86efac' font-size='12' font-family='Inter, Arial' text-anchor='end'>▲0.6%</text>
    </g>
    <rect x='308' y='48' width='860' height='320' rx='18' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
    <text x='326' y='76' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>P/E</text>
    <text x='386' y='76' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>RSI</text>
    <text x='446' y='76' fill='#9ca3af' font-size='12' font-family='Inter, Arial'>Sharpe</text>
    <rect x='308' y='388' width='418' height='230' rx='16' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
    <rect x='748' y='388' width='420' height='230' rx='16' fill='rgba(255,255,255,0.05)' stroke='rgba(255,255,255,0.1)'/>
    <text x='326' y='412' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>AI Memo (preview)</text>
    <text x='766' y='412' fill='#e5e7eb' font-size='14' font-family='Inter, Arial'>Signals</text>
  </svg>`;
  const desktopMock = `data:image/svg+xml;utf8,${encodeURIComponent(desktopSvg)}`;
  return (
    <div className="min-h-[100svh] w-full scroll-smooth bg-[#0a0c10] text-zinc-300 antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        :root{--aa-ink:#8efcff;--aa-glow:#a78bfa;--aa-rose:#ff7ad9;}
        html,body,#root{height:100%}
        .headline{font-family:'Archivo',system-ui,ui-sans-serif;letter-spacing:-0.02em}
      `}</style>

      
      


      {/* Floating dock for primary actions (moved from navbar) */}
      <FloatingDock
        items={[
          { title: 'Features', icon: <Sparkles className="h-5 w-5" />, href: '#features' },
          { title: 'Use cases', icon: <Users className="h-5 w-5" />, href: '#personas' },
          { title: 'Blog', icon: <Newspaper className="h-5 w-5" />, href: '/blog' },
          { title: 'Recommendation', icon: <BarChart3 className="h-5 w-5" />, href: '/recommendation' },
          { title: 'Pricing', icon: <PieChart className="h-5 w-5" />, href: '/pricing' },
          { title: 'Templates', icon: <Layout className="h-5 w-5" />, href: '#templates' },
          { title: 'Get started', icon: <Rocket className="h-5 w-5" />, href: '/sign-up' },
        ]}
        desktopClassName="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        mobileClassName="fixed bottom-3 left-1/2 -translate-x-1/2 z-40"
      />

      {/* Hero */}
      <motion.header 
        id="hero"
        className="relative mx-auto mt-4 sm:mt-6 w-full px-4 sm:px-6 pb-12 sm:pb-18 min-h-[100vh] flex items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <motion.div 
          className="absolute top-6 left-12 z-50"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <img 
            src="/assets/logo/logo.png" 
            alt="Ask Alpha" 
            className="h-10 w-auto transition-all duration-300 hover:scale-105"
          />
        </motion.div>
        <div className="relative w-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3">
          <GlowingEffect
            blur={0}
            borderWidth={3}
            spread={80}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <div className="border-0.75 relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl p-4 sm:p-6 md:p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
            <div className="absolute -left-24 top-10 h-72 w-[55rem] rotate-[8deg] rounded-full bg-[radial-gradient(closest-side,rgba(30,144,255,0.5),transparent)] blur-2xl" />
            <div className=" md:grid gap-6 sm:gap-8 md:grid-cols-2 min-h-[80vh]">
              <motion.div 
                className="z-10 flex justify-center flex-col w-full"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge>AI research engine</Badge>
                  <Badge>Equities · Indices · ETFs</Badge>
                </div>
                <h1 className="headline mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-zinc-50">
                  AI Stock Analysis
                  <br />
                </h1>
                <p className="mb-6 max-w-2xl text-sm sm:text-base md:text-lg text-zinc-300">
                  Get instant AI-powered stock analysis and investment recommendations in under 60 seconds. Professional equity research tool for traders, investors, and financial advisors. No spreadsheets, no guesswork—just actionable insights.
                </p>
                <div className="relative mt-4 max-w-xl">
                  <input
                    type="text"
                    placeholder="Enter stock symbol or company name (e.g., RELIANCE, AAPL, TCS)"
                    className="min-w-full rounded-2xl border border-white/10 bg-white/5 px-4 sm:px-5 py-3 sm:py-4 pr-28 sm:pr-36 text-sm text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg"
                    value={heroInput}
                    onChange={(e) => setHeroInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAnalyzeClick(); } }}
                  />
                  <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2">
                    <ShinyButton className="px-3 sm:px-5 py-2 text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg" onClick={handleAnalyzeClick}>Analyze</ShinyButton>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <Badge>60-second stock analysis</Badge>
                  <Badge>SEBI compliant research</Badge>
                  <Badge>Global stock coverage</Badge>
                </div>
              </motion.div>
              {/* Right visual: laptop + mobile mockups */}
              <motion.div 
                className="relative flex justify-center items-center mt-8 md:mt-0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {/* Laptop mockup (Safari frame with embedded UI) */}
                <div className="hidden md:block group">
                  <div className="scale-75 lg:scale-90 xl:scale-50 transition-all duration-500 hover:scale-[0.8] lg:hover:scale-[0.95] xl:hover:scale-[0.55] hover:rotate-1">
                    <Safari url="askalpha.ai/app" imageSrc={desktopMock} width={1280} height={800} />
                  </div>
                </div>
                
                {/* Mobile mockup (iPhone 15 Pro) with embedded UI */}
                <div className="absolute right-[-20px] bottom-[20px] hidden lg:block group">
                  <div className="scale-[0.35] lg:scale-[0.4] xl:scale-[0.42] origin-bottom-right transition-all duration-500 hover:scale-[0.38] lg:hover:scale-[0.43] xl:hover:scale-[0.45] hover:rotate-2 hover:-translate-y-2">
                    <Iphone15Pro src={mobileMock} />
                  </div>
                </div>
                
                {/* Mobile-only mockup */}
                <div className="block md:hidden group">
                  <div className="scale-75 transition-all duration-500 hover:scale-80 hover:rotate-1">
                    <Iphone15Pro src={mobileMock} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>
{/* Scroll stack (personas/use cases) */}
      <motion.section 
        id="personas" 
        className="mx-auto w-full px-4 sm:px-6 py-8 sm:py-14"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <SectionTitle
          eyebrow="who it's for"
          title="Perfect for traders, teams, and operators"
          cta={<ShinyButton className="!bg-white/5 !text-zinc-200 !ring-white/10" onClick={handleExplorePersonas}>Explore personas</ShinyButton>}
        />
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-[#0a0c10] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-10 bg-gradient-to-l no-scrollbar from-[#0a0c10] to-transparent z-10" />
          <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[
              { icon: Users, title: 'Retail traders', copy: 'Quick conviction before taking a position' },
              { icon: Briefcase, title: 'Wealth managers / RIAs', copy: 'Scalable research without more headcount' },
              { icon: Newspaper, title: 'Business media / writers', copy: 'Instant backgrounders during earnings' },
              { icon: Building2, title: 'Founders & CFOs', copy: 'Impartial valuation sanity‑check for fundraise/M&A' },
              { icon: BarChart3, title: 'Swing investors', copy: 'Signals and screens with explainability' },
              { icon: Shield, title: 'Compliance‑minded teams', copy: 'Audit‑ready outputs with sources' },
            ].map(({ icon: Icon, title, copy }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cursor-pointer"
              >
                <Card className="min-w-[240px] sm:min-w-[260px] snap-start">
                  <div className="mb-2 flex items-center gap-2 text-zinc-300 transition-colors duration-300 hover:text-white">
                    <Icon className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                    {title}
                  </div>
                  <p className="text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">{copy}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      {/* AI Stock Analysis Report Sample */}
      <motion.section 
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-14"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <SectionTitle eyebrow="sample" title="AI Stock Analysis Report Sample" />
        <div className="grid gap-4 sm:gap-6 md:grid-cols-12">
          {/* Left: Recommendation summary */}
          <motion.div 
            className="md:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="h-full">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">BUY</span>
                <span className="text-xs text-zinc-400">Generated by AskAlpha AI</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <div className="text-zinc-400">Current Price</div>
                  <div className="text-lg sm:text-xl text-white">₹3,050.00</div>
                  <div className="text-emerald-400">+2.5% today</div>
                </div>
                <div>
                  <div className="text-zinc-400">Target Price</div>
                  <div className="text-lg sm:text-xl text-white">₹3,400.00</div>
                  <div className="text-zinc-400">12-month target</div>
                </div>
                <div className="col-span-2">
                  <div className="text-zinc-400">Confidence</div>
                  <div className="text-lg sm:text-xl text-white">87%</div>
                  <div className="text-zinc-400">High conviction</div>
                </div>
              </div>
              <div className="mt-6">
                <ShinyButton className="w-full justify-center" onClick={handleDownloadReport}>Download Report</ShinyButton>
              </div>
            </Card>
          </motion.div>
          {/* Right: Quick modules */}
          <motion.div 
            className="md:col-span-7 grid gap-3 sm:gap-4 md:grid-cols-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="cursor-pointer">
              <div className="mb-2 text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">Quick Search</div>
              <div className="flex items-center justify-between">
                <div className="text-white font-medium transition-colors duration-300 hover:text-emerald-300">RELIANCE</div>
                <div className="text-xs text-zinc-400 transition-colors duration-300 hover:text-zinc-300">Analysis ready in 45s</div>
              </div>
            </Card>
            <Card className="cursor-pointer">
              <div className="mb-2 text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">Valuation Models</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105">
                  <div className="text-zinc-400 transition-colors duration-300 hover:text-zinc-300">DCF Model</div>
                  <div className="text-white transition-colors duration-300 hover:text-emerald-300">₹3,200</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105">
                  <div className="text-zinc-400 transition-colors duration-300 hover:text-zinc-300">P/E Multiple</div>
                  <div className="text-white transition-colors duration-300 hover:text-emerald-300">₹2,950</div>
                </div>
              </div>
            </Card>
            <Card className="cursor-pointer">
              <div className="mb-2 text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">Export Options</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 cursor-pointer">PDF Report</div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 cursor-pointer">PowerPoint</div>
              </div>
            </Card>
            <Card className="cursor-pointer">
              <div className="mb-2 text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">Trusted Stock Analysis Platform</div>
              <div className="text-sm text-zinc-300 transition-colors duration-300 hover:text-zinc-200">+10,000 Active Traders & Investors trust our AI-powered stock analysis tool for reliable investment recommendations.</div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {['HDFC','ICICI','Kotak','Zerodha','Groww','Angel'].map((n) => (
                  <div key={n} className="rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-2 text-center text-zinc-300 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:text-white cursor-pointer">{n}</div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.section>
      {/* Features */}
      <motion.div 
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-14 flex min-h-[60vh] sm:min-h-[80vh] items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <ScrollReveal
          baseOpacity={0}
          enableBlur={true}
          baseRotation={5}
          blurStrength={10}
        >
          AskAlpha turns raw market noise into clear, actionable insights.
          No spreadsheets, no guesswork—just fast, professional-grade equity research
          with transparent sources and buy/sell/hold recommendations in under 60 seconds.
        </ScrollReveal>
      </motion.div>

      {/* Stock Analysis Features */}
      <motion.section 
        id="features" 
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-14"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <SectionTitle eyebrow="features" title="Stock Analysis Features" />
        <p className="mb-6 max-w-3xl text-sm sm:text-base text-zinc-400">
          Professional Stock Research Tool with AI‑Powered Investment Analysis. Advanced equity research platform that delivers institutional‑grade stock analysis and investment recommendations. Perfect for traders, financial advisors, and investment professionals.
        </p>
        <ul className="grid grid-cols-1 grid-rows-none gap-3 sm:gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={<Zap className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="60x Faster – One‑Click Reports"
            description="Replace hours of spreadsheet work and earnings‑call note‑taking with a minute‑long query."
          />
          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            icon={<PieChart className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="Multi‑Model AI Synthesis Engine"
            description="Merges DCF, multiples, and sentiment analysis into clear Buy/Sell/Hold recommendations."
          />
          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={<Download className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="Brandable Export & White‑Label"
            description="Advisors can add their logo and send professional reports to clients instantly."
          />
          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={<Shield className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="Compliant – SEBI Compliance"
            description="Time‑stamped inputs and outputs with transparent audit trails for regulatory disclosures."
          />
          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={<Globe className="h-4 w-4 text-black dark:text-neutral-400" />}
            title="Universal – Global Coverage"
            description="Works for NIFTY heavyweights, SME IPOs, and U.S. tech names with real‑time data."
          />
        </ul>
      </motion.section>

      



      

      {/* Templates */}
      <motion.section 
        id="templates" 
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 sm:py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <SectionTitle
          eyebrow="kits"
          title="Why AskAlpha is the Best Stock Analysis Tool"
          cta={<ShinyButton className="!bg-white/5 !text-zinc-200 !ring-white/10" onClick={handleBrowseTemplates}>Browse templates</ShinyButton>}
        />
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[ 
            { title: "Traditional Research", copy: "Hours to build models and parse filings" },
            { title: "AskAlpha", copy: "60s full report generation with Buy/Sell/Hold + confidence" },
            { title: "Data Freshness", copy: "15‑minute data refresh for real‑time context" },
            { title: "Compliance", copy: "Audit trail & SEBI compliance with citations" },
            { title: "Coverage", copy: "NSE/BSE + NYSE/NASDAQ and more" },
            { title: "Security", copy: "End‑to‑end encryption with source citations" },
          ].map(({ title, copy }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="cursor-pointer"
            >
              <Card>
                <div className="mb-3 flex items-center gap-2 text-zinc-200 transition-colors duration-300 hover:text-white">
                  {title}
                </div>
                <p className="text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-300">{copy}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick setup */}
      <motion.section 
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_115%,rgba(142,252,255,0.2),transparent_60%)]" />
          <div className="text-xs sm:text-sm uppercase tracking-[0.22em] text-zinc-400">Start Your Free Stock Analysis</div>
          <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white">Get Buy/Sell/Hold Recommendations Now</div>
          <div className="mx-auto mt-4 sm:mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3 text-xs text-zinc-400">
            <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:text-white cursor-pointer">AAPL</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:text-white cursor-pointer">MSFT</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-2 sm:px-3 py-2 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:text-white cursor-pointer">RELIANCE</div>
          </div>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <ShinyButton className="transition-all duration-300 hover:scale-105 hover:shadow-lg" onClick={handleTryFreeAnalysis}>Try free stock analysis</ShinyButton>
            <ShinyButton className="!bg-white/5 !text-zinc-200 !ring-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:!bg-white/10" onClick={handleGetReport}>Get Report</ShinyButton>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-[-18%] mx-auto h-56 w-[85%] rounded-[40px] bg-[radial-gradient(50%_120%_at_50%_-20%,rgba(255,255,255,0.25),transparent_60%)]" />
        </div>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <span>© {new Date().getFullYear()} Ask Alpha</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-zinc-300 transition-all duration-300 hover:scale-105 cursor-pointer">Privacy</a>
            <a href="/terms" className="hover:text-zinc-300 transition-all duration-300 hover:scale-105 cursor-pointer">Terms</a>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
