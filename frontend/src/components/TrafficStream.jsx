import React, { useState, useEffect, useRef } from 'react'
import { Activity, Play, Pause, RotateCcw, Server, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

export default function TrafficStream({ onLastResponse }) {
  const [isRunning, setIsRunning] = useState(true)
  const [intervalMs, setIntervalMs] = useState(600) // ~1.6 req/s
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    blue: 0,
    green: 0,
    errors: 0
  })

  const timerRef = useRef(null)

  const sendRequest = async () => {
    const startTime = performance.now()
    try {
      const res = await fetch('/api/version')
      const latency = Math.round(performance.now() - startTime)
      const data = await res.json()
      
      const isSuccess = res.ok
      const isBlue = data.color === 'blue' || (data.version && data.version.includes('v1'))
      const isGreen = data.color === 'green' || (data.version && data.version.includes('v2'))

      const entry = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        status: res.status,
        success: isSuccess,
        version: data.version || 'unknown',
        color: data.color || (isSuccess ? 'blue' : 'gray'),
        hostname: data.hostname || 'unknown',
        latency,
        error: data.error || null
      }

      setHistory(prev => [entry, ...prev.slice(0, 24)])
      setStats(prev => ({
        total: prev.total + 1,
        blue: prev.blue + (isSuccess && isBlue ? 1 : 0),
        green: prev.green + (isSuccess && isGreen ? 1 : 0),
        errors: prev.errors + (isSuccess ? 0 : 1)
      }))

      if (onLastResponse) {
        onLastResponse(entry)
      }
    } catch (err) {
      const latency = Math.round(performance.now() - startTime)
      const entry = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        status: 503,
        success: false,
        version: 'N/A',
        color: 'red',
        hostname: 'gateway/offline',
        latency,
        error: err.message
      }
      setHistory(prev => [entry, ...prev.slice(0, 24)])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        errors: prev.errors + 1
      }))
      if (onLastResponse) {
        onLastResponse(entry)
      }
    }
  }

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(sendRequest, intervalMs)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, intervalMs])

  const resetStats = () => {
    setStats({ total: 0, blue: 0, green: 0, errors: 0 })
    setHistory([])
  }

  const bluePct = stats.total > 0 ? Math.round((stats.blue / stats.total) * 100) : 0
  const greenPct = stats.total > 0 ? Math.round((stats.green / stats.total) * 100) : 0
  const errorPct = stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
      {/* Top Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-wide">Tráfego em Tempo Real</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulador de tráfego de usuários acessando o Load Balancer (Nginx)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Rate selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700">
            <span>Freq:</span>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="bg-transparent font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value={1000} className="bg-slate-900">1 req/s</option>
              <option value={500} className="bg-slate-900">2 req/s</option>
              <option value={250} className="bg-slate-900">4 req/s</option>
            </select>
          </div>

          {/* Pause/Play Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pausar</> : <><Play className="w-3.5 h-3.5" /> Retomar</>}
          </button>

          {/* Reset Button */}
          <button
            onClick={resetStats}
            title="Zerar contadores"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Requisições</span>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
        </div>

        <div className="bg-blue-950/40 border border-blue-600/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Versão 1 (Blue)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
              {bluePct}%
            </span>
          </div>
          <div className="text-2xl font-black text-blue-200 mt-1">{stats.blue}</div>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Versão 2 (Green)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
              {greenPct}%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-200 mt-1">{stats.green}</div>
        </div>

        <div className={`rounded-lg p-4 border transition ${
          stats.errors > 0
            ? 'bg-rose-950/50 border-rose-600/60'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Erros (5xx)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/30">
              {errorPct}%
            </span>
          </div>
          <div className="text-2xl font-black text-rose-200 mt-1">{stats.errors}</div>
        </div>
      </div>

      {/* Visual Traffic Ratio Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Distribuição de Tráfego:</span>
          <span>
            {stats.total > 0
              ? `Blue: ${bluePct}% | Green: ${greenPct}% | Erros: ${errorPct}%`
              : 'Aguardando requisições...'}
          </span>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700/60">
          <div
            style={{ width: `${bluePct}%` }}
            className="bg-blue-600 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {bluePct > 10 && `${bluePct}%`}
          </div>
          <div
            style={{ width: `${greenPct}%` }}
            className="bg-emerald-500 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {greenPct > 10 && `${greenPct}%`}
          </div>
          <div
            style={{ width: `${errorPct}%` }}
            className="bg-rose-500 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white"
          >
            {errorPct > 10 && `${errorPct}%`}
          </div>
        </div>
      </div>

      {/* Live Stream Table / Log */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Histórico das últimas 25 requisições:
        </h3>
        <div className="overflow-x-auto max-h-64 overflow-y-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Hora</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Versão</th>
                <th className="py-2.5 px-3">Ambiente</th>
                <th className="py-2.5 px-3">Instância (Host)</th>
                <th className="py-2.5 px-3">Latência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.map((req) => (
                <tr
                  key={req.id}
                  className={`hover:bg-slate-800/40 transition ${
                    !req.success ? 'bg-rose-950/20 text-rose-300' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-slate-400">{req.time}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded ${
                      req.success
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-700/40'
                    }`}>
                      {req.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{req.version}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      req.color === 'blue'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                        : req.color === 'green'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {req.color}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]" title={req.hostname}>
                    {req.hostname}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{req.latency} ms</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    Nenhuma requisição realizada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
