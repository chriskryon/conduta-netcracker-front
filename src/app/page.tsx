"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import data from "@/utils/estados-cidades.json";

type Estado = {
  sigla: string;
  nome: string;
  cidades: string[];
};

export default function Home() {
  const estados: Estado[] = (data as { estados: Estado[] }).estados;
  const [estado, setEstado] = useState<string>("");
  const [cidade, setCidade] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [query, setQuery] = useState<{ uf: string; cidade: string; nome?: string } | null>(null);

  type Unit = {
    nome: string;
    cidade: string;
    uf: string;
    enderecoCompleto?: string;
    especialidades?: string[];
    superior?: boolean;
    senior?: boolean;
    tipo?: string;
    unimed?: string;
    telefone?: string;
    [key: string]: unknown;
  };

  type ApiResponse = {
    success: boolean;
    data: Unit[];
    total: number;
    page: number;
    limit: number;
  };

  const [items, setItems] = useState<Unit[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<Unit | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${API_BASE}${query?.nome ? "/units/search" : "/units"}`;
        const res = await axios.get<ApiResponse>(url, {
          signal: controller.signal,
          params: {
            uf: query.uf,
            cidade: query.cidade,
            page,
            limit,
            ...(query?.nome ? { nome: query.nome } : {}),
          },
          headers: { Accept: "application/json; charset=utf-8" },
        });
        const json = res.data;
        setItems(Array.isArray(json.data) ? json.data : []);
        setTotal(Number(json.total ?? 0));
      } catch (err: any) {
        const msg = err?.message ?? "Erro ao buscar dados";
        setError(err?.message ?? "Erro ao buscar dados");
        setItems([]);
        setTotal(0);
        console.error("API erro", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [API_BASE, query, page, limit]);

  const cidadesDoEstado = useMemo(() => {
    const uf = estados.find((e) => e.sigla === estado);
    if (!uf) return [] as string[];
    return uf.cidades;
  }, [estado, estados]);

  const cidadesFiltradas = useMemo(() => cidadesDoEstado, [cidadesDoEstado]);

  const itemsFiltrados = useMemo(() => items, [items]);

  const DetailsModal = ({ unit, onClose }: { unit: Unit; onClose: () => void }) => {
    return createPortal(
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-4">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-400 via-cyan-400 to-emerald-300" />
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Detalhes</p>
              <h3 className="text-xl font-semibold text-zinc-900 leading-tight">
                {unit.nome}
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                {unit.tipo ?? "—"} · {unit.unimed ?? "Unimed"} · {unit.cidade}/{unit.uf}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-9 rounded-full bg-zinc-900 px-4 text-xs font-semibold text-white shadow hover:bg-zinc-800"
            >
              Fechar
            </button>
          </div>

          <div className="grid max-h-[80vh] gap-4 overflow-auto px-5 pb-5 md:grid-cols-2">
            <div className="rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-500">Endereço</p>
                <a
                  href={unit.enderecoCompleto ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.enderecoCompleto)}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 disabled:opacity-40"
                  aria-disabled={!unit.enderecoCompleto}
                >
                  Ver no Maps
                </a>
              </div>
              <p className="mt-1 text-sm text-zinc-800 leading-relaxed">
                {unit.enderecoCompleto ?? "—"}
              </p>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-zinc-500">Contato</p>
              <p className="mt-1 text-sm text-zinc-800">Telefone: {unit.telefone ?? "—"}</p>
              <p className="text-sm text-zinc-800">Unimed: {unit.unimed ?? "—"}</p>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-zinc-500">Especialidades</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(unit.especialidades ?? []).length === 0 ? (
                  <span className="text-sm text-zinc-600">—</span>
                ) : (
                  (unit.especialidades ?? []).map((esp) => (
                    <span
                      key={esp}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                    >
                      {esp}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-medium text-zinc-500">Convênio</p>
              <p className="mt-1 text-sm text-zinc-800">{unit.unimed ?? "—"}</p>
              <div className="mt-3 flex gap-3 text-sm text-zinc-800">
                <span className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-black/5">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /> Superior: {unit.superior ? "Sim" : "Não"}
                </span>
                <span className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 ring-1 ring-black/5">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" /> Senior: {unit.senior ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className="min-h-dvh bg-linear-to-br from-zinc-50 to-sky-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="relative rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl backdrop-blur-2xl md:p-10">
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />

          <header className="mb-6 md:mb-8 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              NETCRACKER
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              REDE CREDENCIADA SEGUROS UNIMED
            </h1>
            <p className="text-sm text-zinc-600">
              Selecione UF e cidade, depois clique em Buscar para carregar os resultados.
            </p>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              Instabilidade no servidor · A busca pode demorar um pouco.
            </span>
          </header>

          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!estado || !cidade) {
                setError("Selecione estado e cidade antes de buscar");
                return;
              }
              setPage(1);
              setQuery({ uf: estado, cidade, nome: nome.trim() || undefined });
            }}
          >
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-700">Estado (sigla)</span>
              <select
                value={estado}
                onChange={(e) => {
                  const v = e.target.value;
                  setEstado(v);
                  setCidade("");
                }}
                className="h-11 w-full appearance-none rounded-xl border border-white/60 bg-white/70 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80"
              >
                <option value="">Selecione</option>
                {estados.map((e) => (
                  <option key={e.sigla} value={e.sigla} title={e.nome}>
                    {e.sigla} — {e.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-700">Cidade</span>
              <select
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                disabled={!estado}
                className="h-11 w-full appearance-none rounded-xl border border-white/60 bg-white/70 px-4 text-zinc-900 shadow-sm outline-none transition enabled:focus:border-sky-300 enabled:focus:ring-4 enabled:focus:ring-sky-100/80 disabled:opacity-50"
              >
                <option value="">{estado ? "Selecione" : "Escolha um estado primeiro"}</option>
                {cidadesFiltradas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-700">Nome (opcional)</span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: ATIVA"
                className="h-11 w-full rounded-xl border border-white/60 bg-white/70 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80"
              />
            </label>
            <div className="md:col-span-3 flex items-end justify-between">
              <button
                type="submit"
                className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white shadow hover:bg-zinc-800 disabled:opacity-60"
                disabled={!estado || !cidade || loading}
              >
                {loading ? "Carregando…" : "Buscar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEstado("");
                  setCidade("");
                  setNome("");
                  setItems([]);
                  setTotal(0);
                  setPage(1);
                  setQuery(null);
                  setError("");
                }}
                className="h-10 rounded-xl bg-white/70 px-4 text-xs font-medium text-zinc-800 ring-1 ring-black/5 hover:bg-white"
              >
                Limpar filtros
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {estado && (
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-black/5">
                UF: {estado}
              </span>
            )}
            {cidade && (
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-black/5">
                Cidade: {cidade}
              </span>
            )}
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-700">
                  <span>Itens por página</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={limit}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(1000, Number(e.target.value) || 20));
                      setLimit(v);
                      setPage(1);
                    }}
                    className="h-9 w-20 rounded-lg border border-white/60 bg-white/70 px-2 text-zinc-900 shadow-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100/80"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/80 px-4 py-3 text-zinc-700 shadow-sm ring-1 ring-black/5">
                <span
                  className="inline-flex h-7 w-7 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-600"
                  aria-label="Carregando"
                />
                <span className="text-base font-medium">Carregando…</span>
                <span className="text-sm text-zinc-600">Isso pode demorar um pouco, por favor, tenha paciência.</span>
              </div>
            ) : !query ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-5 text-zinc-800 shadow-sm ring-1 ring-black/5">
                <h3 className="text-sm font-semibold text-zinc-900">Como funciona</h3>
                <ol className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">1</span>
                    <span>Escolha a UF (sigla). A lista de cidades será atualizada automaticamente.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">2</span>
                    <span>Selecione a cidade correspondente.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">3</span>
                    <span>Clique em <span className="font-medium">Buscar</span> para consultar a rede credenciada.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">4</span>
                    <span>Os resultados aparecem em uma tabela com <span className="font-medium">Nome</span>, <span className="font-medium">Tipo</span>, <span className="font-medium">Superior</span> e <span className="font-medium">Senior</span>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">5</span>
                    <span>Clique em uma linha para abrir o modal de detalhes: endereço (com link para Google Maps), contato, convênio e especialidades.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-zinc-700 ring-1 ring-black/5">6</span>
                    <span>Você pode ajustar <span className="font-medium">Itens por página</span> e navegar entre páginas.</span>
                  </li>
                </ol>
              </div>
            ) : itemsFiltrados.length === 0 ? (
              <p className="text-sm text-zinc-600">Sem resultados para os filtros atuais.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/60 bg-white/70 shadow-sm ring-1 ring-black/5">
                <table className="w-full text-left text-sm text-zinc-800">
                  <thead className="bg-white/60 text-zinc-600">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Superior</th>
                      <th className="px-4 py-3">Senior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((it, idx) => (
                      <tr
                        key={`${it.uf}-${it.cidade}-${it.nome}-${idx}`}
                        className="cursor-pointer hover:bg-white/80"
                        onClick={() => setSelected(it)}
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">{it.nome}</td>
                        <td className="px-4 py-3">{it.tipo ?? "—"}</td>
                        <td className="px-4 py-3">{it.superior ? "✓" : "✕"}</td>
                        <td className="px-4 py-3">{it.senior ? "✓" : "✕"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-zinc-600">Total: {total}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 rounded-lg bg-white/70 px-3 text-xs font-medium text-zinc-800 ring-1 ring-black/5 hover:bg-white"
                  onClick={() => query && setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || !query}
                >
                  Anterior
                </button>
                <span className="text-xs text-zinc-700">Página {page}</span>
                <button
                  type="button"
                  className="h-9 rounded-lg bg-white/70 px-3 text-xs font-medium text-zinc-800 ring-1 ring-black/5 hover:bg-white"
                  onClick={() => query && setPage((p) => p + 1)}
                  disabled={itemsFiltrados.length < limit || !query}
                >
                  Próxima
                </button>
              </div>
            </div>
          </section>

          {selected && <DetailsModal unit={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  );
}
