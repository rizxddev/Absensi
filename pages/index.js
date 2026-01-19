import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDisclaimer, setIsLoadingDisclaimer] = useState(true);
  const router = useRouter();

  // Load disclaimer from API
  useEffect(() => {
    const loadDisclaimer = async () => {
      setIsLoadingDisclaimer(true);
      try {
        // Try to fetch from API
        const response = await fetch('/api/getDisclaimer', {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDisclaimerText(result.data.text);
            localStorage.setItem('disclaimer_text', result.data.text);
            localStorage.setItem('disclaimer_source', result.source || 'api');
            localStorage.setItem('disclaimer_version', result.data.version || 1);
          }
        } else {
          throw new Error('API Error');
        }
      } catch (error) {
        console.log('Using fallback disclaimer');
        // Fallback to localStorage or default
        const localDisclaimer = localStorage.getItem('disclaimer_text');
        const defaultText = `⚠️ **DISCLAIMER PENTING** ⚠️

DILARANG KERAS MENG COPY-PASTE TEKS ABSENSI KITA!
MINIMAL CREATIVE LAH BOSS!

Sistem ini dibuat dengan ❤️ oleh Rizky.
Hargai karya orang lain dengan tidak menyalin mentah-mentah.

Jika butuh sistem serupa, kontak developer untuk kolaborasi!

📱 Contact: 
• Instagram: @rizkyh358
• WhatsApp: 0838-6116-3950
• Email: rizxddev@gmail.com

💡 Tips:
• Buat sistem sendiri dengan kreativitas
• Belajar coding untuk masa depan
• Dukung karya anak bangsa

✨ Semoga menjadi pribadi yang lebih baik dan kreatif!`;
        
        setDisclaimerText(localDisclaimer || defaultText);
        
        if (!localDisclaimer) {
          localStorage.setItem('disclaimer_text', defaultText);
        }
      } finally {
        setIsLoadingDisclaimer(false);
        
        // Check if user has agreed before
        const hasAgreed = localStorage.getItem('disclaimer_agreed');
        const dontShowAgain = localStorage.getItem('dont_show_disclaimer_again');
        
        // Show disclaimer only if user hasn't agreed AND hasn't chosen "Don't show again"
        if (!hasAgreed && dontShowAgain !== 'true') {
          // Show after 1 second
          setTimeout(() => {
            setShowDisclaimer(true);
          }, 1000);
        }
      }
    };
    
    loadDisclaimer();
  }, []);

  const openModal = (roleType) => {
    if (roleType === 'guru') {
      setIsLoading(true);
      setTimeout(() => {
        router.push('/guru');
      }, 800);
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
    setIsLoading(true);
    const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const ADMIN2_PASS = process.env.NEXT_PUBLIC_ADMIN2_PASSWORD;

    setTimeout(() => {
      if (role === 'admin') {
        if (password === ADMIN_PASS) {
          localStorage.setItem('admin_ok', 'true');
          router.push('/admin');
        } else {
          alert('Password Admin salah!');
          setIsLoading(false);
        }
      } else if (role === 'admin2') {
        if (password === ADMIN2_PASS) {
          localStorage.setItem('admin_ok', 'true');
          router.push('/admin2');
        } else {
          alert('Password Admin 2 salah!');
          setIsLoading(false);
        }
      }
      closeModal();
    }, 800);
  };

  const handleAgreeDisclaimer = (dontShowAgain = false) => {
    localStorage.setItem('disclaimer_agreed', 'true');
    localStorage.setItem('disclaimer_agreed_at', new Date().toISOString());
    
    if (dontShowAgain) {
      localStorage.setItem('dont_show_disclaimer_again', 'true');
    }
    
    setShowDisclaimer(false);
  };

  const formatDisclaimerText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br/>';
        if (line.includes('⚠️')) return `<div class="text-2xl text-center mb-4">${line}</div>`;
        if (line.includes('📱') || line.includes('💡') || line.includes('✨')) {
          return `<div class="font-bold text-yellow-300 mt-4 mb-2">${line}</div>`;
        }
        if (line.includes('•')) {
          return `<div class="ml-4 flex items-start gap-2"><span class="text-yellow-400">•</span>${line.substring(1)}</div>`;
        }
        return `<div class="mb-2">${line}</div>`;
      })
      .join('');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* Loading for Disclaimer */}
      {isLoadingDisclaimer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent border-t-amber-500 border-r-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Loading system...</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-center min-h-screen p-4">
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 max-w-md w-full text-center transform transition-all duration-500 hover:scale-[1.02]">
          {/* Decorative Corner Accents */}
          <div className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-indigo-400 rounded-tl-2xl"></div>
          <div className="absolute -top-2 -right-2 w-12 h-12 border-t-2 border-r-2 border-purple-400 rounded-tr-2xl"></div>
          <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-2 border-l-2 border-blue-400 rounded-bl-2xl"></div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl"></div>

          {/* Logo/Icon with Animation */}
          <div className="relative mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative text-6xl mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-float-slow">
                👑
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-3 drop-shadow-lg">
              SISTEM ABSENSI
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-300 text-sm tracking-wide">
              Portal Digital Absensi Sekolah Modern
            </p>
          </div>

          {/* Role Selection Buttons */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => openModal('guru')}
              disabled={isLoading}
              className="group relative w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-400/30 backdrop-blur-sm transition-all duration-300 hover:shadow-blue-500/30 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl">📊</span>
                <span className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  Lihat Absensi
                </span>
                <span className="ml-auto text-blue-300 group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </button>

            <button
              onClick={() => openModal('admin')}
              disabled={isLoading}
              className="group relative w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-400/30 backdrop-blur-sm transition-all duration-300 hover:shadow-emerald-500/30 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl">🔐</span>
                <span className="text-lg font-semibold bg-gradient-to-r from-emerald-200 to-green-200 bg-clip-text text-transparent">
                  Login Admin
                </span>
                <span className="ml-auto text-emerald-300 group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </button>

            <button
              onClick={() => openModal('admin2')}
              disabled={isLoading}
              className="group relative w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 backdrop-blur-sm transition-all duration-300 hover:shadow-purple-500/30 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl">⚡</span>
                <span className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Login Admin 2
                </span>
                <span className="ml-auto text-purple-300 group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 tracking-wide">
              © 2025 <span className="text-transparent bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text font-semibold">Sistem Absensi Sekolah</span>
              <br />
              <span className="text-gray-500 text-xs mt-1 block">by Rizky</span>
            </p>
          </div>
        </div>

        {/* Disclaimer Modal */}
        {showDisclaimer && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-60 animate-fadeIn">
            <div className="relative bg-gradient-to-br from-amber-900/90 via-orange-900/90 to-red-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-amber-400/50 max-w-2xl w-full mx-4 animate-slideUp">
              {/* Decorative Elements */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="text-4xl animate-bounce">⚠️</div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent mb-3">
                  ⚠️ DISCLAIMER PENTING ⚠️
                </h2>
                <div className="w-48 h-1 bg-gradient-to-r from-amber-500 to-red-500 mx-auto rounded-full mb-4"></div>
              </div>

              <div className="bg-black/30 p-6 rounded-2xl border border-amber-500/30 mb-6 max-h-96 overflow-y-auto">
                <div 
                  className="text-white text-lg whitespace-pre-line leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: formatDisclaimerText(disclaimerText) }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleAgreeDisclaimer(false)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">✅</span>
                  Saya Setuju & Mengerti
                </button>
                
                <button
                  onClick={() => handleAgreeDisclaimer(true)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600 text-gray-300 font-medium transition-all duration-300"
                >
                  Jangan Tampilkan Lagi
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-amber-300/70 text-sm">
                  🔒 Data absensi dilindungi hak cipta © RizzDev
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 animate-fadeIn">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Loading...</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Login */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 animate-fadeIn">
            <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-96 animate-slideUp">
              {/* Modal Decorative Elements */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              
              <div className="text-center mb-6">
                <div className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  {role === 'admin2' ? 'Admin 2 Access' : 'Admin Access'}
                </h2>
                <p className="text-gray-400 text-sm mt-2">Masukkan password untuk melanjutkan</p>
              </div>

              <input
                type="password"
                placeholder={`Enter ${role === 'admin2' ? 'Admin 2' : 'Admin'} Password`}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white transition-all duration-300 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(5deg); }
          66% { transform: translateY(10px) rotate(-5deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        
        /* Custom scrollbar for disclaimer */
        .bg-black\\/30::-webkit-scrollbar {
          width: 8px;
        }
        .bg-black\\/30::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .bg-black\\/30::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #f59e0b, #dc2626);
          border-radius: 4px;
        }
        
        /* Smooth scrolling and selection */
        html {
          scroll-behavior: smooth;
        }
        ::selection {
          background: rgba(245, 158, 11, 0.5);
          color: white;
        }
        
        /* Custom styles for disclaimer text */
        .disclaimer-strong {
          font-weight: bold;
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
}
