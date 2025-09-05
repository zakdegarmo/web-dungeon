
import React from 'react';
import { Html, useProgress } from '@react-three/drei';

export const Loader: React.FC = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-white">
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-lg font-medium">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  );
};
