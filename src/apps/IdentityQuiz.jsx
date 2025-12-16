import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Check, X, Trophy, GraduationCap, ArrowRight, Delete, Home as HomeIcon } from 'lucide-react';

// --- KaTeX 加載與渲染組件 (替代 react-katex) ---

// 1. 動態加載 Script 和 CSS
const loadKatex = () => {
  return new Promise((resolve, reject) => {
    if (window.katex) {
      resolve();
      return;
    }

    // 加載 CSS
    if (!document.querySelector('link[href*="katex.min.css"]')) {
      const link = document.createElement('link');
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    // 加載 JS
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// 2. 自定義 LaTeX 組件
const Latex = ({ math, block = false }) => {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadKatex().then(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded && window.katex && containerRef.current) {
      try {
        window.katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          output: 'html',
        });
      } catch (e) {
        console.error("KaTeX render error:", e);
        containerRef.current.innerText = math;
      }
    }
  }, [math, block, isLoaded]);

  return <span ref={containerRef} className={block ? "block text-center my-2 katex-block" : "inline-block"} />;
};

// --- 主應用程式 ---

const IdentityQuiz = () => {
  // 恆等式類型定義
  const IDENTITIES = {
    PLUS_SQ: 'plus_sq',
    MINUS_SQ: 'minus_sq',
    DIFF_SQ: 'diff_sq'
  };
  
  // 遊戲狀態
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('idle');
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  
  const inputRef = useRef(null);

  // ✅ 提取題目中的變數
  const extractVariables = (questionText) => {
    if (!questionText) return ['x', 'y'];
    const matches = questionText.match(/[a-z]/g);
    if (!matches || matches.length === 0) return ['x', 'y'];
    const unique = [...new Set(matches)].sort();
    return unique.length >= 2 ? unique.slice(0, 2) : [unique[0], 'y'];
  };

  // ✅ 用 useMemo 緩存變數
  const currentVariables = useMemo(() => {
    return currentQuestion ? extractVariables(currentQuestion.text) : ['x', 'y'];
  }, [currentQuestion]);

  // 生成隨機項
  const generateTerm = (allowVariable = true) => {
    const vars = ['x', 'y', 'a', 'b', 'n', 'm'];
    const isVar = allowVariable ? Math.random() > 0.4 : false;
    
    if (isVar) {
      const v = vars[Math.floor(Math.random() * vars.length)];
      const coeff = Math.floor(Math.random() * 8) + 1;
      return { str: coeff === 1 ? v : `${coeff}${v}`, val: { type: 'var', coeff, char: v } };
    } else {
      const num = Math.floor(Math.random() * 9) + 1;
      return { str: `${num}`, val: { type: 'num', val: num } };
    }
  };

  const getSquareStr = (term) => {
    if (term.val.type === 'num') {
      return (term.val.val * term.val.val).toString();
    } else {
      const cSq = term.val.coeff * term.val.coeff;
      return cSq === 1 ? `${term.val.char}^2` : `${cSq}${term.val.char}^2`;
    }
  };

  const get2ABStr = (termA, termB) => {
    let coeff = 2;
    let vars = '';
    
    if (termA.val.type === 'num') coeff *= termA.val.val;
    else {
      coeff *= termA.val.coeff;
      vars += termA.val.char;
    }

    if (termB.val.type === 'num') coeff *= termB.val.val;
    else {
      coeff *= termB.val.coeff;
      vars += termB.val.char;
    }

    vars = vars.split('').sort().join('');
    return `${coeff}${vars}`;
  };

  const generateQuestion = () => {
    let termA, termB;
    do {
      termA = generateTerm(true);
      termB = generateTerm(true);
    } while (
      (termA.val.type === 'num' && termB.val.type === 'num') || 
      (termA.val.type === 'var' && termB.val.type === 'var' && termA.val.char === termB.val.char)
    );

    const types = [IDENTITIES.PLUS_SQ, IDENTITIES.MINUS_SQ, IDENTITIES.DIFF_SQ];
    const type = types[Math.floor(Math.random() * types.length)];

    let mode = 'expand';
    if (level === 2) mode = 'factor';
    if (level === 3) mode = Math.random() > 0.5 ? 'expand' : 'factor';

    let questionText = '';
    let validAnswers = [];
    let hintText = '';

    const A = termA.str;
    const B = termB.str;
    const A2 = getSquareStr(termA);
    const B2 = getSquareStr(termB);
    const _2AB = get2ABStr(termA, termB);

    if (type === IDENTITIES.PLUS_SQ) {
      hintText = `(a + b)^2 = a^2 + 2ab + b^2`;
      if (mode === 'expand') {
        questionText = `(${A}+${B})^2`;
        const baseAnswer = `${A2}+${_2AB}+${B2}`;
        validAnswers = [baseAnswer, `(${baseAnswer})`];
      } else {
        questionText = `${A2}+${_2AB}+${B2}`;
        validAnswers = [`(${A}+${B})^2`, `(${B}+${A})^2`, `(${A}+${B})(${A}+${B})`, `(${B}+${A})(${B}+${A})`];
      }
    } else if (type === IDENTITIES.MINUS_SQ) {
      hintText = `(a - b)^2 = a^2 - 2ab + b^2`;
      if (mode === 'expand') {
        questionText = `(${A}-${B})^2`;
        const baseAnswer = `${A2}-${_2AB}+${B2}`;
        validAnswers = [baseAnswer, `(${baseAnswer})`];
      } else {
        questionText = `${A2}-${_2AB}+${B2}`;
        validAnswers = [`(${A}-${B})^2`, `(${A}-${B})(${A}-${B})`];
      }
    } else {
      hintText = `(a + b)(a - b) = a^2 - b^2`;
      if (mode === 'expand') {
        questionText = Math.random() > 0.5 ? `(${A}+${B})(${A}-${B})` : `(${A}-${B})(${A}+${B})`;
        const baseAnswer = `${A2}-${B2}`;
        validAnswers = [baseAnswer, `(${baseAnswer})`];
      } else {
        questionText = `${A2}-${B2}`;
        validAnswers = [
          `(${A}+${B})(${A}-${B})`, 
          `(${A}-${B})(${A}+${B})`, 
          `(${B}+${A})(${A}-${B})`, 
          `(${A}-${B})(${B}+${A})`,
          `(${A}+${B})(-${B}+${A})`, 
          `(-${B}+${A})(${A}+${B})`, 
          `(${B}+${A})(-${B}+${A})`, 
          `(-${B}+${A})(${B}+${A})` 
        ];
      }
    }

    return {
      id: Date.now(),
      text: questionText,
      answers: validAnswers,
      hint: hintText,
      mode: mode === 'expand' ? '展開 (Expand)' : '因式分解 (Factorize)',
      identityType: type,
      A_str: A, 
      B_str: B,
      A2_str: A2,
      B2_str: B2,
      _2AB_str: _2AB,
    };
  };

  const getSolutionSteps = (q) => {
    if (!q || !q.A_str) return [];
    
    const A = q.A_str;
    const B = q.B_str;
    const identityType = q.identityType; 
    const finalAnswer = q.answers[0];

    const isExpand = q.mode.startsWith('展開');
    
    let steps = [{ label: '題目', math: q.text }];
    let step1_math;
    let step1_label;

    if (isExpand) {
        if (identityType === IDENTITIES.DIFF_SQ) {
            step1_math = `(${A})^2 - (${B})^2`;
            step1_label = '套用 (a+b)(a-b) = a^2 - b^2';
            
            steps.push({ label: step1_label, math: step1_math });
            steps.push({ label: '最終答案 (展開)', math: finalAnswer }); 
        } else {
            const sign = identityType === IDENTITIES.PLUS_SQ ? '+' : '-';
            const middleTermSign = sign;
            
            step1_math = `(${A})^2 ${middleTermSign} 2(${A})(${B}) + (${B})^2`;
            step1_label = `套用 (a${sign}b)^2 = a^2 ${middleTermSign} 2ab + b^2`;
            
            steps.push({ label: step1_label, math: step1_math });
            steps.push({ label: '最終答案 (展開)', math: finalAnswer }); 
        }
    } else {
        if (identityType === IDENTITIES.DIFF_SQ) {
            step1_math = `(${A})^2 - (${B})^2`;
            step1_label = '識別 a^2 - b^2 結構';
            
            steps.push({ label: step1_label, math: step1_math });
            steps.push({ label: '最終答案 (因式分解)', math: finalAnswer }); 
        } else { 
            const middleTermSign = identityType === IDENTITIES.PLUS_SQ ? '+' : '-';
            
            step1_math = `(${A})^2 ${middleTermSign} 2(${A})(${B}) + (${B})^2`;
            step1_label = `識別 a^2 ${middleTermSign} 2ab + b^2 結構`; 
            
            steps.push({ label: step1_label, math: step1_math });
            steps.push({ label: '最終答案 (因式分解)', math: finalAnswer }); 
        }
    }
    
    return steps;
  };
  
  useEffect(() => {
    nextQuestion();
  }, [level]);

  const nextQuestion = () => {
    const q = generateQuestion();
    setCurrentQuestion(q);
    setUserAnswer('');
    setFeedback('idle');
    setShowHint(false);
    setTimeout(() => {
      if(inputRef.current) inputRef.current.focus();
    }, 50);
  };

  // ✅ 改進的 normalize 函數 - 移除外層括號
  const normalize = (str) => {
    let cleaned = str
      .replace(/\s+/g, '') 
      .replace(/\^/g, '^') 
      .toLowerCase();
    
    // 移除外層不必要的括號
    while (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      let depth = 0;
      let isComplete = true;
      for (let i = 0; i < cleaned.length - 1; i++) {
        if (cleaned[i] === '(') depth++;
        if (cleaned[i] === ')') depth--;
        if (depth === 0) {
          isComplete = false;
          break;
        }
      }
      if (isComplete) {
        cleaned = cleaned.slice(1, -1);
      } else {
        break;
      }
    }
    
    return cleaned;
  };
  
  // ✅ 標準化單個項（把變數按字母順序排列）
  const normalizeTerm = (term) => {
    // 分離符號、係數和變數部分
    const match = term.match(/^([+-]?)(\d*)(.*)$/);
    if (!match) return term;
    
    const [, sign, coeff, rest] = match;
    
    // 分離變數和指數
    const chars = [];
    let i = 0;
    while (i < rest.length) {
      if (i + 1 < rest.length && rest[i + 1] === '^') {
        // 有指數的變數 (例如 x^2)
        const expEnd = i + 2 < rest.length && /\d/.test(rest[i + 2]) ? i + 3 : i + 2;
        chars.push(rest.slice(i, expEnd));
        i = expEnd;
      } else if (rest[i] !== '^' && /[a-z]/i.test(rest[i])) {
        // 單個變數字母
        chars.push(rest[i]);
        i++;
      } else {
        i++;
      }
    }
    
    // 按字母順序排列變數
    const sortedVars = chars.sort().join('');
    
    return `${sign}${coeff}${sortedVars}`;
  };
  
  const getTerms = (polynomial) => {
    const normalized = polynomial.replace(/\s+/g, '').toLowerCase();
    const polyWithSign = normalized.startsWith('-') ? normalized : '+' + normalized;
    const terms = polyWithSign.match(/[+-][\dA-Za-z\^]+/g) || [];
    
    // ✅ 標準化每個項後再排序
    return terms.map(normalizeTerm).sort();
  };

  const checkAnswer = (e) => {
    e.preventDefault();
    if (!currentQuestion || feedback !== 'idle' || !userAnswer) return;

    const userClean = normalize(userAnswer);
    const isDirectMatch = currentQuestion.answers.some(ans => normalize(ans) === userClean);
    
    let isPermutationMatch = false;

    if (!isDirectMatch && currentQuestion.mode.startsWith('展開')) {
        const canonicalAnswer = currentQuestion.answers[0]; 
        try {
            const correctTerms = getTerms(canonicalAnswer);
            const userTerms = getTerms(userAnswer);
            
            if (correctTerms.length === userTerms.length) {
                isPermutationMatch = correctTerms.every((term, index) => term === userTerms[index]);
            }
        } catch (error) {
            console.error("Permutation check error:", error);
            isPermutationMatch = false;
        }
    }

    const isCorrect = isDirectMatch || isPermutationMatch;

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      setFeedback('wrong');
      setStreak(0);
    }
  };

  const handleLevelChange = (newLevel) => {
    setLevel(newLevel);
    setScore(0);
    setStreak(0);
  };

  const insertAtCursor = (textToInsert) => {
    const input = inputRef.current;
    if (!input) return;
  
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    const currentValue = input.value;
  
    // ✅ 所有插入內容都讓光標移到最後
    const cursorOffset = textToInsert.length;
    
    const newValue = currentValue.substring(0, startPos) + textToInsert + currentValue.substring(endPos);
    setUserAnswer(newValue);
  
    setTimeout(() => {
      input.focus();
      const newCursorPos = startPos + cursorOffset;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const getFeedbackIcon = () => {
    if (feedback === 'correct') return <Check className="w-12 h-12 text-green-500 drop-shadow-sm" />;
    if (feedback === 'wrong') return <X className="w-12 h-12 text-red-500 drop-shadow-sm" />;
    return null;
  };

  const getLevelButtonClass = (btnLevel, activeColorBg, activeColorText) => {
    const isActive = level === btnLevel;
    const baseClass = "px-4 py-2 rounded-full font-bold transition-all shadow-sm border-2";
    if (isActive) {
      const textClass = activeColorBg.includes('yellow') ? 'text-slate-900' : activeColorText;
      return `${baseClass} ${activeColorBg} ${textClass} border-transparent scale-105`;
    }
    return `${baseClass} bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50`;
  };

  const solutionSteps = feedback === 'wrong' ? getSolutionSteps(currentQuestion) : [];

  return (
    <>
      <Link 
        to="/" 
        className="fixed top-4 left-4 z-50 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2 transition-all hover:shadow-lg"
      >
        <HomeIcon size={18} />
        <span className="font-medium">返回首頁</span>
      </Link>

      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 font-sans select-none">
        
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md overflow-hidden mb-2 border border-slate-100">
          <div className="bg-white p-4 md:p-6 flex flex-wrap justify-between items-center gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                 <GraduationCap className="text-indigo-600 w-6 h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">代數恆等式特訓</h1>
            </div>
            <div className="flex gap-2 text-sm">
              <button 
                onClick={() => handleLevelChange(1)}
                className={getLevelButtonClass(1, 'bg-green-500', 'text-white')}
              >
                Lv 1 展開
              </button>
              <button 
                onClick={() => handleLevelChange(2)}
                className={getLevelButtonClass(2, 'bg-yellow-400', 'text-slate-900')}
              >
                Lv 2 因式分解
              </button>
              <button 
                onClick={() => handleLevelChange(3)}
                className={getLevelButtonClass(3, 'bg-red-500', 'text-white')}
              >
                Lv 3 混合
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-700">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-lg">分數: {score}</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
               連勝: <span className="text-indigo-500 font-bold ml-1 text-lg">{streak}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden p-4 md:p-5 relative flex flex-col items-center text-center">
          
          <div className="mb-1">
              <span className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-lg md:text-xl font-bold">
                  {currentQuestion ? currentQuestion.mode : '...'}
              </span>
          </div>

          <div className="mb-2 w-full flex justify-center items-center min-h-[60px]">
              {currentQuestion ? (
                  <div className="text-3xl md:text-5xl text-slate-800 font-bold tracking-tight flex items-center flex-wrap justify-center gap-2">
                      <Latex math={currentQuestion.text} block={true} />
                      <span className="text-slate-400 mx-2">=</span>
                      <span className="w-12 h-12 border-b-4 border-slate-300 inline-block shrink-0"></span>
                  </div>
              ) : (
                  <span className="text-slate-400 text-2xl animate-pulse">載入題目中...</span>
              )}
          </div>

          <div className="w-full max-w-lg flex flex-col items-center z-10">
            
            <form onSubmit={checkAnswer} className="w-full relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={feedback !== 'idle'}
                placeholder="在此輸入答案..."
                className={`w-full bg-slate-50 border-2 px-4 py-2.5 text-center text-2xl text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none transition-all font-mono shadow-sm
                  ${feedback === 'correct' ? 'border-green-400 bg-green-50' : 
                    feedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:bg-white focus:shadow-md'}`}
                autoComplete="off"
                spellCheck="false"
              />
              
              <div className="absolute right-2">
                 {feedback === 'idle' ? (
                   <button 
                    type="submit"
                    disabled={!userAnswer}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-2 transition disabled:opacity-0 disabled:pointer-events-none shadow-md"
                   >
                     <ArrowRight size={24} />
                   </button>
                 ) : (
                   <button 
                    type="button"
                    onClick={nextQuestion}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-2 shadow-md animate-bounce"
                   >
                     <ArrowRight size={24} />
                   </button>
                 )}
              </div>
            </form>

            {/* 第 1 行：( ) ^2 + */}
            <div className="w-full grid grid-cols-4 gap-1 mt-1"> 
              <button onClick={() => insertAtCursor('(')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                (
              </button>
              <button onClick={() => insertAtCursor(')')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                )
              </button>
              <button onClick={() => insertAtCursor('^2')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center justify-center">
                <Latex math="^{2}" />
              </button>
              <button onClick={() => insertAtCursor('+')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                +
              </button>
            </div>

            {/* 第 2 行：7 8 9 - */}
            <div className="w-full grid grid-cols-4 gap-1 mt-1"> 
              <button onClick={() => insertAtCursor('7')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                7
              </button>
              <button onClick={() => insertAtCursor('8')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                8
              </button>
              <button onClick={() => insertAtCursor('9')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                9
              </button>
              <button onClick={() => insertAtCursor('-')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                −
              </button>
            </div>

            {/* 第 3 行：4 5 6 × */}
            <div className="w-full grid grid-cols-4 gap-1 mt-1"> 
              <button onClick={() => insertAtCursor('4')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                4
              </button>
              <button onClick={() => insertAtCursor('5')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                5
              </button>
              <button onClick={() => insertAtCursor('6')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                6
              </button>
              <button onClick={() => insertAtCursor('*')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                ×
              </button>
            </div>

            {/* 第 4 行：1 2 3 ÷ */}
            <div className="w-full grid grid-cols-4 gap-1 mt-1"> 
              <button onClick={() => insertAtCursor('1')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                1
              </button>
              <button onClick={() => insertAtCursor('2')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                2
              </button>
              <button onClick={() => insertAtCursor('3')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                3
              </button>
              <button onClick={() => insertAtCursor('/')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                ÷
              </button>
            </div>

            {/* 第 5 行：0 x y ← 刪除 */}
            <div className="w-full grid grid-cols-4 gap-1 mt-1">
              <button onClick={() => insertAtCursor('0')} disabled={feedback !== 'idle'} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-mono text-xl py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
                0
              </button>
              <button
                onClick={() => insertAtCursor(currentVariables[0])}
                disabled={feedback !== 'idle'}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xl py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50 border border-blue-200"
              >
                {currentVariables[0]}
              </button>
              <button
                onClick={() => insertAtCursor(currentVariables[1])}
                disabled={feedback !== 'idle'}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xl py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50 border border-blue-200"
              >
                {currentVariables[1]}
              </button>
              <button 
                onClick={() => {
                  const cursorPos = inputRef.current?.selectionStart || userAnswer.length;
                  if (cursorPos > 0) {
                    // ✅ 檢查光標前面是否有 ^2 或 ^3
                    const textBeforeCursor = userAnswer.slice(0, cursorPos);
                    let deleteCount = 1;
                    
                    if (textBeforeCursor.endsWith('^2') || textBeforeCursor.endsWith('^3')) {
                      deleteCount = 2; // 刪除 ^2 或 ^3 整體
                    }
                    
                    setUserAnswer(prev => prev.slice(0, cursorPos - deleteCount) + prev.slice(cursorPos));
                    setTimeout(() => {
                      const newPos = cursorPos - deleteCount;
                      inputRef.current?.setSelectionRange(newPos, newPos);
                      inputRef.current?.focus();
                    }, 0);
                  }
                }}
                disabled={feedback !== 'idle' || !userAnswer} 
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center border border-yellow-200 text-sm"
              >
                ← 刪除
              </button>
            </div>

            <div className={`w-full mt-1 min-h-[25px] flex justify-center items-center p-1.5 rounded-lg bg-slate-100 text-slate-700 text-xl md:text-2xl transition-opacity ${userAnswer ? 'opacity-100' : 'opacity-0'}`}>
               {userAnswer && (
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">預覽:</span>
                      <Latex math={userAnswer} />
                   </div>
               )}
            </div>

            <div className="mt-1.5 flex flex-col items-center justify-center w-full min-h-[50px]">
              
              {feedback === 'idle' && (
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  <Lightbulb size={18} className={showHint ? 'fill-indigo-600' : ''} />
                  {showHint ? '隱藏提示' : '顯示提示'}
                </button>
              )}

              {showHint && feedback === 'idle' && (
                <div className="mt-1 text-slate-700 text-lg bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 shadow-sm flex items-center gap-2">
                  <Lightbulb size={20} className="text-amber-500 shrink-0"/>
                  <Latex math={currentQuestion?.hint} />
                </div>
              )}

              {feedback !== 'idle' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3 mb-1">
                    {getFeedbackIcon()}
                    <span className={`text-2xl md:text-3xl font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                      {feedback === 'correct' ? '答對了！' : '再接再厲！'}
                    </span>
                  </div>
                  
                  {feedback === 'wrong' && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center w-full max-w-md mt-1">
                      <h3 className="text-red-700 font-bold mb-1 text-xl">正確解題步驟</h3>
                      <div className="space-y-1">
                        {solutionSteps.map((step, index) => (
                          <div key={index} className="flex flex-col items-start p-1.5 bg-white rounded-lg border border-slate-100 shadow-inner">
                            <span className={`text-xs font-bold uppercase ${index === 0 ? 'text-slate-400' : index === solutionSteps.length - 1 ? 'text-green-600' : 'text-indigo-500'}`}>
                              {step.label}:
                            </span>
                            <div className="w-full text-left text-xl font-mono">
                              <Latex math={step.math} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-slate-400 text-sm mt-1 font-medium">按右側箭頭或 Enter 繼續</div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="max-w-2xl w-full mt-2 text-slate-500 text-sm text-center">
          <p>提示：使用上方輔助按鈕快速輸入括號和平方符號。輸入答案時，請使用 `^` 來表示指數，例如 "x^2"。</p>
        </div>

      </div>
    </>
  );
};

export default IdentityQuiz;
