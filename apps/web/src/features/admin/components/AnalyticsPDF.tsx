import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Brand colours ────────────────────────────────────────────────────────────
const ACCENT  = "#5B4FCF";
const ACCENT2 = "#7C6EE8";
const DARK    = "#0F172A";
const MID     = "#64748B";
const LIGHT   = "#F1F5F9";
const WHITE   = "#FFFFFF";
const SUCCESS = "#059669";
const WARN    = "#D97706";
const DANGER  = "#DC2626";
const BLUE    = "#2563EB";

const BAR_COLORS = [ACCENT, BLUE, "#7C3AED", WARN, SUCCESS, "#0D9488", DANGER, "#9333EA"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:         { backgroundColor: WHITE, padding: 0, fontFamily: "Helvetica" },

  // Cover
  cover:        { backgroundColor: DARK, flex: 1, padding: 48, justifyContent: "space-between" },
  coverTitle:   { fontSize: 40, fontFamily: "Helvetica-Bold", color: WHITE, letterSpacing: 2, textTransform: "uppercase" },
  coverAccent:  { width: 56, height: 4, backgroundColor: ACCENT, borderRadius: 2, marginTop: 16 },
  coverSub:     { fontSize: 14, color: ACCENT2, marginTop: 8, letterSpacing: 1 },
  coverPeriod:  { fontSize: 10, color: "#94A3B8", marginTop: 36, textTransform: "uppercase", letterSpacing: 1 },
  coverDate:    { fontSize: 10, color: "#94A3B8", marginTop: 4 },
  coverFooter:  { fontSize: 9, color: "#475569" },

  // Layout
  body:    { padding: 40 },
  section: { marginBottom: 24 },
  row:     { flexDirection: "row", gap: 12 },
  col2:    { flex: 1 },

  // Section headers
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: DARK, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 },

  // Stat cards
  card:       { backgroundColor: LIGHT, borderRadius: 8, padding: 14, flex: 1 },
  cardLabel:  { fontSize: 7, fontFamily: "Helvetica-Bold", color: MID, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  cardValue:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: DARK },
  cardSub:    { fontSize: 8, color: MID, marginTop: 2 },
  cardAccent: { width: 24, height: 3, backgroundColor: ACCENT, borderRadius: 1, marginTop: 8 },

  // KPI strip on cover
  strip:      { backgroundColor: ACCENT, borderRadius: 8, padding: 16, flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  stripItem:  { alignItems: "center" },
  stripVal:   { fontSize: 20, fontFamily: "Helvetica-Bold", color: WHITE },
  stripLabel: { fontSize: 7, color: "#C7D2FE", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },

  // Bar charts
  barRow:    { marginBottom: 10 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  barLabel:  { fontSize: 9, color: DARK },
  barPct:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: ACCENT },
  barTrack:  { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden" },
  barFill:   { height: 6, borderRadius: 3 },

  // Tables
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#E2E8F0", paddingBottom: 4, marginBottom: 4 },
  tableRow:    { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  tableCell:   { fontSize: 8, color: DARK, flex: 1 },
  tableHead:   { fontSize: 7, fontFamily: "Helvetica-Bold", color: MID, flex: 1, textTransform: "uppercase", letterSpacing: 1 },

  divider:  { height: 1, backgroundColor: "#E2E8F0", marginVertical: 20 },
  pageNum:  { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: MID },
  watermark:{ position: "absolute", bottom: 20, left: 40, fontSize: 8, color: MID },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number, t: number) { return t ? Math.round((v / t) * 100) : 0; }

function StatCard({ label, value, sub, accent = ACCENT }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.cardValue}>{value}</Text>
      {sub && <Text style={s.cardSub}>{sub}</Text>}
      <View style={[s.cardAccent, { backgroundColor: accent }]} />
    </View>
  );
}

