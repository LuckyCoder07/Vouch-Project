import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CountUpImport from "react-countup";
const CountUp = typeof CountUpImport === 'function' ? CountUpImport : (CountUpImport.default || CountUpImport);
import { 
  ShieldCheck, 
  UploadCloud, 
  Link2, 
  AlertTriangle, 
  Building2, 
  Code2, 
  FolderArchive, 
  FileText, 
  Globe 
} from "lucide-react";

// Fade in component for scroll animations
function FadeInWhenVisible({ children, delay = 0, direction = "up" }) {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased overflow-x-hidden selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-800 dark:selection:text-blue-200">
      
      {/* SECTION 1 — Navbar (fixed top) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-vouch-600" />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Vouch</span>
          <span className="badge-blue text-[10px] py-0.5 px-2 font-semibold">Beta</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-vouch-600 dark:hover:text-vouch-400 transition-colors text-sm font-semibold">Pricing</Link>
          <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-vouch-600 dark:hover:text-vouch-400 transition-colors text-sm font-semibold">How it works</Link>
          <Link to="/login" className="btn-primary py-1.5 px-4 rounded-lg text-xs md:text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Main Sections Wrapper */}
      <main className="pt-16 pb-20 space-y-24 md:space-y-32">
        
        {/* SECTION 2 — Hero */}
        <FadeInWhenVisible>
          <section className="min-h-[calc(100vh-80px)] flex items-center justify-center pt-20 relative overflow-hidden">
            {/* Subtle grid background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
              <div className="absolute top-[20%] left-[10%] w-[30rem] h-[30rem] bg-vouch-500/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
              <div className="absolute bottom-[20%] right-[10%] w-[25rem] h-[25rem] bg-purple-500/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
              {/* Small pill badge */}
              <div className="inline-flex">
                <Link to="/how-it-works" className="badge-blue inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 shadow-sm transition-all hover:bg-blue-100/50 dark:hover:bg-blue-950/60">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Powered by SHA3-256 + Polygon Amoy</span>
                </Link>
              </div>

              {/* H1 */}
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight md:leading-[1.1] text-balance text-gray-900 dark:text-white">
                The Immutable Code Notary <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-vouch-600 to-purple-600 bg-clip-text text-transparent">
                  for Developers
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Prove authorship. Detect plagiarism. Anchor to blockchain.
              </p>

              {/* Two CTA buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <Link to="/login" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto shadow-glow flex items-center justify-center gap-2.5">
                  <UploadCloud className="w-5 h-5" />
                  <span>Vouch Your Code Free</span>
                </Link>
                <Link to="/how-it-works" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto flex items-center justify-center">
                  See How It Works
                </Link>
              </div>

              {/* Stats row below CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto">
                <div className="card p-5 flex flex-col items-center justify-center text-center shadow-soft bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <h3 className="text-3xl font-extrabold text-vouch-600 dark:text-vouch-400">
                    <CountUp end={10000} suffix="+" separator="," />
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Files Vouched</p>
                </div>
                <div className="card p-5 flex flex-col items-center justify-center text-center shadow-soft bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <h3 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    <CountUp end={99.9} decimals={1} suffix="%" />
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Uptime</p>
                </div>
                <div className="card p-5 flex flex-col items-center justify-center text-center shadow-soft bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    <CountUp end={2} prefix="< " suffix="s" />
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Avg Vouch Time</p>
                </div>
              </div>
            </div>
          </section>
        </FadeInWhenVisible>

        {/* SECTION 3 — How It Works (3 steps) */}
        <FadeInWhenVisible>
          <section className="py-12 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                Three steps to permanent proof
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
                Get cryptographic certainty for your intellectual integrity in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-gray-100 dark:bg-gray-800 -z-10" />

              {/* Step 1 */}
              <div className="card p-8 flex flex-col items-center text-center space-y-4 hover:border-vouch-500/50 transition-all duration-300 relative bg-white dark:bg-gray-900 shadow-soft">
                <span className="absolute top-4 right-6 text-2xl font-black text-gray-100 dark:text-gray-800 select-none">
                  01
                </span>
                <div className="w-14 h-14 rounded-2xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Your File</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Drop any .py, .java, .cpp, or .txt file. We accept code in any state.
                </p>
              </div>

              {/* Step 2 */}
              <div className="card p-8 flex flex-col items-center text-center space-y-4 hover:border-vouch-500/50 transition-all duration-300 relative bg-white dark:bg-gray-900 shadow-soft">
                <span className="absolute top-4 right-6 text-2xl font-black text-gray-100 dark:text-gray-800 select-none">
                  02
                </span>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Structural Fingerprint</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  ABT normalization strips formatting — only logic is hashed with SHA3-256.
                </p>
              </div>

              {/* Step 3 */}
              <div className="card p-8 flex flex-col items-center text-center space-y-4 hover:border-vouch-500/50 transition-all duration-300 relative bg-white dark:bg-gray-900 shadow-soft">
                <span className="absolute top-4 right-6 text-2xl font-black text-gray-100 dark:text-gray-800 select-none">
                  03
                </span>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Link2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blockchain Anchored</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your hash is committed to Polygon Amoy every 24 hours via Merkle tree.
                </p>
              </div>
            </div>
          </section>
        </FadeInWhenVisible>

        {/* SECTION 4 — Feature Grid */}
        <FadeInWhenVisible>
          <section className="py-12 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                Everything you need to prove your work
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
                Advanced features built directly into a unified Developer Notary workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Plagiarism Detection</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Similar code detection using structural AST fingerprints.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Organization Management</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Set up classroom rosters, manage departments, and invite teams.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <Code2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">VS Code Extension</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Vouch and verify code without ever leaving your editor workspace.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Batch Upload</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Secure entire repositories or multi-file project packages in ZIP format.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">PDF Certificates</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Official cryptographically signed receipt containing hashes and timestamp.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="card p-6 flex flex-col space-y-4 hover:border-vouch-500/50 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-vouch-50 dark:bg-vouch-950/30 flex items-center justify-center text-vouch-600 dark:text-vouch-400 shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Public Verification Portal</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Share verify links so peers or instructors can validate logic instantly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeInWhenVisible>

        {/* SECTION 5 — Pricing CTA Banner */}
        <FadeInWhenVisible>
          <section className="py-12 max-w-6xl mx-auto px-6">
            <div className="bg-gradient-to-r from-vouch-600 to-purple-600 rounded-3xl text-white p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none" />
              <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Start free. Upgrade when you're ready.
                </h2>
                <p className="text-lg text-blue-100 leading-relaxed">
                  25 files/month free forever. Student Pro at ₹199/month. Classroom plan for institutions.
                </p>
                <div className="pt-4">
                  <Link 
                    to="/pricing" 
                    className="inline-block bg-white text-vouch-600 hover:bg-gray-50 transition-all active:scale-95 font-bold px-8 py-3.5 rounded-xl text-sm shadow-md"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </FadeInWhenVisible>

        {/* SECTION 6 — Footer */}
        <FadeInWhenVisible>
          <footer className="py-12 max-w-6xl mx-auto px-6 border-t border-gray-100 dark:border-gray-800 text-center space-y-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              © 2025 Vouch. Built for developers, by developers.
            </p>
            <div className="flex justify-center gap-6 text-xs text-gray-450 dark:text-gray-500 font-semibold">
              <Link to="/privacy" className="hover:text-vouch-600 dark:hover:text-vouch-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-vouch-600 dark:hover:text-vouch-400 transition-colors">Terms of Service</Link>
              <Link to="/pricing" className="hover:text-vouch-600 dark:hover:text-vouch-400 transition-colors">Pricing</Link>
            </div>
          </footer>
        </FadeInWhenVisible>

      </main>
    </div>
  );
}
