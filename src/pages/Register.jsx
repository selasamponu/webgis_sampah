import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    // Validasi input
    if (!nama || !email || !password) {
      alert("Semua data harus diisi!");
      return;
    }

    // Registrasi ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // Pastikan user berhasil dibuat
    if (!data.user) {
      alert("Registrasi gagal!");
      return;
    }

    // Simpan data ke tabel Profiles
    const { error: profileError } = await supabase
      .from("Profiles")
      .insert([
        {
          id: data.user.id,
          nama: nama,
          role: "warga",
        },
      ]);

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert("Registrasi berhasil!");

    // Pindah ke Dashboard
    navigate("/");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Register</h2>

      <input
        type="text"
        placeholder="Nama Lengkap"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />

      <br />
      <br />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />

      <br />
      <br />

      <button
        onClick={handleRegister}
        style={{
          width: "100%",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Register
      </button>
    </div>
  );
}