function BarChart({ items, total, colors = BAR_COLORS }: {
  items: { label: string; value: number }[];
  total: number;
  colors?: string[];
}) {
  return (
    <View>
      {items.slice(0, 8).map((item, i) => {
        const p = pct(item.value, total);
        return (
          <View key={item.label} style={s.barRow}>
            <View style={s.barHeader}>
              <Text style={s.barLabel}>{item.label}</Text>
              <Text style={s.barPct}>{p}%</Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${p}%` as any, backgroundColor: colors[i % colors.length] }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PageFooter({ num }: { num: number }) {
  return (
    <>
      <Text style={s.watermark}>You Matter — Confidential</Text>
      <Text style={s.pageNum}>{num}</Text>
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface YouMatterAnalyticsPDFProps {
  generatedAt: string;
  learnerInsights: {
    totalLearners:      number;
    activeThisWeek:     number;
    profilesGenerated:  number;
    assessmentCompletion: { type: string; completed: number; total: number }[];
    provinceDistribution: { province: string | null; count: number }[];
    topMatchedCareers:  { title: string; count: number }[];
  };
  contentAnalytics: {
    totalCareers:      number;
    completedJobs:     number;
    totalChatMessages: number;
    thumbsUpCount:     number;
    thumbsDownCount:   number;
    topMatchedCareers: { title: string; count: number }[];
    topSavedCareers:   { title: string; count: number }[];
  };
  platformGrowth: {
    totalLearners:        number;
    pendingInvites:       number;
    schoolsCovered:       number;
    provincesCovered:     number;
    registrationsByMonth: { month: string; count: number }[];
  };
}

const ASSESSMENT_LABELS: Record<string, string> = {
  INTEREST: "Interest", APTITUDE: "Aptitude", PERSONALITY: "Personality", VALUES: "Values",
};

const PROVINCE_LABELS: Record<string, string> = {
  GP: "Gauteng", WC: "Western Cape", KZN: "KwaZulu-Natal", EC: "Eastern Cape",
  LP: "Limpopo", MP: "Mpumalanga", NW: "North West", NC: "Northern Cape", FS: "Free State",
};

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function YouMatterAnalyticsPDF({
  generatedAt,
  learnerInsights: li,
  contentAnalytics: ca,
  platformGrowth: pg,
}: YouMatterAnalyticsPDFProps) {

  const totalAssessments = li.assessmentCompletion.reduce((a, r) => a + r.total, 0);
  const completedAssessments = li.assessmentCompletion.reduce((a, r) => a + r.completed, 0);
  const totalProvince = li.provinceDistribution.reduce((a, r) => a + r.count, 0);
  const totalMatched  = li.topMatchedCareers.reduce((a, r) => a + r.count, 0);
  const totalSaved    = ca.topSavedCareers.reduce((a, r) => a + r.count, 0);
  const maxMonthCount = Math.max(1, ...pg.registrationsByMonth.map(r => r.count));

  const reacted   = ca.thumbsUpCount + ca.thumbsDownCount;
  const helpfulPct = reacted ? Math.round((ca.thumbsUpCount / reacted) * 100) : 0;

  return (
    <Document title={`You Matter Analytics — ${generatedAt}`} author="You Matter">

      {/* ── Cover ─────────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View>
            <Text style={s.coverTitle}>You Matter</Text>
            <View style={s.coverAccent} />
            <Text style={s.coverSub}>Analytics Report</Text>
            <Text style={s.coverPeriod}>Platform Intelligence — All Time</Text>
            <Text style={s.coverDate}>Generated: {generatedAt}</Text>
          </View>
          <View>
            {/* KPI strip */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Learners",      value: li.totalLearners },
                { label: "Active This Week",    value: li.activeThisWeek },
                { label: "Profiles Generated",  value: li.profilesGenerated },
                { label: "Careers in Library",  value: ca.totalCareers },
              ].map(({ label, value }) => (
                <View key={label} style={{ flex: 1, borderTopWidth: 2, borderColor: ACCENT, paddingTop: 10 }}>
                  <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: WHITE }}>{value}</Text>
                  <Text style={{ fontSize: 7, color: "#94A3B8", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
                </View>
              ))}
            </View>
            <Text style={s.coverFooter}>This document is confidential and intended for authorised recipients only.</Text>
          </View>
        </View>
      </Page>

      {/* ── Page 1: Learner Insights ───────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <Text style={s.sectionLabel}>Learner Intelligence</Text>
          <Text style={s.sectionTitle}>Learner Insights</Text>

          {/* Stat cards row 1 */}
          <View style={[s.row, { marginBottom: 12 }]}>
            <StatCard label="Total Learners"     value={li.totalLearners}     sub="registered on the platform" />
            <StatCard label="Active This Week"   value={li.activeThisWeek}    sub="logged in in the last 7 days" accent={SUCCESS} />
            <StatCard label="Profiles Generated" value={li.profilesGenerated} sub="AI career profiles created" accent={ACCENT2} />
            <StatCard label="Provinces Covered"  value={li.provinceDistribution.length} sub="out of 9 SA provinces" accent={BLUE} />
          </View>

          {/* Assessment stats */}
          <View style={[s.row, { marginBottom: 20 }]}>
            <StatCard label="Assessments Completed" value={completedAssessments} sub={`out of ${totalAssessments} started`} />
            <StatCard label="Completion Rate"
              value={`${totalAssessments ? Math.round((completedAssessments / totalAssessments) * 100) : 0}%`}
              sub="across all assessment types" accent={WARN} />
            <StatCard label="Schools Covered"  value={pg.schoolsCovered}  sub="unique schools represented" accent={SUCCESS} />
            <StatCard label="Pending Invites"  value={pg.pendingInvites}  sub="staff invitations outstanding" accent={pg.pendingInvites > 0 ? WARN : MID} />
          </View>

          <View style={s.divider} />

          {/* Assessment completion bars */}
          <View style={s.row}>
            <View style={s.col2}>
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Assessment Completion</Text>
              <Text style={{ fontSize: 8, color: MID, marginBottom: 10 }}>
                How many learners completed each assessment type
              </Text>
              {li.assessmentCompletion.length === 0 ? (
                <Text style={{ fontSize: 8, color: MID }}>No assessment data yet.</Text>
              ) : (
                <BarChart
                  items={li.assessmentCompletion.map(r => ({
                    label: `${ASSESSMENT_LABELS[r.type] ?? r.type} (${r.completed}/${r.total})`,
                    value: r.completed,
                  }))}
                  total={Math.max(1, li.assessmentCompletion[0]?.total ?? 1)}
                />
              )}
            </View>
            <View style={s.col2}>
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Province Distribution</Text>
              <Text style={{ fontSize: 8, color: MID, marginBottom: 10 }}>
                Where learners are located across South Africa
              </Text>
              {li.provinceDistribution.length === 0 ? (
                <Text style={{ fontSize: 8, color: MID }}>No province data yet.</Text>
              ) : (
                <BarChart
                  items={li.provinceDistribution.slice(0, 9).map(r => ({
                    label: PROVINCE_LABELS[r.province ?? ""] ?? (r.province ?? "Not set"),
                    value: r.count,
                  }))}
                  total={totalProvince}
                  colors={[ACCENT, BLUE, "#7C3AED", WARN, SUCCESS, "#0D9488", DANGER, "#9333EA", MID]}
                />
              )}
            </View>
          </View>

          <View style={s.divider} />

          {/* Top matched careers */}
          <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Most Explored Careers (by AI Match)</Text>
          {li.topMatchedCareers.length === 0 ? (
            <Text style={{ fontSize: 8, color: MID }}>No career match data yet.</Text>
          ) : (
            <>
              <View style={s.tableHeader}>
                <Text style={[s.tableHead, { flex: 3 }]}>Career</Text>
                <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>Matches</Text>
                <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>Share</Text>
              </View>
              {li.topMatchedCareers.slice(0, 8).map((r, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{r.title}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: "right" }]}>{r.count}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: "right", color: ACCENT, fontFamily: "Helvetica-Bold" }]}>
                    {pct(r.count, totalMatched)}%
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
        <PageFooter num={1} />
      </Page>

      {/* ── Page 2: Content Analytics ──────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <Text style={s.sectionLabel}>Content Intelligence</Text>
          <Text style={s.sectionTitle}>Content & AI Analytics</Text>

          {/* Stat cards */}
          <View style={[s.row, { marginBottom: 20 }]}>
            <StatCard label="Total Careers"       value={ca.totalCareers}      sub="approved & verified in library" />
            <StatCard label="AI Jobs Completed"   value={ca.completedJobs}     sub="generation jobs finished" accent={SUCCESS} />
            <StatCard label="Chat Messages"       value={ca.totalChatMessages} sub="total guidance messages sent" accent={ACCENT2} />
            <StatCard label="Chat Helpfulness"    value={`${helpfulPct}%`}     sub={`${ca.thumbsUpCount} helpful · ${ca.thumbsDownCount} not`} accent={WARN} />
          </View>

          <View style={s.divider} />

          {/* Most matched vs saved careers */}
          <View style={s.row}>
            <View style={s.col2}>
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Most Matched Careers</Text>
              <Text style={{ fontSize: 8, color: MID, marginBottom: 10 }}>
                Careers most frequently returned by the AI matching engine
              </Text>
              {ca.topMatchedCareers.length === 0 ? (
                <Text style={{ fontSize: 8, color: MID }}>No match data yet.</Text>
              ) : (
                <BarChart
                  items={ca.topMatchedCareers.map(r => ({ label: r.title, value: r.count }))}
                  total={totalMatched}
                />
              )}
            </View>
            <View style={s.col2}>
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Most Saved Careers</Text>
              <Text style={{ fontSize: 8, color: MID, marginBottom: 10 }}>
                Careers learners bookmarked to explore further
              </Text>
              {ca.topSavedCareers.length === 0 ? (
                <Text style={{ fontSize: 8, color: MID }}>No save data yet.</Text>
              ) : (
                <BarChart
                  items={ca.topSavedCareers.map(r => ({ label: r.title, value: r.count }))}
                  total={totalSaved}
                  colors={[BLUE, "#7C3AED", WARN, SUCCESS, ACCENT, "#0D9488", DANGER]}
                />
              )}
            </View>
          </View>

          <View style={s.divider} />

          {/* Chat feedback breakdown */}
          <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Guidance Chat Feedback Summary</Text>
          <Text style={{ fontSize: 8, color: MID, marginBottom: 12 }}>
            Learner reactions to AI guidance messages — a signal of content quality and relevance.
          </Text>
          <View style={[s.row, { gap: 10 }]}>
            {[
              { label: "Total messages",       value: ca.totalChatMessages, accent: ACCENT  },
              { label: "Helpful reactions 👍", value: ca.thumbsUpCount,     accent: SUCCESS },
              { label: "Not helpful 👎",       value: ca.thumbsDownCount,   accent: DANGER  },
              { label: "Helpfulness rate",     value: `${helpfulPct}%`,     accent: WARN    },
            ].map(({ label, value, accent }) => (
              <View key={label} style={[s.card, { flex: 1 }]}>
                <Text style={s.cardLabel}>{label}</Text>
                <Text style={[s.cardValue, { fontSize: 18 }]}>{value}</Text>
                <View style={[s.cardAccent, { backgroundColor: accent }]} />
              </View>
            ))}
          </View>

          <View style={s.divider} />

          {/* Saved careers table */}
          {ca.topSavedCareers.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Top Saved Careers — Detail</Text>
              <View style={s.tableHeader}>
                <Text style={[s.tableHead, { flex: 3 }]}>Career</Text>
                <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>Saves</Text>
                <Text style={[s.tableHead, { flex: 1, textAlign: "right" }]}>Share</Text>
              </View>
              {ca.topSavedCareers.slice(0, 8).map((r, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{r.title}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: "right" }]}>{r.count}</Text>
                  <Text style={[s.tableCell, { flex: 1, textAlign: "right", color: ACCENT, fontFamily: "Helvetica-Bold" }]}>
                    {pct(r.count, totalSaved)}%
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
        <PageFooter num={2} />
      </Page>

      {/* ── Page 3: Platform Growth ────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <Text style={s.sectionLabel}>Growth Intelligence</Text>
          <Text style={s.sectionTitle}>Platform Growth</Text>

          {/* Stat cards */}
          <View style={[s.row, { marginBottom: 20 }]}>
            <StatCard label="Total Learners"    value={pg.totalLearners}    sub="registered on platform" />
            <StatCard label="Schools Covered"   value={pg.schoolsCovered}   sub="unique schools" accent={BLUE}    />
            <StatCard label="Provinces Covered" value={pg.provincesCovered} sub="out of 9 SA provinces" accent={SUCCESS} />
            <StatCard label="Pending Invites"   value={pg.pendingInvites}   sub="awaiting staff sign-up" accent={pg.pendingInvites > 0 ? WARN : MID} />
          </View>

          <View style={s.divider} />

          {/* Registrations over time */}
          <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Learner Registrations Over Time</Text>
          <Text style={{ fontSize: 8, color: MID, marginBottom: 12 }}>
            Monthly sign-ups showing platform growth trajectory
          </Text>

          {pg.registrationsByMonth.length === 0 ? (
            <Text style={{ fontSize: 8, color: MID }}>Registration data will populate as learners join.</Text>
          ) : (
            <View>
              {pg.registrationsByMonth.map(({ month, count }) => {
                const [year, mon] = month.split("-");
                const label = new Date(parseInt(year), parseInt(mon) - 1, 1)
                  .toLocaleString("en-ZA", { month: "short", year: "2-digit" });
                const p = pct(count, maxMonthCount);
                return (
                  <View key={month} style={[s.barRow, { marginBottom: 8 }]}>
                    <View style={s.barHeader}>
                      <Text style={s.barLabel}>{label}</Text>
                      <Text style={[s.barPct, { color: ACCENT }]}>{count}</Text>
                    </View>
                    <View style={[s.barTrack, { height: 10, borderRadius: 4 }]}>
                      <View style={[s.barFill, { height: 10, borderRadius: 4, width: `${Math.max(p, 2)}%` as any, backgroundColor: ACCENT }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={s.divider} />

          {/* Cumulative summary */}
          <Text style={[s.sectionLabel, { marginBottom: 12 }]}>Growth Summary</Text>
          <View style={s.row}>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.cardLabel}>First Registration</Text>
              <Text style={[s.cardValue, { fontSize: 12 }]}>
                {pg.registrationsByMonth.length > 0
                  ? (() => {
                      const [y, m] = pg.registrationsByMonth[0]!.month.split("-");
                      return new Date(parseInt(y!), parseInt(m!) - 1, 1)
                        .toLocaleString("en-ZA", { month: "long", year: "numeric" });
                    })()
                  : "—"}
              </Text>
              <View style={[s.cardAccent, { backgroundColor: ACCENT }]} />
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.cardLabel}>Peak Month</Text>
              <Text style={[s.cardValue, { fontSize: 12 }]}>
                {pg.registrationsByMonth.length > 0
                  ? (() => {
                      const peak = pg.registrationsByMonth.reduce((a, b) => b.count > a.count ? b : a);
                      const [y, m] = peak.month.split("-");
                      return `${new Date(parseInt(y!), parseInt(m!) - 1, 1)
                        .toLocaleString("en-ZA", { month: "short", year: "2-digit" })} (${peak.count})`;
                    })()
                  : "—"}
              </Text>
              <View style={[s.cardAccent, { backgroundColor: WARN }]} />
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.cardLabel}>Avg / Month</Text>
              <Text style={s.cardValue}>
                {pg.registrationsByMonth.length > 0
                  ? Math.round(pg.totalLearners / pg.registrationsByMonth.length)
                  : 0}
              </Text>
              <View style={[s.cardAccent, { backgroundColor: SUCCESS }]} />
            </View>
            <View style={[s.card, { flex: 1 }]}>
              <Text style={s.cardLabel}>Total Months Active</Text>
              <Text style={s.cardValue}>{pg.registrationsByMonth.length}</Text>
              <View style={[s.cardAccent, { backgroundColor: BLUE }]} />
            </View>
          </View>
        </View>
        <PageFooter num={3} />
      </Page>

    </Document>
  );
}
