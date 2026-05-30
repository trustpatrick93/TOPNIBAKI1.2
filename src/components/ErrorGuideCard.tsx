import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Globe, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function ErrorGuideCard() {
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm font-sans">
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
        <Info className="w-4 h-4 text-amber-600" />
        <h3 className="font-mono font-bold text-xs tracking-wider uppercase text-stone-700">
          오류 해결 가이드 (Troubleshooting Guide)
        </h3>
      </div>

      <div className="space-y-3">
        {/* Guide Toggle 1 */}
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setShowVercelGuide(!showVercelGuide)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-left">
              <Globe className="w-4 h-4 text-amber-600 shrink-0" />
              <span>로그인 시 [unauthorized-domain] 오류 발생</span>
            </span>
            {showVercelGuide ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showVercelGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 space-y-2 leading-relaxed">
                  <p className="font-semibold text-rose-700">원인: Firebase Authentication 승인 도메인에 해당 주소가 추가되지 않았습니다.</p>
                  <ol className="list-decimal pl-4 space-y-1.5 font-mono text-[11px] text-stone-500">
                    <li>Firebase 콘솔 &gt; Authentication으로 접근</li>
                    <li><strong>Settings</strong> 탭 &gt; <strong>Authorized domains</strong> 선택</li>
                    <li><strong>Add domain</strong>을 누르고 현재 브라우저 주소의 도메인(<span className="font-semibold text-stone-800">ais-dev-kzf4hunwlfgirjrrs55cmf-782041381308.asia-east1.run.app</span> 등)을 추가해 주십시오.</li>
                   </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Guide Toggle 2 */}
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setShowOAuthGuide(!showOAuthGuide)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>로그인 시 [403: access_denied] 오류 발생</span>
            </span>
            {showOAuthGuide ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showOAuthGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 space-y-2 leading-relaxed">
                  <p className="font-semibold text-rose-700">원인: Google Cloud Console의 OAuth 프로젝트가 테스트 상태여서 특정 테스터만 로그인 가능합니다.</p>
                  <ul className="list-disc pl-4 space-y-1.5 font-mono text-[11px] text-stone-500">
                    <li>Google Cloud Console &gt; API 및 서비스 &gt; OAuth 동의 화면으로 접근</li>
                    <li><strong>테스트 사용자 (Test users)</strong> 섹션에서 [Add Users] 선택</li>
                    <li>로그인을 시도하는 본인의 구글 이메일(<span className="font-semibold text-stone-800">hgfd930906@gmail.com</span> 등)을 추가해야 차단이 해결됩니다.</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
