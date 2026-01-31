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
  FiSearch,
  FiSettings,
  FiFileText,
  FiDownload,
  FiUpload,
  FiAlertTriangle
} from 'react-icons/fi';

export default function Admin() {
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Bu Kartika");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswaShalat, setSiswaShalat] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [salinText, setSalinText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDisclaimer, setIsSavingDisclaimer] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [disclaimerText, setDisclaimerText] = useState('');
  const [showDisclaimerSettings, setShowDisclaimerSettings] = useState(false);

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

  // Ambil disclaimer dari API
  const fetchDisclaimer = async () => {
    try {
      const response = await fetch('/api/getDisclaimer');
      const result = await response.json();
      if (result.success && result.data) {
        setDisclaimerText(result.data.text);
        localStorage.setItem('disclaimer_text', result.data.text);
      }
    } catch (error) {
      console.error('Error fetching disclaimer:', error);
      // Fallback ke localStorage jika ada
      const localDisclaimer = localStorage.getItem('disclaimer_text');
      if (localDisclaimer) {
        setDisclaimerText(localDisclaimer);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchSiswa();
    fetchDisclaimer();
  }, []);

  // Filter siswa berdasarkan pencarian
  const filteredSiswa = siswaShalat.filter(siswa => 
    siswa.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const logout = () => {
    localStorage.removeItem('admin_ok');
    window.location.href = '/';
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
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

  const generateHasilText = () => {
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

    let teks = `📊 REKAP ABSENSI SHALAT - SISWA\n`;
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

    return { teks, hasil };
  };

  // Fungsi baru: Simpan dan Salin sekaligus
  const simpanDanSalin = async () => {
    setIsLoading(true);
    
    // 1. Simpan ke database terlebih dahulu
    const { hasil, teks } = generateHasilText();
    
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
        // 2. Setelah berhasil disimpan, salin ke clipboard
        setSalinText(teks);
        navigator.clipboard.writeText(teks);
        showNotification('Absensi berhasil disimpan dan hasil disalin ke clipboard!', 'success');
      } else {
        showNotification('Gagal menyimpan absensi', 'error');
      }
    } catch (error) {
      showNotification('Error menyimpan absensi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi lama salinHasil untuk tombol salin di preview
  const salinHasil = () => {
    const { teks } = generateHasilText();
    setSalinText(teks);
    navigator.clipboard.writeText(teks);
    showNotification('Hasil absensi berhasil disalin ke clipboard!', 'success');
  };

  // Simpan disclaimer ke GitHub
  const saveDisclaimerToGitHub = async () => {
    setIsSavingDisclaimer(true);
    
    try {
      const response = await fetch('/api/updateDisclaimer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disclaimer_text: disclaimerText,
          action: 'single'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Disclaimer berhasil disimpan ke GitHub!', 'success');
        
        // Simpan ke localStorage juga
        localStorage.setItem('disclaimer_text', disclaimerText);
        localStorage.setItem('disclaimer_last_saved', new Date().toISOString());
        
        if (result.data) {
          localStorage.setItem('disclaimer_commit_sha', result.data.commit_sha);
        }
      } else {
        showNotification(`Gagal menyimpan: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving disclaimer:', error);
      showNotification('Gagal menyimpan ke GitHub', 'error');
    } finally {
      setIsSavingDisclaimer(false);
    }
  };

  // Reset disclaimer ke default
  const resetDisclaimer = () => {
    const defaultText = "⚠️ **DISCLAIMER!!** ⚠️\n\nDILARANG KERAS MENG COPY-PASTE TEKS ABSENSI KITA!\nMINIMAL CREATIVE LAH BOSS!\n\nSistem ini dibuat dengan ❤️ oleh Rizky.\nHargai karya orang lain dengan tidak menyalin mentah-mentah.\n\nJika butuh sistem serupa, kontak developer untuk kolaborasi!";
    setDisclaimerText(defaultText);
    showNotification('Disclaimer direset ke default', 'info');
  };

  // Export disclaimer sebagai file
  const exportDisclaimer = () => {
    const blob = new Blob([disclaimerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disclaimer-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    showNotification('Disclaimer berhasil diexport!', 'success');
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
      const radio = document.querySelector(`input[name="shalat_${siswa.id}"][value="${status}"]`);
      if (radio) radio.checked = true;
    };

    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-sm font-bold">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900 text-white p-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-slideIn
          ${notification.type === 'success' ? 'bg-emerald-500/90' : notification.type === 'error' ? 'bg-rose-500/90' : 'bg-blue-500/90'} backdrop-blur-md border border-white/20`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-40">
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-indigo-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Admin Panel - Siswa
            </h1>
            <p className="text-gray-400 text-sm">{siswaShalat.length} siswa terdaftar</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDisclaimerSettings(!showDisclaimerSettings)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/30 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
            >
              <FiSettings size={16} />
              Pengaturan
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
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <FiUsers className="text-indigo-400" />
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
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={tambahSiswa}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <FiUserPlus size={16} />
              Tambah Siswa
            </button>
          </div>
        </div>
      </div>

      {/* Section Pengaturan Disclaimer */}
      {showDisclaimerSettings && (
        <div className="mb-6 bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20 backdrop-blur-sm rounded-2xl border border-amber-400/30 p-6 animate-slideDown">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <FiAlertTriangle />
              Pengaturan Disclaimer
            </h3>
            <button
              onClick={() => setShowDisclaimerSettings(false)}
              className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 transition-colors"
            >
              <span className="text-amber-300">✕</span>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-3">
              Teks disclaimer ini akan muncul di halaman utama saat pertama kali diakses.
            </p>
            
            <div className="relative">
              <textarea
                className="w-full h-48 p-4 rounded-xl bg-gray-900/50 border border-amber-400/30 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-300"
                value={disclaimerText}
                onChange={(e) => setDisclaimerText(e.target.value)}
                placeholder="Masukkan teks disclaimer di sini..."
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                {disclaimerText.length} karakter
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={saveDisclaimerToGitHub}
                disabled={isSavingDisclaimer}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDisclaimer ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Simpan ke GitHub
                  </>
                )}
              </button>
              
              <button
                onClick={resetDisclaimer}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600 text-gray-300 font-medium transition-all duration-300 flex items-center gap-2"
              >
                <FiFileText />
                Reset ke Default
              </button>
              
              <button
                onClick={exportDisclaimer}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-400/30 text-blue-300 font-medium transition-all duration-300 flex items-center gap-2"
              >
                <FiDownload />
                Export File
              </button>
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-xl border border-amber-500/20">
            <h4 className="text-amber-200 font-medium mb-2 flex items-center gap-2">
              <FiFileText />
              Preview Disclaimer:
            </h4>
            <div className="text-gray-300 whitespace-pre-line text-sm max-h-40 overflow-y-auto p-2 bg-gray-900/30 rounded-lg">
              {disclaimerText}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Grid Siswa */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Daftar Siswa</h2>
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
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="hidden sm:inline">Dispen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="hidden sm:inline">T.Sekolah</span>
            </div>
          </div>
        </div>

        {/* Grid Siswa */}
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
            <p className="text-gray-400 mb-2">
              {searchTerm ? 'Tidak ada siswa ditemukan' : 'Belum ada siswa terdaftar'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Reset pencarian
              </button>
            ) : (
              <button
                onClick={tambahSiswa}
                className="text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Tambah siswa pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Fixed at Bottom - TOMBOL DIUBAH DI SINI */}
      <div className="sticky bottom-4 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-xl border border-gray-700/50 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={simpanDanSalin}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="mr-1" />
            <FiCopy className="mr-1" />
            Simpan & Salin
          </button>
        </div>
      </div>

      {/* Preview Hasil */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white flex items-center gap-2">
            <FiFileText />
            Preview Hasil
          </h3>
          {salinText && (
            <button
              onClick={salinHasil}
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
            placeholder="Hasil absensi akan muncul di sini setelah menekan tombol 'Simpan & Salin'..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-500 text-xs">
        <p>Sistem Absensi Sekolah © 2025 - Panel Admin Siswa</p>
        <p className="mt-1 text-gray-600">Disclaimer dapat diatur melalui tombol "Pengaturan" di atas</p>
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
        @keyframes slideDown {
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
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #3b82f6, #6366f1);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
