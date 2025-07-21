import { useState, useEffect } from 'react';

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [kelas, setKelas] = useState("XI C");
  const [wali, setWali] = useState("Gungun Nugraha");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [siswa, setSiswa] = useState([]);
  const [guruList, setGuruList] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_ok');
    if (token) {
      setLoggedIn(true);
      // Ambil data guru
      fetch('/guru.json')
        .then(r => r.json())
        .then(json => setGuruList(json.guru || []))
        .catch(() => setGuruList([]));

      // Ambil daftar siswa dari file
      fetch('/siswa.json')
        .then(r => r.json())
        .then(json => setSiswa(json.siswa || []))
        .catch(() => setSiswa([]));
    }
  }, []);

  const login = () => {
    const ADMIN_PASS = "1234"; // bisa ganti sesuai keinginan
    if (password === ADMIN_PASS) {
      localStorage.setItem('admin_ok', 'true');
      setLoggedIn(true);
    } else {
      alert('Password salah!');
    }
  };

  // Simpan daftar siswa ke GitHub
  const simpanSiswa = async (list) => {
  const res = await fetch('/api/updateSiswa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siswa: list })
  });
  const json = await res.json();
  if (json.success) {
    alert('Daftar siswa berhasil disimpan!');
  } else {
    alert('Gagal simpan siswa: ' + JSON.stringify(json.error || json));
  }
};

  const tambahSiswa = () => {
  const nama = prompt('Nama siswa baru:');
  if (nama) {
    const updated = [...(siswa || []), { id: Date.now(), nama }];
    setSiswa(updated);
    simpanSiswa(updated);
  }
};

  const hapusSiswa = (id) => {
  if (confirm('Hapus siswa ini?')) {
    const updated = (siswa || []).filter(s => s.id !== id);
    setSiswa(updated);
    simpanSiswa(updated);
  }
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

  const simpanGuru = async (list) => {
    const res = await fetch('/api/updateGuru', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guru: list })
    });
    const json = await res.json();
    if (!json.success) {
      alert('Gagal simpan data guru: ' + JSON.stringify(json.error || json));
    }
  };

  const simpanAbsensi = async () => {
  const hasil = siswa.map(s => ({
    nama: s.nama,
    sekolah: document.querySelector(`input[name="sekolah_${s.id}"]:checked`)?.value || "Alpha",
    shalat: document.querySelector(`input[name="shalat_${s.id}"]:checked`)?.value || "Tidak"
  }));
  const dataExport = {
    kelas,
    wali_kelas: wali,
    absensi: { [tanggal]: hasil }
  };

  const res = await fetch('/api/updateHasil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataExport)
  });
  const json = await res.json();
  if (json.success) {
    alert(json.message || 'Absensi berhasil disimpan!');
  } else {
    alert('Gagal simpan absensi: ' + JSON.stringify(json.error || json));
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
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Panel Admin Absensi</h2>

      <div className="space-x-4 mb-4">
        <label>Tanggal: <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></label>
        <label>Kelas: <input className="border" value={kelas} onChange={e => setKelas(e.target.value)} /></label>
        <label>Wali Kelas: <input className="border" value={wali} onChange={e => setWali(e.target.value)} /></label>
      </div>

      <button className="bg-green-500 text-white px-4 py-2 rounded mb-4" onClick={tambahSiswa}>Tambah Siswa</button>

      <table className="table-auto w-full border mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th>No</th><th>Nama</th>
            <th colSpan={5}>Absen Sekolah</th>
            <th colSpan={2}>Absen Shalat</th>
            <th>Aksi</th>
          </tr>
          <tr className="bg-gray-100">
            <th></th><th></th>
            <th>Hadir</th> <th>Izin</th> <th>Sakit</th> <th>Alpha</th> <th>Dispen</th> 
            <th>Ya</th> <th>Tidak</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {siswa.map((s, i) => (
            <tr key={s.id} className="border-t">
              <td>{i + 1}</td>
              <td>{s.nama}</td>
              <td><input type="radio" name={`sekolah_${s.id}`} value="Hadir" defaultChecked /></td>
              <td><input type="radio" name={`sekolah_${s.id}`} value="Izin" /></td>
              <td><input type="radio" name={`sekolah_${s.id}`} value="Sakit" /></td>
              <td><input type="radio" name={`sekolah_${s.id}`} value="Alpha" /></td>
              <td><input type="radio" name={`sekolah_${s.id}`} value="Dispen" /></td>
              <td><input type="radio" name={`shalat_${s.id}`} value="Ya" defaultChecked /></td>
              <td><input type="radio" name={`shalat_${s.id}`} value="Tidak" /></td>
              <td>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => hapusSiswa(s.id)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="bg-blue-600 text-white px-5 py-2 rounded" onClick={simpanAbsensi}>Simpan Absensi</button>

      <div className="mt-10">
        <h3 className="text-xl font-bold mb-3">Manajemen Guru</h3>
        <button className="bg-green-500 text-white px-4 py-2 rounded mb-3" onClick={tambahGuru}>Tambah Guru</button>
        <table className="table-auto w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th>Username</th>
              <th>Password</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guruList.length === 0 ? (
              <tr><td colSpan={3} className="text-center">Belum ada guru</td></tr>
            ) : (
              guruList.map((g, idx) => (
                <tr key={idx} className="border-t">
                  <td>{g.username}</td>
                  <td>{g.password}</td>
                  <td>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => hapusGuru(g.username)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
    }
