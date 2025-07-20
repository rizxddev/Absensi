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
  const PATH = 'public/hasil.json';

  try {
    let sha = await getLatestSha(OWNER, REPO, PATH, GITHUB_TOKEN);
    const contentEncoded = Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64');
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

    const save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Update hasil absensi', content: contentEncoded, sha })
    });

    const result = await save.json();

    if (save.status === 409) {
      sha = await getLatestSha(OWNER, REPO, PATH, GITHUB_TOKEN);
      const retry = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'Retry update hasil absensi', content: contentEncoded, sha })
      });
      const retryResult = await retry.json();
      if (retry.status === 200 || retry.status === 201) {
        return res.status(200).json({ success: true, commitSha: retryResult.commit?.sha });
      }
      return res.status(retry.status).json({ error: retryResult });
    }

    if (save.status === 200 || save.status === 201) {
      return res.status(200).json({ success: true, commitSha: result.commit?.sha });
    }

    return res.status(save.status).json({ error: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
