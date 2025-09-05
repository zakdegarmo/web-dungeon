
import { GoogleGenAI, Type } from "@google/genai";
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = {
  runtime: 'nodejs',
  // Increase memory and timeout for Puppeteer and AI processing
  memory: 1024,
  maxDuration: 45,
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, thematic summary of the webpage content, written as if describing a room in a fantasy dungeon."
        },
        pathways: {
            type: Type.ARRAY,
            description: "An array of exactly three distinct, intriguing topics discovered from the text that a user could explore next. These should be short, punchy phrases.",
            items: { type: Type.STRING }
        }
    },
    required: ["summary", "pathways"]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL parameter is missing.' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    
    // Extract text content from the page
    const pageText = await page.evaluate(() => document.body.innerText);
    await browser.close();
    browser = null;

    if (!pageText || pageText.trim().length < 100) {
        // Use a default response if the page has very little text
        return res.status(200).json({
            summary: "You've entered a quiet, sparse chamber. There's not much to see here, but the path forward is clear.",
            pathways: ["The nature of reality", "The history of the web", "The concept of infinity"]
        });
    }

    // Limit text size to avoid hitting API limits
    const truncatedText = pageText.substring(0, 15000);

    const prompt = `You are a 'Dungeon Master' for a web-based exploration game. Based on the following web page content, provide a brief, thematic summary of this 'dungeon chamber' and suggest three distinct, intriguing 'pathways' a user could explore next. The pathways should be related but divergent topics discovered from the text.

Web Content:
---
${truncatedText}
---
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.7,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    res.status(200).json(result);

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error(`Error analyzing URL: ${url}`, error);
    res.status(500).json({ message: 'Error analyzing page: ' + error.message });
  }
}
