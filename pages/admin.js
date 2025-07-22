import { useState, useEffect } from 'react';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Gungun Nugraha");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));

  // Pisah state untuk sekolah & shalat
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

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (token) {
      setLoggedIn(true);

      // Guru
      fetch('/guru.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(json => setGuruList(json.guru || []))
        .catch(() => setGuruList([]));

      // Ambil data siswa
      fetchSiswaSekolah();
      fetchSiswaShalat();
    }
  }, []);

  const login = () => {
    if (password === "1234") {
      localStorage.setItem('admin_ok', 'true');
      setLoggedIn(true);
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

  const tambahSiswaSekolah = async () => {
    const nama = prompt('Nama siswa baru (Sekolah):');
    if (!nama) return;
    await simpanSiswaSekolah([...siswaSekolah, { id: Date.now(), nama }]);
  };

  const tambahSiswaShalat = async () => {
    const nama = prompt('Nama siswa baru (Shalat):');
    if (!nama) return;
    await simpanSiswaShalat([...siswaShalat, { id: Date.now(), nama }]);
  };

  const hapusSiswaSekolah = async (id) => {
    if (!confirm('Hapus siswa ini dari absensi sekolah?')) return;
    await simpanSiswaSekolah(siswaSekolah.filter(s => s.id !== id));
  };

  const hapusSiswaShalat = async (id) => {
    if (!confirm('Hapus siswa ini dari absensi shalat?')) return;
    await simpanSiswaShalat(siswaShalat.filter(s => s.id !== id));
  };

  // Simpan absensi sekolah (hasil2.json)
  const simpanAbsensiSekolah = async () => {
    const hasil = siswaSekolah.map(s => ({
      nama: s.nama,
      sekolah: document.querySelector(`input[name="sekolah_${s.id}"]:checked`)?.value || "Alpha"
    }));
    const res = await fetch('/api/updateHasil2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas, wali_kelas: wali, absensi: { [tanggal]: hasil } })
    });
    const json = await res.json();
    if (!json.success) alert('Gagal simpan absensi sekolah: ' + JSON.stringify(json.error || json));
  };

  // Simpan absensi shalat (hasil.json)
  const simpanAbsensiShalat = async () => {
    const hasil = siswaShalat.map(s => ({
      nama: s.nama,
      shalat: document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak"
    }));
    const res = await fetch('/api/updateHasil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas, wali_kelas: wali, absensi: { [tanggal]: hasil } })
    });
    const json = await res.json();
    if (!json.success) alert('Gagal simpan absensi shalat: ' + JSON.stringify(json.error || json));
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
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={login}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold mb-4">Panel Admin Absensi</h2>

        <div className="flex space-x-4 mb-6">
          <label>Tanggal: <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="text-black" /></label>
          <label>Kelas: <input className="border text-black" value={kelas} onChange={e => setKelas(e.target.value)} /></label>
          <label>Wali Kelas: <input className="border text-black" value={wali} onChange={e => setWali(e.target.value)} /></label>
        </div>

        {/* Tabel Absensi Sekolah */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-xl font-bold mb-3">Absensi Sekolah</h3>
          <button className="bg-green-500 px-4 py-2 rounded mb-3" onClick={tambahSiswaSekolah}>Tambah Siswa Sekolah</button>
          <table className="table-auto w-full text-white">
            <thead>
              <tr className="bg-indigo-600">
                <th>No</th><th>Nama</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Dispen</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaSekolah.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.nama}</td>
                  {['Hadir','Izin','Sakit','Alpha','Dispen'].map(opt => (
                    <td key={opt}><input type="radio" name={`sekolah_${s.id}`} value={opt} defaultChecked={opt === 'Hadir'} /></td>
                  ))}
                  <td><button className="bg-red-500 px-3 py-1 rounded" onClick={() => hapusSiswaSekolah(s.id)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="bg-blue-500 px-4 py-2 rounded mt-4" onClick={simpanAbsensiSekolah}>Simpan Absensi Sekolah</button>
        </div>

        {/* Tabel Absensi Shalat */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-xl font-bold mb-3">Absensi Shalat</h3>
          <button className="bg-green-500 px-4 py-2 rounded mb-3" onClick={tambahSiswaShalat}>Tambah Siswa Shalat</button>
          <table className="table-auto w-full text-white">
            <thead>
              <tr className="bg-indigo-600">
                <th>No</th><th>Nama</th><th>Ya</th><th>Tidak</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaShalat.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.nama}</td>
                  <td><input type="radio" name={`shalat_${s.id}`} value="Ya" defaultChecked /></td>
                  <td><input type="radio" name={`shalat_${s.id}`} value="Tidak" /></td>
                  <td><button className="bg-red-500 px-3 py-1 rounded" onClick={() => hapusSiswaShalat(s.id)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="bg-blue-500 px-4 py-2 rounded mt-4" onClick={simpanAbsensiShalat}>Simpan Absensi Shalat</button>
        </div>
      </div>
    </div>
  );
                                                                               }
