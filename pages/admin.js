import { useState, useEffect } from 'react';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Gungun Nugraha");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));

  const [siswaSekolah, setSiswaSekolah] = useState([]);
  const [siswaShalat, setSiswaShalat] = useState([]);
  const [guruList, setGuruList] = useState([]);

  // Fetch siswa sekolah
  const fetchSiswaSekolah = async () => {
    try {
      const res = await fetch('/api/getSiswa', { cache: 'no-store' });
      const json = await res.json();
      setSiswaSekolah(json.siswa || []);
    } catch {
      setSiswaSekolah([]);
    }
  };

  // Fetch siswa shalat
  const fetchSiswaShalat = async () => {
    try {
      const res = await fetch('/api/getSiswa2', { cache: 'no-store' });
      const json = await res.json();
      setSiswaShalat(json.siswa || []);
    } catch {
      setSiswaShalat([]);
    }
  };

  // Fetch guru
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
      fetchGuru();
      fetchSiswaSekolah();
      fetchSiswaShalat();
    }
  }, []);

  const login = () => {
    const ADMIN_PASS = "1234";
    if (password === ADMIN_PASS) {
      localStorage.setItem('admin_ok', 'true');
      setLoggedIn(true);
      fetchGuru();
      fetchSiswaSekolah();
      fetchSiswaShalat();
    } else {
      alert('Password salah!');
    }
  };

  // Simpan siswa sekolah
  const simpanSiswaSekolah = async (list) => {
    const res = await fetch('/api/updateSiswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswa: list })
    });
    const json = await res.json();
    if (json.success) fetchSiswaSekolah();
    else alert('Gagal simpan siswa sekolah: ' + JSON.stringify(json.error || json));
  };

  // Simpan siswa shalat
  const simpanSiswaShalat = async (list) => {
    const res = await fetch('/api/updateSiswa2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswa: list })
    });
    const json = await res.json();
    if (json.success) fetchSiswaShalat();
    else alert('Gagal simpan siswa shalat: ' + JSON.stringify(json.error || json));
  };

  // Tambah & hapus siswa sekolah
  const tambahSiswaSekolah = async () => {
    const nama = prompt('Nama siswa baru (Sekolah):');
    if (!nama) return;
    const updated = [...siswaSekolah, { id: Date.now(), nama }];
    await simpanSiswaSekolah(updated);
  };
  const hapusSiswaSekolah = async (id) => {
    if (!confirm('Hapus siswa ini (Sekolah)?')) return;
    const updated = siswaSekolah.filter(s => s.id !== id);
    await simpanSiswaSekolah(updated);
  };

  // Tambah & hapus siswa shalat
  const tambahSiswaShalat = async () => {
    const nama = prompt('Nama siswa baru (Shalat):');
    if (!nama) return;
    const updated = [...siswaShalat, { id: Date.now(), nama }];
    await simpanSiswaShalat(updated);
  };
  const hapusSiswaShalat = async (id) => {
    if (!confirm('Hapus siswa ini (Shalat)?')) return;
    const updated = siswaShalat.filter(s => s.id !== id);
    await simpanSiswaShalat(updated);
  };

  // Simpan absensi sekolah & shalat
  const simpanAbsensiSekolah = async () => {
    const hasil = siswaSekolah.map(s => ({
      nama: s.nama,
      sekolah: document.querySelector(`input[name="sekolah_${s.id}"]:checked`)?.value || "Alpha"
    }));
    const data = { kelas, wali_kelas: wali, absensi: { [tanggal]: hasil } };

    const res = await fetch('/api/updateHasil2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) alert('Gagal simpan absensi sekolah: ' + JSON.stringify(json.error || json));
  };

  const simpanAbsensiShalat = async () => {
    const hasil = siswaShalat.map(s => ({
      nama: s.nama,
      shalat: document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak"
    }));
    const data = { kelas, wali_kelas: wali, absensi: { [tanggal]: hasil } };

    const res = await fetch('/api/updateHasil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) alert('Gagal simpan absensi shalat: ' + JSON.stringify(json.error || json));
  };

  // Manajemen guru
  const simpanGuru = async (list) => {
    const res = await fetch('/api/updateGuru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guru: list })
    });
    const json = await res.json();
    if (!json.success) alert('Gagal simpan guru: ' + JSON.stringify(json.error || json));
  };
  const tambahGuru = () => {
    const username = prompt('Masukkan username guru:');
    const pass = prompt('Masukkan password guru:');
    if (username && pass) {
      const updated = [...guruList, { username, password: pass }];
      setGuruList(updated);
      simpanGuru(updated);
    }
  };
  const hapusGuru = (username) => {
    if (confirm(`Hapus guru ${username}?`)) {
      const updated = guruList.filter(g => g.username !== username);
      setGuruList(updated);
      simpanGuru(updated);
    }
  };

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-xl font-bold">Login Admin</h2>
        <input
          type="password"
          className="border px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={login}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-6">
      <h2 className="text-3xl font-bold text-center mb-6">Panel Admin Absensi</h2>
      <div className="flex flex-col md:flex-row justify-center space-x-0 md:space-x-6 mb-6">
        <label className="flex flex-col mb-2">
          <span>Tanggal:</span>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-3 py-2 rounded bg-gray-800 text-white" />
        </label>
        <label className="flex flex-col mb-2">
          <span>Kelas:</span>
          <input value={kelas} onChange={e => setKelas(e.target.value)} className="px-3 py-2 rounded bg-gray-800 text-white" />
        </label>
        <label className="flex flex-col mb-2">
          <span>Wali Kelas:</span>
          <input value={wali} onChange={e => setWali(e.target.value)} className="px-3 py-2 rounded bg-gray-800 text-white" />
        </label>
      </div>

      {/* Absensi Sekolah */}
      <div className="bg-gray-900/70 p-4 rounded-lg shadow mb-6">
        <h3 className="text-xl font-bold text-blue-400 mb-3">Absensi Sekolah</h3>
        <button className="bg-green-500 px-4 py-2 rounded mb-4" onClick={tambahSiswaSekolah}>Tambah Siswa Sekolah</button>
        <table className="table-auto w-full text-white border">
          <thead>
            <tr className="bg-indigo-700">
              <th>No</th><th>Nama</th>
              <th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Dispen</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {siswaSekolah.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-700">
                <td>{i + 1}</td>
                <td>{s.nama}</td>
                {['Hadir', 'Izin', 'Sakit', 'Alpha', 'Dispen'].map(v => (
                  <td key={v}><input type="radio" name={`sekolah_${s.id}`} value={v} defaultChecked={v === 'Hadir'} /></td>
                ))}
                <td><button onClick={() => hapusSiswaSekolah(s.id)} className="bg-red-600 px-3 py-1 rounded">Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="bg-blue-500 px-5 py-2 rounded mt-3" onClick={simpanAbsensiSekolah}>Simpan Absensi Sekolah</button>
      </div>

      {/* Absensi Shalat */}
      <div className="bg-gray-900/70 p-4 rounded-lg shadow mb-6">
        <h3 className="text-xl font-bold text-purple-400 mb-3">Absensi Shalat</h3>
        <button className="bg-green-500 px-4 py-2 rounded mb-4" onClick={tambahSiswaShalat}>Tambah Siswa Shalat</button>
        <table className="table-auto w-full text-white border">
          <thead>
            <tr className="bg-purple-700">
              <th>No</th><th>Nama</th><th>Ya</th><th>Tidak</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {siswaShalat.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-700">
                <td>{i + 1}</td>
                <td>{s.nama}</td>
                <td><input type="radio" name={`shalat_${s.id}`} value="Ya" defaultChecked /></td>
                <td><input type="radio" name={`shalat_${s.id}`} value="Tidak" /></td>
                <td><button onClick={() => hapusSiswaShalat(s.id)} className="bg-red-600 px-3 py-1 rounded">Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="bg-blue-500 px-5 py-2 rounded mt-3" onClick={simpanAbsensiShalat}>Simpan Absensi Shalat</button>
      </div>

      {/* Manajemen Guru */}
      <div className="bg-gray-900/70 p-4 rounded-lg shadow">
        <h3 className="text-xl font-bold text-pink-400 mb-3">Manajemen Guru</h3>
        <button className="bg-green-500 px-4 py-2 rounded mb-4" onClick={tambahGuru}>Tambah Guru</button>
        <table className="table-auto w-full text-white border">
          <thead>
            <tr className="bg-pink-700">
              <th>Username</th><th>Password</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guruList.map((g, i) => (
              <tr key={i} className="border-t border-gray-700">
                <td>{g.username}</td>
                <td>{g.password}</td>
                <td><button onClick={() => hapusGuru(g.username)} className="bg-red-600 px-3 py-1 rounded">Hapus</button></td>
              </tr>
            ))}
            {guruList.length === 0 && (
              <tr><td colSpan="3" className="text-center text-gray-400">Belum ada guru</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
            }
