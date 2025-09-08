
import React, { useEffect, useRef } from 'react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatHistoryProps {
  history: ChatMessage[];
  onClose: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ history, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  return (
    <div className="absolute bottom-24 left-4 z-20 w-80 max-w-[calc(100vw-2rem)] h-96 bg-black bg-opacity-60 backdrop-blur-md rounded-lg border border-cyan-500/50 shadow-lg flex flex-col font-mono">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="text-cyan-400 font-bold">MOOSE-BOT Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none p-1">&times;</button>
      </div>
      <div className="flex-grow p-3 overflow-y-auto space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded-lg text-sm break-words ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
