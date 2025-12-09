import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, RefreshCw, Trophy, CheckCircle, XCircle, AlertCircle, Layers, Plus, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const AngleQuiz = () => {
  // 遊戲狀態
  const [level, setLevel] = useState(1);
  
  const [levelData, setLevelData] = useState({
    1: { score: 0, streak: 0 },
    2: { score: 0, streak: 0 },
    3: { score: 0, streak: 0 }
  });
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState({ type: 'neutral', msg: '' });
  const [isAnswered, setIsAnswered] = useState(false);
  const inputRef = useRef(null);

  const [gameState, setGameState] = useState({
    points: [],
    lines: [],
    target: null,
    arcPath: '',
    transform: 'translate(0, 0)'
  });

  const currentLevelData = useMemo(() => levelData[level] || { score: 0, streak: 0 }, [level, levelData]);
  const currentScore = currentLevelData.score;
  const currentStreak = currentLevelData.streak;

  const letterSets = [
    ['A', 'B', 'C', 'D', 'E'], ['X', 'Y', 'Z', 'W', 'V'], ['L', 'M', 'N', 'O', 'P'], 
    ['Q', 'R', 'S', 'T', 'U'], ['F', 'G', 'H', 'I', 'J']
  ];

  const getRandomLetters = (count) => {
    const setIndex = Math.floor(Math.random() * letterSets.length);
    const set = letterSets[setIndex];
    return [...set].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const getPointPos = useCallback((label) => {
    const p = gameState.points.find(pt => pt.label === label);
    return p ? { x: p.x, y: p.y, label: p.label } : { x: 0, y: 0, label: '' };
  }, [gameState.points]); 

  const calculateArcPath = (v, p1, p2, radius = 35) => {
    if (!v || !p1 || !p2) return ''; 

    let ang1 = Math.atan2(p1.y - v.y, p1.x - v.x);
    let ang2 = Math.atan2(p2.y - v.y, p2.x - v.x);
    
    let diff = ang2 - ang1;
    while (diff <= -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;

    if (diff < 0) {
        [ang1, ang2] = [ang2, ang1];
    }
    
    const startX = v.x + radius * Math.cos(ang1);
    const startY = v.y + radius * Math.sin(ang1);
    const endX = v.x + radius * Math.cos(ang2);
    const endY = v.y + radius * Math.sin(ang2);

    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  };

  const generateLevel1 = (letters, baseCenterX, baseCenterY) => {
    const [l1, lV, l2] = letters;
    const vX = baseCenterX + (Math.random() * 40 - 20);
    const vY = baseCenterY + (Math.random() * 40 - 20);
    const armLength = 110;
    
    const angle1 = Math.random() * 2 * Math.PI;
    const angle2 = angle1 + (Math.random() * (Math.PI * 0.6) + Math.PI * 0.2);

    const p1 = { x: vX + armLength * Math.cos(angle1), y: vY + armLength * Math.sin(angle1), label: l1 };
    const vertex = { x: vX, y: vY, label: lV };
    const p2 = { x: vX + armLength * Math.cos(angle2), y: vY + armLength * Math.sin(angle2), label: l2 };

    const points = [p1, vertex, p2];

    return {
      points: points,
      lines: [[lV, l1], [lV, l2]],
      target: { v: lV, p1: l1, p2: l2 },
      arcPath: calculateArcPath(vertex, p1, p2, 35)
    };
  };

  const generateConvexPolygonPoints = (N, centerX, centerY, radius, letters) => {
    const pointsList = [];
    const baseAngle = Math.random() * Math.PI * 2; 

    for (let i = 0; i < N; i++) {
        const angle = baseAngle + (i * (2 * Math.PI / N)) + (Math.random() * 0.2 - 0.1);
        const currentRadius = radius + (Math.random() * 10 - 5);
        
        const x = centerX + currentRadius * Math.cos(angle);
        const y = centerY + currentRadius * Math.sin(angle);
        
        pointsList.push({ x, y, label: letters[i] });
    }
    return pointsList;
  };

  const generateLevel2 = (centerX, centerY) => {
    const numSides = Math.floor(Math.random() * 3) + 3;
    const letters = getRandomLetters(numSides);
    const radius = 100; 
    
    const pointsList = generateConvexPolygonPoints(numSides, centerX, centerY, radius, letters);
    
    const targetIndex = Math.floor(Math.random() * numSides);
    const vertex = pointsList[targetIndex];
    
    const arm1 = pointsList[(targetIndex + numSides - 1) % numSides];
    const arm2 = pointsList[(targetIndex + 1) % numSides];
    
    const lines = [];
    for (let i = 0; i < numSides; i++) {
        const p1 = pointsList[i].label;
        const p2 = pointsList[(i + 1) % numSides].label;
        lines.push([p1, p2]);
    }

    return {
      points: pointsList,
      lines: lines, 
      target: { v: vertex.label, p1: arm1.label, p2: arm2.label },
      arcPath: calculateArcPath(vertex, arm1, arm2, 30) 
    };
  };
  
  const generateLevel3 = (centerX, centerY) => {
    const structureType = Math.random() < 0.5 ? 'QUAD_DIAG' : 'TRI_INLINE';
    let newGameState = { structureType };

    if (structureType === 'QUAD_DIAG') {
        const numPoints = 4;
        const letters = getRandomLetters(numPoints);
        const [lA, lB, lC, lD] = letters;

        const radius = 100;
        const pointsList = generateConvexPolygonPoints(numPoints, centerX, centerY, radius, letters);
        
        const diagonalType = Math.random() < 0.5 ? 'AC' : 'BD';
        
        let lines = [];
        let targetVertexLabel, targetArm1Label, targetArm2Label;

        if (diagonalType === 'AC') {
            lines = [[lA, lB], [lB, lC], [lC, lD], [lD, lA], [lA, lC]]; 
            
            const corners = [
                { v: lA, p1: lB, p2: lC, radius: 25 },
                { v: lA, p1: lD, p2: lC, radius: 25 },
                { v: lC, p1: lB, p2: lA, radius: 25 },
                { v: lC, p1: lD, p2: lA, radius: 25 }
            ];
            const targetCorner = corners[Math.floor(Math.random() * corners.length)];

            targetVertexLabel = targetCorner.v;
            targetArm1Label = targetCorner.p1;
            targetArm2Label = targetCorner.p2;
            newGameState = { ...newGameState, radius: targetCorner.radius };

        } else {
            lines = [[lA, lB], [lB, lC], [lC, lD], [lD, lA], [lB, lD]]; 
            
            const corners = [
                { v: lB, p1: lA, p2: lD, radius: 25 },
                { v: lB, p1: lC, p2: lD, radius: 25 },
                { v: lD, p1: lA, p2: lB, radius: 25 },
                { v: lD, p1: lC, p2: lB, radius: 25 }
            ];
            const targetCorner = corners[Math.floor(Math.random() * corners.length)];

            targetVertexLabel = targetCorner.v;
            targetArm1Label = targetCorner.p1;
            targetArm2Label = targetCorner.p2;
            newGameState = { ...newGameState, radius: targetCorner.radius };
        }

        const vertex = pointsList.find(p => p.label === targetVertexLabel);
        const arm1 = pointsList.find(p => p.label === targetArm1Label);
        const arm2 = pointsList.find(p => p.label === targetArm2Label);
        
        return {
            points: pointsList,
            lines: lines,
            target: { v: targetVertexLabel, p1: targetArm1Label, p2: targetArm2Label },
            arcPath: calculateArcPath(vertex, arm1, arm2, newGameState.radius),
            structureType: 'QUAD_DIAG'
        };

    } else {
        const letters = getRandomLetters(4);
        const [lA, lB, lC, lD] = letters;

        const A = { x: centerX + (Math.random() * 20 - 10), y: centerY - 80 - (Math.random() * 20), label: lA };
        const B = { x: centerX - 120 + (Math.random() * 20 - 10), y: centerY + 60 + (Math.random() * 20), label: lB };
        const C = { x: centerX + 120 + (Math.random() * 20 - 10), y: centerY + 60 + (Math.random() * 20), label: lC };

        const r = Math.random() * 0.4 + 0.3;
        const D = {
            x: B.x * (1 - r) + C.x * r,
            y: B.y * (1 - r) + C.y * r,
            label: lD
        };
        const pointsList = [A, B, C, D];
        
        const lines = [
            [lA, lB], [lA, lC], [lB, lC], 
            [lA, lD]                      
        ];

        const corners = [
            { v: lA, p1: lB, p2: lD, radius: 30 },
            { v: lA, p1: lC, p2: lD, radius: 30 },
            { v: lD, p1: lB, p2: lA, radius: 25 },
            { v: lD, p1: lC, p2: lA, radius: 25 }
        ];
        const targetCorner = corners[Math.floor(Math.random() * corners.length)];
        
        const vertex = pointsList.find(p => p.label === targetCorner.v);
        const arm1 = pointsList.find(p => p.label === targetCorner.p1);
        const arm2 = pointsList.find(p => p.label === targetCorner.p2);

        return {
            points: pointsList,
            lines: lines,
            target: { v: targetCorner.v, p1: targetCorner.p1, p2: targetCorner.p2 },
            arcPath: calculateArcPath(vertex, arm1, arm2, targetCorner.radius),
            structureType: 'TRI_INLINE'
        };
    }
  };

  const generatePuzzle = useCallback(() => {
    const width = 360; 
    const height = 280;

    let tempGameState;
    switch (level) {
        case 1:
            tempGameState = generateLevel1(getRandomLetters(3), width / 2, height / 2);
            break;
        case 2:
            tempGameState = generateLevel2(width / 2, height / 2);
            break;
        case 3:
            tempGameState = generateLevel3(width / 2, height / 2);
            break;
        default:
            tempGameState = generateLevel1(getRandomLetters(3), width / 2, height / 2);
    }
    
    const allX = tempGameState.points.map(p => p.x);
    const allY = tempGameState.points.map(p => p.y);

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    
    const buffer = 30;
    const actualWidth = dataWidth + 2 * buffer;
    const actualHeight = dataHeight + 2 * buffer;

    const offsetX = (width - actualWidth) / 2 - minX + buffer;
    const offsetY = (height - actualHeight) / 2 - minY + buffer;

    const transform = `translate(${offsetX}, ${offsetY})`;

    setGameState({
        ...tempGameState,
        transform: transform
    });

    setInput('');
    const newMsg = '請輸入紅色弧線標示的角名稱';
      
    setFeedback({ type: 'neutral', msg: newMsg });
    setIsAnswered(false);
    
    setTimeout(() => {
        if(inputRef.current) inputRef.current.focus();
    }, 100);
  }, [level]); 

  useEffect(() => {
    generatePuzzle();
  }, [level, generatePuzzle]); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAnswered) return;

    const pointsToAdd = level * 10;
    
    let isCorrect = false;
    let feedbackMsg = '';

    const userAnswer = input.toUpperCase().replace(/\s/g, '').replace(/∠/g, '');
    
    if (userAnswer.length !== 3) {
        setFeedback({ 
            type: 'error', 
            msg: `命名必須使用三個字母！` 
        });
        setIsAnswered(true);
        return;
    }

    const { v, p1, p2 } = gameState.target;
    const valid1 = `${p1}${v}${p2}`;
    const valid2 = `${p2}${v}${p1}`;
    
    isCorrect = (userAnswer === valid1 || userAnswer === valid2);

    if (isCorrect) {
      setLevelData(prev => ({
        ...prev,
        [level]: {
            score: prev[level].score + pointsToAdd,
            streak: prev[level].streak + 1
        }
      }));

      setFeedback({ 
        type: 'success', 
        msg: `太棒了！答案正確！ (+${pointsToAdd}分)` 
      });
    } else {
      setLevelData(prev => ({
        ...prev,
        [level]: {
            ...prev[level],
            streak: 0
        }
      }));
      
      if (userAnswer.includes(v) && userAnswer[1] !== v) {
         feedbackMsg = `不對喔！頂點 ${v} 必須放在中間。`;
      } else {
         feedbackMsg = `錯誤。正確的頂點是 ${v}，邊是 ${p1} 和 ${p2}。`;
      }
      
      setFeedback({ 
        type: 'error', 
        msg: feedbackMsg 
      });
    }

    setIsAnswered(true);
  };

  const getTextOffset = (pt) => {
    const allX = gameState.points.map(p => p.x);
    const allY = gameState.points.map(p => p.y);
    const approxCenterX = (Math.min(...allX) + Math.max(...allX)) / 2;
    const approxCenterY = (Math.min(...allY) + Math.max(...allY)) / 2;
    
    const dx = pt.x - approxCenterX;
    const dy = pt.y - approxCenterY;
    
    const angle = Math.atan2(dy, dx);
    const offset = 22;
    
    let labelX = pt.x + offset * Math.cos(angle);
    let labelY = pt.y + offset * Math.sin(angle);
    
    if (level === 3) {
        const { v: targetV } = gameState.target || {};
        const isTargetVertex = pt.label === targetV;

        if (gameState.structureType === 'TRI_INLINE') {
            const [lA, , , lD] = gameState.points.map(p => p.label).slice(0, 4);

            if (pt.label === lA && isTargetVertex) {
                labelX = pt.x; 
                labelY = pt.y - 25; 
            }
            
            if (pt.label === lD) {
                labelX = pt.x; 
                labelY = pt.y + 25; 
            }
            
            if (pt.label === lD && isTargetVertex) {
                 labelX = pt.x; 
                 labelY = pt.y + 25; 
            }

        } else if (gameState.structureType === 'QUAD_DIAG') {
            const largeOffset = 25; 
            labelX = pt.x + largeOffset * Math.cos(angle);
            labelY = pt.y + largeOffset * Math.sin(angle);
        }
    }
    
    return { x: labelX, y: labelY };
  };
  
  return (
    <>
      <Link 
        to="/" 
        className="fixed top-4 left-4 z-50 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2 transition-all hover:shadow-lg"
      >
        <HomeIcon size={18} />
        <span className="font-medium">返回首頁</span>
      </Link>

      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
      
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">📐 角度命名大挑戰</h1>
          <p className="text-slate-600 text-sm">請完成紅色標示的題目 (命名)</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-md border border-slate-200 mb-4">
          {[1, 2, 3].map((lv) => (
              <button
                  key={lv}
                  onClick={() => {
                      if (lv !== level) {
                          setLevel(lv);
                      }
                  }}
                  className={`flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all min-w-[100px]
                      ${level === lv 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'text-slate-600 hover:bg-blue-50'
                  }`}
              >
                  <Layers size={16} /> LV.{lv}
                  <span className={`text-xs ml-1 px-2 py-0.5 rounded-full ${level === lv ? 'bg-blue-700' : 'bg-slate-200'}`}>{levelData[lv]?.score || 0}</span>
              </button>
          ))}
        </div>

        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-4 mb-4 flex justify-between items-center border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold">當前關卡總分 (LV.{level})</div>
              <div className="text-2xl font-bold text-slate-800">{currentScore}</div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="text-xs text-slate-500 uppercase font-bold mb-1">連勝次數</div>
            <div className="flex space-x-1 items-center">
              <Plus className="w-4 h-4 text-green-500" />
              <span className="text-xl font-bold text-green-600">{currentStreak}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          
          <div className="bg-slate-50 border-b border-slate-100 flex justify-center py-8 relative">
            <svg width="360" height="280" className="bg-white rounded-lg shadow-inner border border-slate-200">
              
              <g transform={gameState.transform}>
                  
                  {gameState.arcPath && (
                      <path 
                          d={gameState.arcPath} 
                          fill="none" 
                          stroke="#ef4444"
                          strokeWidth="4" 
                          strokeLinecap="round"
                          className="animate-pulse-slow" 
                      />
                  )}
                  
                  {gameState.lines.map(([l1, l2], index) => {
                      const p1 = getPointPos(l1);
                      const p2 = getPointPos(l2);
                      return (
                          <line 
                            key={`line-${index}`}
                            x1={p1.x} y1={p1.y} 
                            x2={p2.x} y2={p2.y} 
                            stroke="#475569" strokeWidth="3" strokeLinecap="round"
                          />
                      );
                  })}

                  {gameState.points.map((pt) => {
                      const textPos = getTextOffset(pt);
                      const isTargetVertex = gameState.target && pt.label === gameState.target.v;
                      return (
                          <g key={`pt-${pt.label}`}>
                              <circle 
                                  cx={pt.x} cy={pt.y} 
                                  r={isTargetVertex ? "6" : "5"} 
                                  fill={isTargetVertex ? "#0f172a" : "#3b82f6"}
                                  className="transition-all"
                              />
                              <text 
                                x={textPos.x} 
                                y={textPos.y}
                                className={`text-lg font-bold ${isTargetVertex ? 'fill-slate-900' : 'fill-blue-600'}`} 
                                textAnchor="middle" dominantBaseline="middle"
                              >
                                {pt.label}
                              </text>
                          </g>
                      );
                  })}
              </g>
            </svg>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
               <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-serif text-lg">∠</div>
                  
                  <input
                    ref={inputRef}
                    type='text'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="請輸入三個字母 (例: ABC)"
                    className={`w-full pl-8 pr-4 py-3 rounded-lg border-2 text-lg uppercase font-bold tracking-wider outline-none transition-all
                      ${isAnswered 
                        ? (feedback.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    disabled={isAnswered}
                    maxLength={3} 
                  />
               </div>
              
              {!isAnswered ? (
                <button 
                  type="submit"
                  disabled={input.length !== 3}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Send size={20} />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={generatePuzzle}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 rounded-lg font-medium transition-colors flex items-center gap-2 animate-bounce-short"
                >
                  下一題 <RefreshCw size={18} />
                </button>
              )}
            </form>

            <div className={`rounded-lg p-4 flex items-start gap-3 transition-all duration-300 ${
              feedback.type === 'neutral' ? 'bg-blue-50 text-blue-800' :
              feedback.type === 'success' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {feedback.type === 'neutral' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {feedback.type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {feedback.type === 'error' && <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              
              <div className="text-sm font-medium leading-relaxed">
                {feedback.msg}
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-slate-500 text-xs text-center max-w-xs">
          {level === 1 && "LV1: 基礎練習。單一角度命名。"}
          {level === 2 && "LV2: 一個多邊形挑戰。現在會出現三邊形至五邊形，請準確命名紅色弧線標示的內角。"}
          {level === 3 && "LV3: 由多個三角形組成的圖形挑戰。請務必使用三個字母來精確指定紅色弧線標示的角。"}
        </p>

        <style>{`
          .animate-bounce-short {
            animation: bounce 1s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-pulse-slow {
              animation: pulse-slow 3s infinite;
          }
          @keyframes pulse-slow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    </>
  );
};

export default AngleQuiz;
