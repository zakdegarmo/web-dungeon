


import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from './Icons';
import type { ScreenState, DoorState, SceneObjectState, MooseBotState, RoomConfig, SceneObjectType } from '../App';

interface ControlPanelProps {
  screens: ScreenState[];
  doors: DoorState[];
  sceneObjects: SceneObjectState[];
  mooseBot: MooseBotState;
  animationNames: string[];
  roomConfig: RoomConfig;
  onApply: (screens: ScreenState[], doors: DoorState[], sceneObjects: SceneObjectState[], mooseBot: MooseBotState, roomConfig: RoomConfig) => void;
  onLoadConfiguration: (config: any) => void;
  onClose: () => void;
}

type Tab = 'screens' | 'doors' | 'objects' | 'bot' | 'room' | 'settings' | 'community';

const SliderInput: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number; step: number; displayValue?: string; className?: string;}> = ({ label, value, onChange, min, max, step, displayValue, className }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="text-sm text-gray-400 mb-1 whitespace-nowrap">{label}</label>
        <div className="flex items-center gap-2">
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full" />
            <span className="text-cyan-400 text-sm w-12 text-right">{displayValue || value}</span>
        </div>
    </div>
);

const RemoveButton: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 font-bold text-lg leading-none p-1">&times;</button>
)

