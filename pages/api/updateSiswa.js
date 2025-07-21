async function getFile(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return await res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST diizinkan' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/siswa.json';

  try {
    // Ambil file lama dari GitHub (isi + sha)
    const fileData = await getFile(OWNER, REPO, PATH, GITHUB_TOKEN);
    const oldContent = fileData.content
      ? JSON.parse(Buffer.from(fileData.content, 'base64').toString())
      : { siswa: [] };
    const sha = fileData.sha;

    // Data baru dari request (bentuk { siswa: [...] })
    const newData = req.body;

    // Gabungkan data lama + baru, hapus duplikat berdasarkan id
    const combined = {
      siswa: [
        ...oldContent.siswa.filter(s => !newData.siswa.some(n => n.id === s.id)),
        ...newData.siswa
      ]
    };

    const contentEncoded = Buffer.from(JSON.stringify(combined, null, 2)).toString('base64');
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

    const save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Update siswa.json', content: contentEncoded, sha })
    });

    const result = await save.json();
    if (save.status === 200 || save.status === 201) {
      return res.status(200).json({ success: true, siswa: combined.siswa });
    }

    return res.status(save.status).json({ error: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
