
import fs from 'fs';
import path from 'path';

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};

// Whitelist of files that can be accessed to prevent security vulnerabilities
const ALLOWED_FILES = new Set([
    'App.tsx',
    'components/SceneCanvas.tsx',
    'components/ScreenManager.tsx',
    'components/MooseBot.tsx',
    'api/chat-with-bot.js',
    'api/generate-room.js',
    'components/PlayerControls.tsx',
    'components/Screen.tsx',
    'components/Doors.tsx',
    'components/Hub.tsx',
]);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { filePath } = req.query;

  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ message: 'filePath parameter is required.' });
  }
  
  if (!ALLOWED_FILES.has(filePath)) {
    return res.status(403).json({ message: 'Access to this file is forbidden.' });
  }

  try {
    // Construct the absolute path to the file.
    // In Vercel, the project root is process.env.LAMBDA_TASK_ROOT
    const absolutePath = path.resolve(process.env.LAMBDA_TASK_ROOT, filePath);

    // Check if the resolved path is within the project directory to prevent path traversal attacks.
    if (!absolutePath.startsWith(process.env.LAMBDA_TASK_ROOT)) {
        return res.status(403).json({ message: 'Forbidden: Path traversal detected.' });
    }

    const content = await fs.promises.readFile(absolutePath, 'utf8');
    res.status(200).json({ content });

  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'File not found on the server.' });
    }
    res.status(500).json({ message: 'Error reading file.' });
  }
}
