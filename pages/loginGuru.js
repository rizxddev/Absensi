import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginGuru() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guruList, setGuruList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/guru.json')
      .then(r => r.json())
      .then(json => setGuruList(json.guru || []));
  }, []);

  const handleLogin = () => {
    const found = guruList.find(
      g => g.username === username && g.password === password
    );
    if (found) {
      localStorage.setItem('guru_login', username);
      router.push('/guru');
    } else {
      alert('Username atau password salah!');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">Login Guru</h2>
        <div className="space-y-4">
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
        <p className="mt-4 text-center text-gray-500 text-sm">
          Sistem Absensi Sekolah © 2025
        </p>
      </div>
    </div>
  );
}
