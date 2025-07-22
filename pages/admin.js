import { useState, useEffect } from 'react';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Gungun Nugraha");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswa, setSiswa] = useState([]);
  const [guruList, setGuruList] = useState([]);

  const fetchSiswa = async () => {
    try {
      const res = await fetch('/api/getSiswa', { cache: 'no-store' });
      const json = await res.json();
      setSiswa(json.siswa || []);
    } catch {
      setSiswa([]);
    }
  };

  const fetchGuru = async () => {
    try {
      const res = await fetch('/guru.json', { cache: 'no-store' });
      const json = await res.json();
      setGuruList(json.guru || []);
    } catch {
      setGuruList([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (token) {
      setLoggedIn(true);
      fetchSiswa();
      fetchGuru();
    }
  }, []);

  const login = () => {
    const ADMIN_PASS = "1234";
    if (password === ADMIN_PASS) {
      localStorage.setItem('admin_ok', 'true');
      setLoggedIn(true);
    } else {
      alert('Password salah!');
    }
  };

  const simpanSiswa = async (list) => {
    const res = await fetch('/api/updateSiswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswa: list })
    });
    const json = await res.json();
    if (json.success) fetchSiswa();
    else alert('Gagal simpan siswa: ' + JSON.stringify(json.error || json));
  };

  const tambahSiswa = async () => {
    const nama = prompt('Nama siswa baru:');
    if (!nama) return;
    await simpanSiswa([...siswa, { id: Date.now(), nama }]);
  };

  const hapusSiswa = async (id) => {
    if (!confirm('Hapus siswa ini?')) return;
    await simpanSiswa(siswa.filter(s => s.id !== id));
  };

  const simpanGuru = async (list) => {
    const res = await fetch('/api/updateGuru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guru: list })
    });
    const json = await res.json();
    if (json.success) fetchGuru();
    else alert('Gagal simpan guru: ' + JSON.stringify(json.error || json));
  };

  const tambahGuru = () => {
    const username = prompt('Masukkan username guru:');
    const pass = prompt('Masukkan password guru:');
    if (username && pass) simpanGuru([...guruList, { username, password: pass }]);
  };

  const hapusGuru = (username) => {
    if (confirm(`Hapus guru ${username}?`)) {
      simpanGuru(guruList.filter(g => g.username !== username));
    }
  };

  const simpanAbsensi = async () => {
    const hasilShalat = siswa.map(s => ({
      nama: s.nama,
      shalat: document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak"
    }));

    const hasilSekolah = siswa.map(s => ({
      nama: s.nama,
      sekolah: document.querySelector(`input[name="sekolah_${s.id}"]:checked`)?.value || "Alpha"
    }));

    const dataExportShalat = { kelas, wali_kelas: wali, absensi: { [tanggal]: hasilShalat } };
    const dataExportSekolah = { kelas, wali_kelas: wali, absensi: { [tanggal]: hasilSekolah } };

    const res1 = await fetch('/api/updateHasil', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataExportShalat)
    });
    const json1 = await res1.json();
    if (!json1.success) alert('Gagal simpan absensi shalat: ' + JSON.stringify(json1.error || json1));

    const res2 = await fetch('/api/updateHasil2', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataExportSekolah)
    });
    const json2 = await res2.json();
    if (!json2.success) alert('Gagal simpan absensi sekolah: ' + JSON.stringify(json2.error || json2));
  };

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white space-y-4">
        <h2 className="text-2xl font-bold">Login Admin</h2>
        <input type="password" className="border px-3 py-2 text-black rounded" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={login}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto bg-gray-900/80 p-6 rounded-2xl shadow-2xl border border-indigo-400/50">
        <h2 className="text-3xl font-bold mb-6 text-indigo-300">Panel Admin Absensi</h2>

        {/* Form tanggal, kelas, wali */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center gap-2">Tanggal:
            <input type="date" className="text-black rounded px-2" value={tanggal} onChange={e => setTanggal(e.target.value)} />
          </label>
          <label className="flex items-center gap-2">Kelas:
            <input className="text-black rounded px-2" value={kelas} onChange={e => setKelas(e.target.value)} />
          </label>
          <label className="flex items-center gap-2">Wali Kelas:
            <input className="text-black rounded px-2" value={wali} onChange={e => setWali(e.target.value)} />
          </label>
        </div>

        {/* Tabel siswa */}
        <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg mb-4 shadow" onClick={tambahSiswa}>
          Tambah Siswa
        </button>
        <table className="table-auto w-full text-left border border-gray-700 rounded-lg overflow-hidden mb-8">
          <thead>
            <tr className="bg-indigo-700 text-white">
              <th className="px-4 py-2">No</th><th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2" colSpan={5}>Absen Sekolah</th>
              <th className="px-4 py-2" colSpan={2}>Absen Shalat</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
            <tr className="bg-indigo-600 text-white text-sm">
              <th></th><th></th>
              <th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Dispen</th>
              <th>Ya</th><th>Tidak</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {siswa.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-700 hover:bg-gray-800 transition">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{s.nama}</td>
                <td><input type="radio" name={`sekolah_${s.id}`} value="Hadir" defaultChecked /></td>
                <td><input type="radio" name={`sekolah_${s.id}`} value="Izin" /></td>
                <td><input type="radio" name={`sekolah_${s.id}`} value="Sakit" /></td>
                <td><input type="radio" name={`sekolah_${s.id}`} value="Alpha" /></td>
                <td><input type="radio" name={`sekolah_${s.id}`} value="Dispen" /></td>
                <td><input type="radio" name={`shalat_${s.id}`} value="Ya" defaultChecked /></td>
                <td><input type="radio" name={`shalat_${s.id}`} value="Tidak" /></td>
                <td>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                    onClick={() => hapusSiswa(s.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow" onClick={simpanAbsensi}>
          Simpan Absensi
        </button>

        {/* Panel manajemen guru */}
        <div className="mt-10">
          <h3 className="text-2xl font-bold mb-4 text-indigo-300">Manajemen Guru</h3>
          <button className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg mb-4 shadow" onClick={tambahGuru}>
            Tambah Guru
          </button>
          <table className="table-auto w-full text-left border border-gray-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-indigo-700 text-white">
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Password</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guruList.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-4 text-gray-400">Belum ada guru</td></tr>
              ) : guruList.map((g, idx) => (
                <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800 transition">
                  <td className="px-4 py-2">{g.username}</td>
                  <td className="px-4 py-2">{g.password}</td>
                  <td>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                      onClick={() => hapusGuru(g.username)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
      }
