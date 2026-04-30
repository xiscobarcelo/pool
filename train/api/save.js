export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path = process.env.GITHUB_DATA_PATH || 'data/trainings.json';
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) return res.status(500).json({ error: 'Faltan variables de entorno de GitHub' });
  try {
    const body = req.body || {};
    const payload = { trainings: Array.isArray(body.trainings) ? body.trainings : [], updatedAt: body.updatedAt || new Date().toISOString() };
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    let sha = null;
    const current = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
    if (current.ok) sha = (await current.json()).sha;
    else if (current.status !== 404) return res.status(current.status).json({ error: (await current.json()).message || 'Error obteniendo SHA actual' });
    const content = Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64');
    const gh = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' }, body: JSON.stringify({ message: `Update training checklist ${new Date().toISOString()}`, content, branch, ...(sha ? { sha } : {}) }) });
    const data = await gh.json();
    if (!gh.ok) return res.status(gh.status).json({ error: data.message || 'Error guardando en GitHub' });
    return res.status(200).json({ ok: true, commit: data.commit?.sha || null, updatedAt: payload.updatedAt });
  } catch (error) { return res.status(500).json({ error: error.message || 'Error interno' }); }
}
