import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FolderPlus, Tag, Trash2, Calendar, Plus, CornerDownRight, Check, Hash, Sparkles, BrainCircuit, X, Lightbulb, ShieldCheck, HardDrive, Cloud, ExternalLink, Lock } from 'lucide-react';
import { DiaryEntry, Category } from '../types';

interface DailyJournalCardProps {
  entries: DiaryEntry[];
  categories: Category[];
  onAddEntry: (content: string, category: string) => void;
  onDeleteEntry: (id: string) => void;
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;

  // Backup configurations passed from core App container
  localBackupEnabled: boolean;
  onToggleLocalBackup: (val: boolean) => void;
  oneDriveEnabled: boolean;
  onToggleOneDrive: (val: boolean) => void;
  oneDriveFolder: string;
  onUpdateOneDriveFolder: (folderName: string) => void;
  oneDriveClientId: string;
  onUpdateOneDriveClientId: (clientId: string) => void;
  oneDriveToken: string | null;
  onOneDriveLogout: () => void;
}

const PRESET_VINTAGE_COLORS = [
  '#b45309', // Amber-700
  '#15803d', // Green-700
  '#0369a1', // Sky-700
  '#a21caf', // Fuchsia-700
  '#be123c', // Rose-700
  '#4d7c0f', // Lime-700
  '#6d28d9', // Violet-700
];

