import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData, getCityJobs } from "../../api/jobs";

const PINK = "#E8398A";
const SAMPLE_CITIES = [
  { city: "Bangalore", state: "Karnataka",   latitude: 12.9716, longitude: 77.5946, job_count: 5 },
  { city: "Mumbai",    state: "Maharashtra", latitude: 19.0760, longitude: 72.8777, job_count: 8 },
  { city: "Delhi",     state: "Delhi",       latitude: 28.6139, longitude: 77.2090, job_count: 6 },
  { city: "Hyderabad", state: "Telangana",   latitude: 17.3850, longitude: 78.4867, job_count: 3 },
  { city: "Chennai",   state: "Tamil Nadu",  latitude: 13.0827, longitude: 80.2707, job_count: 4 },
  { city: "Pune",      state: "Maharashtra", latitude: 18.5204, longitude: 73.8567, job_count: 2 },
  { city: "Kolkata",   state: "West Bengal", latitude: 22.5726, longitude: 88.3639, job_count: 3 },
];

export default function MapPage() {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const markersRef = useRef([]);

  const [drawerCity,    setDrawerCity]    = useState(null);
  const [drawerJobs,    setDrawerJobs]    = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [mapReady,      setMapReady]      = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });
      mapObjRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomright" })
        .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      let cities = SAMPLE_CITIES;
      try {
        const res  = await getMapData();
        const data = res.data?.data || res.data || [];
        if (data.length) cities = data;
      } catch {}

      cities.forEach(city => {
        const size = Math.min(10 + Math.log(city.job_count + 1) * 5, 28);
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${PINK};border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            font-size:${Math.max(8,size*0.38)}px;font-weight:700;color:#fff;
            font-family:DM Sans,sans-serif;
          ">${city.job_count}</div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        L.marker([city.latitude, city.longitude], { icon })
          .addTo(map)
          .on("click", () => openDrawer(city));
      });

      setMapReady(true);
    }

    init();
    return () => {
      cancelled = true;
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  }, []);

  async function openDrawer(cityData) {
    setDrawerCity(cityData);
    setDrawerOpen(true);
    setDrawerJobs([]);
    setDrawerLoading(true);
    if (mapObjRef.current) {
      mapObjRef.current.flyTo([cityData.latitude, cityData.longitude], 12, { duration: 0.8 });
    }
    try {
      const res  = await getCityJobs(cityData.city);
      const jobs = res.data?.data || res.data || [];
      setDrawerJobs(jobs);
    } catch {
      setDrawerJobs([]);
    } finally {
      setDrawerLoading(false);
    }
  }

  function fmtSalary(min, max) {
    if (!min) return null;
    const toK = n => n >= 100000 ? (n/100000).toFixed(1)+"L" : (n/1000).toFixed(0)+"k";
    return `₹${toK(min)}–₹${toK(max)}`;
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", zIndex: 1 }}>

      {/* ── Back ── */}
      <button onClick={() => navigate(-1)} style={{
        position: "absolute", top: 14, left: 14, zIndex: 1000,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "7px 12px",
        fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      {/* ── Title ── */}
      <div style={{
        position: "absolute", top: 14, right: 14, zIndex: 1000,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "7px 12px",
        fontSize: "0.82rem", fontWeight: 700,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Job<span style={{ color: PINK }}>Map</span>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", zIndex: 1 }} />

      {/* ── Loading ── */}
      {!mapReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 10, background: "#e8f4f8",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #ddd", borderTopColor: PINK, animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "0.78rem", color: "#777" }}>Loading map…</div>
        </div>
      )}

      {/* ── Hint ── */}
      {mapReady && !drawerOpen && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          fontSize: "0.7rem", color: "var(--muted)", fontWeight: 500,
          background: "var(--card)", padding: "5px 12px", borderRadius: 999,
          border: "1px solid var(--border)", whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 999,
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: PINK, display: "inline-block", flexShrink: 0 }} />
          Tap a city pin to see jobs
        </div>
      )}

      {/* ── Overlay ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: "var(--nav-height)",
          background: "rgba(0,0,0,0.25)", zIndex: 998,
        }} />
      )}

      {/* ── Drawer ── */}
      <div style={{
        position: "absolute", bottom: "var(--nav-height)", left: 0, right: 0, zIndex: 999,
        background: "var(--card)", borderRadius: "16px 16px 0 0",
        maxHeight: "55vh", display: "flex", flexDirection: "column",
        transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        visibility: drawerCity ? "visible" : "hidden",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.14)",
      }}>

        {/* Handle */}
        <div style={{ paddingTop: 10, paddingBottom: 2, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div onClick={() => setDrawerOpen(false)} style={{
            width: 36, height: 4, background: "var(--border)", borderRadius: 999, cursor: "pointer",
          }} />
        </div>

        {drawerCity && (
          <>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 14px 10px", flexShrink: 0,
              borderBottom: "1px solid var(--border)",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{drawerCity.city}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 1 }}>
                  {drawerCity.state && `${drawerCity.state} · `}
                  {drawerCity.job_count} job{drawerCity.job_count !== 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 6, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--muted)", fontSize: "1rem",
              }}>×</button>
            </div>

            {/* Jobs */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 24px" }}>
              {drawerLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "28px 0" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: PINK, animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : drawerJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--pink-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>No jobs listed yet</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 3 }}>Try another city</div>
                </div>
              ) : drawerJobs.map(job => (
                <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} style={{
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 12px", marginBottom: 7,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.84rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
                      {job.company_name}
                      {fmtSalary(job.salary_min, job.salary_max) && (
                        <span style={{ color: PINK, fontWeight: 600, marginLeft: 6 }}>
                          {fmtSalary(job.salary_min, job.salary_max)}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}