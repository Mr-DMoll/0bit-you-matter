"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import apiClient from "@/api/client";

const T = {
  primary:  "#5B4FCF",
  secondary:"#EEE9FF",
  coral:    "#F97066",
  teal:     "#0D9488",
  bg:       "#FAFAF9",
  card:     "#FFFFFF",
  fg:       "#1A1535",
  muted:    "#7A7499",
  border:   "rgba(91,79,207,0.12)",
};

// Cycling palette for cluster pills
const CLUSTER_PALETTE = [
  { bg: T.secondary,  color: T.primary   },
  { bg: "#D1FAE5",    color: "#059669"   },
  { bg: "#FEF3C7",    color: "#D97706"   },
  { bg: "#EDE9FE",    color: "#7C3AED"   },
  { bg: "#FCE7F3",    color: "#DB2777"   },
  { bg: "#DBEAFE",    color: "#2563EB"   },
  { bg: "#FEE2E2",    color: "#DC2626"   },
  { bg: "#D1FAE5",    color: "#065F46"   },
  { bg: "#FDE8D8",    color: "#C2410C"   },
];

const RIASEC_COLOR: Record<string, string> = {
  R: "#ef4444", I: "#3b82f6", A: "#f59e0b",
  S: "#22c55e", E: "#8b5cf6", C: "#f97316",
};

function clusterStyle(id: string, clusters: any[]) {
  const idx = clusters.findIndex((c) => c.id === id);
  return CLUSTER_PALETTE[idx % CLUSTER_PALETTE.length] ?? CLUSTER_PALETTE[0];
}

function formatEarnings(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `R${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} /yr`;
  if (min)        return `From ${fmt(min)} /yr`;
  if (max)        return `Up to ${fmt(max)} /yr`;
  return null;
}

export function ExploreCareersPage() {
  const router = useRouter();
  const [careers,    setCareers]    = useState<any[]>([]);
  const [clusters,   setClusters]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [clusterId,  setClusterId]  = useState("");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((q: string, cid: string, p: number) => {
    setLoading(true);
    const params: any = { page: p, limit: 24 };
    if (q)   params.search    = q;
    if (cid) params.clusterId = cid;
    apiClient.get("/careers", { params })
      .then((r) => {
        setCareers(r.data.data.careers ?? []);
        setTotal(r.data.data.pagination?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load clusters once
  useEffect(() => {
    apiClient.get("/careers/clusters")
      .then((r) => setClusters(r.data.data ?? []));
  }, []);

  // Load careers on filter/page change
  useEffect(() => { load(search, clusterId, page); }, [clusterId, page]);

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(val, clusterId, 1); }, 350);
  };

  const showClusterFilter = clusters.length > 1;
  const hasFilters = search !== "" || clusterId !== "";
  const pages = Math.ceil(total / 24);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "28px 24px 48px", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: T.fg }}>Explore Careers</h1>
            <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
              {loading ? "Loading…" : `${total} verified career${total !== 1 ? "s" : ""} in South Africa`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 440, marginTop: 14 }}>
          <Search size={16} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search careers…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px 10px 38px",
              border: `1.5px solid ${search ? T.primary : T.border}`,
              borderRadius: 10, fontSize: 14, color: T.fg,
              background: T.card, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.muted, lineHeight: 1 }}
            >×</button>
          )}
        </div>
      </div>

      {/* Cluster filter chips — only when 2+ clusters exist */}
      {showClusterFilter && (
        <div className="cluster-chips" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => { setClusterId(""); setPage(1); }}
            style={{
              padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: !clusterId ? T.primary : T.card,
              color: !clusterId ? "#fff" : T.muted,
              border: `1.5px solid ${!clusterId ? T.primary : T.border}`,
            }}
          >
            All
          </button>
          {clusters.map((c) => {
            const active = clusterId === c.id;
            const fc = clusterStyle(c.id, clusters);
            return (
              <button
                key={c.id}
                onClick={() => { setClusterId(active ? "" : c.id); setPage(1); }}
                style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background: active ? fc.color + "18" : T.card,
                  color: active ? fc.color : T.muted,
                  border: `1.5px solid ${active ? fc.color + "60" : T.border}`,
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: T.muted, fontSize: 14 }}>
          Loading careers…
        </div>
      ) : careers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: T.fg, margin: "0 0 6px" }}>
            {hasFilters ? "No careers match your search" : "No careers available yet"}
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            {hasFilters ? "Try a different search term or cluster." : "Our reviewers are verifying careers — check back soon."}
          </p>
          {hasFilters && (
            <button
              onClick={() => { handleSearch(""); setClusterId(""); setPage(1); }}
              style={{ marginTop: 16, padding: "8px 20px", borderRadius: 99, border: `1px solid ${T.border}`, background: T.card, color: T.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="careers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {careers.map((c) => {
              const fc  = clusterStyle(c.clusterId, clusters);
              const earnings = formatEarnings(c.earningsMin, c.earningsMax);
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/learner/explore/${c.slug}`)}
                  style={{
                    background: T.card, borderRadius: 14, padding: 18,
                    border: `1px solid ${T.border}`,
                    display: "flex", flexDirection: "column", gap: 10,
                    cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(91,79,207,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(91,79,207,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  }}
                >
                  {/* Cluster pill */}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: fc.bg, color: fc.color, alignSelf: "flex-start" }}>
                    {c.cluster?.name ?? "General"}
                  </span>

                  {/* Title */}
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.fg, lineHeight: 1.3 }}>{c.title}</h3>

                  {/* Overview snippet */}
                  {c.overview && (
                    <p style={{
                      margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {c.overview}
                    </p>
                  )}

                  {/* Earnings */}
                  {earnings && (
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.teal }}>{earnings}</p>
                  )}

                  {/* RIASEC codes */}
                  {Array.isArray(c.riasecCodes) && c.riasecCodes.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {c.riasecCodes.map((code: string) => (
                        <span
                          key={code}
                          title={code}
                          style={{
                            width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            background: (RIASEC_COLOR[code] ?? "#6366f1") + "20",
                            color: RIASEC_COLOR[code] ?? "#6366f1",
                            border: `1.5px solid ${(RIASEC_COLOR[code] ?? "#6366f1") + "50"}`,
                          }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer CTA */}
                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.primary }}>Explore →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: page === 1 ? T.muted : T.fg, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
              >
                ← Prev
              </button>
              <span style={{ padding: "7px 14px", fontSize: 13, color: T.muted }}>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: page === pages ? T.muted : T.fg, cursor: page === pages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 900px) { .careers-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px) { .careers-grid { grid-template-columns: 1fr !important; } }
        .careers-grid > div:hover { cursor: pointer; }
        @media (max-width: 768px) {
          .cluster-chips {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            padding-bottom: 6px !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .cluster-chips::-webkit-scrollbar { display: none; }
          .cluster-chips button { flex-shrink: 0 !important; white-space: nowrap !important; }
        }
      `}</style>
    </div>
  );
}
