import { useState, useEffect, useRef } from 'react';
import { FiLogOut, FiSave, FiCopy, FiTrash2, FiUserPlus, FiCalendar, FiUsers, FiUser } from 'react-icons/fi';
import { HiOutlineShieldCheck, HiOutlineClipboardCopy } from 'react-icons/hi';

export default function Admin2() {
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Bu Kartika");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswaShalat, setSiswaShalat] = useState([]);
  const [salinText, setSalinText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const containerRef = useRef(null);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Ambil data siswa cowok
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

  // Status color mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'Ya': return 'bg-emerald-500';
      case 'Tidak': return 'bg-rose-500';
      case 'Dispen': return 'bg-amber-500';
      case 'Tidak Sekolah': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl transform transition-all duration-300 animate-slideIn
          ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-md border border-white/20`}>
          <div className="flex items-center gap-3">
            <HiOutlineShieldCheck className="text-xl" />
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      <div className="relative container mx-auto px-4 py-8" ref={containerRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              Panel Admin Siswa
            </h1>
            <p className="text-gray-400">Manajemen absensi shalat siswa kelas XI C</p>
          </div>
          <button
            onClick={logout}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 
              hover:from-rose-600/30 hover:to-pink-600/30 border border-rose-400/30 backdrop-blur-sm 
              transition-all duration-300 hover:shadow-rose-500/30 hover:shadow-lg"
          >
            <FiLogOut className="group-hover:rotate-12 transition-transform" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FiCalendar className="text-2xl text-blue-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tanggal</p>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="bg-transparent text-xl font-bold outline-none text-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <FiUsers className="text-2xl text-purple-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Kelas</p>
                <input
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  className="bg-transparent text-xl font-bold outline-none text-purple-200 w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-400/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <FiUser className="text-2xl text-emerald-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Wali Kelas</p>
                <input
                  value={wali}
                  onChange={e => setWali(e.target.value)}
                  className="bg-transparent text-xl font-bold outline-none text-emerald-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Absensi Shalat Siswa</h2>
              <p className="text-gray-400">Total {siswaShalat.length} siswa terdaftar</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={tambahSiswa}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 
                  hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-400/30 backdrop-blur-sm 
                  transition-all duration-300 hover:shadow-emerald-500/30 hover:shadow-lg"
              >
                <FiUserPlus className="group-hover:scale-110 transition-transform" />
                Tambah Siswa
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
                  <th className="p-4 text-left">No</th>
                  <th className="p-4 text-left">Nama Siswa</th>
                  <th className="p-4 text-center">Status Shalat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {siswaShalat.map((siswa, index) => (
                  <tr key={siswa.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-4 font-medium">{siswa.nama}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-3 justify-center">
                        {['Ya', 'Tidak', 'Dispen', 'Tidak Sekolah'].map((status) => (
                          <label
                            key={status}
                            className="relative flex items-center cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name={`shalat_${siswa.id}`}
                              value={status}
                              defaultChecked={status === 'Ya'}
                              className="sr-only peer"
                            />
                            <div className={`px-4 py-2 rounded-lg transition-all duration-300
                              peer-checked:${getStatusColor(status)} 
                              peer-checked:text-white
                              bg-white/5 hover:bg-white/10 border border-white/10
                              peer-checked:border-transparent`}>
                              {status}
                            </div>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => hapusSiswa(siswa.id, siswa.nama)}
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500/10 to-pink-500/10 
                          hover:from-rose-500/20 hover:to-pink-500/20 border border-rose-400/20 
                          transition-all duration-300"
                      >
                        <FiTrash2 className="group-hover:scale-110 transition-transform" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
            <div className="flex gap-4">
              <button
                onClick={simpanAbsensi}
                className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 
                  hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-blue-500/30 
                  transition-all duration-300"
              >
                <FiSave className="group-hover:rotate-12 transition-transform" />
                <span className="font-semibold">Simpan Absensi</span>
              </button>
              
              <button
                onClick={salinHasil}
                className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 
                  hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-emerald-500/30 
                  transition-all duration-300"
              >
                <HiOutlineClipboardCopy className="group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Salin Hasil</span>
              </button>
            </div>
            
            <div className="text-gray-400 text-sm">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>Ya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span>Tidak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Dispen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span>Tidak Sekolah</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Preview */}
        <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Preview Hasil</h3>
            <div className="text-gray-400 text-sm">
              {salinText ? `${salinText.split('\n').length} baris` : 'Kosong'}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-64 p-4 rounded-xl bg-gray-900/50 border border-white/10 
                text-gray-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 
                focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
              readOnly
              value={salinText}
              placeholder="Hasil absensi akan muncul di sini setelah menekan tombol 'Salin Hasil'..."
            />
            {salinText && (
              <button
                onClick={() => navigator.clipboard.writeText(salinText)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 
                  transition-colors backdrop-blur-sm"
              >
                <FiCopy className="text-lg" />
              </button>
            )}
          </div>
          
          <div className="mt-4 text-gray-400 text-sm">
            <p>Format otomatis siap untuk dibagikan ke WhatsApp atau platform lainnya</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistem Absensi Sekolah © 2025 - Dibuat dengan ❤️ oleh Rizky</p>
          <p className="mt-1">v2.0 • Admin Panel</p>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}
