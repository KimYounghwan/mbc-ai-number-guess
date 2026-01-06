
import { GoogleGenAI } from "@google/genai";

/**
 * 배포 환경(Vercel 등)에서는 process.env.API_KEY를 통해 키를 주입받습니다.
 * 로컬 테스트 시에는 개발 도구가 이를 처리합니다.
 */
const apiKey = "AIzaSyBrDYJGqDcGAKLEoBX2_IyaapO_JlmvTl8";
const aiClient = new GoogleGenAI({ apiKey });

// Game State
let state = {
    targetNumber: 0,
    guesses: [],
    isGameOver: false,
    isAiLoading: false
};

// DOM Elements
const elements = {
    guessForm: document.getElementById('guess-form'),
    guessInput: document.getElementById('guess-input'),
    statusMessage: document.getElementById('status-message'),
    aiCommentary: document.getElementById('ai-commentary'),
    attemptBadge: document.getElementById('attempt-badge'),
    historyList: document.getElementById('history-list'),
    resetContainer: document.getElementById('reset-container'),
    inputContainer: document.getElementById('input-container'),
    resetBtn: document.getElementById('reset-btn'),
    getHintBtn: document.getElementById('get-hint-btn'),
    hintDisplay: document.getElementById('hint-display'),
    hintText: document.getElementById('hint-text'),
    hintActionContainer: document.getElementById('hint-action-container')
};

// --- API Functions ---

async function fetchAiCommentary(guess, target, attempts, previousGuesses) {
    if (!apiKey) return "API 키가 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요.";
    
    try {
        const isHigher = guess < target;
        const distance = Math.abs(target - guess);
        
        let prompt = `You are a witty and encouraging game show host for a 'Guess the Number' game (1-100).
        The player just guessed ${guess}. The target is ${target}. 
        This is attempt number ${attempts}.
        The guess is too ${isHigher ? 'LOW' : 'HIGH'}. 
        The distance from the target is ${distance}.
        Previous guesses: ${previousGuesses.join(', ')}.
        
        Provide a short, 1-2 sentence response in Korean. 
        Be funny, supportive, or slightly mysterious. 
        If they are very close (within 5), be excited.
        If they are very far (more than 30), give a playful tease.
        Do not reveal the target number.`;

        if (guess === target) {
            prompt = `The player WON! They guessed the target number ${target} in ${attempts} attempts.
            Give a grand, celebratory 2-sentence congratulatory message in Korean.`;
        }

        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { temperature: 0.8 }
        });

        return response.text || "흥미진진한 전개네요! 다음 숫자는 무엇일까요?";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "과연 이 숫자가 맞을까요? 계속 도전해보세요!";
    }
}

async function fetchSecretHint(target, previousGuesses) {
    if (!apiKey) return "API 키를 설정해주세요.";
    
    try {
        const prompt = `The target number is ${target}. The player has already guessed: ${previousGuesses.join(', ')}.
        Provide a cryptic but helpful hint in Korean about the target number without revealing it directly.
        For example, mention if it's prime, even/odd, its relation to a famous number, or its tens digit in a riddle-like way.
        Keep it to one short sentence.`;

        const response = await aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { temperature: 0.9 }
        });

        return response.text || "숫자의 기운이 심상치 않군요...";
    } catch (error) {
        return "흐음... 좀 더 집중해보세요!";
    }
}

// --- Logic Functions ---

function initGame() {
    state = {
        targetNumber: Math.floor(Math.random() * 100) + 1,
        guesses: [],
        isGameOver: false,
        isAiLoading: false
    };

    // Reset UI
    elements.statusMessage.innerText = "1에서 100 사이의 숫자를 맞춰보세요!";
    elements.aiCommentary.innerText = "안녕! 나는 너의 게임 마스터 제미나이야. 행운을 빌어!";
    elements.attemptBadge.innerText = "시도 횟수: 0";
    elements.historyList.innerHTML = `<div class="text-center text-slate-600 py-10 italic">아직 기록이 없습니다.</div>`;
    elements.guessInput.value = '';
    elements.hintDisplay.classList.add('hidden');
    elements.hintActionContainer.classList.remove('hidden');
    elements.inputContainer.classList.remove('hidden');
    elements.resetContainer.classList.add('hidden');
    elements.guessInput.focus();
}

function updateHistoryUI() {
    if (state.guesses.length === 0) return;

    elements.historyList.innerHTML = state.guesses.map((g, i) => `
        <div class="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/50 animate-in slide-in-from-right-4 duration-300">
            <div class="flex items-center gap-3">
                <span class="text-slate-500 text-xs font-mono">#${state.guesses.length - i}</span>
                <span class="text-2xl font-black text-white">${g.value}</span>
            </div>
            <span class="text-sm font-bold px-3 py-1 rounded-full ${
                g.feedback === 'High' ? 'bg-red-500/20 text-red-400' :
                g.feedback === 'Low' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-emerald-500/20 text-emerald-400'
            }">
                ${g.feedback === 'High' ? '낮춰주세요' : g.feedback === 'Low' ? '높여주세요' : '정답'}
            </span>
        </div>
    `).join('');
}

async function handleGuess(event) {
    event.preventDefault();
    if (state.isGameOver) return;

    const val = parseInt(elements.guessInput.value);
    if (isNaN(val) || val < 1 || val > 100) return;

    let feedback = 'Correct';
    if (val > state.targetNumber) feedback = 'High';
    else if (val < state.targetNumber) feedback = 'Low';

    const newGuess = {
        value: val,
        feedback,
        timestamp: Date.now()
    };

    state.guesses = [newGuess, ...state.guesses];
    elements.attemptBadge.innerText = `시도 횟수: ${state.guesses.length}`;

    if (feedback === 'Correct') {
        state.isGameOver = true;
        elements.statusMessage.innerText = `축하합니다! 정답은 ${val}이었습니다!`;
        elements.inputContainer.classList.add('hidden');
        elements.resetContainer.classList.remove('hidden');
        // @ts-ignore
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        elements.statusMessage.innerText = `${val}보다 ${feedback === 'High' ? '작습니다' : '큽니다'}!`;
    }

    updateHistoryUI();
    elements.guessInput.value = '';

    // AI Commentary
    elements.aiCommentary.classList.add('animate-pulse-slow');
    const commentary = await fetchAiCommentary(
        val, 
        state.targetNumber, 
        state.guesses.length, 
        state.guesses.map(g => g.value)
    );
    elements.aiCommentary.innerText = `"${commentary}"`;
    elements.aiCommentary.classList.remove('animate-pulse-slow');
}

async function handleGetHint() {
    if (state.isGameOver || state.isAiLoading) return;
    
    elements.getHintBtn.innerText = "생각 중...";
    elements.getHintBtn.disabled = true;
    
    const hint = await fetchSecretHint(state.targetNumber, state.guesses.map(g => g.value));
    
    elements.hintText.innerText = hint;
    elements.hintDisplay.classList.remove('hidden');
    elements.hintActionContainer.classList.add('hidden');
}

// --- Event Listeners ---

elements.guessForm.addEventListener('submit', handleGuess);
elements.resetBtn.addEventListener('click', initGame);
elements.getHintBtn.addEventListener('click', handleGetHint);

// Start
initGame();
