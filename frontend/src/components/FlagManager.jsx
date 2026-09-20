import React, { useState, useEffect } from 'react'
import { ToggleLeft, ToggleRight, Sliders, ExternalLink, HelpCircle, ShieldAlert, Sparkles, ShoppingBag, Zap } from 'lucide-react'

export default function FlagManager({ onFlagChange }) {
  const [flags, setFlags] = useState({
    new_checkout: { enabled: false, type: 'release', description: 'Nova tela de checkout em etapas' },
    modern_layout: { enabled: false, type: 'experiment', description: 'Layout moderno com gradiente e novos cards' },
    vip_discount: { enabled: false, type: 'permission', description: 'Cupom VIP de 20% para clientes selecionados' },
    ops_degraded_mode: { enabled: false, type: 'ops', description: 'Desliga busca pesada durante pico de tráfego' }
  })
  const [unleashInfo, setUnleashInfo] = useState({ configured: false, connection: 'checking', features: [] })
  const [loadingFlag, setLoadingFlag] = useState(null)

  const fetchFlags = async () => {
    try {
      const res = await fetch('/api/features')
      if (res.ok) {
        const data = await res.json()
        if (data.local) setFlags(data.local)
        if (data.unleash) setUnleashInfo(data.unleash)
      }
    } catch (err) {
      console.error('Erro ao buscar flags:', err)
    }
  }

  useEffect(() => {
    fetchFlags()
    const interval = setInterval(fetchFlags, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (onFlagChange) {
      onFlagChange(flags)
    }
  }, [flags, onFlagChange])

  const toggleFlag = async (flagName, currentVal) => {
    setLoadingFlag(flagName)
    try {
      const res = await fetch('/api/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag: flagName, enabled: !currentVal })
      })
      if (res.ok) {
        const data = await res.json()
        setFlags(prev => ({
          ...prev,
          [flagName]: {
            ...prev[flagName],
            enabled: data.enabled,
            // Atualização otimista: só vale quando a flag é local. Se o
            // Unleash comanda, o próximo poll traz o valor verdadeiro.
            effective: prev[flagName]?.source === 'unleash'
              ? prev[flagName]?.effective
              : data.enabled
          }
        }))
      }
    } catch (err) {
      console.error('Erro ao alternar flag:', err)
    } finally {
      setLoadingFlag(null)
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'release':
        return <span className="text-[10px] uppercase font-bold whitespace-nowrap px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Release Toggle</span>
      case 'experiment':
        return <span className="text-[10px] uppercase font-bold whitespace-nowrap px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Experiment (A/B)</span>
      case 'permission':
        return <span className="text-[10px] uppercase font-bold whitespace-nowrap px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Permission</span>
      case 'ops':
        return <span className="text-[10px] uppercase font-bold whitespace-nowrap px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Ops (Disjuntor)</span>
      default:
        return null
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'release': return <ShoppingBag className="w-4 h-4 text-blue-400" />
      case 'experiment': return <Sparkles className="w-4 h-4 text-purple-400" />
      case 'permission': return <Zap className="w-4 h-4 text-amber-400" />
      case 'ops': return <ShieldAlert className="w-4 h-4 text-rose-400" />
      default: return <Sliders className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Feature Flags (Feature Toggles)</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Separação entre <strong className="text-slate-200">Deploy</strong> (código em produção) e <strong className="text-slate-200">Release</strong> (visível ao usuário) sem reiniciar containers.
          </p>
        </div>

        {/* Unleash Status Badge */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <span className="text-slate-400">Unleash:</span>
          {unleashInfo.connection === 'connected' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ● Conectado
            </span>
          ) : (
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              ○ Modo Local
            </span>
          )}
          <a
            href="http://localhost:4242"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 ml-1 inline-flex items-center"
            title="Abrir Dashboard do Unleash"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Flag Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {Object.entries(flags).map(([key, flag]) => {
          // No modo dual o Unleash manda: o valor que vale é o "effective".
          const controladaPeloUnleash = flag.source === 'unleash'
          const isEnabled = flag.effective ?? flag.enabled
          const isToggling = loadingFlag === key

          return (
            <div
              key={key}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isEnabled
                  ? 'bg-slate-800/70 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                  : 'bg-slate-800/30 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getIcon(flag.type)}
                  <span className="font-mono font-bold text-sm text-white">{key}</span>
                </div>
                {getTypeBadge(flag.type)}
              </div>

              <p className="text-xs text-slate-300 mt-2 min-h-[32px]">
                {flag.description}
              </p>

              {controladaPeloUnleash && (
                <div className="mt-2 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded px-2 py-1">
                  Controlada pelo <strong>Unleash</strong> — o servidor central sobrepõe o toggle local
                  (local: {flag.enabled ? 'ligado' : 'desligado'}).
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className={`text-xs font-semibold ${isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isEnabled ? '● Ativo em Produção' : '○ Desativado (Invisível)'}
                </span>

                <button
                  onClick={() => toggleFlag(key, flag.enabled)}
                  disabled={isToggling || controladaPeloUnleash}
                  title={controladaPeloUnleash ? 'Esta flag está sendo controlada pelo Unleash' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                    isEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700'
                  } ${controladaPeloUnleash ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isEnabled ? (
                    <><ToggleRight className="w-4 h-4 text-emerald-400" /> Ligado</>
                  ) : (
                    <><ToggleLeft className="w-4 h-4 text-slate-400" /> Desligado</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Flags vindas do servidor Unleash */}
      {unleashInfo.connection === 'connected' && (
        <div className="mb-6 border border-emerald-900/50 bg-emerald-950/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">Flags do servidor Unleash</span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              centralizadas
            </span>
          </div>
          {unleashInfo.features.length === 0 ? (
            <p className="text-xs text-slate-400">
              Conectado, mas nenhuma flag cadastrada ainda. Crie uma em{' '}
              <a href="http://localhost:4242" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                localhost:4242
              </a>{' '}
              (ambiente <span className="font-mono">development</span>) e ela aparece aqui em até 10s.
            </p>
          ) : (
            <div className="space-y-2">
              {unleashInfo.features.map((f) => (
                <div key={f.name} className="flex items-center justify-between gap-2 text-xs bg-slate-900/60 rounded px-3 py-2">
                  <span className="font-mono font-bold text-white">{f.name}</span>
                  <div className="flex items-center gap-2">
                    {f.type && <span className="text-[10px] uppercase text-slate-400">{f.type}</span>}
                    <span className={`text-[11px] font-semibold ${f.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {f.enabled ? '● Ativa' : '○ Inativa'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Concept Box for Students */}
      <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3 text-xs text-indigo-200/90 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-indigo-300">Conceito Chave (Página 14 do Guia):</strong> O código de uma nova tela ou recurso pode estar implantado (Deploy) há semanas no cluster, mas o lançamento de negócio (Release) só ocorre quando a flag é ativada em milissegundos sem novo deploy.
        </div>
      </div>
    </div>
  )
}
