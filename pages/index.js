import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaUserGraduate, FaUserShield, FaUsers } from 'react-icons/fa';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const openModal = (roleType) => {
    if (roleType === 'guru') {
      router.push('/guru');
    } else {
      setRole(roleType);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
  };

  const handleLogin = () => {
    const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const ADMIN2_PASS = process.env.NEXT_PUBLIC_ADMIN2_PASSWORD;

    if (role === 'admin') {
      if (password === ADMIN_PASS) {
        localStorage.setItem('admin_ok', 'true');
        router.push('/admin');
      } else {
        alert('Password Admin salah!');
      }
      closeModal();
    } else if (role === 'admin2') {
      if (password === ADMIN2_PASS) {
        localStorage.setItem('admin_ok', 'true');
        router.push('/admin2');
      } else {
        alert('Password Admin 2 salah!');
      }
      closeModal();
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      {/* Background efek bintang */}
      <div className="absolute inset-0 bg-[url('/stars.gif')] bg-cover opacity-30 animate-pulse"></div>

      {/* Card utama */}
      <div className="relative z-10 bg-gradient-to-br from-indigo-700/80 to-purple-800/80 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-indigo-400/50 backdrop-blur-md transform transition hover:scale-[1.02] hover:shadow-indigo-500/40 duration-500">
        <div className="text-6xl mb-4 animate-bounce">👑</div>
        <h1 className="text-3xl font-extrabold text-indigo-200 drop-shadow-lg mb-2">
          Sistem Absensi Sekolah
        </h1>
        <p className="text-gray-300 mb-8 text-sm">
          Pilih mode untuk melihat absensi atau login.
        </p>

        <div className="space-y-5">
          <button
            onClick={() => openModal('guru')}
            className="w-full flex items-center justify-center gap-3 py-4 text-lg rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 hover:from-indigo-600 hover:to-blue-600 shadow-xl hover:shadow-blue-500/50 transition-all duration-300"
          >
            <FaUserGraduate className="text-2xl" /> Lihat Absensi
          </button>

          <button
            onClick={() => openModal('admin')}
            className="w-full flex items-center justify-center gap-3 py-4 text-lg rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 hover:from-emerald-600 hover:to-green-600 shadow-xl hover:shadow-green-500/50 transition-all duration-300"
          >
            <FaUserShield className="text-2xl" /> Login Admin
          </button>

          <button
            onClick={() => openModal('admin2')}
            className="w-full flex items-center justify-center gap-3 py-4 text-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 hover:from-purple-700 hover:to-pink-600 shadow-xl hover:shadow-pink-500/50 transition-all duration-300"
          >
            <FaUsers className="text-2xl" /> Login Admin 2
          </button>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          © 2025 Sistem Absensi Sekolah by Rizky
        </p>
      </div>

      {/* Modal Login */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 animate-fadeIn">
          <div className="bg-gray-900/95 border border-indigo-400/50 p-6 rounded-2xl shadow-2xl w-80 animate-slideUp">
            <h2 className="text-xl font-bold text-center text-indigo-200 mb-4">
              🔒 {role === 'admin2' ? 'Login Admin 2' : 'Login Admin'}
            </h2>
            <input
              type="password"
              placeholder={`Password ${role === 'admin2' ? 'Admin 2' : 'Admin'}`}
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
                className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 hover:from-blue-600 hover:to-indigo-600 text-white py-2 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animasi tambahan */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
              }