export default function DailyJournalCard({
  entries,
  categories,
  onAddEntry,
  onDeleteEntry,
  onAddCategory,
  onDeleteCategory,
  localBackupEnabled,
  onToggleLocalBackup,
  oneDriveEnabled,
  onToggleOneDrive,
  oneDriveFolder,
  onUpdateOneDriveFolder,
  oneDriveClientId,
  onUpdateOneDriveClientId,
  oneDriveToken,
  onOneDriveLogout,
}: DailyJournalCardProps) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || '⚙️ 일상');

  useEffect(() => {
    if (categories.length > 0 && !categories.some(c => c.name === selectedCategory)) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);
  
  // Category management tools state
  const [showCategoryToolbox, setShowCategoryToolbox] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_VINTAGE_COLORS[0]);

  // Backup Security Dashboard toggle state
  const [showBackupCenter, setShowBackupCenter] = useState(false);
  const [tempFolder, setTempFolder] = useState(oneDriveFolder);
  const [tempClientId, setTempClientId] = useState(oneDriveClientId);

  useEffect(() => {
    setTempFolder(oneDriveFolder);
  }, [oneDriveFolder]);

  useEffect(() => {
    setTempClientId(oneDriveClientId);
  }, [oneDriveClientId]);

  const handleOneDriveLoginRedirect = () => {
    try {
      const clientId = tempClientId.trim() || 'a1ebf7c0-2621-4f1b-b463-b6dc29329fc3';
      const redirectUri = encodeURIComponent(window.location.origin);
      const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=files.readwrite%20User.Read&response_mode=fragment&state=onedrive_auth`;
      window.location.href = url;
    } catch (e) {
      console.error("OneDrive login setup error:", e);
    }
  };

  // AI Psychology Analyzer states
  const [analyzingEntry, setAnalyzingEntry] = useState<DiaryEntry | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    mood: string;
    score: number;
    description: string;
    color: string;
    icon: string;
  } | null>(null);

  const performAIAnalysis = (entry: DiaryEntry) => {
    setAnalyzingEntry(entry);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const txt = entry.content;
    let mood = '차분하고 정돈된 내면 균형';
    let score = 70;
    let color = 'text-amber-800 bg-amber-50 border-amber-200';
    let icon = '🧘';
    let description = '정성들여 정제된 가치 있는 하루를 가꾸어가고 있습니다. 꾸준한 일지 작성은 뇌 인지 부하를 줄여 우수한 의사결정을 돕습니다.';

    if (txt.includes('힘들') || txt.includes('피곤') || txt.includes('스트레스') || txt.includes('어렵') || txt.includes('지친') || txt.includes('우울')) {
      mood = '스트레스 누적 및 휴식 우선 권고';
      score = 42;
      color = 'text-rose-800 bg-rose-50 border-rose-200';
      icon = '😫';
      description = '격무와 의무감으로 심적 부담이 누적된 흔적이 보입니다. 잠시 가벼운 산책이나 휴식으로 디지털 디톡스를 하고 뇌에 산소를 보급하는 것을 권장합니다.';
    } else if (txt.includes('완료') || txt.includes('행복') || txt.includes('기쁜') || txt.includes('성공') || txt.includes('최고') || txt.includes('감사') || txt.includes('Cozy') || txt.includes('좋은') || txt.includes('수고')) {
      mood = '활기찬 성취감 및 긍정 충만 전성기';
      score = 92;
      color = 'text-emerald-800 bg-emerald-50 border-emerald-250';
      icon = '🚀';
      description = '학습과 내면 성취감이 아주 조화롭게 만개해 있는 주간입니다. 오늘의 우수한 효율성과 밝은 에너지를 간직하며 스스로에게 가벼운 보상을 건네보세요.';
    } else if (txt.includes('주식') || txt.includes('매수') || txt.includes('매도') || txt.includes('차트') || txt.includes('계좌') || txt.includes('투자') || txt.includes('수익')) {
      mood = '이성적 탐색 및 분석 뇌 활성화';
      score = 78;
      color = 'text-blue-800 bg-blue-50 border-blue-200';
      icon = '📈';
      description = '전략적인 계좌 흐름 및 시장 분석에 집중한 수고가 담겨 있습니다. 차트 등락에 조급해하기보다 명확히 명문화된 정석 매매 원칙을 점검하는 것을 지지합니다.';
    }

    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({ mood, score, description, color, icon });
    }, 1200);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddEntry(content, selectedCategory);
    setContent('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim(), newCategoryColor);
    setNewCategoryName('');
  };

  return (
    <div className="bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-5 shadow-sm space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-[#ece9e0] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <h3 className="font-mono font-black text-sm tracking-widest text-[#1c1c1a] uppercase">
            JOURNAL Log
          </h3>
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Toggleable Settings Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowCategoryToolbox(!showCategoryToolbox);
              if (!showCategoryToolbox) setShowBackupCenter(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              showCategoryToolbox 
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' 
                : 'bg-[#f7f5ef] text-stone-700 border-[#d9d5cb] hover:bg-[#edeae4]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            분류 설정 {showCategoryToolbox ? '▲' : '▼'}
          </button>

          {/* Toggleable Backup Center Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowBackupCenter(!showBackupCenter);
              if (!showBackupCenter) setShowCategoryToolbox(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              showBackupCenter 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' 
                : 'bg-[#f7f5ef] text-stone-700 border-[#d9d5cb] hover:bg-[#edeae4]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            백업 아카이브 {showBackupCenter ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Toolbox drawer (Settings theme style) */}
      <AnimatePresence>
        {showCategoryToolbox && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#faf8f2] border border-amber-200/50 rounded p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-900 flex items-center gap-1">
                  <FolderPlus className="w-3.5 h-3.5" /> 일지 카테고리 설정
                </h4>
                <p className="text-[11px] text-amber-800 mt-1">
                  일지 기록에 사용할 신규 카테고리를 지정하거나 관리합니다.
                </p>
              </div>
            </div>

            {/* List existing categories */}
            <div className="flex flex-wrap gap-1.5 py-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border bg-white shadow-sm"
                  style={{ borderColor: cat.color + '30', color: cat.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  {cat.name}
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat.id)}
                      className="ml-1 hover:text-rose-600 transition-colors"
                      title="카테고리 삭제"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            {/* Create new category */}
            <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/40">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리명 (예: 🌱 성장)"
                className="col-span-1 bg-white border border-[#d2cebf] rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="col-span-1 flex items-center gap-1">
                <span className="text-[11px] font-mono text-stone-500">색상:</span>
                <div className="flex gap-1 overflow-x-auto py-1">
                  {PRESET_VINTAGE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className="w-4 h-4 rounded-full border border-stone-300 relative transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: color }}
                    >
                      {newCategoryColor === color && (
                        <Check className="w-2.5 h-2.5 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="col-span-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> 추가 등록
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Center drawer (Expandable Cozy Settings theme) */}
      <AnimatePresence>
        {showBackupCenter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#f4fbf7] border border-emerald-200 rounded p-4 space-y-4 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" /> 일지 데이터 안전 아카이빙 센터 (Double-Backup Guard)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  작성하신 일지를 절대 소실하지 않도록 로컬 컴퓨터 저장소와 마이크로소프트 OneDrive에 2중 실시간 TXT 백업을 지원합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/45">
              
              {/* Method 2: Local Copy Saving */}
              <div className="bg-white border border-emerald-100 p-3.5 rounded-lg space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-stone-850 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[#15803d]" /> 방법 2: 내 컴퓨터 자동 TXT 저장
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localBackupEnabled} 
                      onChange={(e) => onToggleLocalBackup(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#15803d]"></div>
                  </label>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  새 일지를 작성할 때마다 브라우저가 소장용 텍스트 파일(.txt)로 즉각 변환하여 컴퓨터에 <strong>즉시 자동 다운로드</strong>합니다.
                </p>
                <div className="bg-stone-50 p-2 rounded border border-stone-100 font-mono text-[9px] text-[#2c3e2f] leading-normal">
                  파일명 양식 예시:<br />
                  <span className="font-semibold text-emerald-700">톱니바퀴_일지_YYYY-MM-DD_HHMMSS.txt</span>
                </div>
              </div>

              {/* Method 1: Microsoft OneDrive Sync */}
              <div className="bg-white border border-emerald-100 p-3.5 rounded-lg space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-stone-850 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-600" /> 방법 1: 원드라이브(OneDrive) 실시간 동기화
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={oneDriveEnabled} 
                      disabled={!oneDriveToken}
                      onChange={(e) => onToggleOneDrive(e.target.checked)}
                      className="sr-only peer disabled:opacity-40" 
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-disabled:opacity-40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  계정 연동 후 활성화 시, 새 일지를 작성하는 즉시 본인의 Microsoft Cloud OneDrive 폴더 내에 <strong>텍스트 파일이 백업 저장</strong>됩니다.
                </p>

                {/* Connection Status Section */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  {oneDriveToken ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                        <span className="text-[10px] font-mono font-semibold text-emerald-700">OneDrive 연동 중</span>
                      </div>
                      <button
                        type="button"
                        onClick={onOneDriveLogout}
                        className="text-[9px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-350 py-0.5 px-2 rounded cursor-pointer transition-colors"
                      >
                        연동 해제
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0"></span>
                        <span className="text-[10px] font-mono text-stone-500">연동 끊김</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOneDriveLoginRedirect}
                        className="text-[9px] font-mono bg-blue-600 hover:bg-blue-700 text-white font-bold py-0.5 px-2 rounded cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> 연동 로그인
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Config details */}
            <div className="bg-[#fafcfb] border border-emerald-200/50 rounded-lg p-3.5 space-y-3.5 text-xs text-stone-700">
              <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black block w-fit">
                원드라이브 세부 설정 (OneDrive Details)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-stone-500 block">백업 폴더명</label>
                  <input
                    type="text"
                    value={tempFolder}
                    onChange={(e) => {
                      setTempFolder(e.target.value);
                      onUpdateOneDriveFolder(e.target.value);
                    }}
                    placeholder="예: Cogwheel_Diary_Backup"
                    className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[9px] text-stone-400 block mt-0.5">내 OneDrive 개인 공간 계정 내의 경로 폴더명입니다.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-stone-500 block flex items-center gap-1">
                    나만의 Microsoft CLIENT ID <Lock className="w-3 h-3 text-stone-400" />
                  </label>
                  <input
                    type="text"
                    value={tempClientId}
                    onChange={(e) => {
                      setTempClientId(e.target.value);
                      onUpdateOneDriveClientId(e.target.value);
                    }}
                    placeholder="지정하려면 입력 (선택사항)"
                    className="w-full bg-white border border-[#d2cebf] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[9px] text-stone-400 block mt-0.5">완전 독립적인 백업 보안이 필요하시면 무료 발급한 ID를 입력해 주십시오.</span>
                </div>
              </div>

              {/* Instructions Guide to register app */}
              <div className="bg-stone-50 border border-stone-200 rounded p-3 text-[10px] leading-relaxed text-stone-600 space-y-1.5">
                <p className="font-bold text-stone-800 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>💡 [독립 백업 가이드] 나만의 Microsoft Azure Application (Client) ID 등록 방법:</span>
                </p>
                <ol className="list-decimal pl-4.5 space-y-1 text-[10px]">
                  <li><a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">[Microsoft 앱 등록 포털]</a> 에 개인 Microsoft 아이디로 접속합니다.</li>
                  <li><strong>[새 등록 (New Registration)]</strong> 을 선택합니다.</li>
                  <li>이름에 <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-850 text-[9px]">나의 톱니바퀴 백업</code>을 적당히 적어줍니다.</li>
                  <li>지원 유형에서 <strong>&quot;모든 조직 디렉터리의 계정 및 개인 Microsoft 계정&quot;</strong>을 체크합니다.</li>
                  <li>리디렉션 URI 유형을 <strong>SPA (단일 페이지 애플리케이션)</strong> 선택 후, 공란에 <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-850 text-[9px]">{window.location.origin}</code> 을 복사합니다.</li>
                  <li>그 아래 [등록]을 마친 후 화면에 주어지는 <strong>&apos;애플리케이션(클라이언트) ID&apos;</strong>를 복사해서 위 공란에 넣어 연동해 주십시오!</li>
                </ol>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Input Form */}
      <form onSubmit={handleSubmitEntry} className="space-y-3">
        <div className="flex flex-wrap gap-1.5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                selectedCategory === cat.name
                  ? 'border-2 font-bold shadow-sm'
                  : 'border border-stone-200 hover:bg-stone-50'
              }`}
              style={{
                borderColor: selectedCategory === cat.name ? cat.color : '#e2e8f0',
                color: cat.color,
                backgroundColor: selectedCategory === cat.name ? cat.color + '15' : 'transparent',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘의 작업, 연구 성과물 또는 성찰 일지를 자유롭게 남기십시오."
            rows={4}
            className="flex-1 bg-[#fcfbfa] border border-[#d2cebf] rounded-md p-3 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans resize-none"
          />
          <button
            type="submit"
            className="bg-[#1c1c1a] hover:bg-amber-700 hover:text-white text-[#f7f5ef] px-4 rounded-md font-mono text-xs transition-all flex flex-col justify-center items-center gap-1 border border-stone-800 cursor-pointer shadow-sm w-16"
          >
            <Plus className="w-4 h-4" />
            <span>기록</span>
          </button>
        </div>
      </form>

    </div>
  );
}
