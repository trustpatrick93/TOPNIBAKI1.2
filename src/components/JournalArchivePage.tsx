import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  BrainCircuit, 
  Sparkles, 
  Coffee, 
  Layers, 
  X, 
  AlertCircle,
  TrendingUp,
  Inbox,
  Filter,
  Calendar,
  BarChart2
} from 'lucide-react';
import { DiaryEntry, Category } from '../types';

interface JournalArchivePageProps {
  entries: DiaryEntry[];
  categories: Category[];
  onDeleteEntry: (id: string) => void;
}

export default function JournalArchivePage({
  entries,
  categories,
  onDeleteEntry
}: JournalArchivePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // AI Psychology Analyzer states (integrated in archive view for rich interaction)
  const [analyzingEntry, setAnalyzingEntry] = useState<DiaryEntry | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    mood: string;
    score: number;
    description: string;
    color: string;
    icon: string;
  } | null>(null);

  // Filter diary listings
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery.trim() === '' || 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

  // Compute metrics from general states
  const metrics = useMemo(() => {
    const total = entries.length;
    
    // Count per category
    const counts: Record<string, number> = {};
    categories.forEach(cat => { counts[cat.name] = 0; });
    entries.forEach(e => {
      if (counts[e.category] !== undefined) {
        counts[e.category]++;
      } else {
        counts[e.category] = 1;
      }
    });

    // Estimate positive stress average as simulated metrics
    let happyTermsCount = 0;
    entries.forEach(e => {
      const c = e.content;
      if (c.includes('완료') || c.includes('행복') || c.includes('기쁜') || c.includes('성공') || c.includes('최고') || c.includes('감사') || c.includes('Cozy') || c.includes('좋은') || c.includes('수고')) {
        happyTermsCount++;
      }
    });
    const happyPercentage = total > 0 ? Math.round((happyTermsCount / total) * 100) : 0;

    return {
      total,
      counts,
      happyPercentage
    };
  }, [entries, categories]);

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

  return (
    <div className="space-y-6">
      {/* Metrics Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-stone-400 block uppercase font-bold">누적 기록 일수</span>
            <span className="text-2xl font-serif italic text-stone-850 font-black">{metrics.total}건</span>
          </div>
          <Inbox className="w-8 h-8 text-amber-600/30 shrink-0" />
        </div>

        {categories.map(cat => {
          const count = metrics.counts[cat.name] || 0;
          return (
            <div 
              key={cat.id} 
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={`p-4 border rounded-lg flex items-center justify-between shadow-2xs cursor-pointer transition-all ${
                selectedCategory === cat.name 
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' 
                  : 'bg-white border-[#ece9e0] hover:border-amber-300'
              }`}
            >
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono block font-bold" style={{ color: cat.color }}>
                  {cat.name} 분류
                </span>
                <span className="text-xl font-mono text-stone-800 font-bold">{count}건 기록됨</span>
              </div>
              <span 
                className="w-3.5 h-3.5 rounded-full border border-white shadow-xs shrink-0" 
                style={{ backgroundColor: cat.color }}
              />
            </div>
          );
        })}

        <div className="bg-[#f2efe6] border border-[#d1ccbe] rounded-lg p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono text-stone-500 block uppercase font-bold">긍정 마인드 비율</span>
            <span className="text-2xl font-mono text-[#b35210] font-black">{metrics.happyPercentage}%</span>
          </div>
          <TrendingUp className="w-8 h-8 text-orange-600/20 shrink-0" />
        </div>
      </div>

      {/* Grid: Search controls on the left, Timeline Feed list on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Left Column (or First): Search Filters */}
        <div className="lg:col-span-4 bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-5 shadow-sm space-y-5">
          <div className="border-b pb-2 flex items-center gap-1.5 text-stone-850">
            <Filter className="w-4 h-4 text-amber-700" />
            <h4 className="font-mono font-black text-xs uppercase tracking-widest">분류 필터 대시보드</h4>
          </div>

          {/* Keyword search input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-stone-550 block">키워드 일치 검색</label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="일지 내용에서 단어 찾기..."
                className="w-full bg-white border border-[#d2cebf] rounded-md pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Select filter pills */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-stone-550 block">카테고리 개별 지정</span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`text-xs font-mono py-1.5 px-3 rounded border text-left flex items-center justify-between transition-colors ${
                  !selectedCategory
                    ? 'bg-stone-900 border-stone-900 text-white font-bold'
                    : 'bg-white border-stone-200 hover:bg-[#faf9f3] text-stone-700'
                }`}
              >
                <span>전체 분류 보기</span>
                <span className="text-[10px] font-mono opacity-80">{entries.length}건</span>
              </button>
              {categories.map((cat) => {
                const count = entries.filter(e => e.category === cat.name).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`text-xs font-mono py-1.5 px-3 rounded border text-left flex items-center justify-between transition-all ${
                      selectedCategory === cat.name
                        ? 'border-2 text-stone-900 font-bold'
                        : 'bg-white border-stone-200 hover:bg-[#faf9f3]'
                    }`}
                    style={{
                      borderColor: selectedCategory === cat.name ? cat.color : '#e2e8f0',
                      color: cat.color,
                      backgroundColor: selectedCategory === cat.name ? cat.color + '12' : 'transparent',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">{count}건</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/50 rounded-md p-3 text-[11px] leading-relaxed text-stone-600">
            <span className="font-mono text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black block w-fit mb-1">
              AI ADVICE
            </span>
            기록이 축적될수록 AI 마음 분석기가 핵심 심리 궤적과 내면 활성도 피드백을 한층 고해상도로 교정해 줍니다.
          </div>
        </div>

        {/* Right Column (or Second): Timeline Archive Feed */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-[#fcfbfa] border border-[#d9d5cb] rounded-lg p-5 shadow-sm min-h-[420px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#ece9e0] pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-mono font-bold text-stone-600">
                    ARCHIVE TIMELINE ({filteredEntries.length} RECORDS FILTERED)
                  </span>
                </div>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200 py-0.5 px-2 rounded-full flex items-center gap-1"
                  >
                    <span>{selectedCategory} 필터 해제</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-24 font-serif italic text-xs text-stone-400">
                      일치하는 일지 기록을 찾을 수 없습니다. 조건을 완화해 보십시오.
                    </div>
                  ) : (
                    [...filteredEntries]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((entry, index) => {
                        const catObj = categories.find(c => c.name === entry.category) || { color: '#7c2d12' };
                        const entryDate = new Date(entry.createdAt);
                        const formattedTime = entryDate.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        const formattedDateStr = `${entryDate.getFullYear()}년 ${entryDate.getMonth() + 1}월 ${entryDate.getDate()}일`;

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ delay: Math.min(index * 0.04, 0.2) }}
                            className="group flex gap-3.5 bg-white border border-[#ece9e0] hover:border-amber-300 p-4 rounded-lg shadow-2xs transition-all relative"
                          >
                            {/* Date vertical node accent */}
                            <div className="flex flex-col items-center justify-start border-r border-[#ece9e0] pr-3.5 shrink-0 min-w-[84px] text-right">
                              <span className="text-[10px] font-mono text-stone-400 block tracking-tighter">
                                {formattedTime}
                              </span>
                              <span className="text-xs font-mono font-bold text-stone-800 block mt-0.5 whitespace-nowrap">
                                {entryDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[8px] font-sans text-stone-400 opacity-80 block mt-0.5">
                                {entryDate.getFullYear()}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-[9px] font-mono px-2 py-0.5 rounded font-semibold"
                                  style={{
                                    backgroundColor: catObj.color + '18',
                                    color: catObj.color,
                                    border: `1px solid ${catObj.color}25`
                                  }}
                                >
                                  {entry.category}
                                </span>
                              </div>
                              <p className="text-xs text-stone-800 font-sans leading-relaxed break-words whitespace-pre-wrap">
                                {entry.content}
                              </p>
                            </div>

                            {/* Options handles */}
                            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-all self-start ml-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => performAIAnalysis(entry)}
                                className="p-1 rounded hover:bg-amber-50 text-amber-700 transition-all cursor-pointer border border-[#ece9e0] bg-white shadow-2xs hover:border-amber-200"
                                title="AI 심리 회고 처방전"
                              >
                                <BrainCircuit className="w-4 h-4 animate-pulse" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEntry(entry.id)}
                                className="p-1 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all cursor-pointer border border-[#ece9e0] bg-white shadow-2xs hover:border-rose-200"
                                title="기록 영구 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Psychology Analysis Modal Overlay inside Archive */}
      <AnimatePresence>
        {analyzingEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setAnalyzingEntry(null)}
              className="absolute inset-0 bg-stone-950"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-[#fcfbfa] border-2 border-stone-850 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-left"
            >
              <button
                onClick={() => setAnalyzingEntry(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b pb-3 mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-amber-600 animate-pulse" />
                <h4 className="font-mono font-black text-xs text-stone-900 uppercase">
                  AI MIND ANALYZER
                </h4>
              </div>

              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 1.5 }}
                    className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full"
                  />
                  <p className="text-[11px] font-mono text-stone-500 animate-pulse text-center">
                    일지 텍스트 인덱싱 & 심리 단어 매핑 중...
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-4">
                  <div className="bg-stone-50 border border-stone-200/60 rounded p-2.5 bg-[#fbf9f4]">
                    <p className="text-[10px] font-mono font-bold text-stone-400 uppercase">원본 일지 내용</p>
                    <p className="text-xs text-stone-700 mt-1 italic line-clamp-2">
                      &ldquo;{analyzingEntry.content}&rdquo;
                    </p>
                  </div>

                  <div className={`border p-3.5 rounded-lg flex items-start gap-3 ${analysisResult.color}`}>
                    <span className="text-2xl pt-0.5">{analysisResult.icon}</span>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-70">
                        종합 기분 지수: {analysisResult.score}%
                      </p>
                      <h5 className="text-xs font-bold font-sans">
                        {analysisResult.mood}
                      </h5>
                    </div>
                  </div>

                  <div className="bg-amber-50/40 border border-amber-200/50 p-3 rounded-lg text-[11px] leading-relaxed text-stone-700 space-y-2">
                    <div className="flex items-center gap-1 text-amber-900 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 심리 분석 처방전</span>
                    </div>
                    <p>{analysisResult.description}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => setAnalyzingEntry(null)}
                      className="bg-stone-900 text-white font-mono text-[11px] py-1.5 px-3.5 rounded hover:bg-amber-700 hover:text-white transition-all cursor-pointer font-bold shadow-xs"
                    >
                      마음 분석 닫기
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
