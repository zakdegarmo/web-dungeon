import fs from 'fs/promises';
import path from 'path';

export async function getLibraryData() {
  const filePath = path.join(process.cwd(), 'data', 'library.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function getDDCData() {
  const filePath = path.join(process.cwd(), 'data', 'ddc_skos.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}