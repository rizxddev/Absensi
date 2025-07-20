import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginGuru() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [guruList, setGuruList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Ambil daftar guru dari guru.json (disimpan di GitHub/public)
    fetch('/guru.json')
      .then(r => r.json())
      .then(json => setGuruList(json.guru || []));
  }, []);

  const handleLogin = () => {
    const found = guruList.find(
      g => g.username === username && g.password === password
    );
    if (found) {
      localStorage.setItem('guru_login', username); // simpan status login
      alert(`Selamat datang, ${username}!`);
      router.push('/guru'); // arahkan ke halaman guru
    } else {
      alert('Username atau password salah!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h2 className="text-2xl font-bold">Login Guru</h2>
      <input
        type="text"
        className="border px-3 py-2 w-64"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border px-3 py-2 w-64"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-5 py-2 rounded"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
}