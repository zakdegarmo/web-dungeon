




import React, { useState, useCallback } from 'react';
import { SceneCanvas } from './components/SceneCanvas';
import { ControlPanel } from './components/ScreenManager';
import type { DoorData as OldDoorData } from './components/Doors';
import { ChatHistory } from './components/ChatHistory';
import { ChatBubble } from './components/Icons';

// Define unified state structures for all scene objects
export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export interface ScreenState extends Transform {
  id: string | number;
  url: string;
  isVisible: boolean;
}

export interface DoorState extends Transform {
  id: string | number;
  name: string;
  url: string;
}

export type SceneObjectType = 'model' | 'hologram';

export interface SceneObjectState extends Transform {
  id:string | number;
  url: string; 
  type: SceneObjectType;
}

export interface MooseBotState extends Transform {
  url: string;
  dialogue: string;
  activeAnimation: string;
}

export interface RoomConfig {
  size: number;
  wallColor: string;
  floorColor: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}


// Define portal door data centrally so it can be used for both doors and screen positioning
const portalDoorData: OldDoorData[] = [
    { id: 'ontology', link: 'https://zakdegarmo.github.io/MyOntology/', type: 'portal' },
    { id: 'notepad', link: 'https://zakdegarmo.github.io/ZaksNotepad/index.html', type: 'portal' },
    { id: 'file-explorer', link: 'https://3-d-file-explorer.vercel.app/', type: 'portal' },
    { id: 'hap', link: 'https://hyper-aether-pilgrim.vercel.app/', type: 'portal'},
    { id: '3d-molecule-lab', link: 'https://3d-molecule-lab.vercel.app/', type: 'portal' },
    { id: 'data-vis', link: 'https://data-vis-eosin.vercel.app/', type: 'portal' },
    { id: 'font-fun', link: 'https://3d-ttf.vercel.app/', type: 'portal' },
    { id: 'IDE', link: 'https://my-os-3-d-ide.vercel.app/', type: 'portal' },
    { id: 'web-dungeon homepage', link: 'https://web-dungeon.vercel.app/', type: 'portal' },
];

const initialScreenUrls = [
  'https://zakdegarmo.github.io/MyOntology/',
  'https://zakdegarmo.github.io/ZaksNotepad/index.html',
  'https://3-d-file-explorer.vercel.app/',
  'https://hyper-aether-pilgrim.vercel.app/',
  'https://3d-molecule-lab.vercel.app/',
  'https://data-vis-eosin.vercel.app/',
  'https://3d-ttf.vercel.app/',
  'https://my-os-3-d-ide.vercel.app/',
];

// Hardcoded initial positions for screens to lock in the layout
const initialScreens: ScreenState[] = [
  {
    id: 1,
    url: initialScreenUrls[0],
    isVisible: true,
    position: [180, -85, 0],
    rotation: [0, 1.5707963267948966, 0],
    scale: 1.6,
  },
  {
    id: 2,
    url: initialScreenUrls[1],
    isVisible: true,
    position: [127.27922061357857, -85, 127.27922061357857],
    rotation: [0, 0.7853981633974483, 0],
    scale: 1.6,
  },
  {
    id: 3,
    url: initialScreenUrls[2],
    isVisible: true,
    position: [0, -85, 180],
    rotation: [0, 0, 0],
    scale: 1.6,
  },
  {
    id: 4,
    url: initialScreenUrls[3],
    isVisible: true,
    position: [-127.27922061357856, -85, 127.27922061357857],
    rotation: [0, -0.7853981633974483, 0],
    scale: 1.6,
  },
  {
    id: 5,
    url: initialScreenUrls[4],
    isVisible: true,
    position: [-180, -85, 0],
    rotation: [0, -1.5707963267948966, 0],
    scale: 1.6,
  },
  {
    id: 6,
    url: initialScreenUrls[5],
    isVisible: true,
    position: [-127.27922061357857, -85, -127.27922061357856],
    rotation: [0, -2.356194490192345, 0],
    scale: 1.6,
  },
  {
    id: 7,
    url: initialScreenUrls[6],
    isVisible: true,
    position: [0, -85, -180],
    rotation: [0, -3.141592653589793, 0],
    scale: 1.6,
  },
  {
    id: 8,
    url: initialScreenUrls[7],
    isVisible: true,
    position: [127.27922061357856, -85, -127.27922061357857],
    rotation: [0, -3.9269908169872414, 0],
    scale: 1.6,
  },
];

