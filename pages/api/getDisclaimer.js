// pages/api/getDisclaimer.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Hanya method GET yang diizinkan' 
    });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/data/disclaimer.json';

  // Fallback jika file tidak ada
  const defaultDisclaimer = {
    text: "⚠️ **DISCLAIMER!!** ⚠️\n\nDILARANG KERAS MENG COPY-PASTE TEKS ABSENSI KITA!\nMINIMAL CREATIVE LAH BOSS!\n\nSistem ini dibuat dengan ❤️ oleh Rizky.\nHargai karya orang lain dengan tidak menyalin mentah-mentah.\n\nJika butuh sistem serupa, kontak developer untuk kolaborasi!",
    version: 1,
    last_updated: new Date().toISOString()
  };

  try {
    if (!GITHUB_TOKEN || !OWNER || !REPO) {
      console.warn('GitHub config tidak lengkap, menggunakan default disclaimer');
      return res.status(200).json({
        success: true,
        data: defaultDisclaimer,
        source: 'default'
      });
    }

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Sistem-Absensi-App'
      },
      // Cache untuk 5 menit
      next: { revalidate: 300 }
    });

    // Jika file tidak ditemukan, return default
    if (response.status === 404) {
      return res.status(200).json({
        success: true,
        data: defaultDisclaimer,
        source: 'default_fallback',
        message: 'File disclaimer tidak ditemukan, menggunakan default'
      });
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const decoded = Buffer.from(data.content, 'base64').toString('utf8');
    const disclaimerData = JSON.parse(decoded);

    // Validasi struktur data
    if (!disclaimerData.text) {
      disclaimerData.text = defaultDisclaimer.text;
    }

    return res.status(200).json({
      success: true,
      data: disclaimerData,
      source: 'github',
      metadata: {
        sha: data.sha,
        size: data.size,
        last_modified: data.sha ? new Date().toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error fetching disclaimer:', error);
    
    // Return default pada error
    return res.status(200).json({
      success: true,
      data: defaultDisclaimer,
      source: 'error_fallback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
