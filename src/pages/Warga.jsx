import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";
import { useNavigate } from "react-router-dom";
import TransaksiWarga from "../components/TransaksiWarga";

export default function Warga() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [pesananSampah, setPesananSampah] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State untuk form pemesanan
  const [jenisSampah, setJenisSampah] = useState("");
  const [beratSampah, setBeratSampah] = useState("");
  const [tanggalJemput, setTanggalJemput] = useState("");
  const [catatan, setCatatan] = useState("");
  const [showForm, setShowForm] = useState(false);

  // State untuk filter
  const [filterStatus, setFilterStatus] = useState("Semua");

  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState("");

  // Ambil data warga yang login
  const [userWarga, setUserWarga] = useState(null);

  useEffect(() => {
    getProfileWarga();
  }, []);

  // ==================== FUNGSI AMBIL DATA ====================
  async function getProfileWarga() {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.log("Error get user:", userError);
        setLoading(false);
        return;
      }

      if (userData?.user) {
        const { data, error } = await supabase
          .from("warga")
          .select("*")
          .eq("email", userData.user.email)
          .single();

        if (error) {
          console.log("Error get profile:", error);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("warga")
            .select("*")
            .limit(1);

          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            setUserWarga(fallbackData[0]);
            await getPesananWarga(fallbackData[0].id);
          }
        } else {
          setUserWarga(data);
          if (data) {
            await getPesananWarga(data.id);
          }
        }
      }
    } catch (error) {
      console.log("Error:", error);
    }
    setLoading(false);
  }

  async function getPesananWarga(wargaId) {
    try {
      const { data, error } = await supabase
        .from("pengangkutan")
        .select("*")
        .eq("warga_id", wargaId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error get pesanan warga:", error);
        return;
      }

      setPesananSampah(data || []);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  // ==================== FUNGSI PEMESANAN ====================
  async function pesanPengambilan() {
    if (!jenisSampah) {
      alert("⚠️ Silakan pilih jenis sampah!");
      return;
    }
    if (!beratSampah || parseFloat(beratSampah) <= 0) {
      alert("⚠️ Masukkan berat sampah yang valid!");
      return;
    }
    if (!tanggalJemput) {
      alert("⚠️ Silakan pilih tanggal jemput!");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (tanggalJemput < today) {
      alert("⚠️ Tanggal jemput tidak boleh kurang dari hari ini!");
      return;
    }

    if (!userWarga) {
      alert("⚠️ Silakan login terlebih dahulu!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("pengangkutan").insert([
        {
          warga_id: userWarga.id,
          nama_warga: userWarga.nama || userWarga.Nama,
          alamat: userWarga.alamat || userWarga.Alamat,
          jenis_sampah: jenisSampah,
          berat: parseFloat(beratSampah),
          tanggal_jemput: tanggalJemput,
          catatan: catatan.trim() || "-",
          status: "Menunggu",
        },
      ]);

      if (error) {
        alert("❌ Gagal memesan: " + error.message);
        setLoading(false);
        return;
      }

      alert("✅ Pesanan berhasil dibuat!");
      
      resetForm();
      await getPesananWarga(userWarga.id);
    } catch (error) {
      console.log("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    }
    setLoading(false);
  }

  function resetForm() {
    setJenisSampah("");
    setBeratSampah("");
    setTanggalJemput("");
    setCatatan("");
    setShowForm(false);
  }

  // ==================== FUNGSI BATAL PESANAN ====================
  async function batalkanPesanan(id) {
    if (!window.confirm("⚠️ Yakin ingin membatalkan pesanan ini?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("pengangkutan")
        .update({ status: "Dibatalkan" })
        .eq("id", id);

      if (error) {
        alert("❌ Gagal membatalkan pesanan: " + error.message);
        setLoading(false);
        return;
      }

      alert("✅ Pesanan berhasil dibatalkan!");
      await getPesananWarga(userWarga.id);
    } catch (error) {
      console.log("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    }
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
      const { data: wargaData, error: wargaError } = await supabase
        .from("warga")
        .select("*")
        .or(`nama.ilike.%${searchQuery}%,alamat.ilike.%${searchQuery}%`)
        .limit(20);

      if (wargaError) {
        console.error("Error searching warga:", wargaError);
      }

      if (mapRef.current) {
        await mapRef.current.search(searchQuery);
        
        if (wargaData && wargaData.length > 0) {
          setSearchResults(wargaData);
          setSearchInfo(`✅ Ditemukan ${wargaData.length} data warga`);
        } else {
          setSearchResults([]);
          setSearchInfo("✅ Menampilkan lokasi TPS terdekat");
        }
      } else {
        alert("Peta belum siap, silakan coba lagi!");
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
  }

  // ==================== FUNGSI LOGOUT ====================
  async function logout() {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.log("Error logout:", error);
    }
  }

  // ==================== STYLE ====================
  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  };

  const getStatusBadge = (status) => {
    const styles = {
      "Menunggu": { background: "#FF9800", color: "#fff", icon: "⏳" },
      "Proses": { background: "#2196F3", color: "#fff", icon: "🚛" },
      "Selesai": { background: "#4CAF50", color: "#fff", icon: "✅" },
      "Dibatalkan": { background: "#f44336", color: "#fff", icon: "❌" },
    };
    return styles[status] || styles["Menunggu"];
  };

  const filteredPesanan = filterStatus === "Semua" 
    ? pesananSampah 
    : pesananSampah.filter(item => item.status === filterStatus);

  const stats = {
    total: pesananSampah.length,
    menunggu: pesananSampah.filter(p => p.status === "Menunggu").length,
    proses: pesananSampah.filter(p => p.status === "Proses").length,
    selesai: pesananSampah.filter(p => p.status === "Selesai").length,
    dibatalkan: pesananSampah.filter(p => p.status === "Dibatalkan").length,
  };

  return (
    <div style={{
      background: "#f5f5f5",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
        color: "white",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: "20px",
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🚛 Dashboard Warga</h2>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
            Layanan Pengangkutan Sampah
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#2E7D32",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* ===== STATISTIK ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "15px",
        marginBottom: "20px",
      }}>
        <div style={{ ...card, textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "13px" }}>📦 Total</h3>
          <h2 style={{ margin: "5px 0 0 0", color: "#2E7D32" }}>{stats.total}</h2>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "13px" }}>⏳ Menunggu</h3>
          <h2 style={{ margin: "5px 0 0 0", color: "#FF9800" }}>{stats.menunggu}</h2>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "13px" }}>🚛 Proses</h3>
          <h2 style={{ margin: "5px 0 0 0", color: "#2196F3" }}>{stats.proses}</h2>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "13px" }}>✅ Selesai</h3>
          <h2 style={{ margin: "5px 0 0 0", color: "#4CAF50" }}>{stats.selesai}</h2>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "13px" }}>❌ Batal</h3>
          <h2 style={{ margin: "5px 0 0 0", color: "#f44336" }}>{stats.dibatalkan}</h2>
        </div>
      </div>

      {/* ===== PETA DENGAN PENCARIAN ===== */}
      <div style={card}>
        <h3 style={{ marginTop: 0 }}>🗺️ Peta Lokasi TPS & Warga</h3>
        
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "15px",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="🔍 Cari nama, alamat, atau kota (contoh: Yogyakarta)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "10px 15px",
              borderRadius: "8px",
              border: "2px solid #2E7D32",
              fontSize: "14px",
              minWidth: "200px",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "10px 25px",
              background: "#2E7D32",
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
          {searchResults.length > 0 || searchInfo ? (
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
          ) : null}
        </div>

        {searchInfo && (
          <div style={{
            background: "#e8f5e9",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
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

        {searchResults.length > 0 && !searchInfo && (
          <div style={{
            background: "#e8f5e9",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}>
            <span>✅ Ditemukan <strong>{searchResults.length}</strong> data untuk "{searchQuery}"</span>
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

      {/* ===== FORM PEMESANAN ===== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>📋 Pesan Pengambilan Sampah</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? "#f44336" : "#2E7D32",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {showForm ? "✕ Tutup Form" : "➕ Pesan Sekarang"}
          </button>
        </div>

        {showForm && (
          <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
            <h4 style={{ marginTop: 0, color: "#2E7D32" }}>Form Pemesanan Pengambilan Sampah</h4>
            <div style={{ display: "grid", gap: "12px" }}>
              <select
                value={jenisSampah}
                onChange={(e) => setJenisSampah(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid #ccc", 
                  fontSize: "14px", 
                  boxSizing: "border-box" 
                }}
              >
                <option value="">Pilih jenis sampah</option>
                <option value="Organik">🌿 Organik</option>
                <option value="Anorganik">♻️ Anorganik</option>
                <option value="B3">☣️ B3</option>
                <option value="Campuran">📦 Campuran</option>
              </select>

              <input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="Berat (kg) *"
                value={beratSampah}
                onChange={(e) => setBeratSampah(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid #ccc", 
                  fontSize: "14px", 
                  boxSizing: "border-box" 
                }}
              />

              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={tanggalJemput}
                onChange={(e) => setTanggalJemput(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid #ccc", 
                  fontSize: "14px", 
                  boxSizing: "border-box" 
                }}
              />

              <textarea
                placeholder="Catatan (opsional)"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows="2"
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  borderRadius: "6px", 
                  border: "1px solid #ccc", 
                  fontSize: "14px", 
                  resize: "vertical", 
                  boxSizing: "border-box" 
                }}
              />

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={pesanPengambilan}
                  disabled={loading}
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    background: "#2E7D32", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer", 
                    fontWeight: "bold", 
                    opacity: loading ? 0.7 : 1 
                  }}
                >
                  {loading ? "⏳..." : "🚛 Pesan"}
                </button>
                <button
                  onClick={resetForm}
                  style={{ 
                    padding: "12px 20px", 
                    background: "#f44336", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "6px", 
                    cursor: "pointer", 
                    fontWeight: "bold" 
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== RIWAYAT PESANAN ===== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>📦 Riwayat Pesanan</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ 
              padding: "6px 12px", 
              borderRadius: "6px", 
              border: "1px solid #ccc", 
              fontSize: "13px" 
            }}
          >
            <option value="Semua">Semua</option>
            <option value="Menunggu">⏳ Menunggu</option>
            <option value="Proses">🚛 Proses</option>
            <option value="Selesai">✅ Selesai</option>
            <option value="Dibatalkan">❌ Dibatalkan</option>
          </select>
        </div>

        {filteredPesanan.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "#999" }}>
            <p style={{ fontSize: "40px", margin: 0 }}>📭</p>
            <p>
              {filterStatus !== "Semua" 
                ? `Tidak ada pesanan dengan status "${filterStatus}"` 
                : "Belum ada pesanan"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#2E7D32", color: "white" }}>
                <tr>
                  <th style={{ padding: "8px", textAlign: "left" }}>No</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Jenis</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Berat</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Tanggal</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "8px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPesanan.map((item, index) => {
                  const statusStyle = getStatusBadge(item.status);
                  const canCancel = item.status === "Menunggu" || item.status === "Proses";
                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: "1px solid #eee", 
                        background: index % 2 === 0 ? "#fff" : "#f9f9f9" 
                      }}
                    >
                      <td style={{ padding: "8px" }}>{index + 1}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{ 
                          background: "#e8f5e9", 
                          padding: "3px 8px", 
                          borderRadius: "4px", 
                          fontSize: "12px" 
                        }}>
                          {item.jenis_sampah || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>
                        {item.berat || 0} kg
                      </td>
                      <td style={{ padding: "8px", fontSize: "13px" }}>
                        {item.tanggal_jemput 
                          ? new Date(item.tanggal_jemput).toLocaleDateString("id-ID") 
                          : "-"}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <span style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          display: "inline-block",
                        }}>
                          {statusStyle.icon} {item.status || "Menunggu"}
                        </span>
                      </td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        {canCancel ? (
                          <button
                            onClick={() => batalkanPesanan(item.id)}
                            style={{
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            ❌ Batal
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#999" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== TRANSAKSI KEUANGAN WARGA ===== */}
      <TransaksiWarga wargaId={userWarga?.id} namaWarga={userWarga?.nama} />

      {/* ===== TIPS ===== */}
      <div style={{ 
        ...card, 
        background: "#e8f5e9", 
        border: "1px solid #4CAF50" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "24px" }}>💡</span>
          <div style={{ fontSize: "13px" }}>
            <strong>Tips Pencarian:</strong> Cari nama warga, alamat, atau kota seperti "Yogyakarta", "Sleman", "Bantul" untuk melihat lokasi TPS terdekat.
          </div>
        </div>
      </div>

      {/* ===== LOADING ===== */}
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