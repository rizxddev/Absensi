import { useState, useEffect, useRef } from 'react';
import { FiLogOut, FiSave, FiCopy, FiTrash2, FiUserPlus, FiCalendar, FiUsers, FiUser, FiSearch, FiFilter } from 'react-icons/fi';
import { HiOutlineShieldCheck, HiOutlineClipboardCopy } from 'react-icons/hi';

export default function Admin2() {
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Bu Kartika");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswaShalat, setSiswaShalat] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [salinText, setSalinText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Ambil data siswa
  const fetchSiswa = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/getSiswa', { cache: 'no-store' });
      const json = await res.json();
      setSiswaShalat(json.siswa || []);
    } catch (error) {
      console.error('Error fetching siswa:', error);
      setSiswaShalat([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchSiswa();
  }, []);

  // Filter siswa berdasarkan pencarian
  const filteredSiswa = siswaShalat.filter(siswa => {
    const matchesSearch = siswa.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'Semua' || true; // Filter bisa ditambahkan nanti
    return matchesSearch && matchesFilter;
  });

  const logout = () => {
    localStorage.removeItem('admin_ok');
    window.location.href = '/';
  };

  const simpanSiswa = async (list) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/updateSiswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa: list })
      });
      const json = await res.json();
      if (json.success) {
        fetchSiswa();
        showNotification('Data siswa berhasil disimpan!', 'success');
      } else {
        showNotification('Gagal menyimpan data siswa', 'error');
      }
    } catch (error) {
      showNotification('Error menyimpan data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const tambahSiswa = async () => {
    const nama = prompt('Masukkan nama siswa baru:');
    if (!nama || nama.trim() === '') return;
    const newId = Math.max(...siswaShalat.map(s => s.id), 0) + 1;
    const updated = [...siswaShalat, { id: newId, nama: nama.trim() }];
    await simpanSiswa(updated);
  };

  const hapusSiswa = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus siswa: ${nama}?`)) return;
    const updated = siswaShalat.filter(s => s.id !== id);
    await simpanSiswa(updated);
  };

  const simpanAbsensi = async () => {
    setIsLoading(true);
    const hasil = siswaShalat.map(s => {
      const selected = document.querySelector(`input[name="shalat_${s.id}"]:checked`);
      return {
        nama: s.nama,
        shalat: selected ? selected.value : "Tidak"
      };
    });

    const data = {
      kelas,
      wali_kelas: wali,
      absensi: { [tanggal]: hasil }
    };

    try {
      const res = await fetch('/api/updateHasil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success) {
        showNotification('Absensi shalat berhasil disimpan!', 'success');
      } else {
        showNotification('Gagal menyimpan absensi', 'error');
      }
    } catch (error) {
      showNotification('Error menyimpan absensi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const salinHasil = () => {
    const hasil = siswaShalat.map(s => {
      const selected = document.querySelector(`input[name="shalat_${s.id}"]:checked`);
      return {
        nama: s.nama,
        shalat: selected ? selected.value : "Tidak"
      };
    });

    const total = hasil.length;
    const jumlahYa = hasil.filter(h => h.shalat === 'Ya').length;
    const jumlahTidak = hasil.filter(h => h.shalat === 'Tidak').length;
    const jumlahDispen = hasil.filter(h => h.shalat === 'Dispen').length;
    const jumlahTidakSekolah = hasil.filter(h => h.shalat === 'Tidak Sekolah').length;

    let teks = `📊 REKAP ABSENSI SHALAT\n`;
    teks += `Kelas: ${kelas}\n`;
    teks += `Wali Kelas: ${wali}\n`;
    teks += `Tanggal: ${tanggal}\n\n`;
    teks += `DAFTAR SISWA:\n`;

    hasil.forEach((h, i) => {
      let status = h.shalat;
      if (h.shalat === 'Dispen') status = 'Tidak Sekolah (Dispen)';
      teks += `${i + 1}. ${h.nama} | Shalat: ${status}\n`;
    });

    teks += `\n📈 STATISTIK:\n`;
    teks += `├─ Shalat: ${jumlahYa} orang\n`;
    teks += `├─ Tidak Shalat: ${jumlahTidak} orang\n`;
    teks += `├─ Dispen: ${jumlahDispen} orang\n`;
    teks += `├─ Tidak Sekolah: ${jumlahTidakSekolah} orang\n`;
    teks += `└─ Total: ${total} orang\n\n`;
    teks += `🔗 Lihat Hasil: https://absensi-xic.vercel.app\n`;
    teks += `© 2025 - Sistem Absensi Sekolah by Rizky`;

    setSalinText(teks);
    navigator.clipboard.writeText(teks);
    showNotification('Hasil absensi berhasil disalin ke clipboard!', 'success');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Ya': return 'bg-emerald-500';
      case 'Tidak': return 'bg-rose-500';
      case 'Dispen': return 'bg-amber-500';
      case 'Tidak Sekolah': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  // Komponen Card untuk setiap siswa
  const StudentCard = ({ siswa, index }) => {
    const [selectedStatus, setSelectedStatus] = useState('Ya');

    const handleStatusChange = (status) => {
      setSelectedStatus(status);
      // Update radio button
      const radio = document.querySelector(`input[name="shalat_${siswa.id}"][value="${status}"]`);
      if (radio) radio.checked = true;
    };

    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div>
              <h4 className="font-medium text-white truncate max-w-[180px]">{siswa.nama}</h4>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedStatus)}`}></div>
                <span>{selectedStatus}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => hapusSiswa(siswa.id, siswa.nama)}
            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            title="Hapus siswa"
          >
            <FiTrash2 className="text-rose-400" size={16} />
          </button>
        </div>

        {/* Radio buttons compact */}
        <div className="grid grid-cols-2 gap-2">
          {['Ya', 'Tidak', 'Dispen', 'Tidak Sekolah'].map((status) => (
            <label key={status} className="relative cursor-pointer">
              <input
                type="radio"
                name={`shalat_${siswa.id}`}
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
                  status === 'Dispen' ? 'bg-amber-500/10' : 
                  'bg-slate-500/10'}
                hover:opacity-90
                peer-checked:border-transparent
                border border-gray-700/50
              `}>
                {status}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 animate-slideIn
          ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} backdrop-blur-md`}>
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck />
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
          <div className="w-12 h-12 border-3 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header Compact */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              Admin Panel - {kelas}
            </h1>
            <p className="text-gray-400 text-sm">{siswaShalat.length} siswa</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-sm font-medium transition-all duration-300"
          >
            <FiLogOut className="inline mr-2" />
            Logout
          </button>
        </div>

        {/* Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FiCalendar className="text-blue-400" />
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
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <FiUser className="text-emerald-400" />
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

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={tambahSiswa}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FiUserPlus />
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Grid Siswa */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Daftar Siswa</h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Ya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span>Tidak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Dispen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span>Tidak Sekolah</span>
            </div>
          </div>
        </div>

        {/* Grid Siswa - Responsive & Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSiswa.map((siswa, index) => (
            <StudentCard key={siswa.id} siswa={siswa} index={index} />
          ))}
        </div>

        {/* Empty State */}
        {filteredSiswa.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-gray-800/50 mb-4">
              <FiUsers className="text-4xl text-gray-500" />
            </div>
            <p className="text-gray-400">Tidak ada siswa ditemukan</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Reset pencarian
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Fixed at Bottom */}
      <div className="sticky bottom-4 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-700/50 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={simpanAbsensi}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiSave />
            Simpan Absensi
          </button>
          
          <button
            onClick={salinHasil}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <HiOutlineClipboardCopy />
            Salin Hasil
          </button>
        </div>
      </div>

      {/* Preview Hasil */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white">Preview Hasil</h3>
          {salinText && (
            <button
              onClick={() => navigator.clipboard.writeText(salinText)}
              className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-colors flex items-center gap-1"
            >
              <FiCopy size={12} />
              Salin
            </button>
          )}
        </div>
        
        <div className="relative">
          <textarea
            className="w-full h-40 p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 
              text-gray-200 text-sm font-mono resize-none focus:outline-none focus:border-blue-500/50"
            readOnly
            value={salinText}
            placeholder="Hasil absensi akan muncul di sini setelah menekan tombol 'Salin Hasil'..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-gray-500 text-xs">
        <p>Sistem Absensi Sekolah © 2025</p>
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
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          border-radius: 3px;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
    </div>
  );
}
