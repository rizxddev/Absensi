export default async function handler(req, res) {
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const PATH = 'public/hasil2.json';
  const TOKEN = process.env.GITHUB_TOKEN;

  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store'
    });
    const data = await resp.json();

    if (!data.content) {
      return res.status(200).json({ siswa: [] });
    }

    const decoded = JSON.parse(Buffer.from(data.content, 'base64').toString());
    return res.status(200).json(decoded);
  } catch (err) {
    return res.status(500).json({ siswa: [], error: err.message });
  }
}
