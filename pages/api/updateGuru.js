export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // simpan di Vercel
  const OWNER = 'rizxddev';  // ganti username
  const REPO = 'Absensi';         // ganti repo
  const PATH = 'data/guru.json';    // file target di repo

  const newData = req.body; // { guru: [...] }

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
    const fileData = await resp.json();
    let oldSha = null;

    if (fileData.sha) oldSha = fileData.sha;

    const save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update guru.json`,
        content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
        sha: oldSha
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