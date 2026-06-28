import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../lib/supabase";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Komponen untuk mengakses map dari luar
function MapController({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

// Data TPS dengan keywords yang lebih lengkap
const TPS_LOCATIONS = [
  { 
    id: 1, 
    name: "TPS Condongcatur", 
    position: [-7.7856, 110.3795], 
    address: "Condongcatur, Depok, Sleman", 
    type: "TPS",
    keywords: ["condongcatur", "depok", "sleman", "yogyakarta", "jogja"]
  },
  { 
    id: 2, 
    name: "TPS Maguwoharjo", 
    position: [-7.7656, 110.3895], 
    address: "Maguwoharjo, Depok, Sleman", 
    type: "TPS",
    keywords: ["maguwoharjo", "depok", "sleman", "yogyakarta", "jogja"]
  },
  { 
    id: 3, 
    name: "TPS Sleman", 
    position: [-7.7456, 110.3995], 
    address: "Sleman, Sleman", 
    type: "TPS",
    keywords: ["sleman", "yogyakarta", "jogja"]
  },
  { 
    id: 4, 
    name: "TPS Bantul", 
    position: [-7.8956, 110.3295], 
    address: "Bantul, Bantul", 
    type: "TPS",
    keywords: ["bantul", "yogyakarta", "jogja"]
  },
  { 
    id: 5, 
    name: "TPS Kulon Progo", 
    position: [-7.8256, 110.2195], 
    address: "Kulon Progo", 
    type: "TPS",
    keywords: ["kulon progo", "kulonprogo", "yogyakarta", "jogja"]
  },
  { 
    id: 6, 
    name: "TPS Kota Yogyakarta", 
    position: [-7.797068, 110.370529], 
    address: "Kota Yogyakarta", 
    type: "TPS",
    keywords: ["yogyakarta", "jogja", "kota yogyakarta", "pusat"]
  },
  { 
    id: 7, 
    name: "TPS Gondokusuman", 
    position: [-7.787068, 110.380529], 
    address: "Gondokusuman, Yogyakarta", 
    type: "TPS",
    keywords: ["gondokusuman", "yogyakarta", "jogja"]
  },
  { 
    id: 8, 
    name: "TPS Jetis", 
    position: [-7.807068, 110.360529], 
    address: "Jetis, Yogyakarta", 
    type: "TPS",
    keywords: ["jetis", "yogyakarta", "jogja"]
  },
  { 
    id: 9, 
    name: "TPS Ngaglik", 
    position: [-7.7556, 110.4095], 
    address: "Ngaglik, Sleman", 
    type: "TPS",
    keywords: ["ngaglik", "sleman", "yogyakarta", "jogja"]
  },
  { 
    id: 10, 
    name: "TPS Kasihan", 
    position: [-7.8356, 110.3095], 
    address: "Kasihan, Bantul", 
    type: "TPS",
    keywords: ["kasihan", "bantul", "yogyakarta", "jogja"]
  },
];

const Map = forwardRef(({ height = "500px" }, ref) => {
  const [markers, setMarkers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInfo, setSearchInfo] = useState("");
  const mapRef = useRef(null);

  useEffect(() => {
    setMarkers(TPS_LOCATIONS);
  }, []);

  // ==================== FUNGSI PENCARIAN ====================
  const handleSearch = async (query) => {
    if (!query || !query.trim()) {
      alert("Masukkan kata kunci pencarian!");
      return;
    }

    setIsSearching(true);
    const searchQuery = query.toLowerCase().trim();
    let foundWarga = [];
    let foundTPS = [];
    let searchInfoText = "";

    try {
      // 1. Cari data warga dari database (nama dan alamat)
      const { data, error } = await supabase
        .from("warga")
        .select("*")
        .or(`nama.ilike.%${searchQuery}%,alamat.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.error("Error searching warga:", error);
      } else if (data && data.length > 0) {
        foundWarga = data;
      }

      // 2. Cari TPS berdasarkan kata kunci (lebih fleksibel)
      foundTPS = TPS_LOCATIONS.filter(tps => {
        // Cek apakah query cocok dengan keywords
        const matchKeyword = tps.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery) || 
          searchQuery.includes(keyword.toLowerCase())
        );
        
        // Cek apakah query cocok dengan nama TPS
        const matchName = tps.name.toLowerCase().includes(searchQuery);
        
        // Cek apakah query cocok dengan alamat TPS
        const matchAddress = tps.address.toLowerCase().includes(searchQuery);
        
        return matchKeyword || matchName || matchAddress;
      });

      // 3. Jika tidak ada hasil, coba cari dengan kata kunci yang mirip
      if (foundWarga.length === 0 && foundTPS.length === 0) {
        // Coba cari dengan menghilangkan spasi atau menambahkan kata kunci umum
        const commonKeywords = ["yogyakarta", "jogja", "sleman", "bantul", "kulon progo"];
        const hasCommonKeyword = commonKeywords.some(kw => 
          searchQuery.includes(kw) || kw.includes(searchQuery)
        );
        
        if (hasCommonKeyword) {
          // Tampilkan semua TPS di area tersebut
          foundTPS = TPS_LOCATIONS.filter(tps => {
            return tps.keywords.some(kw => 
              kw.includes("yogyakarta") || kw.includes("jogja")
            );
          });
        }
      }

      // 4. Gabungkan hasil
      const totalFound = foundWarga.length + foundTPS.length;

      if (totalFound > 0) {
        // Buat marker untuk hasil pencarian warga
        const wargaMarkers = foundWarga.map((item, index) => ({
          id: `warga-${item.id}`,
          name: item.nama || item.Nama || "Warga",
          position: [
            -7.797068 + (Math.random() - 0.5) * 0.02 + (index * 0.001),
            110.370529 + (Math.random() - 0.5) * 0.02 + (index * 0.001)
          ],
          address: item.alamat || item.Alamat || "-",
          type: "Warga",
          email: item.email || "-",
          isSearchResult: true,
        }));

        // Buat marker untuk TPS yang ditemukan
        const tpsMarkers = foundTPS.map((tps) => ({
          id: `tps-${tps.id}`,
          name: tps.name,
          position: tps.position,
          address: tps.address,
          type: "TPS",
          email: "-",
          isSearchResult: true,
          isTPS: true,
        }));

        // Gabungkan semua marker (TPS tetap + hasil pencarian)
        const allMarkers = [...TPS_LOCATIONS, ...wargaMarkers];
        setMarkers(allMarkers);
        setSearchResults([...foundWarga, ...foundTPS]);

        // Buat info pencarian
        let infoParts = [];
        if (foundWarga.length > 0) {
          infoParts.push(`${foundWarga.length} Warga`);
        }
        if (foundTPS.length > 0) {
          infoParts.push(`${foundTPS.length} TPS`);
        }
        searchInfoText = `✅ Ditemukan: ${infoParts.join(' & ')}`;

        // Zoom ke area Yogyakarta
        if (mapRef.current) {
          mapRef.current.setView([-7.797068, 110.370529], 13);
        }

        setSearchInfo(searchInfoText);
      } else {
        // Tidak ada hasil
        const noResultMsg = `❌ Data "${query}" tidak ditemukan!\n\n💡 Tips:\n- Coba gunakan kata kunci lain\n- Contoh: "Yogyakarta", "Sleman", "Bantul"\n- Atau cari nama warga`;
        alert(noResultMsg);
        setSearchResults([]);
        setSearchInfo("");
        setMarkers(TPS_LOCATIONS);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // ==================== FUNGSI CLEAR PENCARIAN ====================
  const clearSearch = () => {
    setMarkers(TPS_LOCATIONS);
    setSearchResults([]);
    setSearchInfo("");
    if (mapRef.current) {
      mapRef.current.setView([-7.797068, 110.370529], 12);
    }
  };

  // ==================== FUNGSI GET MARKERS ====================
  const getMarkers = () => {
    return markers;
  };

  // Expose fungsi ke parent component
  useImperativeHandle(ref, () => ({
    search: handleSearch,
    clearSearch: clearSearch,
    getMarkers: getMarkers,
  }));

  // ==================== RENDER ====================
  return (
    <div style={{ 
      position: "relative", 
      height: height, 
      borderRadius: "10px", 
      overflow: "hidden",
      border: "2px solid #4CAF50",
    }}>
      <MapContainer
        center={[-7.797068, 110.370529]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render semua marker */}
        {markers.map((loc) => {
          // Cek apakah ini hasil pencarian
          const isSearchResult = loc.isSearchResult || false;
          
          return (
            <Marker key={loc.id} position={loc.position}>
              <Popup>
                <div style={{ minWidth: "180px" }}>
                  <strong>
                    {loc.type === "TPS" ? "🏢" : "👤"} {loc.name}
                  </strong>
                  <br />
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    📍 {loc.address}
                  </span>
                  {loc.email && loc.email !== "-" && (
                    <>
                      <br />
                      <span style={{ fontSize: "11px", color: "#999" }}>
                        📧 {loc.email}
                      </span>
                    </>
                  )}
                  <br />
                  <span
                    style={{
                      fontSize: "11px",
                      background: loc.type === "TPS" ? "#4CAF50" : "#2196F3",
                      color: "white",
                      padding: "2px 10px",
                      borderRadius: "10px",
                      display: "inline-block",
                      marginTop: "5px",
                    }}
                  >
                    {loc.type}
                  </span>
                  {isSearchResult && (
                    <>
                      <br />
                      <span style={{
                        fontSize: "10px",
                        color: "#FF9800",
                        fontWeight: "bold",
                        display: "inline-block",
                        marginTop: "3px",
                      }}>
                        ⭐ Hasil Pencarian
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Controller untuk akses map */}
        <MapController onMapReady={(map) => {
          mapRef.current = map;
        }} />
      </MapContainer>
    </div>
  );
});

Map.displayName = "Map";

export default Map;