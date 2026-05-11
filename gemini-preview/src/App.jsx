import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Activity,
  Cpu,
  Globe,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Database,
  Users,
  DollarSign,
  Search,
  Eye,
  Settings,
} from 'lucide-react';

const App = () => {
  const [phase, setPhase] = useState('landing'); // landing, scanning, dashboard, futurecast
  const [scanProgress, setScanProgress] = useState(0);
  const [activeNodes, setActiveNodes] = useState([]);
  const [optimizationLevel, setOptimizationLevel] = useState(0);
  const [showVulnerability, setShowVulnerability] = useState(false);

  // --- Mock Data ---
  const insights = [
    { id: 1, title: 'Ghost Latency Detected', location: 'Bengaluru Hub', impact: '$1.2M/yr Loss', type: 'performance' },
    { id: 2, title: 'Shadow IT Breach', location: 'Marketing Dept', impact: 'Data Leak Risk', type: 'security' },
    { id: 3, title: 'Redundant Licenses', location: 'Global SaaS', impact: '450+ Unused Seats', type: 'cost' }
  ];

  // --- Phase Logic ---
  useEffect(() => {
    if (phase === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase('dashboard'), 800);
            return 100;
          }
          return prev + 1;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // --- Components ---

  const Navbar = () => (
    <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 backdrop-blur-md bg-black/10 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
          <Zap className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tighter text-white">NEURAL_OS</span>
      </div>
      <div className="flex gap-4 items-center">
        <span className="text-xs font-mono text-zinc-500 hidden md:block">SYSTEM_STATUS: NOMINAL</span>
        <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
          V.2.5.0-STABLE
        </div>
      </div>
    </nav>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1e1e2e_0%,_transparent_100%)] opacity-50" />

      <div className="z-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          The End of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Invisible Waste.</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-light">
          Grant NEURAL_OS 60 seconds of read-only access to your Enterprise Graph.
          We map the DNA of your IT infrastructure and find what you're missing.
        </p>

        <button
          onClick={() => setPhase('scanning')}
          className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-indigo-600 w-0 group-hover:w-full transition-all duration-500" />
          <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
            Connect via SSO & Begin Deep Scan <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        <div className="mt-12 flex gap-8 justify-center opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
          <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-widest"><Shield className="w-4 h-4"/> Enterprise Ready</div>
          <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-widest"><Lock className="w-4 h-4"/> SOC 2 Type II</div>
        </div>
      </div>
    </div>
  );

  const ScanningPhase = () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 w-full max-w-md text-center">
        <div className="text-xs font-mono text-indigo-400 mb-2 uppercase tracking-[0.3em]">Neural Integration in Progress</div>
        <div className="text-4xl font-bold text-white mb-8 font-mono">{scanProgress}%</div>

        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-100 ease-out"
            style={{ width: `${scanProgress}%` }}
          />
        </div>

        <div className="space-y-2 h-20">
          {scanProgress > 10 && <div className="text-[10px] text-zinc-500 font-mono animate-pulse">INGESTING JIRA WORKFLOWS... [SUCCESS]</div>}
          {scanProgress > 30 && <div className="text-[10px] text-zinc-500 font-mono animate-pulse">MAPPING GLOBAL NETWORK TOPOLOGY... [SUCCESS]</div>}
          {scanProgress > 60 && <div className="text-[10px] text-zinc-500 font-mono animate-pulse">ANALYZING SAAS LICENSE UTILIZATION... [SUCCESS]</div>}
          {scanProgress > 85 && <div className="text-[10px] text-indigo-400 font-mono animate-pulse">DETECTING ANOMALIES IN ASIA-PACIFIC HUB... [ALERT]</div>}
        </div>
      </div>

      {/* Background Grid/Simulation Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {[...Array(144)].map((_, i) => (
            <div key={i} className={`border-[0.5px] border-zinc-800 transition-colors duration-500 ${Math.random() > 0.9 ? 'bg-indigo-900/20' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );

  const DashboardPhase = () => {
    const isOptimized = optimizationLevel > 50;

    return (
      <div className="min-h-screen bg-black text-white p-6 pt-24 font-sans select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Visualizer */}
          <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden min-h-[500px]">
             <div className="absolute top-6 left-8 z-10">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {isOptimized ? <CheckCircle className="text-teal-400" /> : <Activity className="text-rose-500 animate-pulse" />}
                  Enterprise Health Map
                </h2>
                <p className="text-zinc-500 text-sm mt-1">Live simulation of the Global Neural Network</p>
             </div>

             <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className={`relative transition-all duration-1000 ${isOptimized ? 'scale-90' : 'scale-100'}`}>
                   {/* Mock Globe/Map Structure */}
                   <Globe className={`w-80 h-80 transition-colors duration-1000 ${isOptimized ? 'text-teal-900' : 'text-zinc-800'}`} />

                   {/* Stress Points */}
                   {!isOptimized && (
                     <>
                       <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-rose-500 rounded-full animate-ping" />
                       <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                       <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-rose-500/20 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-rose-500 rounded-full" />
                       </div>
                     </>
                   )}

                   {/* Optimization Lines */}
                   {isOptimized && (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full rounded-full border border-teal-500/30 animate-pulse scale-110" />
                        <div className="w-full h-full rounded-full border border-teal-500/10 animate-pulse scale-125" />
                     </div>
                   )}
                </div>
             </div>

             {/* Dynamic Alerts */}
             <div className="absolute bottom-10 left-8 right-8 flex gap-4">
                {insights.map(insight => (
                  <div key={insight.id} className={`flex-1 p-4 rounded-xl border transition-all duration-500 ${isOptimized ? 'bg-zinc-900/50 border-zinc-800 opacity-30 grayscale' : 'bg-zinc-900 border-zinc-700 hover:border-rose-500/50'}`}>
                    <div className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">{insight.location}</div>
                    <div className="font-bold text-xs truncate">{insight.title}</div>
                    <div className={`text-sm font-bold mt-2 ${isOptimized ? 'text-zinc-400' : 'text-rose-500'}`}>
                      {isOptimized ? 'RESOLVED' : insight.impact}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Side Panel: Impact Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex-1">
              <h3 className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-6">Financial Recovery Preview</h3>

              <div className="space-y-8">
                <div>
                  <div className="text-zinc-500 text-sm mb-1">Annual Loss Prevented</div>
                  <div className="text-5xl font-bold font-mono tracking-tighter">
                    {isOptimized ? '$3,240,000' : '$0'}
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Cpu className="w-4 h-4"/> Compute Efficiency</span>
                      <span className={isOptimized ? "text-teal-400" : "text-zinc-500"}>{isOptimized ? "+42%" : "---"}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Users className="w-4 h-4"/> Human Productivity</span>
                      <span className={isOptimized ? "text-teal-400" : "text-zinc-500"}>{isOptimized ? "+18%" : "---"}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Shield className="w-4 h-4"/> Risk Mitigation</span>
                      <span className={isOptimized ? "text-teal-400" : "text-zinc-500"}>{isOptimized ? "99.9%" : "---"}</span>
                   </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                   <div className="text-xs font-mono text-zinc-500 mb-4 uppercase">Toggle Neural Optimizer</div>
                   <div className="relative h-12 bg-zinc-900 rounded-full p-1 flex items-center cursor-pointer" onClick={() => setOptimizationLevel(prev => prev > 50 ? 0 : 100)}>
                      <div
                        className={`h-full w-1/2 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out shadow-lg ${isOptimized ? 'translate-x-full bg-teal-500 text-black' : 'translate-x-0 bg-rose-500 text-white'}`}
                      >
                         <span className="font-bold text-xs uppercase tracking-widest">
                           {isOptimized ? 'OPTIMIZED' : 'LEGACY STATE'}
                         </span>
                      </div>
                      <div className="absolute inset-0 flex justify-around items-center pointer-events-none text-[10px] font-bold text-zinc-600">
                        <span>OFF</span>
                        <span>ON</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <button
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95"
              onClick={() => alert("Deployment Sequence Initiated. Welcome to the future of IT.")}
            >
              Deploy Full Package <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Floating Chat/AI Voice */}
        <div className="fixed bottom-10 right-10 z-50 flex items-end gap-4">
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl max-w-[300px] shadow-2xl animate-in fade-in slide-in-from-right-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                <span className="text-indigo-400 font-bold">SYSTEM_ORCHESTRATOR:</span> {isOptimized ?
                  "Optimization complete. VPN latency resolved in Bengaluru. 14 unauthorized Marketing SaaS accounts identified for consolidation. Security perimeter sealed." :
                  "Vikram, I've identified critical stress points. Your Bengaluru team is suffering from a 12% packet loss during peak sync hours. Drag the optimizer to see the remediation."}
              </p>
           </div>
           <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Zap className="text-white w-6 h-6" />
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black font-sans">
      <Navbar />
      {phase === 'landing' && <LandingPage />}
      {phase === 'scanning' && <ScanningPhase />}
      {phase === 'dashboard' && <DashboardPhase />}
    </div>
  );
};

export default App;
