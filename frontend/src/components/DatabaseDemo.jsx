import React, { useState, useEffect } from 'react'
import { Database, Plus, RefreshCw, Layers } from 'lucide-react'

export default function DatabaseDemo() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState({ degraded: false, total: null, limit: null, discount: 0 })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setMeta({
          degraded: !!data.degraded,
          total: data.total ?? null,
          limit: data.limit ?? null,
          discount: data.discount_percent || 0
        })
      }
    } catch (err) {
      console.error('Erro ao buscar dados do banco:', err)
    }
  }

  // Poll curto para que o efeito de um Ops Toggle (ou uma escrita feita pela
  // outra versão) apareça sem precisar clicar em Recarregar.
  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setTitle('')
        setError(null)
        fetchItems()
      } else {
        setError(data.error || `Falha ao salvar (HTTP ${res.status})`)
      }
    } catch (err) {
      setError(err.message)
      console.error('Erro ao salvar item:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">Persistência & Banco de Dados Compartilhado</h2>
        </div>
        <button
          onClick={fetchItems}
          title="Recarregar dados"
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-3">
        Tanto a <strong className="text-blue-400">v1 (Blue)</strong> quanto a <strong className="text-emerald-400">v2 (Green)</strong> compartilham o mesmo banco PostgreSQL. Os dados persistem intactos após qualquer switch ou rollback.
      </p>

      {/* Add Item Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          id="novo-item"
          name="novo-item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite um registro para salvar no PostgreSQL..."
          className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600/30 text-teal-200 border border-teal-500/40 hover:bg-teal-600/40 disabled:opacity-50 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Salvar
        </button>
      </form>

      {meta.degraded && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
          <strong>Ops Toggle ativo (disjuntor):</strong> consulta reduzida a {meta.limit} registros
          {meta.total !== null && ` de ${meta.total}`} para aliviar o banco. Desligue
          <span className="font-mono"> ops_degraded_mode </span> para voltar ao normal.
        </div>
      )}

      {meta.discount > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
          <strong>Permission Toggle ativo:</strong> a API está devolvendo desconto VIP de {meta.discount}%.
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Items List */}
      <div className="mt-4 max-h-48 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/60 font-mono text-xs">
        {items.map((item) => (
          <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-slate-800/30 transition">
            <span className="text-slate-200">{item.title}</span>
            <span className="text-[10px] text-slate-500">{new Date(item.created_at || Date.now()).toLocaleTimeString()}</span>
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-4 text-center text-slate-500">
            Nenhum item salvo no banco de dados.
          </div>
        )}
      </div>

      {/* Schema Migration Lesson Note */}
      <div className="mt-4 bg-teal-950/20 border border-teal-900/40 rounded-lg p-3 text-xs text-teal-200/90 flex items-start gap-2">
        <Layers className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-teal-300">Desafio de Banco de Dados (Página 10 do Guia):</strong> Em deploys Blue-Green ou Rolling, o banco de dados é compartilhado. Mudanças no schema devem ser <em>aditivas</em> (retrocompatíveis) para que a versão antiga não quebre enquanto a nova está sendo promovida!
        </div>
      </div>
    </div>
  )
}
