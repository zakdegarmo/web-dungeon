
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Fetch the most recent public gists from GitHub.
    // The per_page parameter can be increased up to 100.
    const response = await fetch('https://api.github.com/gists/public?per_page=100', {
      headers: {
        // GitHub API recommends setting a User-Agent header.
        'User-Agent': 'MOOSE-App-Serverless-Function',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}: ${await response.text()}`);
    }

    const gists = await response.json();
    const models = [];

    // Iterate over each gist to find model files.
    for (const gist of gists) {
      for (const file of Object.values(gist.files)) {
        const filename = file.filename.toLowerCase();
        if (filename.endsWith('.glb') || filename.endsWith('.gltf')) {
          models.push({
            url: file.raw_url,
            description: gist.description || 'A 3D model from a public gist.',
          });
        }
      }
    }

    // Return the found models as a JSON array.
    res.status(200).json(models);

  } catch (error) {
    console.error('Error fetching models from gists:', error);
    res.status(500).json({ message: 'Failed to fetch models: ' + error.message });
  }
}
