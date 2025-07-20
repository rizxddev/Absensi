export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Hanya POST' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = 'rizxddev'; // ganti dengan username GitHub kamu
  const REPO = 'Absensi';        // ganti nama repo
  const PATH = 'public/hasil.json'; // path file

  const newData = req.body;

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } });
    const fileData = await resp.json();
    let oldSha = null, oldContent = {};

    if (fileData.content) {
      oldSha = fileData.sha;
      const decoded = Buffer.from(fileData.content, 'base64').toString();
      oldContent = JSON.parse(decoded);
    }

    const merged = oldContent.absensi || {};
    const dateKey = Object.keys(newData.absensi)[0];
    merged[dateKey] = newData.absensi[dateKey];

    const finalData = {
      kelas: newData.kelas || oldContent.kelas || "7A",
      wali_kelas: newData.wali_kelas || oldContent.wali_kelas || "-",
      absensi: merged
    };

    const save = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update hasil.json (${dateKey})`,
        content: Buffer.from(JSON.stringify(finalData, null, 2)).toString('base64'),
        sha: oldSha
      })
    });

    const result = await save.json();
    if (save.status === 200 || save.status === 201) {
      return res.status(200).json({ success: true, commit: result.commit });
    } else {
      return res.status(400).json({ error: result });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}