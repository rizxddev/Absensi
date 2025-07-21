async function getLatestSha(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.sha || null;
}

async function commitToGitHub({ owner, repo, path, token, content, message }) {
  let sha = await getLatestSha(owner, repo, path, token);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

  // Coba commit sampai 3 kali
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      return { success: true, commitSha: result.commit?.sha };
    }

    if (res.status === 409 && attempt < 3) {
      // Tunggu 0.5 detik dan ambil SHA terbaru
      await new Promise(r => setTimeout(r, 500));
      sha = await getLatestSha(owner, repo, path, token);
      continue; // retry
    }

    const error = await res.json();
    return { success: false, error };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST diizinkan' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/hasil.json';

  try {
    const result = await commitToGitHub({
      owner: OWNER,
      repo: REPO,
      path: PATH,
      token: GITHUB_TOKEN,
      content: req.body,
      message: 'Update hasil absensi'
    });

    if (result.success) return res.status(200).json(result);
    return res.status(400).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
