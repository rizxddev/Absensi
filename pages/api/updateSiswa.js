export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya method POST yang diizinkan' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // isi di Vercel
  const OWNER = 'rizxddev';       // nama github
  const REPO = 'Absensi';         // nama repo
  const PATH = 'public/siswa.json';             // simpan di folder public

  try {
    // Ambil sha file lama untuk update
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
    const fileData = await resp.json();
    const sha = fileData.sha || null;

    // Encode data siswa jadi Base64 untuk commit ke GitHub
    const encoded = Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64');

    const save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update daftar siswa',
        content: encoded,
        sha
      })
    });

    const result = await save.json();
    if (save.status === 200 || save.status === 201) {
      return res.status(200).json({ success: true, commit: result.commit });
    }

    return res.status(400).json({ error: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