// Hardcoded initial positions for doors to lock in the layout
const initialDoors: DoorState[] = [
  {
    id: 'ontology',
    name: 'Ontology',
    url: 'https://zakdegarmo.github.io/MyOntology/',
    position: [220, -110, 0],
    rotation: [0, 1.5707963267948966, 0],
    scale: 1.4,
  },
  {
    id: 'notepad',
    name: 'Notepad',
    url: 'https://zakdegarmo.github.io/ZaksNotepad/index.html',
    position: [168.5542152642095, -110, 141.2820323027551],
    rotation: [0, 0.8726646259971648, 0],
    scale: 1.4,
  },
  {
    id: 'file-explorer',
    name: 'File Explorer',
    url: 'https://3-d-file-explorer.vercel.app/',
    position: [38.20423349051557, -110, 216.7957665094825],
    rotation: [0, 0.17453292519943295, 0],
    scale: 1.4,
  },
  {
    id: 'hap',
    name: 'Hap',
    url: 'https://hyper-aether-pilgrim.vercel.app/',
    position: [-110, -110, 190.5255866034633],
    rotation: [0, -0.5235987755982988, 0],
    scale: 1.4,
  },
  {
    id: '3d-molecule-lab',
    name: '3d Molecule Lab',
    url: 'https://3d-molecule-lab.vercel.app/',
    position: [-206.7957665094825, -110, 75.25423349051566],
    rotation: [0, -1.2217304763960306, 0],
    scale: 1.4,
  },
  {
    id: 'data-vis',
    name: 'Data Vis',
    url: 'https://data-vis-eosin.vercel.app/',
    position: [-206.79576650948253, -110, -75.25423349051552],
    rotation: [0, -1.9198621771937625, 0],
    scale: 1.4,
  },
  {
    id: 'font-fun',
    name: 'Font Fun',
    url: 'https://3d-ttf.vercel.app/',
    position: [-110, -110, -190.52558660346327],
    rotation: [0, -2.6179938779914944, 0],
    scale: 1.4,
  },
  {
    id: 'IDE',
    name: 'IDE',
    url: 'https://my-os-3-d-ide.vercel.app/',
    position: [38.2042334905154, -110, -216.79576650948253],
    rotation: [0, -3.316125578789226, 0],
    scale: 1.4,
  },
  {
    id: 'web-dungeon homepage',
    name: 'Web Dungeon Homepage',
    url: 'https://web-dungeon.vercel.app/',
    position: [168.5542152642094, -110, -141.28203230275518],
    rotation: [0, -4.014257279586958, 0],
    scale: 1.4,
  },
];


const initialSceneObjects: SceneObjectState[] = [];

const initialMooseBotState: MooseBotState = {
    url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    dialogue: 'Hello! I am MOOSE-BOT. Ask me anything!',
    activeAnimation: 'Idle',
    position: [0, -125, 15],
    rotation: [0, Math.PI, 0],
    scale: 6,
};


