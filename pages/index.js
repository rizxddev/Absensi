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

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function to format date like example
  const formatNotificationDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
  };

  // Load disclaimer from API
  useEffect(() => {
    const loadDisclaimer = async () => {
      setIsLoadingDisclaimer(true);
      try {
        const response = await fetch('/api/getDisclaimer', {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setDisclaimerText(result.data.text);
            localStorage.setItem('disclaimer_text', result.data.text);
          }
        } else {
          throw new Error('API Error');
        }
      } catch (error) {
        console.log('Using fallback disclaimer');
        const localDisclaimer = localStorage.getItem('disclaimer_text');
        const defaultText = `DILARANG KERAS MENG COPY-PASTE TEKS ABSENSI KITA!
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
        
        // Check disclaimer status with date-based logic
        const today = getTodayDate();
        const lastAgreedDate = localStorage.getItem('disclaimer_last_agreed_date');
        const dontShowAgainDate = localStorage.getItem('dont_show_disclaimer_until');
        
        let shouldShowDisclaimer = true;
        
        // Check "Don't show again" option (expires at end of day)
        if (dontShowAgainDate === today) {
          shouldShowDisclaimer = false;
        }
        // Check if useagreed today
        else if (lastAgreedDate === today) {
          shouldShowDisclaimer = false;
        }
        
        if (shouldShowDisclaimer) {
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
    const today = getTodayDate();
    
    if (dontShowAgain) {
      // Set "don't show again" only for today
      localStorage.setItem('dont_show_disclaimer_until', today);
    } else {
      // User agreed today
      localStorage.setItem('disclaimer_last_agreed_date', today);
    }
    
    // Also store the timestamp for tracking
    localStorage.setItem('disclaimer_last_interaction', new Date().toISOString());
    
    setShowDisclaimer(false);
  };

  // Format disclaimer text for display
  const formatDisclaimerContent = (text) => {
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} style={{ height: '1em' }}></div>;
      }
      
      // Check for special lines
      if (line.includes('📱') || line.includes('💡') || line.includes('✨')) {
        return (
          <div key={index} className="font-bold text-lg mt-4 mb-2 text-blue-800">
            {line}
          </div>
        );
      }
      
      if (line.includes('•')) {
        return (
          <div key={index} className="ml-6 mb-2 flex items-start">
            <span className="mr-2 text-blue-600">•</span>
            <span className="text-gray-700">{line.substring(1)}</span>
          </div>
        );
      }
      
      // Check for warning lines
      if (line.includes('DILARANG KERAS')) {
        return (
          <div key={index} className="font-bold text-red-600 text-lg mb-3">
            ⚠️ {line}
          </div>
        );
      }
      
      if (line.includes('MINIMAL CREATIVE')) {
        return (
          <div key={index} className="font-bold text-orange-600 mb-3">
            {line}
          </div>
        );
      }
      
      if (line.includes('Sistem ini dibuat')) {
        return (
          <div key={index} className="text-gray-700 mb-3 flex items-center">
            <span className="text-red-500 mr-2">❤️</span>
            {line}
          </div>
        );
      }
      
      // Regular text
      return (
        <div key={index} className="text-gray-700 mb-3 leading-relaxed">
          {line}
        </div>
      );
    });
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

        {/* Disclaimer Modal - New Design Like Example */}
        {showDisclaimer && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-slideUp border border-gray-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
                <h1 className="text-2xl font-bold mb-1">Pusat Pemberitahuan</h1>
                <p className="text-blue-100 text-sm">
                  Berikut adalah semua pesan dan pemberitahuan untuk Anda.
                </p>
              </div>
              
              {/* Modal Content */}
              <div className="p-5">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    ⚠️ PENTING
                  </h2>
                  
                  <div className="bg-gray-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r">
                    <div className="text-gray-700">
                      {formatDisclaimerContent(disclaimerText)}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-500 text-2xl">💡</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Ingat ya!
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Dengan menekan "Mengerti", Anda telah menyetujui ketentuan di atas😉.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Diterima: {formatNotificationDate()}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        🔒 Hak Cipta Dilindungi
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-5 border-t border-gray-200">
                  <button
                    onClick={() => handleAgreeDisclaimer(true)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Jangan Tampilkan Lagi Hari Ini
                  </button>
                  <button
                    onClick={() => handleAgreeDisclaimer(false)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-sm"
                  >
                    ✅ Saya Mengerti
                  </button>
                </div>
                
                {/* Footer Note */}
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>Disclaimer ini akan muncul lagi besok. Klik "Jangan Tampilkan Lagi Hari Ini" untuk menyembunyikan hanya hari ini.</p>
                </div>
              </div>
              
              {/* Modal Footer Decoration */}
              <div className="bg-gray-50 p-3 border-t border-gray-200">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <span className="mr-2">📌</span>
                  <span>Sistem Absensi Sekolah • © 2025 RizzDev</span>
                </div>
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
        
        /* Smooth scrolling and selection */
        html {
          scroll-behavior: smooth;
        }
        ::selection {
          background: rgba(37, 99, 235, 0.3);
          color: white;
        }
        
        /* Remove any triangle images */
        img[src*="triangle"], 
        img[alt*="triangle"],
        img[src*="segitiga"],
        img[alt*="segitiga"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
