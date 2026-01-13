import { useState, useEffect } from 'react';
import { 
  FiLogOut, 
  FiSave, 
  FiCopy, 
  FiTrash2, 
  FiUserPlus, 
  FiCalendar, 
  FiUsers, 
  FiUser,
  FiDownload,
  FiUpload,
  FiSearch,
  FiX
} from 'react-icons/fi';

export default function Admin2() {
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Bu Kartika");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswiShalat, setSiswiShalat] = useState([]);
  const [salinText, setSalinText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Ambil data siswi
  const fetchSiswiShalat = async () => {
    try {
      const res = await fetch('/api/getSiswi', { cache: 'no-store' });
      const json = await res.json();
      setSiswiShalat(json.siswi || []);
    } catch {
      setSiswiShalat([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchSiswiShalat();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const logout = () => {
    localStorage.removeItem('admin_ok');
    window.location.href = '/';
  };

  const simpanSiswiShalat = async (list) => {
    const res = await fetch('/api/updateSiswi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswi: list })
    });
    const json = await res.json();
    if (json.success) {
      fetchSiswiShalat();
      showNotification('Data siswi berhasil disimpan!', 'success');
    } else {
      showNotification('Gagal menyimpan data siswi', 'error');
    }
  };

  const tambahSiswiShalat = async () => {
    const nama = prompt('Nama siswi baru:');
    if (!nama) return;
    const newId = Math.max(...siswiShalat.map(s => s.id), 0) + 1;
    const updated = [...siswiShalat, { id: newId, nama: nama.trim() }];
    await simpanSiswiShalat(updated);
  };

  const hapusSiswiShalat = async (id, nama) => {
    if (!confirm(`Hapus siswi "${nama}"?`)) return;
    const updated = siswiShalat.filter(s => s.id !== id);
    await simpanSiswiShalat(updated);
  };

  const simpanAbsensiShalat = async () => {
    const hasil = siswiShalat.map(s => ({
      nama: s.nama,
      shalat: document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak"
    }));
    const data = { kelas, wali_kelas: wali, absensi: { [tanggal]: hasil } };

    const res = await fetch('/api/updateHasil2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    
    if (json.success) {
      showNotification(`Absensi siswi tersimpan (Tanggal ${tanggal})!`, 'success');
    } else {
      showNotification('Gagal menyimpan absensi siswi!', 'error');
    }
  };

  const salinHasil = () => {
    const hasil = siswiShalat.map((s, i) => {
      const status = document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak";
      return { nama: s.nama, shalat: status };
    });

    const total = hasil.length;
    const hitung = (k) => hasil.filter(h => h.shalat.toLowerCase() === k.toLowerCase()).length;

    const shalatCount = hitung('Ya');
    const tidakCount = hitung('Tidak');
    const halanganCount = hitung('Halangan');
    const dispenCount = hitung('Dispen');
    const tidakSekolahCount = hitung('Tidak Sekolah');

    let teks = `🌸 REKAP ABSENSI SHALAT SISWI\n`;
    teks += `Kelas: ${kelas}\n`;
    teks += `Wali Kelas: ${wali}\n`;
    teks += `Tanggal: ${tanggal}\n\n`;
    teks += `📋 DAFTAR SISWI:\n`;
    
    hasil.forEach((r, i) => {
      let statusTampil = r.shalat;
      if (r.shalat === 'Dispen') statusTampil = 'Tidak Sekolah (Dispen)';
      teks += `${i + 1}. ${r.nama} | Shalat: ${statusTampil}\n`;
    });

    teks += `\n📊 STATISTIK:\n`;
    teks += `├─ Shalat: ${shalatCount} orang\n`;
    teks += `├─ Tidak Shalat: ${tidakCount} orang\n`;
    teks += `├─ Halangan: ${halanganCount} orang\n`;
    teks += `├─ Dispen: ${dispenCount} orang\n`;
    teks += `├─ Tidak Sekolah: ${tidakSekolahCount} orang\n`;
    teks += `└─ Total: ${total} orang\n\n`;
    teks += `🔗 Lihat Hasil Absen:\nhttps://absensi-xic.vercel.app\n\n`;
    teks += `© 2025 - Sistem Absensi Sekolah by Rizky`;

    setSalinText(teks);
    navigator.clipboard.writeText(teks);
    showNotification('Hasil absensi berhasil disalin ke clipboard!', 'success');
  };

  // Import dari teks rekap
  const importAbsensi = () => {
    const tanggalMatch = importText.match(/Tanggal:\s*(\d{4}-\d{2}-\d{2})/);
    if (!tanggalMatch) {
      showNotification('Tanggal tidak ditemukan di teks!', 'error');
      return;
    }
    
    const tglRekap = tanggalMatch[1];
    setTanggal(tglRekap);

    const lines = importText.split('\n').filter(line => /^\d+\./.test(line));
    const mapping = {};
    lines.forEach(line => {
      const [ , nama, statusRaw ] = line.match(/^\d+\.\s*(.*?)\s*\|\s*Shalat:\s*(.*)$/) || [];
      if (nama) mapping[nama.trim()] = statusRaw.trim();
    });

    // Isi status di radio sesuai mapping
    siswiShalat.forEach(s => {
      const status = mapping[s.nama];
      if (status) {
        const val = status.includes('Dispen') ? 'Dispen' :
                    status.includes('Halangan') ? 'Halangan' :
                    status.includes('Tidak Sekolah') ? 'Tidak Sekolah' :
                    status.includes('Tidak') ? 'Tidak' : 'Ya';
        const radio = document.querySelector(`input[name="shalat_${s.id}"][value="${val}"]`);
        if (radio) radio.checked = true;
      }
    });

    simpanAbsensiShalat();
    setShowImport(false);
    setImportText('');
    showNotification(`Absensi diimpor & disimpan untuk tanggal ${tglRekap}!`, 'success');
  };

  // Filtered siswi berdasarkan pencarian
  const filteredSiswi = siswiShalat.filter(siswi => 
    siswi.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'Ya': return 'bg-emerald-500';
      case 'Tidak': return 'bg-rose-500';
      case 'Halangan': return 'bg-purple-500';
      case 'Dispen': return 'bg-amber-500';
      case 'Tidak Sekolah': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  // Komponen Card untuk setiap siswi
  const SiswiCard = ({ siswi, index }) => {
    const [selectedStatus, setSelectedStatus] = useState('Ya');

    const handleStatusChange = (status) => {
      setSelectedStatus(status);
      const radio = document.querySelector(`input[name="shalat_${siswi.id}"][value="${status}"]`);
      if (radio) radio.checked = true;
    };

    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-pink-500/30 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div>
              <h4 className="font-medium text-white truncate max-w-[160px]">{siswi.nama}</h4>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedStatus)}`}></div>
                <span>{selectedStatus}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => hapusSiswiShalat(siswi.id, siswi.nama)}
            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            title="Hapus siswi"
          >
            <FiTrash2 className="text-rose-400" size={16} />
          </button>
        </div>

        {/* Radio buttons compact */}
        <div className="grid grid-cols-3 gap-2">
          {['Ya', 'Tidak', 'Halangan', 'Dispen', 'Tidak Sekolah'].map((status) => (
            <label key={status} className="relative cursor-pointer">
              <input
                type="radio"
                name={`shalat_${siswi.id}`}
                value={status}
                defaultChecked={status === 'Ya'}
                className="sr-only peer"
                onChange={() => handleStatusChange(status)}
              />
              <div className={`
                text-xs py-2 rounded-lg text-center transition-all duration-200
                peer-checked:${getStatusColor(status)}
                peer-checked:text-white
                ${status === 'Ya' ? 'bg-emerald-500/10' : 
                  status === 'Tidak' ? 'bg-rose-500/10' : 
                  status === 'Halangan' ? 'bg-purple-500/10' :
                  status === 'Dispen' ? 'bg-amber-500/10' : 
                  'bg-slate-500/10'}
                hover:opacity-90
                peer-checked:border-transparent
                border border-gray-700/50
              `}>
                {status.length > 6 ? status.substring(0, 6) : status}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-pink-900 text-white p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-slideIn
          ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-md border border-white/20`}>
          <div className="flex items-center gap-3">
            <div className="text-xl">✨</div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Compact */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
              Admin Panel - Siswi
            </h1>
            <p className="text-gray-400 text-sm">{siswiShalat.length} siswi terdaftar</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FiUpload size={16} />
              Import
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FiLogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <FiCalendar className="text-pink-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tanggal</p>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FiUsers className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Kelas</p>
                <input
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <FiUser className="text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Wali Kelas</p>
                <input
                  value={wali}
                  onChange={e => setWali(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Cari siswi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:border-pink-500/50 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={tambahSiswiShalat}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FiUserPlus size={16} />
              Tambah Siswi
            </button>
          </div>
        </div>
      </div>

      {/* Grid Siswi */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Daftar Siswi</h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="hidden sm:inline">Ya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="hidden sm:inline">Tidak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="hidden sm:inline">Halangan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="hidden sm:inline">Dispen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="hidden sm:inline">T.Sekolah</span>
            </div>
          </div>
        </div>

        {/* Grid Siswi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSiswi.map((siswi, index) => (
            <SiswiCard key={siswi.id} siswi={siswi} index={index} />
          ))}
        </div>

        {/* Empty State */}
        {filteredSiswi.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gray-800/50 mb-4">
              <FiUsers className="text-4xl text-gray-500" />
            </div>
            <p className="text-gray-400 mb-2">
              {searchTerm ? 'Tidak ada siswi ditemukan' : 'Belum ada siswi terdaftar'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="text-pink-400 hover:text-pink-300 text-sm"
              >
                Reset pencarian
              </button>
            ) : (
              <button
                onClick={tambahSiswiShalat}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Tambah siswi pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-4 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-700/50 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={simpanAbsensiShalat}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiSave />
            Simpan Absensi
          </button>
          
          <button
            onClick={salinHasil}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiCopy />
            Salin Hasil
          </button>
        </div>
      </div>

      {/* Preview Hasil */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white flex items-center gap-2">
            <FiDownload />
            Preview Hasil
          </h3>
          {salinText && (
            <button
              onClick={() => navigator.clipboard.writeText(salinText)}
              className="text-xs px-3 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 transition-colors flex items-center gap-1"
            >
              <FiCopy size={12} />
              Salin
            </button>
          )}
        </div>
        
        <div className="relative">
          <textarea
            className="w-full h-40 p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 
              text-gray-200 text-sm font-mono resize-none focus:outline-none focus:border-pink-500/50"
            readOnly
            value={salinText}
            placeholder="Hasil absensi akan muncul di sini setelah menekan tombol 'Salin Hasil'..."
          />
        </div>
      </div>

      {/* Modal Import Absensi */}
      {showImport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl rounded-2xl border border-pink-500/30 p-6 max-w-lg w-full animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Import Absensi dari Teks</h3>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText('');
                }}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">
                Paste teks rekap absensi sebelumnya untuk mengisi data otomatis
              </p>
              <textarea
                className="w-full h-48 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 
                  text-gray-200 focus:outline-none focus:border-pink-500/50 resize-none"
                placeholder={`Contoh format:
1. Andini | Shalat: Ya
2. Sari | Shalat: Tidak
3. Maya | Shalat: Halangan
...`}
                value={importText}
                onChange={e => setImportText(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={importAbsensi}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 transition-all duration-300"
              >
                Import & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-gray-500 text-xs">
        <p>Sistem Absensi Sekolah © 2025 - Panel Admin Siswi</p>
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #ec4899, #8b5cf6);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
