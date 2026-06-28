import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";
import { useNavigate } from "react-router-dom";

export default function Transporter() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [pengangkutan, setPengangkutan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Semua");
  
  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState("");

  useEffect(() => {
    getPengangkutan();
  }, []);

  async function getPengangkutan() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("pengangkutan")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("DATA PENGANGKUTAN:", data);

    if (error) {
      alert("Error mengambil data: " + error.message);
      setLoading(false);
      return;
    }

    setPengangkutan(data || []);
    setLoading(false);
  }

  // ==================== FUNGSI PENCARIAN ====================
  async function handleSearch() {
    if (!searchQuery.trim()) {
      alert("Masukkan kata kunci pencarian!");
      return;
    }

    setLoading(true);
    setSearchInfo("");

    try {
      const { data, error } = await supabase
        .from("pengangkutan")
        .select("*")
        .or(`nama_warga.ilike.%${searchQuery}%,alamat.ilike.%${searchQuery}%,jenis_sampah.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error searching:", error);
        alert("Gagal mencari: " + error.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSearchResults(data);
        setSearchInfo(`✅ Ditemukan ${data.length} data untuk "${searchQuery}"`);
        
        if (mapRef.current) {
          mapRef.current.search(searchQuery);
        }
      } else {
        alert(`❌ Data "${searchQuery}" tidak ditemukan!`);
        setSearchResults([]);
        setSearchInfo("");
        if (mapRef.current) {
          mapRef.current.clearSearch();
        }
      }
    } catch (error) {
      console.log("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    }
    setLoading(false);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setSearchInfo("");
    if (mapRef.current) {
      mapRef.current.clearSearch();
    }
    getPengangkutan();
  }

  // ==================== FUNGSI UPDATE STATUS ====================
  async function updateStatus(id, statusBaru) {
    if (!window.confirm(`Yakin ingin mengubah status menjadi "${statusBaru}"?`)) {
      return;
    }

    const { error } = await supabase
      .from("pengangkutan")
      .update({ status: statusBaru })
      .eq("id", id);

    if (error) {
      alert("Gagal update status: " + error.message);
      return;
    }

    alert(`✅ Status berhasil diupdate menjadi "${statusBaru}"`);
    getPengangkutan();
  }

  // ==================== FUNGSI HAPUS DATA ====================
  async function hapusData(id) {
    if (!window.confirm("Yakin ingin menghapus data pengangkutan ini?")) {
      return;
    }

    const { error } = await supabase
      .from("pengangkutan")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus: " + error.message);
      return;
    }

    alert("✅ Data berhasil dihapus!");
    getPengangkutan();
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  // Filter data berdasarkan status dan pencarian
  const getFilteredData = () => {
    let data = pengangkutan;
    
    if (filterStatus !== "Semua") {
      data = data.filter(item => item.status === filterStatus);
    }
    
    if (searchResults.length > 0) {
      const searchIds = searchResults.map(item => item.id);
      data = data.filter(item => searchIds.includes(item.id));
    }
    
    return data;
  };

  const filteredData = getFilteredData();

  // Style untuk status badge
  const getStatusStyle = (status) => {
    const styles = {
      "Menunggu": { background: "#FF9800", color: "white", icon: "⏳" },
      "Proses": { background: "#2196F3", color: "white", icon: "🚛" },
      "Selesai": { background: "#4CAF50", color: "white", icon: "✅" },
      "Dibatalkan": { background: "#f44336", color: "white", icon: "❌" },
    };
    return styles[status] || styles["Menunggu"];
  };

  // Card style
  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 5px 15px rgba(0,0,0,.15)",
    marginBottom: "20px",
  };

  // Statistik
  const stats = {
    total: pengangkutan.length,
    menunggu: pengangkutan.filter(p => p.status === "Menunggu").length,
    proses: pengangkutan.filter(p => p.status === "Proses").length,
    selesai: pengangkutan.filter(p => p.status === "Selesai").length,
    dibatalkan: pengangkutan.filter(p => p.status === "Dibatalkan").length,
  };

  // Style tabel
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const thStyle = {
    padding: "12px 15px",
    textAlign: "left",
    fontWeight: "600",
    letterSpacing: "0.5px",
    fontSize: "13px",
    textTransform: "uppercase",
  };

  const tdStyle = {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
  };

  const rowHover = {
    transition: "background 0.2s ease",
  };

  return (
    <div
      style={{
        background: "#fff3e0",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, #E65100, #FF9800)",
          color: "white",
          borderRadius: "15px",
          padding: "25px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 5px 15px rgba(0,0,0,.2)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>
            🚛 Dashboard Transporter
          </h1>
          <p style={{ marginTop: 8, opacity: 0.9 }}>
            Kelola pengangkutan sampah
          </p>
          <p style={{ marginTop: 5, fontSize: "14px", opacity: 0.8 }}>
            Total pesanan: <strong>{stats.total}</strong>
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#E65100",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          🚪 Logout
        </button>
      </div>

      <br />

      {/* STATISTIK CARD */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: "20px",
        }}
      >
        <div style={{ ...card, borderLeft: "4px solid #FF9800", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>📦 Total</h3>
          <h1 style={{ color: "#E65100", margin: "10px 0 0 0" }}>
            {stats.total}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
            Semua pesanan
          </p>
        </div>

        <div style={{ ...card, borderLeft: "4px solid #FF9800", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>⏳ Menunggu</h3>
          <h1 style={{ color: "#FF9800", margin: "10px 0 0 0" }}>
            {stats.menunggu}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
            Belum diproses
          </p>
        </div>

        <div style={{ ...card, borderLeft: "4px solid #2196F3", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>🚛 Proses</h3>
          <h1 style={{ color: "#2196F3", margin: "10px 0 0 0" }}>
            {stats.proses}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
            Sedang diangkut
          </p>
        </div>

        <div style={{ ...card, borderLeft: "4px solid #4CAF50", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>✅ Selesai</h3>
          <h1 style={{ color: "#4CAF50", margin: "10px 0 0 0" }}>
            {stats.selesai}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
            Sudah diangkut
          </p>
        </div>

        <div style={{ ...card, borderLeft: "4px solid #f44336", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>❌ Batal</h3>
          <h1 style={{ color: "#f44336", margin: "10px 0 0 0" }}>
            {stats.dibatalkan}
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#999" }}>
            Dibatalkan
          </p>
        </div>
      </div>

      {/* PETA LOKASI DENGAN PENCARIAN */}
      <div style={card}>
        <h2>🗺️ Peta Lokasi TPS & Warga</h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>
          Lokasi Tempat Pembuangan Sampah (TPS) terdekat
        </p>
        
        {/* SEARCH BAR UNTUK MAPS */}
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "15px",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="🔍 Cari nama warga, alamat, atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "10px 15px",
              borderRadius: "8px",
              border: "2px solid #FF9800",
              fontSize: "14px",
              minWidth: "200px",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "10px 25px",
              background: "#E65100",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "⏳" : "🔍 Cari"}
          </button>
          {(searchResults.length > 0 || searchInfo) && (
            <button
              onClick={clearSearch}
              style={{
                padding: "10px 20px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* HASIL PENCARIAN */}
        {searchInfo && (
          <div style={{
            background: "#fff3e0",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            border: "1px solid #FF9800",
          }}>
            <span>{searchInfo}</span>
            <button
              onClick={clearSearch}
              style={{
                background: "transparent",
                color: "#f44336",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕ Tutup
            </button>
          </div>
        )}

        <Map ref={mapRef} height="400px" />
      </div>

      {/* ==================== DATA PENGANGKUTAN ==================== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>📦 Data Pengangkutan</h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontWeight: "bold", color: "#666" }}>Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
              }}
            >
              <option value="Semua">Semua</option>
              <option value="Menunggu">⏳ Menunggu</option>
              <option value="Proses">🚛 Proses</option>
              <option value="Selesai">✅ Selesai</option>
              <option value="Dibatalkan">❌ Dibatalkan</option>
            </select>

            <button
              onClick={getPengangkutan}
              style={{
                padding: "8px 15px",
                background: "#E65100",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead style={{ background: "linear-gradient(135deg, #E65100, #FF9800)" }}>
              <tr>
                <th style={{ ...thStyle, color: "white", width: "50px" }}>No</th>
                <th style={{ ...thStyle, color: "white" }}>Nama Warga</th>
                <th style={{ ...thStyle, color: "white" }}>Alamat</th>
                <th style={{ ...thStyle, color: "white" }}>Jenis Sampah</th>
                <th style={{ ...thStyle, color: "white", width: "80px" }}>Berat</th>
                <th style={{ ...thStyle, color: "white" }}>Tanggal Jemput</th>
                <th style={{ ...thStyle, color: "white" }}>Status</th>
                <th style={{ ...thStyle, color: "white", textAlign: "center", width: "220px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    ⏳ Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    📭 Belum ada data pengangkutan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const statusStyle = getStatusStyle(item.status);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        ...rowHover,
                        background: index % 2 === 0 ? "#fff" : "#fff8f0",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fff3e0"}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fff8f0"}
                    >
                      <td style={{ ...tdStyle, fontWeight: "bold", color: "#E65100", textAlign: "center" }}>
                        {index + 1}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>
                        {item.nama_warga || "-"}
                      </td>
                      <td style={tdStyle}>
                        {item.alamat || "-"}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: "#e8f5e9",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        >
                          {item.jenis_sampah || "-"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "bold", textAlign: "center" }}>
                        {item.berat || 0} kg
                      </td>
                      <td style={tdStyle}>
                        {item.tanggal_jemput 
                          ? new Date(item.tanggal_jemput).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"
                        }
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: statusStyle.background,
                            color: statusStyle.color,
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            display: "inline-block",
                          }}
                        >
                          {statusStyle.icon} {item.status || "Menunggu"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                          {item.status !== "Menunggu" && (
                            <button
                              onClick={() => updateStatus(item.id, "Menunggu")}
                              style={{
                                padding: "4px 8px",
                                background: "#FF9800",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                              title="Ubah ke Menunggu"
                            >
                              ⏳
                            </button>
                          )}
                          
                          {item.status !== "Proses" && (
                            <button
                              onClick={() => updateStatus(item.id, "Proses")}
                              style={{
                                padding: "4px 8px",
                                background: "#2196F3",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                              title="Ubah ke Proses"
                            >
                              🚛
                            </button>
                          )}
                          
                          {item.status !== "Selesai" && (
                            <button
                              onClick={() => updateStatus(item.id, "Selesai")}
                              style={{
                                padding: "4px 8px",
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                              title="Ubah ke Selesai"
                            >
                              ✅
                            </button>
                          )}
                          
                          {item.status !== "Dibatalkan" && (
                            <button
                              onClick={() => updateStatus(item.id, "Dibatalkan")}
                              style={{
                                padding: "4px 8px",
                                background: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "10px",
                                transition: "transform 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                              title="Batalkan"
                            >
                              ❌
                            </button>
                          )}
                          
                          <button
                            onClick={() => hapusData(item.id)}
                            style={{
                              padding: "4px 8px",
                              background: "#666",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "10px",
                              transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFORMASI TAMBAHAN */}
      <div
        style={{
          ...card,
          background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
          border: "2px solid #FF9800",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "32px" }}>📋</span>
          <div>
            <h3 style={{ margin: 0, color: "#E65100" }}>
              Panduan Status Pengangkutan
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px", marginTop: "10px" }}>
              <div>
                <span style={{ background: "#FF9800", padding: "3px 10px", borderRadius: "10px", color: "white", fontSize: "12px" }}>
                  ⏳ Menunggu
                </span>
                <p style={{ fontSize: "12px", margin: "5px 0 0 0", color: "#666" }}>
                  Pesanan baru masuk
                </p>
              </div>
              <div>
                <span style={{ background: "#2196F3", padding: "3px 10px", borderRadius: "10px", color: "white", fontSize: "12px" }}>
                  🚛 Proses
                </span>
                <p style={{ fontSize: "12px", margin: "5px 0 0 0", color: "#666" }}>
                  Sedang diangkut
                </p>
              </div>
              <div>
                <span style={{ background: "#4CAF50", padding: "3px 10px", borderRadius: "10px", color: "white", fontSize: "12px" }}>
                  ✅ Selesai
                </span>
                <p style={{ fontSize: "12px", margin: "5px 0 0 0", color: "#666" }}>
                  Sampah sudah diangkut
                </p>
              </div>
              <div>
                <span style={{ background: "#f44336", padding: "3px 10px", borderRadius: "10px", color: "white", fontSize: "12px" }}>
                  ❌ Dibatalkan
                </span>
                <p style={{ fontSize: "12px", margin: "5px 0 0 0", color: "#666" }}>
                  Pesanan dibatalkan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "white",
            padding: "20px 30px",
            borderRadius: "10px",
            textAlign: "center",
          }}>
            <h3>⏳ Memproses...</h3>
          </div>
        </div>
      )}
    </div>
  );
}