import { useState, useEffect, useRef } from 'react';
import { 
  FiLogOut, 
  FiCopy, 
  FiCalendar, 
  FiUsers, 
  FiUser,
  FiDownload,
  FiPrinter,
  FiBarChart2,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiShare2
} from 'react-icons/fi';
import { 
  HiOutlineTrendingUp, 
  HiOutlineTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineAcademicCap
} from 'react-icons/hi';

export default function Guru() {
  const [dataSiswa, setDataSiswa] = useState(null);
  const [dataSiswi, setDataSiswi] = useState(null);
  const [tanggalListSiswa, setTanggalListSiswa] = useState([]);
  const [tanggalListSiswi, setTanggalListSiswi] = useState([]);
  const [tanggalPilihSiswa, setTanggalPilihSiswa] = useState('');
  const [tanggalPilihSiswi, setTanggalPilihSiswi] = useState('');
  const [salinText, setSalinText] = useState('');
  const [activeTab, setActiveTab] = useState('siswa');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [statistics, setStatistics] = useState({ siswa: {}, siswi: {} });
  const previewRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStatistics();
  }, [dataSiswa, dataSiswi, tanggalPilihSiswa, tanggalPilihSiswi]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ambil hasil absensi siswa
      const resSiswa = await fetch('/api/getHasil', { cache: 'no-store' });
      const jsonSiswa = await resSiswa.json();
      setDataSiswa(jsonSiswa);
      const keysSiswa = Object.keys(jsonSiswa.absensi || {}).sort((a, b) => new Date(b) - new Date(a));
      setTanggalListSiswa(keysSiswa);
      setTanggalPilihSiswa(keysSiswa[0] || '');

      // Ambil hasil absensi siswi
      const resSiswi = await fetch('/api/getHasil2', { cache: 'no-store' });
      const jsonSiswi = await resSiswi.json();
      setDataSiswi(jsonSiswi);
      const keysSiswi = Object.keys(jsonSiswi.absensi || {}).sort((a, b) => new Date(b) - new Date(a));
      setTanggalListSiswi(keysSiswi);
      setTanggalPilihSiswi(keysSiswi[0] || '');
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Gagal memuat data absensi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = () => {
    if (!dataSiswa || !dataSiswi) return;

    const calculateForDate = (data, date, type) => {
      if (!date || !data.absensi || !data.absensi[date]) return null;
      
      const list = data.absensi[date] || [];
      const total = list.length;

      let stats = {
        shalat: 0,
        tidak: 0,
        halangan: 0,
        dispen: 0,
        tidakSekolah: 0,
        total: total
      };

      list.forEach(s => {
        const val = (s.shalat || '').toLowerCase();
        if (val === 'ya') stats.shalat++;
        else if (val === 'tidak') stats.tidak++;
        else if (val.includes('halangan')) stats.halangan++;
        else if (val.includes('dispen')) stats.dispen++;
        else if (val.includes('tidak sekolah')) stats.tidakSekolah++;
      });

      // Calculate percentages
      stats.percentageShalat = total > 0 ? Math.round((stats.shalat / total) * 100) : 0;
      stats.percentageTidak = total > 0 ? Math.round((stats.tidak / total) * 100) : 0;
      stats.percentageHadir = total > 0 ? Math.round(((stats.shalat + stats.tidak + stats.halangan) / total) * 100) : 0;

      return stats;
    };

    setStatistics({
      siswa: calculateForDate(dataSiswa, tanggalPilihSiswa, 'siswa') || {},
      siswi: calculateForDate(dataSiswi, tanggalPilihSiswi, 'siswi') || {}
    });
  };

  const formatRekap = (tipe, tgl) => {
    const data = tipe === 'siswa' ? dataSiswa : dataSiswi;
    if (!data || !tgl || !data.absensi || !data.absensi[tgl]) return '';

    const list = data.absensi[tgl] || [];
    const total = list.length;

    // Hitung statistik
    let stats = {
      shalat: 0,
      tidak: 0,
      halangan: 0,
      dispen: 0,
      tidakSekolah: 0
    };

    list.forEach(s => {
      const val = (s.shalat || '').toLowerCase();
      if (val === 'ya') stats.shalat++;
      else if (val === 'tidak') stats.tidak++;
      else if (val.includes('halangan')) stats.halangan++;
      else if (val.includes('dispen')) stats.dispen++;
      else if (val.includes('tidak sekolah')) stats.tidakSekolah++;
    });

    const title = `📊 REKAP ABSENSI SHALAT ${tipe.toUpperCase()} - KELAS ${data.kelas}\n`;
    const subtitle = `Wali Kelas: ${data.wali_kelas} | Tanggal: ${tgl}\n\n`;
    
    let body = `📋 DAFTAR ${tipe === 'siswa' ? 'SISWA' : 'SISWI'}:\n`;
    list.forEach((r, i) => {
      const statusIcon = r.shalat === 'Ya' ? '✅' : 
                        r.shalat === 'Tidak' ? '❌' : 
                        r.shalat === 'Halangan' ? '⚠️' : 
                        r.shalat === 'Dispen' ? '📝' : '🏠';
      body += `${i + 1}. ${r.nama} ${statusIcon} ${r.shalat}\n`;
    });

    const footer = `\n📈 STATISTIK:\n`;
    footer += `├─ Shalat: ${stats.shalat} orang (${Math.round((stats.shalat/total)*100)}%)\n`;
    footer += `├─ Tidak Shalat: ${stats.tidak} orang (${Math.round((stats.tidak/total)*100)}%)\n`;
    if (tipe === 'siswi') {
      footer += `├─ Halangan: ${stats.halangan} orang (${Math.round((stats.halangan/total)*100)}%)\n`;
    }
    footer += `├─ Dispen: ${stats.dispen} orang (${Math.round((stats.dispen/total)*100)}%)\n`;
    footer += `├─ Tidak Sekolah: ${stats.tidakSekolah} orang (${Math.round((stats.tidakSekolah/total)*100)}%)\n`;
    footer += `└─ Total: ${total} orang\n\n`;
    footer += `🏫 Persentase Kehadiran: ${Math.round(((stats.shalat + stats.tidak + stats.halangan)/total)*100)}%\n\n`;
    footer += `🔗 Lihat Hasil: https://absensi-xic.vercel.app\n`;
    footer += `© 2025 - Sistem Absensi Sekolah by Rizky`;

    return title + subtitle + body + footer;
  };

  const salinRekap = (tipe) => {
    const tgl = tipe === 'siswa' ? tanggalPilihSiswa : tanggalPilihSiswi;
    const teks = formatRekap(tipe, tgl);
    
    if (!teks) {
      showNotification('Tidak ada data absensi untuk tanggal tersebut', 'error');
      return;
    }
    
    setSalinText(teks);
    navigator.clipboard.writeText(teks);
    
    // Scroll ke preview
    if (previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    showNotification(`Rekap ${tipe} tanggal ${tgl} berhasil disalin!`, 'success');
  };

  const keluar = () => {
    window.location.href = '/';
  };

  const printPreview = () => {
    if (salinText) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Rekap Absensi - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: monospace; padding: 20px; line-height: 1.6; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${salinText}</pre>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
    }
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch(status?.toLowerCase()) {
        case 'ya': return 'bg-emerald-500';
        case 'tidak': return 'bg-rose-500';
        case 'halangan': return 'bg-purple-500';
        case 'dispen': return 'bg-amber-500';
        case 'tidak sekolah': return 'bg-slate-500';
        default: return 'bg-gray-500';
      }
    };

    const getStatusIcon = (status) => {
      switch(status?.toLowerCase()) {
        case 'ya': return '✓';
        case 'tidak': return '✗';
        case 'halangan': return '⚠';
        case 'dispen': return '📝';
        case 'tidak sekolah': return '🏠';
        default: return '?';
      }
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const StatCard = ({ title, value, icon, color, trend }) => {
    return (
      <div className={`bg-gradient-to-br ${color} backdrop-blur-sm rounded-xl p-4 border border-white/10`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300 text-sm">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="text-2xl opacity-80">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trend > 0 ? <HiOutlineTrendingUp className="text-emerald-400" /> : <HiOutlineTrendingDown className="text-rose-400" />}
            <span className={trend > 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'siswa' ? dataSiswa : dataSiswi;
  const currentTanggal = activeTab === 'siswa' ? tanggalPilihSiswa : tanggalPilihSiswi;
  const currentTanggalList = activeTab === 'siswa' ? tanggalListSiswa : tanggalListSiswi;
  const currentStats = statistics[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 text-white">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-slideIn
          ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-md border border-white/20`}>
          <div className="flex items-center gap-3">
            <div className="text-xl">📋</div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-900/90 to-transparent backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                <HiOutlineAcademicCap className="text-2xl text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Dashboard Absensi Guru
                </h1>
                <p className="text-gray-400 text-sm">Monitor dan kelola absensi shalat siswa & siswi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-colors"
                title="Refresh data"
              >
                <FiRefreshCw />
              </button>
              <button
                onClick={keluar}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-400/30 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
              >
                <FiLogOut />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
              activeTab === 'siswa' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' 
                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'
            }`}
          >
            <FiUsers />
            Siswa
            {tanggalListSiswa.length > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {tanggalListSiswa.length} hari
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('siswi')}
            className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium flex items-center gap-2 ${
              activeTab === 'siswi' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/30' 
                : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50'
            }`}
          >
            <FiUser />
            Siswi
            {tanggalListSiswi.length > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {tanggalListSiswi.length} hari
              </span>
            )}
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Shalat"
            value={currentStats.shalat || 0}
            icon={<HiOutlineCheckCircle />}
            color="from-emerald-500/10 to-green-500/10"
          />
          
          <StatCard 
            title="Tidak Shalat"
            value={currentStats.tidak || 0}
            icon={<HiOutlineXCircle />}
            color="from-rose-500/10 to-pink-500/10"
          />
          
          {activeTab === 'siswi' && (
            <StatCard 
              title="Halangan"
              value={currentStats.halangan || 0}
              icon={<HiOutlineBan />}
              color="from-purple-500/10 to-indigo-500/10"
            />
          )}
          
          <StatCard 
            title="Kehadiran"
            value={`${currentStats.percentageHadir || 0}%`}
            icon={<FiBarChart2 />}
            color="from-blue-500/10 to-cyan-500/10"
            trend={currentStats.percentageHadir || 0}
          />
        </div>

        {/* Date Selection */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Data {activeTab === 'siswa' ? 'Siswa' : 'Siswi'} - Kelas {currentData?.kelas}
              </h2>
              <p className="text-gray-400 text-sm">Wali Kelas: {currentData?.wali_kelas}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" />
                <select
                  className="bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                  value={currentTanggal}
                  onChange={(e) => activeTab === 'siswa' ? setTanggalPilihSiswa(e.target.value) : setTanggalPilihSiswi(e.target.value)}
                >
                  {currentTanggalList.map(tgl => (
                    <option key={tgl} value={tgl}>
                      {new Date(tgl).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => salinRekap(activeTab)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-300 flex items-center gap-2"
              >
                <FiCopy />
                Salin Rekap
              </button>
            </div>
          </div>

          {/* Attendance List */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-white/5 to-white/0">
                  <th className="p-4 text-left">No</th>
                  <th className="p-4 text-left">Nama</th>
                  <th className="p-4 text-left">Status Shalat</th>
                  <th className="p-4 text-left">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {currentTanggal && currentData?.absensi?.[currentTanggal] ? (
                  currentData.absensi[currentTanggal].map((item, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{item.nama}</td>
                      <td className="p-4">
                        <StatusBadge status={item.shalat} />
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {item.shalat === 'Ya' ? 'Sudah shalat' : 
                         item.shalat === 'Tidak' ? 'Belum shalat' :
                         item.shalat === 'Halangan' ? 'Halangan' :
                         item.shalat === 'Dispen' ? 'Dispensasi' : 'Tidak sekolah'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="inline-block p-4 rounded-full bg-gray-800/50 mb-4">
                        <FiCalendar className="text-3xl" />
                      </div>
                      <p>Tidak ada data absensi untuk tanggal ini</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {currentStats.total > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                <FiBarChart2 />
                Ringkasan Statistik
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentStats.total}</p>
                  <p className="text-gray-400 text-sm">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{currentStats.shalat}</p>
                  <p className="text-gray-400 text-sm">Shalat</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-400">{currentStats.tidak}</p>
                  <p className="text-gray-400 text-sm">Tidak</p>
                </div>
                {activeTab === 'siswi' && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{currentStats.halangan || 0}</p>
                    <p className="text-gray-400 text-sm">Halangan</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{currentStats.percentageHadir || 0}%</p>
                  <p className="text-gray-400 text-sm">Kehadiran</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview & Export Section */}
        <div ref={previewRef} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FiShare2 />
              Preview & Export
            </h3>
            
            <div className="flex gap-3">
              <button
                onClick={printPreview}
                disabled={!salinText}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                  salinText 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600' 
                    : 'bg-gray-700/50 cursor-not-allowed'
                }`}
              >
                <FiPrinter />
                Cetak
              </button>
              
              <button
                onClick={() => {
                  if (salinText) {
                    const blob = new Blob([salinText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rekap-absensi-${activeTab}-${currentTanggal}.txt`;
                    a.click();
                    showNotification('File berhasil didownload!', 'success');
                  }
                }}
                disabled={!salinText}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                  salinText 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600' 
                    : 'bg-gray-700/50 cursor-not-allowed'
                }`}
              >
                <FiDownload />
                Download
              </button>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-64 p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 
                text-gray-200 font-mono text-sm resize-none focus:outline-none focus:border-blue-500/50"
              readOnly
              value={salinText}
              placeholder="Hasil rekap akan muncul di sini setelah menekan tombol 'Salin Rekap'..."
            />
            {salinText && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(salinText)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                  title="Salin teks"
                >
                  <FiCopy />
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-gray-400 text-sm">
            <p>Format teks siap untuk dibagikan ke WhatsApp, email, atau platform lainnya.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistem Absensi Sekolah © 2025 - Dashboard Guru v2.0</p>
          <p className="mt-1">Total data: {tanggalListSiswa.length + tanggalListSiswi.length} hari absensi</p>
        </div>
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
