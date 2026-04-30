export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path = process.env.GITHUB_DATA_PATH || 'data/trainings.json';
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) return res.status(500).json({ error: 'Faltan variables de entorno de GitHub' });
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const gh = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
    if (gh.status === 404) return res.status(200).json({ trainings: [], updatedAt: null });
    const data = await gh.json();
    if (!gh.ok) return res.status(gh.status).json({ error: data.message || 'Error leyendo GitHub' });
    const decoded = Buffer.from(data.content || '', 'base64').toString('utf8');
    return res.status(200).json(decoded ? JSON.parse(decoded) : { trainings: [] });
  } catch (error) { return res.status(500).json({ error: error.message || 'Error interno' }); }
}
