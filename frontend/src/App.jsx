import React, { useState } from 'react'
import TrafficStream from './components/TrafficStream.jsx'
import FlagManager from './components/FlagManager.jsx'
import ChaosControls from './components/ChaosControls.jsx'
import DatabaseDemo from './components/DatabaseDemo.jsx'
import { Server, Layers } from 'lucide-react'

export default function App() {
  const [lastResponse, setLastResponse] = useState(null)

  // Experiment Toggle: o backend informa qual layout está ativo e a interface
  // muda sem novo deploy - é a demonstração do Bloco 5 da aula.
  const behaviour = lastResponse?.behaviour || {}
  const layoutModerno = behaviour.layout === 'moderno'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur transition-colors duration-500 ${
        layoutModerno
          ? 'border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-950/70 via-indigo-950/70 to-sky-950/70'
          : 'border-slate-800/80 bg-slate-900/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                Laboratório Prático: Entrega Contínua & Implantação
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Blue-Green</span> • <span>Canary</span> • <span>Rolling Update</span> • <span>Feature Flags</span>
              </div>
            </div>
          </div>

          {/* Current Active Server Live Badge */}
          <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Última Resposta:</span>
            </div>
            {layoutModerno && (
              <span className="px-2 py-0.5 rounded bg-fuchsia-600/30 text-fuchsia-200 border border-fuchsia-500/40 font-semibold">
                layout moderno
              </span>
            )}
            {behaviour.checkout === 'em-etapas' && (
              <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-200 border border-blue-500/40 font-semibold">
                checkout em etapas
              </span>
            )}
            {lastResponse ? (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                  lastResponse.color === 'blue'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : lastResponse.color === 'green'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                }`}>
                  {lastResponse.version} ({lastResponse.color})
                </span>
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[120px]" title={lastResponse.hostname}>
                  {lastResponse.hostname}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Conectando...</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Strategy Pills / Quick Context */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <div>
              <div className="font-bold text-slate-200">1. Rolling Update</div>
              <div className="text-[11px] text-slate-400">Instâncias graduais</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <div>
              <div className="font-bold text-slate-200">2. Blue-Green</div>
              <div className="text-[11px] text-slate-400">Switch & Rollback 0s</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div>
              <div className="font-bold text-slate-200">3. Canary Release</div>
              <div className="text-[11px] text-slate-400">Fatia % de risco</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <div>
              <div className="font-bold text-slate-200">4. Feature Flags</div>
              <div className="text-[11px] text-slate-400">Deploy ≠ Release</div>
            </div>
          </div>
        </div>

        {/* Real-time Traffic Section (Canary, Rolling & Blue-Green visualizer) */}
        <TrafficStream onLastResponse={setLastResponse} />

        {/* Interactive Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Flags Manager */}
          <FlagManager />

          <div className="space-y-8 flex flex-col">
            {/* Chaos Injection (Canary Error & Rollback Demo) */}
            <ChaosControls lastResponse={lastResponse} />

            {/* Database & Schema Demo */}
            <DatabaseDemo />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 mt-12 text-xs text-center text-slate-500">
        <p>Laboratório Didático de Arquitetura de Software • Desenvolvido com Clojure, React, Tailwind, Docker e Nginx</p>
      </footer>
    </div>
  )
}
