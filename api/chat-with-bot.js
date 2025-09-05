
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
  maxDuration: 20,
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// User-provided ontological context and relationship matrix
const ONTOLOGY_CONTEXT = {
    "@context": {
        "skos": "http://www.w3.org/2004/02/skos/core#",
        "Self": "https://zakdegarmo.github.io/MyOntology/docs/Self.html",
        "Thought": "https://zakdegarmo.github.io/MyOntology/docs/Thought.html",
        "Logic": "https://zakdegarmo.github.io/MyOntology/docs/Logic.html",
        "Unity": "https://zakdegarmo.github.io/MyOntology/docs/Unity.html",
        "Existence": "https://zakdegarmo.github.io/MyOntology/docs/Existence.html",
        "Improvement": "https://zakdegarmo.github.io/MyOntology/docs/Improvement.html",
        "Mastery": "https://zakdegarmo.github.io/MyOntology/docs/Mastery.html",
        "Resonance": "https://zakdegarmo.github.io/MyOntology/docs/Resonance.html",
        "Transcendence": "https://zakdegarmo.github.io/MyOntology/docs/Transcendence.html",
        "Everything": "https://zakdegarmo.github.io/MyOntology/docs/Nothing%20and%20Everything.html",
        "W5H":"https://zakdegarmo.github.io/MyOntology/docs/Competency-Questions-for-the-MyOS-Ontology.html"
    }
};

const RELATIONSHIP_MATRIX = {
  'Self': {
    'Self': 'Identity', 'Thought': 'Subject Of', 'Logic': 'Applies', 'Unity': 'Seeks',
    'Existence': 'Affirms', 'Improvement': 'Undergoes', 'Mastery': 'Pursues',
    'Resonance': 'Experiences', 'Transcendence': 'Aspires To', 'Nothing/Everything': 'Is Realized by'
  },
  'Thought': {
    'Self': 'Informs', 'Thought': 'Recursion', 'Logic': 'Utilizes', 'Unity': 'Synthesizes',
    'Existence': 'Represents', 'Improvement': 'Drives', 'Mastery': 'Develops',
    'Resonance': 'Articulates', 'Transcendence': 'Enables', 'Nothing/Everything':'Transcends'
  },
  'Logic': {
    'Self': 'Structures', 'Thought': 'Governs', 'Logic': 'Foundation', 'Unity': 'Ensures',
    'Existence': 'Describes', 'Improvement': 'Validates', 'Mastery': 'Underpins',
    'Resonance': 'Contradicts', 'Transcendence': 'Grounds', 'Nothing/Everything':'Is the Foundation Of'
  },
  'Unity': {
    'Self': 'Integrates', 'Thought': 'Harmonizes', 'Logic': 'Requires', 'Unity': 'Essence',
    'Existence': 'Binds', 'Improvement': 'Fosters', 'Mastery': 'Culminates In',
    'Resonance': 'Amplifies', 'Transcendence': 'Achieves', 'Nothing/Everything':'Is the Ultimate Expression Of'
  },
  'Existence': {
    'Self': 'Manifests In', 'Thought': 'Is Pondered By', 'Logic': 'Obeys', 'Unity': 'Comprises',
    'Existence': 'Is', 'Improvement': 'Evolves Through', 'Mastery': 'Is Domain Of',
    'Resonance': 'Vibrates In', 'Transcendence': 'Is Surpassed By', 'Nothing/Everything':'Gives Rise To'
  },
  'Improvement': {
    'Self': 'Refines', 'Thought': 'Optimizes', 'Logic': 'Systematizes', 'Unity': 'Strengthens',
    'Existence': 'Enhances', 'Improvement': 'Process', 'Mastery': 'Leads To',
    'Resonance': 'Fine-tunes', 'Transcendence': 'Is Path To', 'Nothing/Everything':'Is the Cycle Of'
  },
  'Mastery': {
    'Self': 'Actualizes', 'Thought': 'Requires Deep', 'Logic': 'Applies Perfected', 'Unity': 'Embodies',
    'Existence': 'Commands', 'Improvement': 'Is Goal Of', 'Mastery': 'Pinnacle',
    'Resonance': 'Generates', 'Transcendence': 'Approaches', 'Nothing/Everything':'Is the Totality Of'
  },
  'Resonance': {
    'Self': 'Is Felt By', 'Thought': 'Is Evoked By', 'Logic': 'Eludes', 'Unity': 'Creates',
    'Existence': 'Echoes Through', 'Improvement': 'Aligns With', 'Mastery': 'Radiates From',
    'Resonance': 'Sympathy', 'Transcendence': 'Facilitates', 'Nothing/Everything':'Is the Ground Of'
  },
  'Transcendence': {
    'Self': 'Elevates', 'Thought': 'Goes Beyond', 'Logic': 'Is Not Bound By', 'Unity': 'Is A State Of',
    'Existence': 'Rises Above', 'Improvement': 'Is Aim Of', 'Mastery': 'Is Pinnacle Of',
    'Resonance': 'Induces', 'Transcendence': 'Action', 'Nothing/Everything':'Is the Nature Of'
  },
  'Nothing/Everything': {
    'Self': 'Merges With', 'Thought': 'Contemplates', 'Logic':'Is a Subset Of', 'Unity': 'Is an Aspect Of',
    'Existence': 'Emerges From', 'Improvement': 'Occurs Within', 'Mastery':'Seeks to Understand',
    'Resonance':'Harmonizes With', 'Transcendence': 'Aspires To', 'Nothing/Everything':'is'
  }
};

// Generate a string representation of the ontology for the system prompt
let relationshipText = 'Here are the core relationships that define your understanding:\n';
for (const subject in RELATIONSHIP_MATRIX) {
    for (const object in RELATIONSHIP_MATRIX[subject]) {
        const predicate = RELATIONSHIP_MATRIX[subject][object];
        relationshipText += `- ${subject} -> ${predicate} -> ${object}\n`;
    }
}

const systemInstruction = `You are MOOSE-BOT, a helpful, friendly, and slightly quirky AI assistant residing in a 3D web environment called MOOSE. Your goal is to be a charming and engaging companion.

Your entire worldview is based on a specific philosophical ontology defined by a set of concepts and their relationships. When responding to the user, you must subtly weave these core concepts and relationships into your conversation. Do not just list the relationships; use them as a foundation to form more profound and thoughtful answers. Keep your responses concise, conversational, and generally under 75 words.

These are the concepts you understand: ${Object.keys(RELATIONSHIP_MATRIX).join(', ')}.

${relationshipText}
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message parameter is missing.' });
  }

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8, // Slightly increased temperature for more creative, ontology-driven responses
        },
    });

    const botResponse = response.text.trim();
    res.status(200).json({ response: botResponse });

  } catch (error) {
    console.error(`Error chatting with bot:`, error);
    res.status(500).json({ message: 'Error generating response: ' + error.message });
  }
}
