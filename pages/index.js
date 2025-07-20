import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guruList, setGuruList] = useState([]);
  const router = useRouter();

  // Ambil daftar guru untuk login guru
  useEffect(() => {
    fetch('/guru.json')
      .then(r => r.json())
      .then(json => setGuruList(json.guru || []));
  }, []);

  const openModal = (roleType) => {
    setRole(roleType);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setUsername('');
    setPassword('');
  };

  const handleLogin = () => {
    if (role === 'admin') {
      if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        localStorage.setItem('admin_ok', 'true');
        router.push('/admin');
      } else {
        alert('Password admin salah!');
      }
    } else if (role === 'guru') {
      const found = guruList.find(g => g.username === username && g.password === password);
      if (found) {
        localStorage.setItem('guru_login', username);
        router.push('/guru');
      } else {
        alert('Username atau password guru salah!');
      }
    }
    closeModal();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-300">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">
          Sistem Absensi Sekolah
        </h1>
        <p className="text-gray-600 mb-6">
          Pilih untuk login sebagai Admin atau Guru.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => openModal('guru')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors text-lg"
          >
            Login Guru
          </button>
          <button
            onClick={() => openModal('admin')}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors text-lg"
          >
            Login Admin
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          © 2025 Sistem Absensi Sekolah by Rizky
        </p>
      </div>

      {/* Modal Login (Pop-up) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 animate-fadeIn">
            <h2 className="text-xl font-bold text-center text-indigo-700 mb-4">
              {role === 'admin' ? 'Login Admin' : 'Login Guru'}
            </h2>

            {/* Username hanya untuk Guru */}
            {role === 'guru' && (
              <input
                type="text"
                placeholder="Username"
                className="w-full border rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            )}

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {/* Tombol */}
            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
