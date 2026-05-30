import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FolderPlus, Tag, Trash2, Calendar, Plus, CornerDownRight, Check, Hash, Sparkles, BrainCircuit, X, Lightbulb } from 'lucide-react';
import { DiaryEntry, Category } from '../types';

interface DailyJournalCardProps {
  entries: DiaryEntry[];
  categories: Category[];
  onAddEntry: (content: string, category: string) => void;
  onDeleteEntry: (id: string) => void;
  onAddCategory: (name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
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
        
        {/* Toggleable Settings Trigger */}
        <button
          onClick={() => setShowCategoryToolbox(!showCategoryToolbox)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
            showCategoryToolbox 
              ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' 
              : 'bg-[#f7f5ef] text-stone-700 border-[#d9d5cb] hover:bg-[#edeae4]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          설정 {showCategoryToolbox ? '▲' : '▼'}
        </button>
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
