import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Globe, ChevronDown, ChevronUp, Info, Calendar } from 'lucide-react';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

export default function ErrorGuideCard() {
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);
  const [showApiGuide, setShowApiGuide] = useState(false);
  const [showUseragentGuide, setShowUseragentGuide] = useState(false);

  const projectId = defaultFirebaseConfig.projectId || 'patrickroom-93';

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
                    <li>Google Cloud / Firebase 콘솔 &gt; Authentication으로 접근</li>
                    <li><strong>Settings</strong> 탭 &gt; <strong>Authorized domains</strong> 선택</li>
                    <li><strong>Add domain</strong>을 누르고 현재 웹사이트 주소의 도메인을 입력하여 추가해 주십시오. (예: <span className="font-semibold text-stone-800">ais-dev-kzf4hunwlfgirjrrs55cmf-782041381308.asia-east1.run.app</span> 혹은 배포한 Vercel 도메인)</li>
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

        {/* Guide Toggle 2.5: Mobile disallowed_useragent */}
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowUseragentGuide(!showUseragentGuide)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-rose-700 font-bold">모바일 403: disallowed_useragent 해결</span>
            </span>
            {showUseragentGuide ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showUseragentGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 space-y-2.5 leading-relaxed font-sans">
                  <p className="font-semibold text-stone-850">
                    💡 <span className="text-rose-700">원인:</span> 카카오톡, 네이버, 인스타그램 등 SNS 내장 브라우저 앱에서는 Google 정책상 Google OAuth 로그인을 원천적으로 차단합니다 (disallowed_useragent 오류).
                  </p>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-stone-800 text-[11px] border-l-2 border-amber-600 pl-2">해결 방법 1: 이메일 간편 로그인 사용 (가장 추천)</p>
                    <p className="text-[11px] text-stone-500 pl-2">
                      화면 로고 하단에 있는 <strong>[1. 이메일 편의 동기화]</strong>를 사용하십시오. 비밀번호나 팝업 차단 없이 이메일만 입력하면 SNS 인앱에서도 즉시 안전하게 로그인되며, 작성한 데이터 또한 PC와 완벽히 2 Way 실시간 동기화됩니다.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-stone-800 text-[11px] border-l-2 border-stone-600 pl-2">해결 방법 2: 외부 정식 웹브라우저로 다시 열기</p>
                    <ol className="list-decimal pl-6 space-y-1 text-[11px] text-stone-500 font-mono">
                      <li>우측 하단 또는 상단의 점 세 개 <span className="font-bold text-stone-800">(⋯)</span> 버튼을 가볍게 누릅니다.</li>
                      <li><strong>[다른 브라우저로 열기]</strong> 혹은 <strong>[웹브라우저에서 열기]</strong>(Safari / Chrome / Samsung Internet)를 터치합니다.</li>
                      <li>연결된 기본 브라우저 창에서 정상적으로 <span className="font-bold text-stone-800">Google 로그인</span>을 시도하십시오.</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Guide Toggle 3 */}
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setShowApiGuide(!showApiGuide)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-left">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>로그인 후 [Sync failed / 403 API Error] 발생</span>
            </span>
            {showApiGuide ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>
          
          <AnimatePresence initial={false}>
            {showApiGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600 space-y-2 leading-relaxed">
                  <p className="font-semibold text-rose-700">원인: 새로 변경하신 Firebase Google Cloud 프로젝트에 Google Calendar API가 활성화되지 않았습니다.</p>
                  <ol className="list-decimal pl-4 space-y-1.5 font-mono text-[11px] text-stone-500">
                    <li>
                      <a 
                        href={`https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${projectId}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-amber-700 font-bold underline hover:text-amber-800"
                      >
                        [GCP Calendar API 라이브러리 이동]
                      </a> 
                      링크를 클릭하여 접속해 주세요.
                    </li>
                    <li>접속한 페이지 우상단의 활성 프로젝트 명이 <span className="font-semibold text-stone-800">{projectId}</span>인지 확인합니다.</li>
                    <li>화면 중앙의 파란색 <strong>사용 (Enable)</strong> 버튼을 클릭하여 API를 활성화해 주십시오.</li>
                    <li>활성화 후 앱에서 새로고침하거나 상단 우측의 <strong>[동기화 반영]</strong> 버튼을 누르면 정상 동작합니다.</li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
