async function getLatestSha(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.sha || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST diizinkan' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/siswa2.json';

  try {
    // Ambil SHA terbaru dulu
    let sha = await getLatestSha(OWNER, REPO, PATH, GITHUB_TOKEN);
    const contentEncoded = Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64');
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

    // Coba simpan pertama
    let save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Update data siswa', content: contentEncoded, sha })
    });

    // Jika konflik (409), ambil SHA terbaru dan simpan ulang
    if (save.status === 409) {
      sha = await getLatestSha(OWNER, REPO, PATH, GITHUB_TOKEN);
      save = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Retry update data siswa', content: contentEncoded, sha })
      });
    }

    const result = await save.json();

    if (save.status === 200 || save.status === 201) {
      return res.status(200).json({
        success: true,
        message: 'Data siswa berhasil disimpan!',
        commitSha: result.commit?.sha
      });
    } else {
      return res.status(save.status).json({ error: result });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