const App: React.FC = () => {
  const [url, setUrl] = useState<string>(initialScreenUrls[0] || 'https://www.google.com');
  const [key, setKey] = useState<number>(0);
  const [screens, setScreens] = useState<ScreenState[]>(initialScreens);
  const [doors, setDoors] = useState<DoorState[]>(initialDoors);
  const [sceneObjects, setSceneObjects] = useState<SceneObjectState[]>(initialSceneObjects);
  const [mooseBot, setMooseBot] = useState<MooseBotState>(initialMooseBotState);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    size: 250,
    wallColor: '#444444',
    floorColor: '#555555',
  });
  const [isManagerVisible, setIsManagerVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isBotChatting, setIsBotChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'bot', text: initialMooseBotState.dialogue }
  ]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const updateMainScreenUrl = (newUrl: string) => {
     setScreens(prevScreens => {
      const firstVisibleIndex = prevScreens.findIndex(s => s.isVisible);
      if (firstVisibleIndex !== -1) {
        const newScreens = [...prevScreens];
        newScreens[firstVisibleIndex] = { ...newScreens[firstVisibleIndex], url: newUrl };
        return newScreens;
      }
      // If no screen is visible, update the first one
      if(prevScreens.length > 0) {
        const newScreens = [...prevScreens];
        newScreens[0] = { ...newScreens[0], url: newUrl, isVisible: true };
        return newScreens;
      }
      return prevScreens;
    });
    setUrl(newUrl);
    setKey(prevKey => prevKey + 1);
  };

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url.trim() === '') return;
    let finalUrl = url;
    if (!/^(https|http|file|ftp|\/)/i.test(url)) {
      finalUrl = 'https://' + url;
    }
    updateMainScreenUrl(finalUrl);
  }, [url]);
  
  const handleApplyChanges = (
    updatedScreens: ScreenState[], 
    updatedDoors: DoorState[], 
    updatedObjects: SceneObjectState[], 
    updatedBot: MooseBotState,
    updatedRoomConfig: RoomConfig
  ) => {
    setScreens(updatedScreens);
    setDoors(updatedDoors);
    setSceneObjects(updatedObjects);
    setMooseBot(updatedBot);
    setRoomConfig(updatedRoomConfig);
    setKey(prevKey => prevKey + 1); // Re-render canvas
  };

  const handleLoadConfiguration = (config: { screens?: ScreenState[]; doors?: DoorState[]; sceneObjects?: SceneObjectState[], mooseBot?: MooseBotState, room?: RoomConfig }) => {
    if (config.screens) setScreens(config.screens);
    if (config.doors) setDoors(config.doors);
    if (config.sceneObjects) setSceneObjects(config.sceneObjects);
    if (config.mooseBot) setMooseBot(config.mooseBot);
    if (config.room) setRoomConfig(config.room);
    setKey(prevKey => prevKey + 1); // Re-render canvas
    setIsManagerVisible(false); // Close panel after loading
  };

  const handleChatWithBot = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || isBotChatting) return;

    if (!apiKey.trim()) {
        const apiKeyMessage = 'Please enter your Gemini API key to chat with me.';
        setMooseBot(prev => ({ ...prev, dialogue: apiKeyMessage }));
        const botMessage: ChatMessage = { sender: 'bot', text: apiKeyMessage };
        setChatHistory(prev => [...prev, botMessage]);
        return;
    }

    const userMessage: ChatMessage = { sender: 'user', text: trimmedInput };
    setChatHistory(prev => [...prev, userMessage]);
    setChatInput('');
    setIsBotChatting(true);
    setMooseBot(prev => ({ ...prev, dialogue: 'Thinking...' }));

    try {
        const response = await fetch('/api/chat-with-bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmedInput, apiKey }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `API error: ${response.statusText}` }));
            throw new Error(errorData.message);
        }

        const data = await response.json();
        const botMessageText = data.response;

        setMooseBot(prev => ({ ...prev, dialogue: botMessageText }));
        const botMessage: ChatMessage = { sender: 'bot', text: botMessageText };
        setChatHistory(prev => [...prev, botMessage]);

    } catch (error) {
        console.error("Failed to chat with bot:", error);
        const errorMessage = error instanceof Error ? error.message : 'Sorry, I had a connection error.';
        setMooseBot(prev => ({ ...prev, dialogue: errorMessage }));
        const botMessage: ChatMessage = { sender: 'bot', text: errorMessage };
        setChatHistory(prev => [...prev, botMessage]);
    } finally {
        setIsBotChatting(false);
    }
  };

  const handleToggleManager = useCallback(() => {
    setIsManagerVisible(v => !v);
  }, []);


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {isManagerVisible && (
        <ControlPanel
          screens={screens}
          doors={doors}
          sceneObjects={sceneObjects}
          mooseBot={mooseBot}
          animationNames={animationNames}
          roomConfig={roomConfig}
          onApply={handleApplyChanges}
          onLoadConfiguration={handleLoadConfiguration}
          onClose={() => setIsManagerVisible(false)}
        />
      )}
      
      {isChatVisible && <ChatHistory history={chatHistory} onClose={() => setIsChatVisible(false)} />}

      <div className="w-full h-full">
        <SceneCanvas 
          key={key} 
          screens={screens}
          doors={doors}
          sceneObjects={sceneObjects}
          mooseBot={mooseBot}
          roomConfig={roomConfig}
          onToggleManager={handleToggleManager}
          onAnimationsLoaded={setAnimationNames}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
        <div className="w-full p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">MOOSE</h1>
              
              <form onSubmit={handleChatWithBot} className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow max-w-xl">
                  <button type="button" onClick={() => setIsChatVisible(v => !v)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors text-white flex-shrink-0" title="Toggle Chat History">
                    <ChatBubble />
                  </button>
                  <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask MOOSE-BOT..."
                      className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full flex-grow"
                      disabled={isBotChatting}
                  />
                  <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="API Key"
                      className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full flex-shrink"
                      style={{maxWidth: '120px'}}
                      aria-label="Gemini API Key"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex-shrink-0" disabled={isBotChatting}>
                      {isBotChatting ? '...' : 'Send'}
                  </button>
              </form>
              
              <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow max-w-xl">
                  <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL for main screen..."
                  className="bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                  />
                  <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                  Load
                  </button>
              </form>
            </div>
        </div>

        <div className="w-full p-2 bg-black bg-opacity-50 text-center text-xs text-gray-400">
            <p>Controls: [W, A, S, D] to Move | [SHIFT] to Sprint | [Q, E] to Turn | [R, F] to Look Up/Down | [Z, C] to Move Up/Down | Click Hub to manage scene.</p>
            <p>Note: Some sites may not load due to security policies (X-Frame-Options). This is a browser security feature.</p>
        </div>
      </div>
    </div>
  );
};

export default App;