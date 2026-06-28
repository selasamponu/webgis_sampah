// src/components/TransaksiWarga.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TransaksiWarga({ wargaId, namaWarga }) {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [totalPembayaran, setTotalPembayaran] = useState(0);
  const [totalPendapatan, setTotalPendapatan] = useState(0);

  useEffect(() => {
    if (wargaId) {
      getTransaksi();
    }
  }, [wargaId]);

  async function getTransaksi() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transaksi")
        .select("*")
        .eq("warga_id", wargaId)
        .order("tanggal", { ascending: false });

      if (error) {
        console.error("Error get transaksi:", error);
        setLoading(false);
        return;
      }

      setTransaksi(data || []);
      hitungTotal(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  function hitungTotal(data) {
    const pembayaran = data
      .filter(t => t.jenis_transaksi === "pembayaran")
      .reduce((sum, t) => sum + t.nominal, 0);
    
    const pendapatan = data
      .filter(t => t.jenis_transaksi === "pendapatan")
      .reduce((sum, t) => sum + t.nominal, 0);

    setTotalPembayaran(pembayaran);
    setTotalPendapatan(pendapatan);
  }

  const filteredData = filterJenis === "Semua" 
    ? transaksi 
    : transaksi.filter(t => t.jenis_transaksi === filterJenis);

  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "15px",
  };

  return (
    <div style={card}>
      <h3 style={{ marginTop: 0, color: "#1B5E20" }}>💰 Transaksi Keuangan</h3>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
        Kelola transaksi keuangan Anda
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "15px",
        marginBottom: "20px",
      }}>
        <div style={{
          ...card,
          background: "#e8f5e9",
          borderLeft: "4px solid #4CAF50",
          textAlign: "center",
          padding: "15px",
        }}>
          <h4 style={{ margin: 0, color: "#666", fontSize: "13px" }}>Total Pembayaran</h4>
          <h2 style={{ margin: "5px 0 0 0", color: "#2E7D32" }}>
            Rp {totalPembayaran.toLocaleString('id-ID')}
          </h2>
        </div>
        <div style={{
          ...card,
          background: "#e3f2fd",
          borderLeft: "4px solid #2196F3",
          textAlign: "center",
          padding: "15px",
        }}>
          <h4 style={{ margin: 0, color: "#666", fontSize: "13px" }}>Total Pendapatan</h4>
          <h2 style={{ margin: "5px 0 0 0", color: "#1565C0" }}>
            Rp {totalPendapatan.toLocaleString('id-ID')}
          </h2>
        </div>
        <div style={{
          ...card,
          background: "#fff3e0",
          borderLeft: "4px solid #FF9800",
          textAlign: "center",
          padding: "15px",
        }}>
          <h4 style={{ margin: 0, color: "#666", fontSize: "13px" }}>Saldo Akhir</h4>
          <h2 style={{ margin: "5px 0 0 0", color: "#E65100" }}>
            Rp {(totalPendapatan - totalPembayaran).toLocaleString('id-ID')}
          </h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        <label style={{ fontWeight: "bold", color: "#666" }}>Filter:</label>
        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "13px",
          }}
        >
          <option value="Semua">Semua</option>
          <option value="pembayaran">💸 Pembayaran</option>
          <option value="pendapatan">💰 Pendapatan</option>
        </select>
        <button
          onClick={getTransaksi}
          style={{
            padding: "6px 12px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>⏳ Memuat data...</div>
      ) : filteredData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          📭 Belum ada transaksi
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ background: "#1B5E20", color: "white" }}>
              <tr>
                <th style={{ padding: "10px", textAlign: "left" }}>No</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Jenis</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Nominal</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Keterangan</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Tanggal</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} style={{
                  borderBottom: "1px solid #eee",
                  background: index % 2 === 0 ? "#fff" : "#f9f9f9",
                }}>
                  <td style={{ padding: "10px" }}>{index + 1}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      background: item.jenis_transaksi === "pembayaran" ? "#ffebee" : "#e8f5e9",
                      color: item.jenis_transaksi === "pembayaran" ? "#c62828" : "#2E7D32",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}>
                      {item.jenis_transaksi === "pembayaran" ? "💸" : "💰"} {item.jenis_transaksi}
                    </span>
                  </td>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>
                    Rp {item.nominal.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: "10px" }}>{item.keterangan || "-"}</td>
                  <td style={{ padding: "10px" }}>
                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      background: "#e8f5e9",
                      color: "#2E7D32",
                      padding: "3px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}>
                      ✅ {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}