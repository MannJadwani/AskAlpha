"use client";
import React, { useEffect } from "react";

export default function MannJadwaniPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!customElements.get("spline-viewer")) {
        const s = document.createElement("script");
        s.type = "module";
        s.src =
          "https://unpkg.com/@splinetool/viewer@1.10.44/build/spline-viewer.js";
        s.setAttribute("data-spline-viewer", "1");
        document.head.appendChild(s);
      }
      if (!document.querySelector('link[data-mj-fonts]')) {
        const pre1 = document.createElement("link");
        pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
        const pre2 = document.createElement("link");
        pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "";
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;600;700&display=swap";
        link.setAttribute("data-mj-fonts", "1");
        document.head.append(pre1, pre2, link);
      }
    }
  }, []);

  return (
    <div className="min-h-dvh bg-[#0b0d12] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0b0d12]/70 backdrop-blur border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 select-none">
            <span className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 grid place-content-center text-sm font-semibold">MJ</span>
            <span className="text-white/80">Mann Jadwani</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a className="hover:text-white" href="#work">Work</a>
            <a className="hover:text-white" href="#expertise">Expertise</a>
            <a className="hover:text-white" href="#about">About</a>
            <a className="hover:text-white" href="#contact">Contact</a>
            <a href="#contact" className="ml-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">Let’s Talk</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grid place-items-center py-24 w-[100vw] h-[100vh]">
        <div
          className="pointer-events-none absolute -top-[30vh] right-1/2 translate-x-1/2 w-[80vmin] h-[80vmin] rounded-full blur-[120px] opacity-60"
          style={{ background: "radial-gradient(closest-side, rgba(44,92,255,0.45), transparent 70%)" }}
        />

        <div className="relative select-none text-center">
          <h1
            className="leading-[0.85] text-[18vw] sm:text-[16vw] md:text-[12vw] text-white"
            style={{ fontFamily: '"Bebas Neue", ui-sans-serif, system-ui' }}
          >
            Mann Jadwani
          </h1>

          {/* Absolute 3D model over center (100x100) */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] z-20 ">
            {/* @ts-ignore */}
            <spline-viewer
              background="transparent"
              url="https://prod.spline.design/haBbjrKAuSd2cwo1/scene.splinecode"
              style={{ position: "absolute", inset: 0 }}
            />
          </div>

          <p className="mt-6 max-w-2xl mx-auto text-white/70 text-sm sm:text-base" style={{ fontFamily: 'Sora, ui-sans-serif, system-ui' }}>
            Head of Tech • AI Engineer • Builder — designing and shipping agentic AI systems and delightful software.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3" style={{ fontFamily: 'Sora, ui-sans-serif, system-ui' }}>
            <a href="#contact" className="rounded-2xl px-5 py-3 bg-gradient-to-r from-[#6aa8ff] to-[#46ffe0] text-black font-semibold">Start a project</a>
            <a href="#work" className="rounded-2xl px-5 py-3 border border-white/15 hover:bg-white/5">See work</a>
          </div>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Selected Work</h2>
            <a href="#contact" className="text-sm text-white/70 hover:text-white">View all</a>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "AccessAllGPT", s: "Unified AI OS with MCP tools", c: "from-[#6aa8ff]/20" },
              { t: "AskAlpha", s: "AI equity research & reports", c: "from-[#46ffe0]/20" },
              { t: "DevBridge", s: "Spec-to-software collaboration", c: "from-[#9aa4ff]/25" },
            ].map((card) => (
              <a key={card.t} className="group rounded-2xl p-5 border border-white/10 bg-white/5 hover:border-white/20 transition" href="#">
                <div className={`h-36 rounded-xl bg-gradient-to-br ${card.c} to-transparent`} />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{card.t}</p>
                    <p className="text-xs text-white/60 mt-1">{card.s}</p>
                  </div>
                  <span className="text-white/50 group-hover:text-white">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section id="expertise" className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl md:text-3xl font-semibold">What I build</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { h: "Agentic AI Systems", p: "Research, planning, tool-use, and workflow automation wired into your stack." },
              { h: "Product Engineering", p: "Next.js apps, scalable APIs, and real-time dashboards tuned for performance." },
              { h: "Content Systems", p: "Pipelines for research, video, and docs to fuel consistent output." },
            ].map((x) => (
              <div key={x.h} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-lg font-semibold">{x.h}</p>
                <p className="mt-2 text-white/70 text-sm">{x.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-white/80">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">About</h2>
          <p className="mt-4">
            I’m Mann Jadwani, Head of Tech and founder of NeuralARC. I partner with teams to design, prototype, and ship AI-powered products fast—combining research, UX, and engineering with a bias for action.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-3xl px-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl md:text-3xl font-semibold">Let’s build something</h2>
          <form className="mt-6 grid md:grid-cols-2 gap-4">
            <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3" placeholder="Name" />
            <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3" placeholder="Email" type="email" />
            <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 md:col-span-2" placeholder="Company" />
            <textarea className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 md:col-span-2" rows={4} placeholder="Project goals" />
            <button type="submit" className="rounded-2xl bg-gradient-to-r from-[#6aa8ff] to-[#46ffe0] text-black font-semibold px-6 py-3">Send</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-white/50 border-t border-white/5">
        <p>
          © {new Date().getFullYear()} Mann Jadwani. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
