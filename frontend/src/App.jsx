import React, { useState } from 'react'
import TrafficStream from './components/TrafficStream.jsx'
import FlagManager from './components/FlagManager.jsx'
import ChaosControls from './components/ChaosControls.jsx'
import DatabaseDemo from './components/DatabaseDemo.jsx'
import { Server, Layers, ShieldAlert, Zap, ShoppingBag, Sparkles } from 'lucide-react'

export default function App() {
  const [lastResponse, setLastResponse] = useState(null)
  const [flags, setFlags] = useState({})

  // "effective" é o valor que o backend está de fato aplicando: no modo dual
  // uma flag vinda do Unleash sobrepõe o toggle local, e a interface precisa
  // refletir quem está no comando.
  const ativa = (nome) => flags[nome]?.effective ?? flags[nome]?.enabled ?? false
  const isModern = ativa('modern_layout')
  const isOpsDegraded = ativa('ops_degraded_mode')
  const isVip = ativa('vip_discount')
  const isNewCheckout = ativa('new_checkout')

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-500 ${
      isModern
        ? 'bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-900'
        : 'bg-slate-950'
    }`}>
      {/* Ops Degraded Mode Alert Banner */}
      {isOpsDegraded && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
              <span>
                <strong className="text-amber-300 font-bold">Modo de Degradação Operacional Ativo (Ops Toggle):</strong> Consultas pesadas de busca e relatórios secundários foram desligados para estabilizar a infraestrutura durante alto tráfego.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40 whitespace-nowrap">
              Disjuntor Ativado
            </span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className={`border-b transition-colors duration-300 sticky top-0 z-50 ${
        isModern
          ? 'border-indigo-500/30 bg-slate-900/80 backdrop-blur shadow-lg shadow-indigo-950/20'
          : 'border-slate-800/80 bg-slate-900/60 backdrop-blur'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isModern
                ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 shadow-purple-500/30 scale-105'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-500 shadow-indigo-500/20'
            }`}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Laboratório Prático: Entrega Contínua & Implantação
                </h1>
                {isModern && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Layout Moderno (A/B)
                  </span>
                )}
              </div>
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

        {/* VIP Discount Promotional Card (Permission Toggle) */}
        {isVip && (
          <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/50 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-amber-200">Benefício VIP Desbloqueado! (Permission Toggle)</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950">20% OFF</span>
                </div>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Esta funcionalidade só é exibida para usuários autorizados (Permission Toggle), sem necessidade de novo deploy.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 font-mono font-bold text-xs">
                CUPOM: ARQ20VIP
              </span>
            </div>
          </div>
        )}

        {/* New Multi-Step Checkout Card (Release Toggle) */}
        {isNewCheckout && (
          <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/50 rounded-xl p-5 shadow-xl transition-all duration-300 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-blue-500/30">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Novo Fluxo de Checkout em Etapas (Release Toggle Ativado)</h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Nova Feature no Ar
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              O código deste novo fluxo de compras já estava implantado no container (Deploy), mas permaneceu invisível aos usuários até a ativação da Release Toggle!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-slate-900/80 border border-blue-500/30 p-3 rounded-lg flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">1</div>
                <div>
                  <div className="font-semibold text-slate-200">Sacola Validada</div>
                  <div className="text-[11px] text-slate-400">Verificação de estoque</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-indigo-500/30 p-3 rounded-lg flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">2</div>
                <div>
                  <div className="font-semibold text-slate-200">Pagamento Pix / Cartão</div>
                  <div className="text-[11px] text-slate-400">1-Click Checkout</div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">3</div>
                <div>
                  <div className="font-semibold text-slate-200">Confirmação Instantânea</div>
                  <div className="text-[11px] text-slate-400">Emissão de recibo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Traffic Section (Canary, Rolling & Blue-Green visualizer) */}
        <TrafficStream onLastResponse={setLastResponse} />

        {/* Interactive Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Flags Manager */}
          <FlagManager onFlagChange={setFlags} />

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
