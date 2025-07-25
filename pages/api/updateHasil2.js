async function getFileContent(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const decoded = Buffer.from(data.content, 'base64').toString('utf8');
  return { sha: data.sha, json: JSON.parse(decoded) };
}

async function commitToGitHub({ owner, repo, path, token, content, sha, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, content: encoded, sha })
  });

  if (res.status === 200 || res.status === 201) {
    const result = await res.json();
    return { success: true, message: 'Absensi shalat berhasil disimpan!', commitSha: result.commit?.sha };
  }

  const error = await res.json();
  return { success: false, error };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST diizinkan' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/hasil2.json';

  try {
    const existingFile = await getFileContent(OWNER, REPO, PATH, GITHUB_TOKEN);
    let existing = { kelas: '', wali_kelas: '', absensi: {} };
    let sha = null;

    if (existingFile) {
      existing = existingFile.json;
      sha = existingFile.sha;
    }

    const { kelas, wali_kelas, absensi } = req.body;

    existing.kelas = kelas || existing.kelas;
    existing.wali_kelas = wali_kelas || existing.wali_kelas;
    if (!existing.absensi) existing.absensi = {};

    // Merge data lama + baru
    for (const tgl in absensi) {
      if (!existing.absensi[tgl]) existing.absensi[tgl] = [];
      const updated = [...existing.absensi[tgl]];

      absensi[tgl].forEach(newItem => {
        const idx = updated.findIndex(i => i.nama === newItem.nama);
        if (idx >= 0) updated[idx] = newItem;
        else updated.push(newItem);
      });

      existing.absensi[tgl] = updated;
    }

    const result = await commitToGitHub({
      owner: OWNER,
      repo: REPO,
      path: PATH,
      token: GITHUB_TOKEN,
      content: existing,
      sha,
      message: 'Update absensi shalat'
    });

    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