export const ControlPanel: React.FC<ControlPanelProps> = ({ screens, doors, sceneObjects, mooseBot, animationNames, roomConfig, onApply, onLoadConfiguration, onClose }) => {
  const [localScreens, setLocalScreens] = useState(screens);
  const [localDoors, setLocalDoors] = useState(doors);
  const [localObjects, setLocalObjects] = useState(sceneObjects);
  const [localBot, setLocalBot] = useState(mooseBot);
  const [localRoomConfig, setLocalRoomConfig] = useState(roomConfig);
  const [activeTab, setActiveTab] = useState<Tab>('bot');
  const [screenLayoutRadius, setScreenLayoutRadius] = useState(180);
  const [doorLayoutRadius, setDoorLayoutRadius] = useState(220);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUploadRef = useRef<HTMLInputElement>(null);


  const handleApplyChanges = () => {
    onApply(localScreens, localDoors, localObjects, localBot, localRoomConfig);
    onClose();
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text === 'string') {
                const config = JSON.parse(text);
                // backward compatibility for old config files
                if (config.decorativeObjects && !config.sceneObjects) {
                    config.sceneObjects = config.decorativeObjects.map((o: any) => ({...o, type: 'model'}));
                    delete config.decorativeObjects;
                }
                onLoadConfiguration(config);
            }
        } catch (error) {
            console.error("Failed to parse configuration file:", error);
            alert("Error: Invalid or corrupted configuration file.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleSaveConfig = () => {
    try {
        const config = {
            screens: localScreens,
            doors: localDoors,
            sceneObjects: localObjects,
            mooseBot: localBot,
            room: localRoomConfig,
        };
        const dataStr = JSON.stringify(config, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'nexus-config.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to save configuration:", error);
        alert("An error occurred while saving the configuration.");
    }
  };
  
  const handleObjectUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
            const newObject: SceneObjectState = {
                id: Date.now(),
                url: dataUrl,
                type: 'model',
                position: [0, -localRoomConfig.size / 2 + 5, -150],
                rotation: [0, 0, 0],
                scale: 10,
            };
            setLocalObjects(prev => [...prev, newObject]);
        }
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleRoomChange = (field: keyof RoomConfig, value: any) => {
      setLocalRoomConfig(prev => ({ ...prev, [field]: value }));
  };
    
  const handleBotChange = (field: keyof MooseBotState, value: any) => {
      setLocalBot(prev => ({ ...prev, [field]: value }));
  };

  const handleArrangeInCircle = (type: 'screens' | 'doors') => {
    if (type === 'screens') {
        const count = localScreens.length;
        if (count === 0) return;
        const newItems = localScreens.map((item, index) => {
            const angle = (index / count) * Math.PI * 2;
            const x = Math.cos(angle) * screenLayoutRadius;
            const z = Math.sin(angle) * screenLayoutRadius;
            const rotationY = -angle + Math.PI / 2;
            return { ...item, position: [x, item.position[1], z] as [number,number,number], rotation: [item.rotation[0], rotationY, item.rotation[2]] as [number,number,number] };
        });
        setLocalScreens(newItems);
    }
    if (type === 'doors') {
        const count = localDoors.length;
        if (count === 0) return;
        const newItems = localDoors.map((item, index) => {
            const angle = (index / count) * Math.PI * 2;
            const x = Math.cos(angle) * doorLayoutRadius;
            const z = Math.sin(angle) * doorLayoutRadius;
            const rotationY = -angle + Math.PI / 2;
            return { ...item, position: [x, item.position[1], z] as [number,number,number], rotation: [item.rotation[0], rotationY, item.rotation[2]] as [number,number,number] };
        });
        setLocalDoors(newItems);
    }
  };

  // Generic handlers for adding/removing items
  const addItem = (type: Tab) => {
    if (type === 'screens') {
        const newItem = {
            id: Date.now(),
            position: [0, -100, -150] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: 1.5,
            url: 'https://www.google.com', 
            isVisible: true
        };
        setLocalScreens(prev => [...prev, newItem]);
    }
    if (type === 'doors') {
        const newItem = {
            id: Date.now(),
            position: [0, -100, -150] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: 1.5,
            url: '#', 
            name: 'New Door'
        };
        setLocalDoors(prev => [...prev, newItem]);
    }
    if (type === 'objects') {
        const newItem: SceneObjectState = {
            id: Date.now(),
            position: [0, -localRoomConfig.size / 2 + 15, -150] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: 15,
            url: '/door.glb',
            type: 'model',
        };
        setLocalObjects(prev => [...prev, newItem]);
    }
  };
  
  const removeItem = (type: Tab, id: number | string) => {
    if (type === 'screens') setLocalScreens(prev => prev.filter(s => s.id !== id));
    if (type === 'doors') setLocalDoors(prev => prev.filter(d => d.id !== id));
    if (type === 'objects') setLocalObjects(prev => prev.filter(o => o.id !== id));
  };
  
  const handleItemChange = (type: Tab, id: number | string, field: string, value: any) => {
    if (type === 'screens') setLocalScreens(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    if (type === 'doors') setLocalDoors(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    if (type === 'objects') setLocalObjects(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };


  const TabButton: React.FC<{tabId: Tab; children: React.ReactNode}> = ({tabId, children}) => (
      <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tabId ? 'bg-gray-800 text-cyan-400' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
          {children}
      </button>
  );

  const renderTransformControls = (item: any, onChange: (field: string, value: any) => void) => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-700/50">
        <SliderInput label="Position X" value={item.position[0]} onChange={e => onChange('position', [Number(e.target.value), item.position[1], item.position[2]])} min={-300} max={300} step={1} />
        <SliderInput label="Position Y" value={item.position[1]} onChange={e => onChange('position', [item.position[0], Number(e.target.value), item.position[2]])} min={-200} max={100} step={1} />
        <SliderInput label="Position Z" value={item.position[2]} onChange={e => onChange('position', [item.position[0], item.position[1], Number(e.target.value)])} min={-300} max={300} step={1} />
        <SliderInput label="Scale" value={item.scale} onChange={e => onChange('scale', Number(e.target.value))} min={0.1} max={100} step={0.1} />
        <SliderInput label="Rotation X" value={item.rotation[0]} onChange={e => onChange('rotation', [Number(e.target.value), item.rotation[1], item.rotation[2]])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[0] * 180 / Math.PI).toFixed(0)}°`} />
        <SliderInput label="Rotation Y" value={item.rotation[1]} onChange={e => onChange('rotation', [item.rotation[0], Number(e.target.value), item.rotation[2]])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[1] * 180 / Math.PI).toFixed(0)}°`} />
        <SliderInput label="Rotation Z" value={item.rotation[2]} onChange={e => onChange('rotation', [item.rotation[0], item.rotation[1], Number(e.target.value)])} min={-Math.PI} max={Math.PI} step={0.01} displayValue={`${(item.rotation[2] * 180 / Math.PI).toFixed(0)}°`} />
     </div>
  );

  return (
    <div className="absolute inset-0 z-30 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-lg shadow-2xl p-6 w-full max-w-4xl text-white font-mono flex flex-col h-full max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
          <h2 className="text-2xl font-bold text-cyan-400">Nexus Control Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        
        <div className="flex border-b border-gray-700">
            <TabButton tabId="bot">MOOSE-BOT</TabButton>
            <TabButton tabId="screens">Screens</TabButton>
            <TabButton tabId="doors">Doors</TabButton>
            <TabButton tabId="objects">Objects</TabButton>
            <TabButton tabId="room">Room</TabButton>
            <TabButton tabId="settings">Settings</TabButton>
            <TabButton tabId="community">Community</TabButton>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 mt-4 space-y-4">
          {activeTab === 'bot' && (
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">MOOSE-BOT Configuration</h3>
                <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-400 w-28">Model URL</label>
                    <input type="text" placeholder="Bot Model URL (.glb)" value={localBot.url} onChange={e => handleBotChange('url', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                 <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-400 w-28">Animation</label>
                    <select value={localBot.activeAnimation} onChange={e => handleBotChange('activeAnimation', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        {animationNames.map(name => <option key={name} value={name}>{name}</option>)}
                         {animationNames.length === 0 && <option>Loading animations...</option>}
                    </select>
                </div>
                 <div className="flex items-start gap-4">
                    <label className="text-sm text-gray-400 w-28 mt-1">Dialogue</label>
                    <textarea placeholder="What the bot is thinking or saying..." value={localBot.dialogue} onChange={e => handleBotChange('dialogue', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" rows={2}/>
                </div>
                {renderTransformControls(localBot, (field, value) => handleBotChange(field as keyof MooseBotState, value))}
            </div>
          )}
          {activeTab === 'screens' && localScreens.map(s => (
            <div key={s.id} className="bg-gray-800 p-3 rounded-md border border-gray-700 relative">
                <RemoveButton onClick={() => removeItem('screens', s.id)} />
                <div className="flex items-center gap-4">
                    <button onClick={() => handleItemChange('screens', s.id, 'isVisible', !s.isVisible)} className="p-2 text-cyan-400 hover:text-white">
                    {s.isVisible ? <Eye /> : <EyeOff />}
                    </button>
                    <input type="text" value={s.url} onChange={e => handleItemChange('screens', s.id, 'url', e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                {renderTransformControls(s, (field, value) => handleItemChange('screens', s.id, field, value))}
            </div>
          ))}
          {activeTab === 'doors' && localDoors.map(d => (
             <div key={d.id} className="bg-gray-800 p-3 rounded-md border border-gray-700 relative">
                <RemoveButton onClick={() => removeItem('doors', d.id)} />
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Name" value={d.name} onChange={e => handleItemChange('doors', d.id, 'name', e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    <input type="text" placeholder="URL" value={d.url} onChange={e => handleItemChange('doors', d.id, 'url', e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                {renderTransformControls(d, (field, value) => handleItemChange('doors', d.id, field, value))}
             </div>
          ))}
          {activeTab === 'objects' && localObjects.map(o => (
             <div key={o.id} className="bg-gray-800 p-3 rounded-md border border-gray-700 relative">
                <RemoveButton onClick={() => removeItem('objects', o.id)} />
                <div className="flex items-center gap-4 mb-2">
                    <select value={o.type} onChange={e => handleItemChange('objects', o.id, 'type', e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="model">3D Model</option>
                        <option value="hologram">Scene Hologram</option>
                    </select>
                    <input type="text" placeholder={o.type === 'model' ? "Model URL (.glb) or Data URL" : "Scene Config URL (.json)"} value={o.url} onChange={e => handleItemChange('objects', o.id, 'url', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                </div>
                {renderTransformControls(o, (field, value) => handleItemChange('objects', o.id, field, value))}
             </div>
          ))}
          {activeTab === 'room' && (
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Environment Settings</h3>
                <p className="text-sm text-gray-400">Customize the appearance of the main chamber.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <SliderInput label="Room Size" value={localRoomConfig.size} onChange={e => handleRoomChange('size', Number(e.target.value))} min={50} max={500} step={1} className="md:col-span-2" />
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-400 mb-1">Wall Color</label>
                        <input type="color" value={localRoomConfig.wallColor} onChange={e => handleRoomChange('wallColor', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded cursor-pointer" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm text-gray-400 mb-1">Floor Color</label>
                        <input type="color" value={localRoomConfig.floorColor} onChange={e => handleRoomChange('floorColor', e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded cursor-pointer" />
                    </div>
                </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="space-y-6">
                <div className="bg-gray-800 p-4 rounded-md border border-gray-700 space-y-4">
                    <h3 className="text-lg font-semibold text-cyan-300">Configuration Management</h3>
                    <p className="text-sm text-gray-400">Save your current scene layout to a file, or load a previously saved layout.</p>
                    <div className="flex gap-4">
                        <button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Save to File</button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Load from File</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileLoad} accept=".json" className="hidden"/>
                    </div>
                </div>
                 <div className="bg-gray-800 p-4 rounded-md border border-gray-700 space-y-2">
                    <h3 className="text-lg font-semibold text-cyan-300">Layout Tools</h3>
                    <p className="text-sm text-gray-400">Automatically arrange items in a circular pattern.</p>
                    <div className="flex items-center gap-4 p-3 border-t border-gray-700/50 mt-2">
                        <span className="font-semibold text-gray-300 w-20">Screens</span>
                        <SliderInput label="Radius" value={screenLayoutRadius} onChange={e => setScreenLayoutRadius(Number(e.target.value))} min={10} max={400} step={1} className="flex-grow"/>
                        <button onClick={() => handleArrangeInCircle('screens')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Arrange</button>
                    </div>
                    <div className="flex items-center gap-4 p-3 border-t border-gray-700/50">
                        <span className="font-semibold text-gray-300 w-20">Doors</span>
                        <SliderInput label="Radius" value={doorLayoutRadius} onChange={e => setDoorLayoutRadius(Number(e.target.value))} min={10} max={400} step={1} className="flex-grow"/>
                        <button onClick={() => handleArrangeInCircle('doors')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Arrange</button>
                    </div>
                </div>
            </div>
          )}
           {activeTab === 'community' && (
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 space-y-4 text-gray-300">
                <h3 className="text-lg font-semibold text-cyan-300">Welcome to MOOSE!</h3>
                <p className="text-sm">MOOSE stands for My Ontological Operating System Environment. The vision is to create a decentralized network of interconnected 3D web spaces—a "MOOSE-NET".</p>
                <p className="text-sm">You can be a part of this by forking this project, customizing your own MOOSE page, and deploying it for others to visit.</p>
                <div className="pt-2">
                    <a href="https://github.com/zakdegarmo/web-dungeon.git" target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors inline-block">
                        Fork on GitHub
                    </a>
                </div>
                 <div className="pt-4 border-t border-gray-700/50 mt-4">
                    <h4 className="font-semibold text-cyan-300">Tip: Loading Models from GitHub</h4>
                    <p className="text-sm mt-1">To load a `.glb` or `.gltf` file from GitHub, find the file in the repository, click the <span className="font-bold text-white">"Raw"</span> button, and use that URL. The URL should start with `raw.githubusercontent.com`.</p>
                </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-700">
            <div className="flex gap-2">
                {activeTab === 'screens' && <button onClick={() => addItem('screens')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">+ Add Screen</button>}
                {activeTab === 'doors' && <button onClick={() => addItem('doors')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">+ Add Door</button>}
                {activeTab === 'objects' && (
                    <>
                        <button onClick={() => addItem('objects')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">+ Add Object</button>
                        <button onClick={() => objectUploadRef.current?.click()} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">+ Upload Model</button>
                        <input type="file" ref={objectUploadRef} onChange={handleObjectUpload} accept=".glb,.gltf" className="hidden"/>
                    </>
                )}
            </div>
            <button
                onClick={handleApplyChanges}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Apply & Close
            </button>
        </div>
      </div>
    </div>
  );
};
