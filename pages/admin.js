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

  const fetchSiswa = async (target) => {
    try {
      const res = await fetch('/api/getSiswa', { cache: 'no-store' });
      const json = await res.json();
      if (target === 'sekolah') setSiswaSekolah(json.siswa || []);
      if (target === 'shalat') setSiswaShalat(json.siswa || []);
    } catch {
      if (target === 'sekolah') setSiswaSekolah([]);
      if (target === 'shalat') setSiswaShalat([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (token) {
      setLoggedIn(true);
      fetch('/guru.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(json => setGuruList(json.guru || []))
        .catch(() => setGuruList([]));
      fetchSiswa('sekolah');
      fetchSiswa('shalat');
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

  const simpanSiswa = async (list, target) => {
    const res = await fetch('/api/updateSiswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswa: list })
    });
    const json = await res.json();
    if (json.success) {
      fetchSiswa(target);
    } else {
      alert('Gagal simpan siswa: ' + JSON.stringify(json.error || json));
    }
  };

  const tambahSiswa = (target) => {
    const nama = prompt(`Nama siswa baru untuk absen ${target}:`);
    if (!nama) return;
    const updated = (target === 'sekolah' ? siswaSekolah : siswaShalat).concat({ id: Date.now(), nama });
    if (target === 'sekolah') setSiswaSekolah(updated);
    else setSiswaShalat(updated);
    simpanSiswa(updated, target);
  };

  const hapusSiswa = (id, target) => {
    if (!confirm('Hapus siswa ini?')) return;
    const updated = (target === 'sekolah' ? siswaSekolah : siswaShalat).filter(s => s.id !== id);
    if (target === 'sekolah') setSiswaSekolah(updated);
    else setSiswaShalat(updated);
    simpanSiswa(updated, target);
  };

  const simpanAbsensi = async (target) => {
    const siswaList = target === 'sekolah' ? siswaSekolah : siswaShalat;

    const hasil = siswaList.map(s => ({
      nama: s.nama,
      value: document.querySelector(`input[name="${target}_${s.id}"]:checked`)?.value || (target === 'sekolah' ? "Alpha" : "Tidak")
    }));

    const dataExport = {
      kelas,
      wali_kelas: wali,
      absensi: { [tanggal]: hasil }
    };

    const apiUrl = target === 'sekolah' ? '/api/updateHasil2' : '/api/updateHasil';

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataExport)
    });
    const json = await res.json();
    if (!json.success) {
      alert(`Gagal simpan absensi ${target}: ` + JSON.stringify(json.error || json));
    } else {
      alert(`Absensi ${target} berhasil disimpan!`);
    }
  };

  const tambahGuru = () => {
    const username = prompt('Masukkan username guru:');
    const pass = prompt('Masukkan password guru:');
    if (username && pass) {
      const updated = [...guruList, { username, password: pass }];
      setGuruList(updated);
      fetch('/api/updateGuru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guru: updated })
      });
    }
  };

  const hapusGuru = (username) => {
    if (!confirm(`Hapus guru ${username}?`)) return;
    const updated = guruList.filter(g => g.username !== username);
    setGuruList(updated);
    fetch('/api/updateGuru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guru: updated })
    });
  };

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-white bg-gradient-to-br from-gray-900 to-indigo-900">
        <h2 className="text-xl font-bold">Login Admin</h2>
        <input
          type="password"
          className="border px-3 py-2 rounded bg-gray-800 text-white"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={login}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-indigo-200 mb-4">Panel Admin Absensi</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex flex-col">Tanggal: <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="bg-gray-800 text-white rounded px-3 py-1" /></label>
          <label className="flex flex-col">Kelas: <input value={kelas} onChange={e => setKelas(e.target.value)} className="bg-gray-800 text-white rounded px-3 py-1" /></label>
          <label className="flex flex-col">Wali Kelas: <input value={wali} onChange={e => setWali(e.target.value)} className="bg-gray-800 text-white rounded px-3 py-1" /></label>
        </div>

        {/* Absensi Sekolah */}
        <div className="bg-gray-900/80 rounded-xl p-4 border border-indigo-500 shadow-lg">
          <h3 className="text-xl font-bold text-indigo-300 mb-3">Absensi Sekolah</h3>
          <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white mb-4" onClick={() => tambahSiswa('sekolah')}>Tambah Siswa Sekolah</button>
          <table className="table-auto w-full border border-gray-700 rounded">
            <thead>
              <tr className="bg-indigo-700">
                <th>No</th><th>Nama</th>
                <th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th><th>Dispen</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaSekolah.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-600">
                  <td>{i + 1}</td>
                  <td>{s.nama}</td>
                  {['Hadir','Izin','Sakit','Alpha','Dispen'].map(v => (
                    <td key={v}><input type="radio" name={`sekolah_${s.id}`} value={v} defaultChecked={v==='Hadir'} /></td>
                  ))}
                  <td><button className="bg-red-600 px-3 py-1 rounded" onClick={() => hapusSiswa(s.id,'sekolah')}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" onClick={() => simpanAbsensi('sekolah')}>Simpan Absensi Sekolah</button>
        </div>

        {/* Absensi Shalat */}
        <div className="bg-gray-900/80 rounded-xl p-4 border border-purple-500 shadow-lg">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Absensi Shalat</h3>
          <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white mb-4" onClick={() => tambahSiswa('shalat')}>Tambah Siswa Shalat</button>
          <table className="table-auto w-full border border-gray-700 rounded">
            <thead>
              <tr className="bg-purple-700">
                <th>No</th><th>Nama</th>
                <th>Ya</th><th>Tidak</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswaShalat.map((s, i) => (
                <tr key={s.id} className="border-t border-gray-600">
                  <td>{i + 1}</td>
                  <td>{s.nama}</td>
                  {['Ya','Tidak'].map(v => (
                    <td key={v}><input type="radio" name={`shalat_${s.id}`} value={v} defaultChecked={v==='Ya'} /></td>
                  ))}
                  <td><button className="bg-red-600 px-3 py-1 rounded" onClick={() => hapusSiswa(s.id,'shalat')}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded" onClick={() => simpanAbsensi('shalat')}>Simpan Absensi Shalat</button>
        </div>

        {/* Manajemen Guru */}
        <div className="bg-gray-900/70 rounded-xl p-4 border border-pink-500 shadow-md mt-8">
          <h3 className="text-xl font-bold text-pink-300 mb-3">Manajemen Guru</h3>
          <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white mb-4" onClick={tambahGuru}>Tambah Guru</button>
          <table className="table-auto w-full border border-gray-700 rounded">
            <thead className="bg-pink-700">
              <tr><th>Username</th><th>Password</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {guruList.map((g, i) => (
                <tr key={i} className="border-t border-gray-600">
                  <td>{g.username}</td>
                  <td>{g.password}</td>
                  <td><button className="bg-red-600 px-3 py-1 rounded" onClick={() => hapusGuru(g.username)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
    }
