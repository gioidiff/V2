
import React, { useState, useCallback } from 'react';
import { Scene } from '../types';

interface SceneCardProps {
  scene: Scene;
  index: number;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, index }) => {
  const [copyText, setCopyText] = useState('Copy');

  const handleCopy = useCallback(() => {
    const jsonString = JSON.stringify(scene, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 2000);
    });
  }, [scene]);
  
  const jsonString = JSON.stringify(scene, null, 2);

  return (
    <div className="bg-[#161c24] border border-[#2c3e50] rounded-lg shadow-lg overflow-hidden">
      <div className="bg-[#212b36] p-2 font-bold text-sm">
        Cảnh {index + 1}
      </div>
      <div className="p-3">
        <pre className="text-xs text-gray-300 bg-[#0d1217] p-2 rounded-md h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
          {jsonString}
        </pre>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button className="bg-[#454f5b] hover:bg-[#5a6673] text-white text-sm py-1 rounded-md transition-colors">Sửa</button>
          <button className="bg-[#454f5b] hover:bg-[#5a6673] text-white text-sm py-1 rounded-md transition-colors">Sửa bằng AI</button>
          <button onClick={handleCopy} className="bg-[#454f5b] hover:bg-[#5a6673] text-white text-sm py-1 rounded-md transition-colors">{copyText}</button>
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
