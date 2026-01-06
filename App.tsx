
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Guess } from './types';
import { getAiCommentary, getSecretHint } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    targetNumber: Math.floor(Math.random() * 100) + 1,
    guesses: [],
    isGameOver: false,
    statusMessage: "1에서 100 사이의 숫자를 맞춰보세요!",
    aiCommentary: "안녕! 나는 너의 게임 마스터 제미나이야. 행운을 빌어!",
    isAiLoading: false
  });

  const [inputValue, setInputValue] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerConfetti = () => {
    // @ts-ignore
    window.confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const startNewGame = useCallback(() => {
    setGameState({
      targetNumber: Math.floor(Math.random() * 100) + 1,
      guesses: [],
      isGameOver: false,
      statusMessage: "새 게임이 시작되었습니다! 1~100 사이의 숫자를 입력하세요.",
      aiCommentary: "오, 새로운 도전인가요? 이번엔 좀 더 어려울지도 몰라요!",
      isAiLoading: false
    });
    setInputValue('');
    setHint('');
  }, []);

  const handleGuess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const num = parseInt(inputValue);
    if (isNaN(num) || num < 1 || num > 100) {
      alert("1에서 100 사이의 유효한 숫자를 입력해주세요.");
      return;
    }

    if (gameState.isGameOver) return;

    let feedback: 'High' | 'Low' | 'Correct' = 'Correct';
    let statusMsg = "";

    if (num > gameState.targetNumber) {
      feedback = 'High';
      statusMsg = `${num}보다 작습니다!`;
    } else if (num < gameState.targetNumber) {
      feedback = 'Low';
      statusMsg = `${num}보다 큽니다!`;
    } else {
      feedback = 'Correct';
      statusMsg = `축하합니다! 정답은 ${num}이었습니다!`;
      triggerConfetti();
    }

    const newGuess: Guess = {
      value: num,
      feedback,
      timestamp: Date.now()
    };

    const newGuesses = [newGuess, ...gameState.guesses];
    const isWin = feedback === 'Correct';

    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      statusMessage: statusMsg,
      isGameOver: isWin,
      isAiLoading: true
    }));

    setInputValue('');

    // Fetch AI commentary
    const commentary = await getAiCommentary(
      num, 
      gameState.targetNumber, 
      gameState.guesses.length,
      gameState.guesses.map(g => g.value)
    );

    setGameState(prev => ({
      ...prev,
      aiCommentary: commentary,
      isAiLoading: false
    }));
  };

  const handleGetHint = async () => {
    if (gameState.isGameOver || gameState.isAiLoading) return;
    setGameState(prev => ({ ...prev, isAiLoading: true }));
    const hintText = await getSecretHint(gameState.targetNumber, gameState.guesses.map(g => g.value));
    setHint(hintText);
    setGameState(prev => ({ ...prev, isAiLoading: false }));
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameState.isGameOver]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          NUMBER QUEST
        </h1>
        <p className="text-slate-400 text-lg">AI 마스터와 함께하는 숫자 맞추기 게임</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Game Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="px-4 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">
                시도 횟수: {gameState.guesses.length}
              </div>
              <div className="text-slate-500 text-sm">범위: 1 - 100</div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-6 min-h-[3rem]">
              {gameState.statusMessage}
            </h2>

            {!gameState.isGameOver ? (
              <form onSubmit={handleGuess} className="flex gap-4">
                <input
                  ref={inputRef}
                  type="number"
                  min="1"
                  max="100"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="숫자 입력..."
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg transform active:scale-95 transition-all text-xl"
                >
                  확인
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={startNewGame}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-12 rounded-2xl shadow-xl transform hover:scale-105 active:scale-95 transition-all text-xl"
                >
                  다시 시작하기
                </button>
              </div>
            )}

            {/* AI Assistant Bubble */}
            <div className="mt-12 p-6 bg-slate-900/80 rounded-2xl border border-blue-500/20 relative group">
              <div className="absolute -top-3 left-6 px-2 py-0.5 bg-blue-600 text-[10px] font-bold rounded-md uppercase tracking-widest">
                Gemini Master
              </div>
              <p className={`text-slate-200 leading-relaxed italic ${gameState.isAiLoading ? 'animate-pulse' : ''}`}>
                "{gameState.aiCommentary}"
              </p>
              
              {!gameState.isGameOver && !hint && (
                <button 
                  onClick={handleGetHint}
                  disabled={gameState.isAiLoading}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-semibold underline decoration-dotted transition-colors disabled:opacity-50"
                >
                  {gameState.isAiLoading ? "생각 중..." : "힌트가 필요하신가요?"}
                </button>
              )}
              
              {hint && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300 animate-in fade-in slide-in-from-top-2 duration-500">
                  💡 <strong>Secret Hint:</strong> {hint}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Area */}
        <div className="space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-slate-700/30 h-full max-h-[600px] flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              추측 기록
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              {gameState.guesses.length === 0 ? (
                <div className="text-center text-slate-600 py-10 italic">
                  아직 기록이 없습니다.
                </div>
              ) : (
                gameState.guesses.map((g, i) => (
                  <div 
                    key={g.timestamp}
                    className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 animate-in slide-in-from-right-4 duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs font-mono">#{gameState.guesses.length - i}</span>
                      <span className="text-2xl font-black text-white">{g.value}</span>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      g.feedback === 'High' ? 'bg-red-500/20 text-red-400' :
                      g.feedback === 'Low' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {g.feedback === 'High' ? '낮춰주세요' : g.feedback === 'Low' ? '높여주세요' : '정답'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-slate-600 text-sm">
        Powered by Gemini 3 Flash • Built with React & Tailwind
      </footer>
    </div>
  );
};

export default App;
