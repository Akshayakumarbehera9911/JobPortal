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
  const leafletRef = useRef(null); // L instance
  const mapObjRef  = useRef(null); // map instance
  const markersRef = useRef([]);

  const [drawerCity,    setDrawerCity]    = useState(null);
  const [drawerJobs,    setDrawerJobs]    = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [mapReady,      setMapReady]      = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet (avoids SSR issues)
    let cancelled = false;

    async function init() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;
      leafletRef.current = L;

      // Fix default marker icon paths broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center:       [20.5937, 78.9629], // center of India
        zoom:         5,
        zoomControl:  false,
        attributionControl: false,
      });

      mapObjRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Attribution small
      L.control.attribution({ prefix: false, position: "bottomright" })
        .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      // Load city data
      let cities = SAMPLE_CITIES;
      try {
        const res  = await getMapData();
        const data = res.data?.data || res.data || [];
        if (data.length) cities = data;
      } catch {}

      // Add pins
      cities.forEach(city => {
        const size   = Math.min(10 + Math.log(city.job_count + 1) * 5, 28);
        const icon   = L.divIcon({
          className: "",
          html: `<div style="
            width:${size}px; height:${size}px; border-radius:50%;
            background:${PINK}; border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            display:flex; align-items:center; justify-content:center;
            font-size:${Math.max(8, size * 0.38)}px; font-weight:700; color:#fff;
            font-family:DM Sans,sans-serif;
          ">${city.job_count}</div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([city.latitude, city.longitude], { icon })
          .addTo(map)
          .on("click", () => openDrawer(city));

        markersRef.current.push(marker);
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

    // Fly to city
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
    const toK = n => (n / 1000).toFixed(0);
    return `₹${toK(min)}k–₹${toK(max)}k`;
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", zIndex: 1 }}>

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{
        position: "absolute", top: 14, left: 16, zIndex: 1000,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px",
        fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 700,
        color: "var(--black)", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}>← Back</button>

      {/* Title */}
      <div style={{
        position: "absolute", top: 14, right: 16, zIndex: 1000,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "8px 14px",
        fontFamily: "var(--font-serif)", fontSize: "0.95rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
      }}>Job<span style={{ color: PINK }}>Map</span></div>

      {/* Map container */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", zIndex: 1 }} />

      {/* Loading */}
      {!mapReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 10, background: "#e8f4f8",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ccc", borderTopColor: PINK, animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "0.82rem", color: "#555" }}>Loading map…</div>
        </div>
      )}

      {/* Hint */}
      {mapReady && !drawerOpen && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500,
          background: "var(--card)", padding: "5px 14px", borderRadius: 999,
          border: "1px solid var(--border)", whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 999,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PINK, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
          Tap a city pin to see jobs
        </div>
      )}

      {/* Overlay */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 998,
        }} />
      )}

      {/* Drawer */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 999,
        background: "var(--card)", borderRadius: "20px 20px 0 0",
        padding: "16px 0 32px",
        maxHeight: "52vh", display: "flex", flexDirection: "column",
        transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        visibility: drawerCity ? "visible" : "hidden",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
      }}>
        {/* Handle */}
        <div onClick={() => setDrawerOpen(false)} style={{
          width: 40, height: 4, background: "var(--border)",
          borderRadius: 999, margin: "0 auto 16px", cursor: "pointer",
        }} />

        {drawerCity && (
          <>
            <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PINK }} />
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem" }}>{drawerCity.city}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {drawerCity.job_count} job{drawerCity.job_count !== 1 ? "s" : ""}
                  {drawerCity.state ? ` · ${drawerCity.state}` : ""}
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--muted)", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ height: 1, background: "var(--border)", marginBottom: 8 }} />

            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 8px" }}>
              {drawerLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid var(--border)", borderTopColor: PINK, animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : drawerJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📍</div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>No jobs listed yet</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>Explore another city</div>
                </div>
              ) : drawerJobs.map(job => (
                <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} style={{
                  display: "flex", alignItems: "center",
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                      {job.company_name}
                      {fmtSalary(job.salary_min, job.salary_max) && (
                        <span style={{ color: PINK, fontWeight: 600, marginLeft: 6 }}>{fmtSalary(job.salary_min, job.salary_max)}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "1rem" }}>›</span>
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