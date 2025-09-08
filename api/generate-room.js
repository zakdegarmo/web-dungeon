
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

// --- Schemas for individual parts ---

const transformSchema = {
    type: Type.OBJECT,
    properties: {
        position: { type: Type.ARRAY, description: "Array of [X, Y, Z] position. Room is a sphere centered at [0, -125, 0] with radius 250.", items: { type: Type.NUMBER } },
        rotation: { type: Type.ARRAY, description: "Array of [X, Y, Z] rotation in radians.", items: { type: Type.NUMBER } },
        scale: { type: Type.NUMBER, description: "Uniform scale." }
    },
    required: ["position", "rotation", "scale"]
};

const screenSchema = {
    type: Type.OBJECT,
    properties: { ...transformSchema.properties, id: { type: Type.STRING }, isVisible: { type: Type.BOOLEAN }, url: { type: Type.STRING } },
    required: [...transformSchema.required, "id", "isVisible"]
};

const doorSchema = {
    type: Type.OBJECT,
    properties: { ...transformSchema.properties, id: { type: Type.STRING }, name: { type: Type.STRING }, url: { type: Type.STRING } },
    required: [...transformSchema.required, "id", "name", "url"]
};

const sceneObjectSchema = {
    type: Type.OBJECT,
    properties: { ...transformSchema.properties, id: { type: Type.STRING }, url: { type: Type.STRING }, type: { type: Type.STRING, description: "'model' or 'hologram'" } },
    required: [...transformSchema.required, "id", "url", "type"]
};

const roomConfigSchema = {
    type: Type.OBJECT,
    properties: {
        size: { type: Type.NUMBER, description: "Radius of the spherical room. Default is 250." },
        wallColor: { type: Type.STRING, description: "Hex color for walls, e.g., '#444444'." },
        floorColor: { type: Type.STRING, description: "Hex color for floor, e.g., '#555555'." },
    },
    required: ["size", "wallColor", "floorColor"]
};

const schemas = {
    room: { schema: roomConfigSchema, key: 'room' },
    screens: { schema: { type: Type.ARRAY, items: screenSchema }, key: 'screens' },
    doors: { schema: { type: Type.ARRAY, items: doorSchema }, key: 'doors' },
    sceneObjects: { schema: { type: Type.ARRAY, items: sceneObjectSchema }, key: 'sceneObjects' }
};

const systemInstructions = {
    base: `You are an imaginative interior designer for a 3D virtual environment called MOOSE. The room is a large sphere (radius 250, centered at 0, -125, 0). Your task is to generate a JSON configuration for a part of the room based on a theme.`,
    room: `Generate a JSON object for the room's core appearance: size, wallColor, and floorColor.`,
    screens: `Generate a JSON array of 2-5 thematic screen objects. Screens should be at eye level (Y position around -85).`,
    doors: `Generate a JSON array of 1-3 thematic door objects. Doors should start from the floor (Y position around -110).`,
    sceneObjects: `Generate a JSON array of 3-7 thematic decorative scene objects. Objects should rest on the floor (Y position around -120).`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, apiKey, part } = req.body;

  if (!apiKey) return res.status(401).json({ message: 'API key is missing.' });
  if (!prompt) return res.status(400).json({ message: 'Prompt parameter is missing.' });
  if (!part || !schemas[part]) return res.status(400).json({ message: 'Invalid generation part specified.' });
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const { schema, key } = schemas[part];
    const systemInstruction = `${systemInstructions.base} ${systemInstructions[part]}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate the '${key}' configuration for the theme: "${prompt}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.6,
        },
    });

    const jsonText = response.text.trim();
    if (!jsonText) throw new Error(`The AI returned an empty response for part: ${part}.`);
    
    res.status(200).json({ [key]: JSON.parse(jsonText) });

  } catch (error) {
    console.error(`Error in /api/generate-room (part: ${part}):`, JSON.stringify(error, null, 2));
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
      return res.status(401).json({ message: 'The provided API key is invalid or missing required permissions.' });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: `An unexpected error occurred during '${part}' generation: ${errorMessage}` });
  }
}
