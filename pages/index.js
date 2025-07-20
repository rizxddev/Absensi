import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guruList, setGuruList] = useState([]);
  const router = useRouter();

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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white relative">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-indigo-400/50 backdrop-blur-md">
        <div className="text-5xl mb-4 animate-pulse">👑</div>
        <h1 className="text-3xl font-bold text-indigo-200 drop-shadow-lg mb-2">
          Sistem Absensi Sekolah
        </h1>
        <p className="text-gray-300 mb-6">
          Pilih untuk login sebagai Admin atau Guru.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => openModal('guru')}
            className="w-full py-3 text-lg rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-600 hover:to-blue-600 shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
          >
            Login Guru
          </button>
          <button
            onClick={() => openModal('admin')}
            className="w-full py-3 text-lg rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-green-500/50 transition-all duration-300"
          >
            Login Admin
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          © 2025 Sistem Absensi Sekolah by Rizky
        </p>
      </div>

      {/* Modal Login */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 animate-fadeIn">
          <div className="bg-gray-900 border border-indigo-400/50 p-6 rounded-2xl shadow-2xl w-80 animate-slideUp">
            <h2 className="text-xl font-bold text-center text-indigo-200 mb-4">
              {role === 'admin' ? '🔒 Login Admin' : '👩‍🏫 Login Guru'}
            </h2>

            {/* Username hanya untuk Guru */}
            {role === 'guru' && (
              <input
                type="text"
                placeholder="Username Guru"
                className="w-full border border-indigo-400 rounded-lg px-3 py-2 mb-3 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            )}
            <input
              type="password"
              placeholder={role === 'admin' ? 'Password Admin' : 'Password Guru'}
              className="w-full border border-indigo-400 rounded-lg px-3 py-2 mb-4 bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-blue-600 hover:to-indigo-600 text-white py-2 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animasi tambahan di global.css */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
      }
