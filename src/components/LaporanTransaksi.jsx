// src/components/LaporanTransaksi.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LaporanTransaksi() {
  const [loading, setLoading] = useState(false);
  const [statistik, setStatistik] = useState({
    totalTransaksiWarga: 0,
    totalTransaksiCourier: 0,
    totalPembayaranWarga: 0,
    totalPendapatanCourier: 0,
  });
  const [transaksiWarga, setTransaksiWarga] = useState([]);
  const [transaksiCourier, setTransaksiCourier] = useState([]);

  useEffect(() => {
    getLaporanTransaksi();
  }, []);

  async function getLaporanTransaksi() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transaksi")
        .select("*")
        .order("tanggal", { ascending: false });

      if (error) {
        console.error("Error get laporan:", error);
        setLoading(false);
        return;
      }

      const wargaTrans = data.filter(t => t.jenis_transaksi === "pembayaran");
      const courierTrans = data.filter(t => t.jenis_transaksi === "pendapatan");

      setTransaksiWarga(wargaTrans);
      setTransaksiCourier(courierTrans);

      const totalPembayaranWarga = wargaTrans.reduce((sum, t) => sum + t.nominal, 0);
      const totalPendapatanCourier = courierTrans.reduce((sum, t) => sum + t.nominal, 0);

      setStatistik({
        totalTransaksiWarga: wargaTrans.length,
        totalTransaksiCourier: courierTrans.length,
        totalPembayaranWarga: totalPembayaranWarga,
        totalPendapatanCourier: totalPendapatanCourier,
      });
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  }

  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "15px",
  };

  return (
    <div style={card}>
      <h2 style={{ color: "#0D47A1", marginTop: 0 }}>📊 Laporan Transaksi Keuangan</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Ringkasan transaksi keuangan dari warga dan courier
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "20px",
      }}>
        <div style={{
          ...card,
          background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
          borderLeft: "4px solid #4CAF50",
          textAlign: "center",
        }}>
          <h4 style={{ margin: 0, color: "#666" }}>🧑‍🤝‍🧑 Transaksi Warga</h4>
          <h2 style={{ margin: "5px 0 0 0", color: "#2E7D32" }}>
            {statistik.totalTransaksiWarga}
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#2E7D32" }}>
            Total: Rp {statistik.totalPembayaranWarga.toLocaleString('id-ID')}
          </p>
        </div>

        <div style={{
          ...card,
          background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
          borderLeft: "4px solid #FF9800",
          textAlign: "center",
        }}>
          <h4 style={{ margin: 0, color: "#666" }}>🚚 Transaksi Courier</h4>
          <h2 style={{ margin: "5px 0 0 0", color: "#E65100" }}>
            {statistik.totalTransaksiCourier}
          </h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#E65100" }}>
            Total: Rp {statistik.totalPendapatanCourier.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: "#2E7D32" }}>🧑‍🤝‍🧑 Transaksi Warga</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>⏳ Memuat data...</div>
        ) : transaksiWarga.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            📭 Belum ada transaksi warga
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#2E7D32", color: "white" }}>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left" }}>No</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Nama Warga</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Nominal</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Keterangan</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {transaksiWarga.map((item, index) => (
                  <tr key={item.id} style={{
                    borderBottom: "1px solid #eee",
                    background: index % 2 === 0 ? "#fff" : "#f9f9f9",
                  }}>
                    <td style={{ padding: "10px" }}>{index + 1}</td>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>{item.nama_warga}</td>
                    <td style={{ padding: "10px", color: "#c62828", fontWeight: "bold" }}>
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: "10px" }}>{item.keterangan || "-"}</td>
                    <td style={{ padding: "10px" }}>
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0, color: "#E65100" }}>🚚 Transaksi Courier</h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>⏳ Memuat data...</div>
        ) : transaksiCourier.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            📭 Belum ada transaksi courier
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#E65100", color: "white" }}>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left" }}>No</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Nama Courier</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Nominal</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Keterangan</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {transaksiCourier.map((item, index) => (
                  <tr key={item.id} style={{
                    borderBottom: "1px solid #eee",
                    background: index % 2 === 0 ? "#fff" : "#fff8f0",
                  }}>
                    <td style={{ padding: "10px" }}>{index + 1}</td>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>{item.nama_warga}</td>
                    <td style={{ padding: "10px", color: "#2E7D32", fontWeight: "bold" }}>
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: "10px" }}>{item.keterangan || "-"}</td>
                    <td style={{ padding: "10px" }}>
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={getLaporanTransaksi}
        style={{
          padding: "10px 20px",
          background: "#0D47A1",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        🔄 Refresh Laporan
      </button>
    </div>
  );
}