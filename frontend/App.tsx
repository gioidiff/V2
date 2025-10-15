
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateScenes, expandScript } from './services/geminiService';
import { Scene, SceneArray } from './types';
import SceneCard from './components/SceneCard';
import Spinner from './components/Spinner';
import { AnalyzeIcon, CheckIcon, ExportIcon, FolderIcon, HeaderLogoIcon, PanelInputIcon, PanelOutputIcon, ProfileIcon, ResizeIcon, StatusIcon, TrashIcon } from './components/icons';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [charDesc, setCharDesc] = useState<string>('');
  const [scenes, setScenes] = useState<SceneArray>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Chào mừng đến với PromptVEO3');
  const [expandCount, setExpandCount] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim()) {
      setStatusText('Lỗi: Vui lòng nhập Transcript!');
      return;
    }
    setLoading(true);
    setScenes([]);
    setStatusText('Đang phân tích...');
    try {
      const result = await generateScenes(transcript, charDesc);
      setScenes(result);
      setStatusText(`Phân tích hoàn thành (Gemini) - ${result.length} cảnh được tạo`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Lỗi không xác định.';
      setStatusText(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [transcript, charDesc]);

  const handleExpandScript = useCallback(async () => {
    if (scenes.length === 0) {
      setStatusText('Lỗi: Cần có cảnh hiện tại để mở rộng.');
      return;
    }
    setLoading(true);
    setStatusText(`Đang mở rộng kịch bản thêm ${expandCount} cảnh...`);
    try {
      const newScenes = await expandScript(scenes, expandCount);
      const combinedScenes = [...scenes, ...newScenes];
      setScenes(combinedScenes);
      setStatusText(`Mở rộng thành công. Tổng số cảnh: ${combinedScenes.length}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Lỗi không xác định.';
      setStatusText(`Lỗi mở rộng: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [scenes, expandCount]);

  const handleClear = () => {
    setTranscript('');
    setCharDesc('');
    setScenes([]);
    setStatusText('Đã xóa tất cả dữ liệu.');
  };

  const handleFileOpenClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTranscript(text);
        setStatusText(`Đã tải file: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleJsonExport = () => {
    if(scenes.length === 0) {
        setStatusText("Lỗi: Không có dữ liệu để xuất.");
        return;
    }
    const jsonString = JSON.stringify(scenes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusText("Đã xuất file JSON thành công.");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        handleAnalyze();
      }
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleJsonExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAnalyze, handleJsonExport]);

  const totalDuration = scenes.reduce((acc, scene) => acc + (scene.scene_length_seconds || 0), 0);

  return (
    <div className="bg-[#0d1217] text-[#c7d5e0] font-sans flex flex-col h-screen">
      <header className="bg-[#1a2129] flex items-center justify-between p-2 border-b border-[#2c3e50]">
        <div className="flex items-center gap-2">
          <HeaderLogoIcon />
          <span className="font-bold">PromptVEO3 Basic (V2)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Hồ sơ: Xuaa</span>
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-300"></div>
          <button className="bg-[#2c3e50] hover:bg-[#34495e] px-4 py-1 rounded-md text-sm">Hồ sơ</button>
        </div>
      </header>

      <main className="flex-grow flex p-4 gap-4 overflow-hidden">
        {/* Input Panel */}
        <div className="w-1/2 flex flex-col bg-[#1a2129] border border-[#2c3e50] rounded-lg p-4 gap-4">
          <div className="flex items-center gap-2 text-lg">
            <PanelInputIcon />
            <h3>Nhập liệu</h3>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcript..."
            className="flex-grow bg-[#0d1217] border border-[#2c3e50] rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#00a76f]"
          />
          <textarea
            value={charDesc}
            onChange={(e) => setCharDesc(e.target.value)}
            placeholder="Mô tả nhân vật (tùy chọn)..."
            className="h-1/3 bg-[#0d1217] border border-[#2c3e50] rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#00a76f]"
          />
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" id="hideBrowser" className="accent-[#00a76f]" />
            <label htmlFor="hideBrowser">Ẩn trình duyệt khi phân tích</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md" />
            <button onClick={handleFileOpenClick} className="bg-[#1877f2] hover:bg-blue-600 p-2 rounded-md flex items-center justify-center gap-2"><FolderIcon /> Mở file</button>
            <button onClick={handleClear} className="bg-[#454f5b] hover:bg-[#5a6673] p-2 rounded-md flex items-center justify-center gap-2"><TrashIcon /> Xóa</button>
            <button onClick={handleAnalyze} disabled={loading} className="bg-[#00a76f] hover:bg-green-700 p-2 rounded-md flex items-center justify-center gap-2 disabled:bg-gray-500">
                {loading && scenes.length === 0 ? <Spinner/> : <AnalyzeIcon/>} Phân tích (F5)
            </button>
            <button onClick={handleJsonExport} className="bg-[#ffab00] hover:bg-amber-500 text-black p-2 rounded-md flex items-center justify-center gap-2"><ExportIcon /> Xuất JSON (Ctrl+E)</button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-1/2 flex flex-col bg-[#1a2129] border border-[#2c3e50] rounded-lg p-4 gap-4">
          <div className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <PanelOutputIcon />
              <h3>Kết quả</h3>
            </div>
            <div className="text-sm">
              <span>Số cảnh: {scenes.length}</span> | <span>Tổng thời lượng: {totalDuration.toFixed(1)}s</span>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto pr-2 space-y-3">
             {scenes.length > 0 ? (
                scenes.map((scene, index) => <SceneCard key={scene.scene_id} scene={scene} index={index} />)
            ) : (
                <div className="text-gray-400 h-full flex items-center justify-center">Chưa có kết quả phân tích...</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Số cảnh mở rộng:</span>
            <input 
                type="number" 
                value={expandCount}
                onChange={(e) => setExpandCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-[#0d1217] border border-[#2c3e50] rounded-md p-1 text-center" 
            />
            <button onClick={handleExpandScript} disabled={loading} className="bg-[#454f5b] hover:bg-[#5a6673] p-2 rounded-md flex items-center justify-center gap-2 flex-grow disabled:bg-gray-500">
                {loading && scenes.length > 0 ? <Spinner /> : <ProfileIcon />} Mở rộng kịch bản
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-[#1a2129] flex items-center justify-between p-1.5 border-t border-[#2c3e50] text-xs">
        <div className="flex items-center gap-2">
            <StatusIcon />
            <span>{statusText}</span>
        </div>
        <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Xuaa</span>
            <ResizeIcon />
        </div>
      </footer>
    </div>
  );
};

export default App;
