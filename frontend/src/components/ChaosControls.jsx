import React, { useState } from 'react'
import { Flame, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react'

export default function ChaosControls({ lastResponse }) {
  const [isInjecting, setIsInjecting] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const toggleFault = async () => {
    setIsInjecting(true)
    try {
      const res = await fetch('/api/fault/toggle', {
        method: 'POST'
      })
      const data = await res.json()
      setStatusMessage(data.message)
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err) {
      setStatusMessage('Erro ao comunicar com a API: ' + err.message)
    } finally {
      setIsInjecting(false)
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
        <Flame className="w-5 h-5 text-amber-400" />
        <h2 className="text-xl font-bold text-white tracking-wide">Simulador de Caos (Injeção de Falha)</h2>
      </div>

      <p className="text-sm text-slate-400 mt-3">
        Injete um erro HTTP 500 na instância que receber a próxima requisição para demonstrar a resposta da estratégia <strong className="text-slate-200">Canary</strong> e a necessidade de <strong className="text-slate-200">Rollback</strong>.
      </p>

      <div className="my-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-lg border border-slate-800">
        <div>
          <span className="text-xs text-slate-400 block">Alvo da injeção:</span>
          <span className="font-mono text-xs font-semibold text-sky-400">
            {lastResponse ? `${lastResponse.version} (${lastResponse.color}) - ${lastResponse.hostname}` : 'Aguardando tráfego...'}
          </span>
        </div>

        <button
          onClick={toggleFault}
          disabled={isInjecting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-rose-600/30 text-rose-200 border border-rose-500/40 hover:bg-rose-600/40 active:scale-95 transition"
        >
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          Alternar Falha (HTTP 500)
        </button>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Concept Box */}
      <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Analogia do Canário (Página 12 do Guia):</strong> Mineradores usavam canários para detectar gases tóxicos antes dos humanos. No Canary Release, se a versão nova falhar para 10% dos usuários, o sistema detecta os erros pelo monitoramento e aborta a implantação antes de afetar os 90% restantes!
        </div>
      </div>
    </div>
  )
}
