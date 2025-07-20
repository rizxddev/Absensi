export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya method POST yang diizinkan' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
  const OWNER = process.env.GITHUB_OWNER;       
  const REPO = process.env.GITHUB_REPO;         
  const PATH = 'public/siswa.json';             

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
    const fileData = await resp.json();
    const sha = fileData.sha || null;

    // Pastikan struktur JSON tetap { siswa: [...] }
    let newContent = req.body;
    if (!newContent.siswa) {
      newContent = { siswa: [] };
    }

    const encoded = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');

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
