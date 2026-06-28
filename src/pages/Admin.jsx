import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Map from "../components/Map";
import { useNavigate } from "react-router-dom";
import LaporanTransaksi from "../components/LaporanTransaksi";

export default function Admin() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [warga, setWarga] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [pengangkutan, setPengangkutan] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [email, setEmail] = useState("");
  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState("");

  useEffect(() => {
    getAllData();
  }, []);

  // ==================== FUNGSI AMBIL DATA ====================
  async function getAllData() {
    setLoading(true);
    await Promise.all([
      getDataWarga(),
      getDataPembayaran(),
      getDataPengangkutan()
    ]);
    setLoading(false);
  }

  async function getDataWarga() {
    try {
      let query = supabase.from("warga").select("*");
      if (searchQuery.trim()) {
        query = query.or(`nama.ilike.%${searchQuery}%,alamat.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      const { data, error } = await query.order("id", { ascending: true });

      if (error) {
        console.log("Error get warga:", error);
        return;
      }
      setWarga(data || []);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  async function getDataPembayaran() {
    try {
      const { data, error } = await supabase
        .from("pembayaran")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.log("Error get pembayaran:", error);
        return;
      }
      setPembayaran(data || []);
    } catch (error) {
      console.log("Error:", error);
    }
  }

  async function getDataPengangkutan() {
    try {
      const { data, error } = await supabase
        .from("pengangkutan")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error get pengangkutan:", error);
        return;
      }
      setPengangkutan(data || []);
    } catch (error) {
      console.log("Error:", error);
    }
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
        .from("warga")
        .select("*")
        .or(`nama.ilike.%${searchQuery}%,alamat.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .order("id", { ascending: true })
        .limit(20);

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
        setWarga(data);
      } else {
        alert(`❌ Data "${searchQuery}" tidak ditemukan!`);
        setSearchResults([]);
        setSearchInfo("");
        if (mapRef.current) {
          mapRef.current.clearSearch();
        }
        getDataWarga();
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
    getDataWarga();
  }

  // ==================== FUNGSI CRUD WARGA ====================
  async function tambahWarga() {
    if (!nama.trim() || !alamat.trim()) {
      alert("⚠️ Nama dan alamat harus diisi!");
      return;
    }

    try {
      if (editMode) {
        const { error } = await supabase
          .from("warga")
          .update({
            nama: nama.trim(),
            alamat: alamat.trim(),
            email: email.trim() || null,
          })
          .eq("id", editId);

        if (error) {
          alert("❌ Gagal update data: " + error.message);
          return;
        }

        alert("✅ Data berhasil diupdate!");
        resetFormWarga();
      } else {
        const { data: existingData } = await supabase
          .from("warga")
          .select("id")
          .order("id", { ascending: false })
          .limit(1);

        const newId = existingData && existingData.length > 0 ? existingData[0].id + 1 : 1;

        const { error } = await supabase.from("warga").insert([
          {
            id: newId,
            nama: nama.trim(),
            alamat: alamat.trim(),
            email: email.trim() || null,
          },
        ]);

        if (error) {
          alert("❌ Gagal tambah data: " + error.message);
          return;
        }

        alert("✅ Data berhasil ditambahkan!");
        resetFormWarga();
      }

      await getDataWarga();
    } catch (error) {
      console.log("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    }
  }

  function editDataWarga(item) {
    setEditMode(true);
    setEditId(item.id);
    setNama(item.nama || "");
    setAlamat(item.alamat || "");
    setEmail(item.email || "");
    document.getElementById("formWarga").scrollIntoView({ behavior: "smooth" });
  }

  function resetFormWarga() {
    setNama("");
    setAlamat("");
    setEmail("");
    setEditMode(false);
    setEditId(null);
  }

  function batalEdit() {
    resetFormWarga();
  }

  async function hapusWarga(id) {
    if (!window.confirm("⚠️ Yakin ingin menghapus data warga ini?")) return;

    try {
      const { error } = await supabase
        .from("warga")
        .delete()
        .eq("id", id);

      if (error) {
        alert("❌ Gagal hapus data: " + error.message);
        return;
      }

      alert("✅ Data berhasil dihapus!");
      await getDataWarga();
    } catch (error) {
      console.log("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
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
    borderRadius: "15px",
    boxShadow: "0 5px 15px rgba(0,0,0,.15)",
    marginBottom: "20px",
  };

  const getStatusBadge = (status) => {
    const styles = {
      "Lunas": { background: "#4CAF50", color: "white", icon: "✅" },
      "Belum Lunas": { background: "#FF9800", color: "white", icon: "⏳" },
      "Menunggu": { background: "#FF9800", color: "white", icon: "⏳" },
      "Proses": { background: "#2196F3", color: "white", icon: "🚛" },
      "Selesai": { background: "#4CAF50", color: "white", icon: "✅" },
      "Dibatalkan": { background: "#f44336", color: "white", icon: "❌" },
    };
    return styles[status] || styles["Menunggu"];
  };

  // Statistik
  const stats = {
    totalWarga: warga.length,
    totalPembayaran: pembayaran.length,
    totalPengangkutan: pengangkutan.length,
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
        background: "#eaf6ff",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1565C0, #2196F3)",
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
          <h1 style={{ margin: 0, fontSize: "28px" }}>🏛️ Dashboard Admin</h1>
          <p style={{ marginTop: 8, opacity: 0.9 }}>WebGIS Pengelolaan Sampah</p>
          <p style={{ marginTop: 5, fontSize: "14px", opacity: 0.8 }}>
            Total: {stats.totalWarga} Warga | {stats.totalPembayaran} Pembayaran | {stats.totalPengangkutan} Pengangkutan
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            background: "white",
            color: "#1565C0",
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

      {/* STATISTIK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "20px",
        }}
      >
        <div style={{ ...card, borderLeft: "4px solid #2196F3", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>👤 Warga</h3>
          <h1 style={{ color: "#2196F3", margin: "10px 0 0 0" }}>{stats.totalWarga}</h1>
        </div>
        <div style={{ ...card, borderLeft: "4px solid #4CAF50", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>💰 Pembayaran</h3>
          <h1 style={{ color: "#4CAF50", margin: "10px 0 0 0" }}>{stats.totalPembayaran}</h1>
        </div>
        <div style={{ ...card, borderLeft: "4px solid #FF9800", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>🚛 Pengangkutan</h3>
          <h1 style={{ color: "#FF9800", margin: "10px 0 0 0" }}>{stats.totalPengangkutan}</h1>
        </div>
      </div>

      {/* MAP DENGAN PENCARIAN */}
      <div style={card}>
        <h2>🗺️ Peta Lokasi TPS & Warga</h2>
        <p style={{ color: "#666", marginBottom: "15px" }}>
          Cari nama atau alamat warga menggunakan fitur pencarian di peta
        </p>
        
        <div style={{ 
          display: "flex", 
          gap: "10px", 
          marginBottom: "15px",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="🔍 Cari nama atau alamat warga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "10px 15px",
              borderRadius: "8px",
              border: "2px solid #2196F3",
              fontSize: "14px",
              minWidth: "200px",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "10px 25px",
              background: "#2196F3",
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

        {searchInfo && (
          <div style={{
            background: "#e3f2fd",
            padding: "10px 15px",
            borderRadius: "8px",
            marginBottom: "15px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            border: "1px solid #2196F3",
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

      {/* FORM TAMBAH/EDIT WARGA */}
      <div style={card} id="formWarga">
        <h2>{editMode ? "✏️ Edit Data Warga" : "➕ Tambah Data Warga"}</h2>

        <input
          type="text"
          placeholder="Nama Lengkap *"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="text"
          placeholder="Alamat *"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="email"
          placeholder="Email (opsional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={tambahWarga}
            style={{
              flex: 1,
              minWidth: "120px",
              padding: "12px",
              background: editMode ? "#FF9800" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {editMode ? "✏️ Update Data" : "💾 Simpan Data"}
          </button>
          
          {editMode && (
            <button
              onClick={batalEdit}
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "12px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              ❌ Batal
            </button>
          )}
        </div>
      </div>

      {/* ==================== DATA WARGA ==================== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>📋 Data Warga</h2>
          <span style={{ fontSize: "13px", color: "#666", background: "#f0f0f0", padding: "4px 12px", borderRadius: "20px" }}>
            Total: {warga.length} warga
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead style={{ background: "linear-gradient(135deg, #1565C0, #2196F3)" }}>
              <tr>
                <th style={{ ...thStyle, color: "white", width: "60px" }}>ID</th>
                <th style={{ ...thStyle, color: "white" }}>Nama</th>
                <th style={{ ...thStyle, color: "white" }}>Alamat</th>
                <th style={{ ...thStyle, color: "white" }}>Email</th>
                <th style={{ ...thStyle, color: "white", textAlign: "center", width: "160px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {warga.length > 0 ? (
                warga.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      ...rowHover,
                      background: index % 2 === 0 ? "#fff" : "#f8fafc",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#e3f2fd"}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#f8fafc"}
                  >
                    <td style={{ ...tdStyle, fontWeight: "bold", color: "#1565C0", textAlign: "center" }}>{item.id}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{item.nama}</td>
                    <td style={tdStyle}>{item.alamat}</td>
                    <td style={tdStyle}>{item.email || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={() => editDataWarga(item)}
                        style={{
                          background: "#FF9800",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginRight: "5px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => hapusWarga(item.id)}
                        style={{
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    📭 Belum ada data warga
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== DATA PEMBAYARAN ==================== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>💰 Data Pembayaran</h2>
          <span style={{ fontSize: "13px", color: "#666", background: "#f0f0f0", padding: "4px 12px", borderRadius: "20px" }}>
            Total: {pembayaran.length} pembayaran
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead style={{ background: "linear-gradient(135deg, #2E7D32, #4CAF50)" }}>
              <tr>
                <th style={{ ...thStyle, color: "white", width: "60px" }}>ID</th>
                <th style={{ ...thStyle, color: "white" }}>Nama Warga</th>
                <th style={{ ...thStyle, color: "white" }}>Nominal</th>
                <th style={{ ...thStyle, color: "white" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pembayaran.length > 0 ? (
                pembayaran.map((item, index) => {
                  const statusStyle = getStatusBadge(item.status);
                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        ...rowHover,
                        background: index % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#e8f5e9"}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#f8fafc"}
                    >
                      <td style={{ ...tdStyle, fontWeight: "bold", color: "#2E7D32", textAlign: "center" }}>{item.id}</td>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{item.nama_warga}</td>
                      <td style={{ ...tdStyle, color: "#2E7D32", fontWeight: "bold" }}>
                        Rp {new Intl.NumberFormat('id-ID').format(item.nominal)}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          display: "inline-block",
                        }}>
                          {statusStyle.icon} {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    📭 Belum ada data pembayaran
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== DATA PENGANGKUTAN ==================== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>🚛 Data Pengangkutan</h2>
          <span style={{ fontSize: "13px", color: "#666", background: "#f0f0f0", padding: "4px 12px", borderRadius: "20px" }}>
            Total: {pengangkutan.length} pengangkutan
          </span>
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
                <th style={{ ...thStyle, color: "white" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pengangkutan.length > 0 ? (
                pengangkutan.map((item, index) => {
                  const statusStyle = getStatusBadge(item.status);
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
                      <td style={{ ...tdStyle, fontWeight: "bold", color: "#E65100", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: "600" }}>{item.nama_warga}</td>
                      <td style={tdStyle}>{item.alamat}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: "#e8f5e9",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}>
                          {item.jenis_sampah}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "bold", textAlign: "center" }}>{item.berat} kg</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          display: "inline-block",
                        }}>
                          {statusStyle.icon} {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    📭 Belum ada data pengangkutan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== LAPORAN TRANSAKSI KEUANGAN ==================== */}
      <LaporanTransaksi />

      {/* LOADING */}
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
            <h3>⏳ Memuat Data...</h3>
          </div>
        </div>
      )}
    </div>
  );
}