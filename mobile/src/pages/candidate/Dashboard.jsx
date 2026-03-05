import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar     from "../../components/TopBar";
import Spinner    from "../../components/Spinner";
import ScoreRing  from "../../components/ScoreRing";
import EmptyState from "../../components/EmptyState";
import { getDashboard, runPipeline } from "../../api/candidate";
import { useAuth } from "../../context/AuthContext";

const STATIC = "https://jobportal-q9ii.onrender.com/static/icons/";

export default function CandidateDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg,  setRunMsg]  = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleRunPipeline() {
    setRunning(true); setRunMsg("");
    try {
      await runPipeline();
      setRunMsg("Score updated!");
      await load();
    } catch (e) { setRunMsg(e.message); }
    finally { setRunning(false); }
  }

  if (loading) return (
    <>
      <TopBar title="Dashboard" />
      <div className="page"><Spinner /></div>
    </>
  );

  const score   = data?.score;
  const gaps    = data?.gaps || [];
  const matches = data?.top_jobs || [];
  const photoUrl = data?.photo_url;
  const name    = data?.full_name || user?.full_name || "there";

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page" style={{ padding: "calc(var(--topbar-height) + 14px) 14px calc(var(--nav-height) + 20px)" }}>

        {/* ── Greeting ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <img
            src={photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E8398A&color=fff`}
            style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }}
            onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=E8398A&color=fff`; }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 6 }}>
              Hello, {name.split(" ")[0]}
              <img src={`${STATIC}hi.png`} width={26} height={26} style={{ display: "inline-block", verticalAlign: "middle" }} onError={e => { e.target.style.display = "none"; }} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Here's your placement overview</div>
          </div>
        </div>

        {/* ── Readiness Score card ── */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden", marginBottom: 10,
        }}>
          {/* Top row: ring + score breakdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 14px 12px" }}>
            <ScoreRing score={score?.overall ?? null} size={76} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 10 }}>Readiness Score</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                {[
                  ["Skills",     score?.skills],
                  ["Experience", score?.experience],
                  ["Projects",   score?.projects],
                  ["Education",  score?.education],
                ].map(([label, val]) => (
                  <div key={label} style={{ fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--muted)" }}>{label} </span>
                    <span style={{
                      fontWeight: 700,
                      color: val >= 70 ? "var(--green)" : val >= 40 ? "var(--gold)" : val == null ? "var(--muted)" : "var(--red)",
                    }}>{val ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Re-analyze button row */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              {runMsg ? <span style={{ color: "var(--green)" }}>✓ {runMsg}</span> : "Keep your profile updated for better matches"}
            </span>
            <button onClick={handleRunPipeline} disabled={running} style={{
              padding: "6px 14px", flexShrink: 0,
              background: running ? "#f0b8d8" : "var(--pink)", color: "#fff",
              border: "none", borderRadius: 999,
              fontSize: "0.72rem", fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer",
            }}>
              {running ? "Analyzing…" : "Re-analyze"}
            </button>
          </div>
        </div>

        {/* ── Skill Gaps ── */}
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: "14px 0 8px" }}>Skill Gaps</div>
        {gaps.length === 0 ? (
          <EmptyState icon="empty-score.png" title="No gaps found" subtitle="Upload resume and re-analyze to see gaps" />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {gaps.map((g, i) => (
              <span key={g.skill_name || i} style={{
                padding: "5px 12px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
                background: g.gap_level === "high" ? "#fdecea" : g.gap_level === "medium" ? "#fffbeb" : "var(--bg)",
                color: g.gap_level === "high" ? "var(--red)" : g.gap_level === "medium" ? "var(--gold)" : "var(--muted)",
                border: `1px solid ${g.gap_level === "high" ? "#fca5a5" : g.gap_level === "medium" ? "#fcd34d" : "var(--border)"}`,
              }}>{g.skill_name}</span>
            ))}
          </div>
        )}

        {/* ── Top Matched Jobs ── */}
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: "4px 0 8px" }}>Top Matched Jobs</div>
        {matches.length === 0 ? (
          <EmptyState icon="empty-match.png" title="No matches yet" subtitle="Complete your profile to see matching jobs" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {matches.map((job, i) => (
              <div key={job.job_id} onClick={() => navigate(`/jobs/${job.job_id}`)} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "12px 14px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
              }}>
                {/* Rank icon */}
                {i < 3 ? (
                  <img
                    src={`${STATIC}${i === 0 ? "first" : i === 1 ? "second" : "third"}.png`}
                    width={32} height={32} style={{ flexShrink: 0 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "var(--bg)", border: "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.82rem", color: "var(--muted)",
                  }}>{i + 1}</div>
                )}

                {/* Job info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "var(--font-serif)", fontSize: "0.92rem", marginBottom: 3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{job.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {job.city || ""}{job.work_mode ? ` · ${job.work_mode}` : ""}
                  </div>
                  {job.missing_mandatory_skills?.length > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "var(--red)", marginTop: 3 }}>
                      Missing: {job.missing_mandatory_skills.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>

                {/* Match score ring */}
                <ScoreRing score={job.match_score} size={46} strokeWidth={4} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}