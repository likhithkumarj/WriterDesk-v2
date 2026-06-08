import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, PenTool, ArrowRight, Layers, FileText, Globe, CheckCircle2 } from "lucide-react";

export function LandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <PenTool className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              WriterDesk
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#stats" className="hover:text-amber-400 transition-colors">Why WriterDesk</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Writing <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-medium mb-8 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Introducing WriterDesk v2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 max-w-4xl mx-auto leading-[1.1]">
          The Professional Workspace for{" "}
          <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            Screenwriters
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Craft scripts, format screenplays instantly, and organize your projects with the most intuitive, beautiful, and fluid scriptwriting tool ever built.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
          >
            Start Free Project <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-base transition-all flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>

        {/* Hero Image Mockup (Glassmorphism card showing editor structure) */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-violet-500/10 rounded-2xl pointer-events-none" />
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80 px-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="h-6 w-48 rounded bg-slate-850 mx-auto border border-slate-800/50 flex items-center justify-center text-[10px] text-slate-500 font-mono">
              writerdesk.app/project/intro-script
            </div>
          </div>
          <div className="pt-6 pb-12 px-8 flex flex-col md:flex-row gap-6 min-h-[300px]">
            {/* Mock Sidebar */}
            <div className="w-full md:w-1/4 flex flex-col gap-4 text-left border-r border-slate-800/60 pr-6">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-full bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center px-3 gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <div className="h-3 w-20 bg-amber-400/40 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-900 rounded-lg flex items-center px-3 gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <div className="h-3 w-28 bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-900 rounded-lg flex items-center px-3 gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <div className="h-3 w-16 bg-slate-800 rounded" />
              </div>
            </div>
            {/* Mock Editor Canvas */}
            <div className="flex-1 flex flex-col items-center justify-start py-4">
              <div className="w-full max-w-md bg-white text-slate-950 p-8 rounded shadow-lg text-left font-mono text-xs flex flex-col gap-4">
                <div className="font-bold text-slate-800 uppercase tracking-widest text-center border-b pb-2 border-slate-100">
                  SCENE 1 - EXT. VALLEY - DAY
                </div>
                <div className="pl-4 border-l-2 border-slate-300">
                  The morning sun breaks over the jagged peaks. A cold wind rustles the tall pines.
                </div>
                <div className="text-center font-bold uppercase mt-2">
                  WRITER
                </div>
                <div className="px-12 text-slate-700 leading-relaxed">
                  (whispering to the screen)
                  It's finally happening. The words flow effortlessly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Designed for the Modern Screenwriter
            </h2>
            <p className="text-slate-400 text-base">
              Everything you need to write blockbusters, high-end drama, or indie shorts with standard industry formatting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-all">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automatic Formatting</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                No more manual margins. Just press Tab or Enter, and WriterDesk handles Scene Headers, Action, Characters, and Dialogue automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:bg-violet-500/20 transition-all">
                <Layers className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-File Projects</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Break your story down into acts, chapters, or character breakdowns. Keep all your screenplay materials under a single clean structure.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm hover:border-amber-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-all">
                <Globe className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Local Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your draft is safe. Automatic storage synchronization ensures you never lose a single line of dialog, saving progress directly in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section id="stats" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="p-12 rounded-3xl bg-gradient-to-r from-amber-500/5 to-violet-500/5 border border-slate-900 flex flex-col md:flex-row items-center justify-around gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2">99.9%</div>
            <div className="text-slate-400 text-sm">Industry Standard Format Match</div>
          </div>
          <div className="h-px w-12 md:h-12 md:w-px bg-slate-800" />
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2">10x</div>
            <div className="text-slate-400 text-sm">Faster Writing & Draft Revisions</div>
          </div>
          <div className="h-px w-12 md:h-12 md:w-px bg-slate-800" />
          <div>
            <div className="text-4xl md:text-5xl font-black text-white mb-2">Free</div>
            <div className="text-slate-400 text-sm">Open Workspace to Get Started</div>
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section id="pricing" className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-900 bg-slate-950/60 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Unleash Your Screenplay's Potential Today
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-10">
            Write on any device, manage infinite screenplays, and format beautiful PDF files in seconds. Completely free to start.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-base shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all inline-flex items-center gap-2 group"
          >
            Create Free Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
              <PenTool className="w-3.5 h-3.5 text-slate-950" />
            </div>
            <span className="font-semibold">WriterDesk</span>
          </div>
          <div>
            © {new Date().getFullYear()} WriterDesk. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
