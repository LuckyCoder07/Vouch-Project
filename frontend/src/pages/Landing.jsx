import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Briefcase, 
  CheckCircle, 
  Cpu, 
  Upload, 
  ArrowRight,
  Github,
  Mail,
  HelpCircle,
  FileText
} from "lucide-react";

// Fade in component for scroll animations
function FadeInWhenVisible({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const howItWorksRef = useRef(null);

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const marqueeVariants = {
    animate: {
      x: [0, -1000],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 20,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* SECTION 1: HERO & NAVBAR */}
      <header className="relative min-h-screen flex flex-col justify-between">
        
        {/* Background blobs & grid */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
          
          {/* Two large blurred orbs moving slowly with CSS */}
          <div className="absolute top-[20%] left-[10%] w-[35rem] h-[35rem] bg-blue-600/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-[20%] right-[10%] w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
        </div>

        {/* Fixed Navbar (glass) */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/75 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">Vouch</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" onClick={scrollToHowItWorks} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">How it works</a>
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <Link to="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors text-sm font-medium px-4 py-2">Sign in</Link>
            <Link to="/login?tab=signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35">Get started free</Link>
          </div>
        </nav>

        {/* Content (centered, max-w-4xl) */}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-6 pt-28 pb-12 z-10">
          
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <a 
              href="#how-it-works" 
              onClick={scrollToHowItWorks}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold tracking-wider uppercase transition-all hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            >
              <span>Now with Blockchain Anchoring on Polygon Amoy →</span>
            </a>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.1] mb-6"
          >
            Prove you wrote it.<br />
            <span className="text-blue-400 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Before anyone questions it.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
          >
            Vouch timestamps and cryptographically signs your code the moment you write it — so you always have immutable proof of authorship.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <Link 
              to="/login?tab=signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>Start for free</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#how-it-works"
              onClick={scrollToHowItWorks}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center"
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center gap-3 text-slate-500 text-sm mb-16"
          >
            <div>No credit card required · 25 free submissions/month</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 border border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">AK</span>
                <span className="w-7 h-7 rounded-full bg-purple-600 border border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">RM</span>
                <span className="w-7 h-7 rounded-full bg-indigo-600 border border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">PS</span>
              </div>
              <span className="text-slate-400 font-medium">Join 500+ students proving their integrity</span>
            </div>
          </motion.div>

          {/* Hero visual: Certificate card mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-4xl mt-4 relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
          >
            {/* Left side: Code snippet mockup */}
            <div className="w-full md:w-1/2 bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-6 text-left shadow-2xl relative">
              <div className="flex gap-1.5 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                <code className="text-slate-500">1  # Compute normalized AST structure</code><br />
                <code>2  <span className="text-blue-400">def</span> <span className="text-purple-400">compute_structural_hash</span>(code_str):</code><br />
                <code>3      tree = ast.parse(code_str)</code><br />
                <code>4      normalized = normalize_ast(tree)</code><br />
                <code>5      <span className="text-blue-400">return</span> hashlib.sha3_256(normalized).hexdigest()</code><br />
              </pre>
              <div className="absolute right-4 bottom-4 text-xs font-mono text-slate-500">normalized_abt.py</div>
            </div>

            {/* Middle connecting arrow */}
            <div className="hidden md:block text-blue-500 text-3xl animate-pulse">
              →
            </div>

            {/* Right side: Floating Certificate Card */}
            <motion.div 
              animate={{ 
                y: [0, -12, 0],
                rotate: [0.5, -0.5, 0.5]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-full md:w-1/2 max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-blue-500/20 rounded-2xl p-6 text-left shadow-[0_10px_40px_rgba(59,130,246,0.15)] relative"
            >
              <div className="absolute top-4 right-4 bg-green-950/60 border border-green-500/30 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Verified
              </div>
              <ShieldCheck className="h-10 w-10 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Certificate of Authenticity</h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">VCH-82A7-91F2-BC70</p>
              
              <div className="space-y-3 border-t border-slate-800/80 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-200">Rahul Mehta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Structure Hash:</span>
                  <span className="font-mono text-slate-300">5a3f...d891</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-300">2026-05-19 12:08 UTC</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </main>
      </header>

      {/* SECTION 2: SOCIAL PROOF BAR */}
      <section className="bg-slate-900 border-y border-slate-800 py-10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-6 z-10 relative">
          <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">
            Trusted at institutions across India
          </span>
          <div className="w-full overflow-hidden flex items-center relative">
            {/* Transparent cover gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex space-x-12 text-slate-400 font-semibold text-sm whitespace-nowrap"
              variants={marqueeVariants}
              animate="animate"
            >
              <span>IIT Bombay</span>
              <span>IIT Delhi</span>
              <span>BITS Pilani</span>
              <span>VIT University</span>
              <span>Manipal Institute</span>
              <span>SRM Institute</span>
              <span>IIIT Hyderabad</span>
              
              {/* Repeated for seamless scroll */}
              <span>IIT Bombay</span>
              <span>IIT Delhi</span>
              <span>BITS Pilani</span>
              <span>VIT University</span>
              <span>Manipal Institute</span>
              <span>SRM Institute</span>
              <span>IIIT Hyderabad</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THREE AUDIENCES */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <FadeInWhenVisible>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Built for everyone who writes code
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Timestamps, signatures, and code validation optimized for your workflows.
            </p>
          </FadeInWhenVisible>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Students */}
          <FadeInWhenVisible delay={0.1}>
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-blue-500/30 rounded-2xl p-8 flex flex-col justify-between h-full transition-all hover:shadow-[0_10px_30px_rgba(59,130,246,0.05)]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-950 flex items-center justify-center text-blue-400 mb-6">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">For Students</h3>
                <h4 className="text-xl font-bold text-white mb-4">Never lose credit for your work again</h4>
                <ul className="space-y-3 mb-8 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Timestamp every assignment before submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Prove you wrote it first in plagiarism disputes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>PDF certificate accepted by most institutions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Free tier: 25 submissions per month</span>
                  </li>
                </ul>
              </div>
              <Link to="/login?tab=signup" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 group">
                <span>Start free</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeInWhenVisible>

          {/* Card 2: Professors */}
          <FadeInWhenVisible delay={0.2}>
            <div className="bg-slate-900/80 backdrop-blur border-2 border-blue-500/80 rounded-2xl p-8 flex flex-col justify-between h-full relative transition-all shadow-[0_10px_45px_rgba(59,130,246,0.1)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
                Most Popular
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400 mb-6">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">For Educators</h3>
                <h4 className="text-xl font-bold text-white mb-4">Automate submission integrity</h4>
                <ul className="space-y-3 mb-8 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Create assignments with secure invite links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Automatic plagiarism detection via ABT hashing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real-time classroom integrity dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Export signed reports for administration</span>
                  </li>
                </ul>
              </div>
              <Link to="/pricing" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 group">
                <span>Try Classroom plan</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeInWhenVisible>

          {/* Card 3: Professionals */}
          <FadeInWhenVisible delay={0.3}>
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-blue-500/30 rounded-2xl p-8 flex flex-col justify-between h-full transition-all hover:shadow-[0_10px_30px_rgba(59,130,246,0.05)]">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-950 flex items-center justify-center text-amber-400 mb-6">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">For Professionals</h3>
                <h4 className="text-xl font-bold text-white mb-4">Protect your intellectual property</h4>
                <ul className="space-y-3 mb-8 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>VS Code extension — vouch directly from editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>GitHub integration — auto-vouch every commit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>API access for CI/CD pipelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Blockchain anchored proof of creation</span>
                  </li>
                </ul>
              </div>
              <Link to="/pricing" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 group">
                <span>Explore plans</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeInWhenVisible>

        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section ref={howItWorksRef} id="how-it-works" className="py-24 bg-slate-900/40 relative">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center mb-16">
            <FadeInWhenVisible>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                From code to certificate in 3 steps
              </h2>
              <p className="text-slate-400">
                Works with Python, Java, C++, and more.
              </p>
            </FadeInWhenVisible>
          </div>

          {/* Timeline steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative mb-16">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[1px] bg-slate-800 z-0" />
            
            {/* Step 1 */}
            <FadeInWhenVisible delay={0.1}>
              <div className="relative text-center flex flex-col items-center z-10">
                <div className="w-11 h-11 rounded-full bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm mb-6">
                  01
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Upload your file</h4>
                <p className="text-sm text-slate-400 max-w-xs">
                  Drag and drop any supported source file into Vouch or submit via the CLI/VS Code extension.
                </p>
              </div>
            </FadeInWhenVisible>

            {/* Step 2 */}
            <FadeInWhenVisible delay={0.2}>
              <div className="relative text-center flex flex-col items-center z-10">
                <div className="w-11 h-11 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-sm mb-6">
                  02
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 mb-4">
                  <Cpu className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">We hash the logic</h4>
                <p className="text-sm text-slate-400 max-w-xs">
                  ABT normalization strips variable names and whitespace — only your code's unique structure is hashed with SHA3-256.
                </p>
              </div>
            </FadeInWhenVisible>

            {/* Step 3 */}
            <FadeInWhenVisible delay={0.3}>
              <div className="relative text-center flex flex-col items-center z-10">
                <div className="w-11 h-11 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm mb-6">
                  03
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Get your certificate</h4>
                <p className="text-sm text-slate-400 max-w-xs">
                  An RSA-signed PDF certificate with your verification code and metadata is generated and emailed to you instantly.
                </p>
              </div>
            </FadeInWhenVisible>
          </div>

          {/* GIF / Demo visual */}
          <FadeInWhenVisible>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-12 shadow-2xl text-center max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-500 mb-4 animate-bounce">
                <Cpu className="h-8 w-8" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Watch Vouch in Action</h4>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                See how fast code hashes are calculated, recorded in the ledger, and anchored to the blockchain.
              </p>
              <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-lg p-4 text-left font-mono text-[11px] text-slate-400">
                <div>$ vouch submit solution.py</div>
                <div className="text-blue-400">➔ Normalizing source code AST... OK</div>
                <div className="text-purple-400">➔ Calculated logic structure hash: vch_3c92e71...</div>
                <div className="text-amber-400">➔ Sending payload to secure ledger...</div>
                <div className="text-emerald-400">✔ Certificate VCH-82A7-91F2 successfully created.</div>
                <div className="text-slate-500">➔ Polygon transaction: 0x9b11e2f75a7...</div>
              </div>
            </div>
          </FadeInWhenVisible>

        </div>
      </section>

      {/* SECTION 5: LIVE STATS */}
      <section className="py-20 bg-slate-950 relative border-y border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInWhenVisible>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-blue-500 mb-2">
                    <CountUp end={12400} duration={3} suffix="+" enableScrollSpy={true} scrollSpyOnce={true} />
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Submissions verified</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-purple-500 mb-2">
                    <CountUp end={98.7} decimals={1} duration={3} suffix="%" enableScrollSpy={true} scrollSpyOnce={true} />
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 mb-2">
                    <CountUp end={3} duration={2} suffix=" sec" enableScrollSpy={true} scrollSpyOnce={true} />
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Avg Verification Time</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-red-500 mb-2">
                    <CountUp end={47} duration={3} enableScrollSpy={true} scrollSpyOnce={true} />
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Plagiarism Prevented</div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>All data anchored to Polygon Amoy blockchain</span>
                </div>
                <a 
                  href="https://amoy.polygonscan.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
                >
                  View latest anchor transaction on PolygonScan
                </a>
              </div>

            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section className="py-24 max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <FadeInWhenVisible>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              What students say
            </h2>
            <p className="text-slate-400">
              Real stories of academic integrity protected by Vouch.
            </p>
          </FadeInWhenVisible>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <FadeInWhenVisible delay={0.1}>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-8 flex flex-col justify-between h-full">
              <p className="text-slate-300 italic mb-8 leading-relaxed">
                "Vouch saved me in a dispute with my professor. I submitted the certificate and it was accepted immediately as proof of original authorship."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  RM
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Rahul M.</h4>
                  <p className="text-xs text-slate-500">Computer Science, IIT Bombay</p>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>

          {/* Card 2 */}
          <FadeInWhenVisible delay={0.2}>
            <div className="bg-slate-900/40 border border-slate-855 rounded-2xl p-8 flex flex-col justify-between h-full">
              <p className="text-slate-300 italic mb-8 leading-relaxed">
                "I use the VS Code extension every time I finish a feature. Takes 2 seconds and I have permanent proof. It's become a habit."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                  PS
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Priya S.</h4>
                  <p className="text-xs text-slate-500">Software Engineer, Bangalore</p>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>

          {/* Card 3 */}
          <FadeInWhenVisible delay={0.3}>
            <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-8 flex flex-col justify-between h-full">
              <p className="text-slate-300 italic mb-8 leading-relaxed">
                "The classroom dashboard cut my grading admin time in half. Plagiarism detection runs automatically — I just review the flags."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  AK
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Prof. Anand K.</h4>
                  <p className="text-xs text-slate-500">Professor of CS, VIT</p>
                </div>
              </div>
            </div>
          </FadeInWhenVisible>

        </div>
      </section>

      {/* SECTION 7: PRICING PREVIEW */}
      <section className="py-24 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          
          <div className="mb-16">
            <FadeInWhenVisible>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-400">
                Start free. Upgrade when you're ready.
              </p>
            </FadeInWhenVisible>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            
            {/* Free */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-white mb-1">Free</h3>
              <p className="text-xs text-slate-500 mb-4">For students starting out</p>
              <div className="text-2xl font-extrabold text-white mb-4">₹0</div>
              <ul className="text-xs text-slate-400 space-y-2 mb-6">
                <li>✓ 25 submissions/month</li>
                <li>✓ 1 Organization</li>
                <li>✓ Basic Plagiarism Detection</li>
              </ul>
              <Link to="/login?tab=signup" className="block text-center bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold py-2.5 rounded-lg border border-slate-850">
                Start Free
              </Link>
            </div>

            {/* Student Pro */}
            <div className="bg-slate-950 border-2 border-blue-500 rounded-2xl p-6 text-left relative">
              <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Pro</span>
              <h3 className="text-lg font-bold text-white mb-1">Student Pro</h3>
              <p className="text-xs text-slate-500 mb-4">For heavy developers</p>
              <div className="text-2xl font-extrabold text-white mb-4">₹199<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-2 mb-6">
                <li>✓ Unlimited submissions</li>
                <li>✓ 5 Organizations</li>
                <li>✓ Batch uploading (ZIP)</li>
                <li>✓ Priority support</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-blue-600/10">
                Upgrade Now
              </Link>
            </div>

            {/* Classroom */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left">
              <h3 className="text-lg font-bold text-white mb-1">Classroom</h3>
              <p className="text-xs text-slate-500 mb-4">For professors & departments</p>
              <div className="text-2xl font-extrabold text-white mb-4">₹999<span className="text-xs font-normal text-slate-500">/mo</span></div>
              <ul className="text-xs text-slate-400 space-y-2 mb-6">
                <li>✓ Unlimited classroom space</li>
                <li>✓ 20 Organizations</li>
                <li>✓ API access</li>
                <li>✓ Advanced Plagiarism dashboard</li>
              </ul>
              <Link to="/pricing" className="block text-center bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold py-2.5 rounded-lg border border-slate-850">
                Try Classroom
              </Link>
            </div>

          </div>

          <Link to="/pricing" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 group text-sm">
            <span>See full pricing details</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-700 to-indigo-950 border-t border-blue-500/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-650 opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <FadeInWhenVisible>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Your code deserves proof.
            </h2>
            <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of students and professionals who've already vouched their work.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link 
                to="/login?tab=signup" 
                className="bg-white hover:bg-slate-100 text-blue-900 text-lg font-bold px-8 py-4 rounded-xl shadow-lg transition-all"
              >
                Create free account
              </Link>
            </div>
            <p className="text-xs text-blue-200">
              No credit card · Cancel anytime · Data secured with RSA + Blockchain
            </p>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-bold text-white tracking-tight">Vouch</span>
            </Link>
            <p className="leading-relaxed">
              Timestamps and cryptographically signs your code logic for academic and intellectual integrity.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:support@vouch.com" className="hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/verify" className="hover:text-white transition-colors">Verification Portal</Link></li>
              <li><Link to="/batch" className="hover:text-white transition-colors">Batch Upload</Link></li>
              <li><Link to="/docs/vscore" className="hover:text-white transition-colors">VScore API</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Company</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" onClick={scrollToHowItWorks} className="hover:text-white transition-colors">How it works</a></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><Link to="/docs/code-normalization" className="hover:text-white transition-colors">Technical Docs</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/docs/code-normalization" className="hover:text-white transition-colors">Security Details</Link></li>
            </ul>
          </div>

        </div>

        <div className="max-w-6xl mx-auto px-6 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2025 Vouch · Built with ♥ in India</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
