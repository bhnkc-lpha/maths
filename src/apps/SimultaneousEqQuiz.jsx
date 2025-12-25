import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Calculator, Lightbulb, Delete, CheckCircle, XCircle, Keyboard as KeyboardIcon, X, Trophy } from 'lucide-react';

// --- 資料庫 (包含所有題目與邏輯) ---
const QUESTIONS = [
  {
    id: 1,
    title: "遊覽船船票",
    text: "某觀光遊覽船只有頭等和普通等兩類船票出售。已知共售出600張船票。其中售出的普通等船票數目為售出的頭等船票數目之三倍。若一張頭等船票的售價為$850,而一張普通等船票的售價為 $500,求售出船票的總值。",
    vars: "設 x 為頭等船票數目,y 為普通等船票數目。",
    segments: [
      { 
        text: "某觀光遊覽船只有頭等和普通等兩類船票出售。已知共售出600張船票。", 
        keywords: ["頭等", "和", "普通等", "共", "600"], 
        valid: ["x+y=600", "y+x=600"], 
        color: "text-red-600", 
        borderColor: "border-red-400",
        hint: "x + y = 600"
      },
      { 
        text: "售出的普通等船票數目為售出的頭等船票數目之三倍。", 
        keywords: ["普通等", "為", "頭等", "三倍"], 
        valid: ["y=3x", "y=3*x", "y=x*3"], 
        color: "text-green-600", 
        borderColor: "border-green-400",
        hint: "y = 3x"
      }
    ],
    answers: [
      ["x+y=600", "y+x=600"],
      ["y=3x", "y=3*x", "3x=y"]
    ]
  },
  {
    id: 2,
    title: "橙與蘋果",
    text: "一個橙子及一個蘋果的價錢分別為$2及$3,現花費了$46購買若干個橙子和蘋果。若所購買的橙子和蘋果的總數為20,求所購買橙子的數目。",
    vars: "設 x 為橙子數目,y 為蘋果數目。",
    segments: [
      { 
        text: "所購買的橙子和蘋果的總數為20。", 
        keywords: ["橙子", "和", "蘋果", "為", "20"], 
        valid: ["x+y=20", "y+x=20"], 
        color: "text-red-600", 
        borderColor: "border-red-400" 
      },
      { 
        text: "一個橙子及一個蘋果的價錢分別為$2及$3,現花費了$46購買若干個橙子和蘋果。", 
        keywords: ["花費了$46", "購買", "橙子", "和", "蘋果"],
        skipInputIndices: [0, 1], // 👈 跳過前兩個匹配（第一次的橙子和蘋果）
        valid: ["2x+3y=46", "3y+2x=46"], 
        color: "text-green-600", 
        borderColor: "border-green-400" 
      }
    ],
    answers: [
      ["x+y=20", "y+x=20"],
      ["2x+3y=46"]
    ]
  },
  {
    id: 3,
    title: "醫生診金",
    text: "某醫生為長者病人及非長者病人診症的診金分別為$120及$160。在某日,該醫生為67位病人診症,且總診金為$9000。該醫生當為多少位長者病人診症?",
    vars: "某醫生為長者病人及非長者病人診症的診金分別為$120及$160。設 x 為長者病人數,y 為非長者病人數。",
    segments: [
      { text: "該醫生為67位病人診症。", keywords: ["67位病人"], valid: ["x+y=67", "y+x=67"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "長者及非長者總診金為$9000。", keywords: ["長者", "非長者", "9000"], valid: ["120x+160y=9000"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x+y=67", "y+x=67"],
      ["120x+160y=9000"]
    ]
  },
  {
    id: 4,
    title: "郵票數量",
    text: "偉明和小麗擁有郵票的總數為300。若小麗從郵局購入20枚郵票,她擁有郵票的數目將為偉明擁有的4倍。求偉明擁有郵票的數目。",
    vars: "設 x 為偉明郵票數,y 為小麗郵票數。",
    segments: [
      { text: "偉明和小麗擁有郵票的總數為300", keywords: ["偉明", "和", "小麗", "為", "300"], valid: ["x+y=300", "y+x=300"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "若小麗從郵局購入20枚郵票, 她擁有郵票的數目將為偉明擁有的4倍。", keywords: ["購入20枚郵票", "將為", "偉明", "4倍"], valid: ["y+20=4x", "y+20=x*4"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x+y=300", "y+x=300"],
      ["y+20=4x", "4x=y+20"]
    ]
  },
  {
    id: 5,
    title: "飲品成本",
    text: "一瓶橙汁的成本與2瓶牛奶的成本相同。3瓶橙汁和5瓶牛奶的總成本為$66。求一瓶牛奶的成本。",
    vars: "設 x 為橙汁成本,y 為牛奶成本。",
    segments: [
      { 
        text: "一瓶橙汁的成本與2瓶牛奶的成本相同。", 
        keywords: ["橙汁的成本", "與", "2瓶牛奶的成本", "相同"], 
        previewOrder: [1, 3, 2],
        valid: ["x=2y", "x=2*y"], 
        color: "text-red-600", 
        borderColor: "border-red-400" 
      },
      { text: "3瓶橙汁和5瓶牛奶的總成本為$66。", keywords: ["3瓶橙汁", "和", "5瓶牛奶", "為", "66"], valid: ["3x+5y=66"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x=2y"],
      ["3x+5y=66"]
    ]
  },
  {
    id: 6,
    title: "夏令營人數",
    text: "在某夏令營,男生人數與女生人數之比為7:6。若17名男生和4名女生離開該夏令營,則男生人數與女生人數相等。求在夏令營原本的女生人數。",
    vars: "設 x 為男生人數,y 為女生人數。",
    segments: [
      { text: "男生人數與女生人數之比為7:6。", keywords: ["男生人數", "與", "女生人數", "之比為", "7:6"], valid: ["x/y=7/6", "6x=7y"], color: "text-red-600", borderColor: "border-red-400" },
      { 
        text: "若17名男生和4名女生離開,人數相等。", 
        keywords: ["17名男生", "和", "4名女生離開", "人數相等"], 
        previewOrder: [1, 3, 2],
        valid: ["x-17=y-4", "y-4=x-17"], 
        color: "text-green-600", 
        borderColor: "border-green-400" 
      }
    ],
    answers: [
      ["x/y=7/6", "6x=7y"],
      ["x-17=y-4", "y-4=x-17"]
    ]
  },
  {
    id: 7,
    title: "足球聯賽",
    text: "在某足球聯賽，每一球隊贏取一場球賽得 3 分，和得 1 分，而輸得 0 分。該聯賽的冠軍隊作賽 36 場且共得 84 分。已知該冠軍隊沒有輸掉任何一場球賽，求該冠軍隊贏取球賽的場數。",
    vars: "設 x 為贏場數,y 為和場數。",
    segments: [
      { 
        text: "該冠軍隊作賽 36 場(已知該冠軍隊沒有輸掉任何一場球賽)。", 
        keywords: ["作賽36場"], 
        valid: ["x+y=36"], 
        color: "text-red-600", 
        borderColor: "border-red-400" 
      },
      { 
        text: "共得 84 分 (贏取一場球賽得 3 分及和得 1 分)。", 
        keywords: ["共得", "84", "贏取一場球賽得3分", "及", "和得 1 分"], 
        previewOrder: [2, 1, 3, 4, 5],
        valid: ["84=3x+y", "3x+y=84"], 
        color: "text-green-600", 
        borderColor: "border-green-400" 
      }
    ],
    answers: [
      ["x+y=36", "y+x=36"],
      ["3x+y=84", "3x+1y=84"]
    ]
  },
  {
    id: 8,
    title: "保安員人數",
    text: "在設有6個展區的展覽中心內有132名保安員。各個展區均有相同人數的保安員。在每個展區內,女保安員均較男保安員多4名。求在該展覽中心內男保安員的人數。",
    vars: "設 x 為每區男保安,y 為每區女保安。",
    segments: [
      { text: "在設有6個展區的展覽中心內有132名保安員。各個展區均有相同人數的保安員。", keywords: ["6個展區", "132名保安員"], valid: ["6(x+y)=132", "6x+6y=132"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "在每個展區內,女保安員均較男保安員多4名。", keywords: ["女", "較", "男", "多4名"], valid: ["y=x+4"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["6(x+y)=132", "6x+6y=132"],
      ["y=x+4"]
    ]
  },
  {
    id: 9,
    title: "梨與橙 (價錢)",
    text: "7個梨和3個橙的價錢為$47,而5個梨和6個橙的價錢為$49。求一個梨的價錢。",
    vars: "設 x 為梨價錢,y 為橙價錢。",
    segments: [
      { text: "7個梨和3個橙的價錢為$47。", keywords: ["7個梨", "和", "3個橙", "為", "47"], valid: ["7x+3y=47"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "而5個梨和6個橙的價錢為$49。", keywords: ["5個梨", "和", "6個橙", "為", "49"], valid: ["5x+6y=49"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["7x+3y=47"],
      ["5x+6y=49"]
    ]
  },
  {
    id: 10,
    title: "蘋果轉讓",
    text: "佩玲擁有蘋果的數目為志偉擁有的4倍。若佩玲將她其中的12個蘋果送給志偉,他們將擁有相同數目的蘋果。求佩玲和志偉擁有蘋果的總數。",
    vars: "設 x 為佩玲數目,y 為志偉數目。",
    segments: [
      { 
        text: "佩玲擁有蘋果的數目為志偉擁有的4倍。", 
        keywords: ["佩玲", "為", "志偉", "4倍"], 
        valid: ["x=4y", "x=y*4"], 
        color: "text-red-600", 
        borderColor: "border-red-400" 
      },
      { 
        text: "佩玲將她其中的12個送給志偉,他們將擁有相同數目。", 
        keywords: ["佩玲", "12個送給志偉", "相同"], 
        previewOrder: [1, 3, 2],
        valid: ["x-12=y+12", "y+12=x-12"], 
        color: "text-green-600", 
        borderColor: "border-green-400" 
      }
    ],
    answers: [
      ["x=4y"],
      ["x-12=y+12"]
    ]
  },
  {
    id: 11,
    title: "劇院門票",
    text: "某劇院只有兩類門票:正價及特惠票。正價及特惠票的票價分別為$126及$78。在某日,售出正價票的數目為售出特惠票的數目之5倍,且售出門票所得的總金額為$50976,求該日售出門票的總數。",
    vars: "設 x 為正價數目,y 為特惠數目。",
    segments: [
      { text: "售出正價票的數目為售出特惠票的數目之5倍。", keywords: ["正價", "為", "特惠票", "5倍"], valid: ["x=5y"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "某劇院只有兩類門票:正價及特惠票。正價及特惠票的票價分別是$126及$78,且售出門票所得的總金額為$50976", keywords: ["總金額", "為", "50976"], valid: ["126x+78y=50976"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x=5y"],
      ["126x+78y=50976", "78y+126x=50976"]
    ]
  },
  {
    id: 12,
    title: "遊樂場人數",
    text: "在某遊樂場,成人人數與小童人數之比為13:6 。若9名成人和24名小童進入該遊樂場,則成人人數與小童人數之比為8:7 。求在該遊樂場原本的成人人數。",
    vars: "設 x 為原本成人數,y 為原本小童數。",
    segments: [
      { text: "成人人數與小童人數之比為13:6。", keywords: ["成人人數", "與", "小童人數", "之比為", "13:6"], valid: ["x/y=13/6", "6x=13y"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "9名成人和24名小童進入後,比為8:7。", keywords: ["9名成人", "和", "24名小童進入", "比為", "8:7"], valid: ["(x+9)/(y+24)=8/7", "7(x+9)=8(y+24)"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x/y=13/6", "6x=13y"],
      ["(x+9)/(y+24)=8/7", "7(x+9)=8(y+24)"]
    ]
  },
  {
    id: 13,
    title: "貼紙轉讓",
    text: "某男生擁有的貼紙數目為某女生擁有的3倍。若該男生將他其中的20張貼紙送給該女生,則該女生擁有貼紙的數目為該男生擁有的2倍。求該男生和該女生擁有貼紙的總數。",
    vars: "設 x 為男生數目,y 為女生數目。",
    segments: [
      { text: "某男生擁有的貼紙數目為某女生擁有的3倍。", keywords: ["男生", "為", "女生", "3倍"], valid: ["x=3y", "3y=x"], color: "text-red-600", borderColor: "border-red-400" },
      { 
        text: "若該男生將他其中的20張貼紙送給該女生,則該女生擁有貼紙的數目為該男生擁有的2倍。", 
        keywords: ["男生", "女生擁有貼紙的數目", "為", "該", "男生", "2倍"], 
        skipInputIndices: [0, 3],
        valid: ["y+20=2(x-20)"], 
        color: "text-green-600", 
        borderColor: "border-green-400" 
      }
    ],
    answers: [
      ["x=3y", "3y=x"],
      ["y+20=2(x-20)", "y+20=2*(x-20)"]
    ]
  },
  {
    id: 14,
    title: "兩數關係",
    text: "設x及y為兩數。x與y之和為456,而7與x之積為y。求x。",
    vars: "設 x, y 為兩數。",
    segments: [
      { text: "x與y之和為456。", keywords: ["x", "與", "y", "之和為", "456"], valid: ["x+y=456"], color: "text-red-600", borderColor: "border-red-400" },
      { text: "7與x之積為y。", keywords: ["7", "與", "x", "之積為", "y"], valid: ["7x=y", "y=7x"], color: "text-green-600", borderColor: "border-green-400" }
    ],
    answers: [
      ["x+y=456"],
      ["7x=y", "7×x=y"]
    ]
  }
];

const CHEATSHEET = [
  { key: "連續數", val: "x, (x+1)" },
  { key: "大 / 多", val: "+" },
  { key: "小 / 少", val: "-" },
  { key: "2倍 (n倍)", val: "× 2 (× n)" },
  { key: "較 / 比 / 是", val: "=" },
  { key: "x 與 y 之和", val: "x + y" },
  { key: "x 的 12 年後", val: "x + 12" },
  { key: "y 的 3 年前", val: "y - 3" },
  { key: "一半", val: "÷ 2" },
  { key: "y 與 11 的積", val: "y × 11" },
  { key: "x 和 y 比例 6:5", val: "x/y = 6/5" }
];

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const MathRenderer = ({ expression }) => {
  if (!expression) return <span className="text-gray-400 italic text-sm md:text-base">等待輸入...</span>;

  const tokens = expression.match(/(\(.*?\)|[=+\-*/]|[0-9a-zA-Z.]+)/g) || [];

  const processedTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '/' && processedTokens.length > 0 && i + 1 < tokens.length) {
      const num = processedTokens.pop();
      const den = tokens[i + 1];
      
      const cleanNum = num.startsWith('(') && num.endsWith(')') ? num.slice(1, -1) : num;
      const cleanDen = den.startsWith('(') && den.endsWith(')') ? den.slice(1, -1) : den;

      processedTokens.push({ type: 'frac', num: cleanNum, den: cleanDen });
      i++;
    } else {
      processedTokens.push(token);
    }
  }

  return (
    <div className="flex items-center flex-wrap gap-1 font-mono text-xl md:text-2xl text-gray-800">
      {processedTokens.map((part, idx) => {
        if (typeof part === 'object' && part.type === 'frac') {
          return (
            <div key={idx} className="inline-flex flex-col items-center justify-center align-middle mx-1">
              <span className="border-b-2 border-gray-800 px-1 leading-none pb-0.5 text-sm md:text-base">{part.num}</span>
              <span className="leading-none pt-0.5 text-sm md:text-base">{part.den}</span>
            </div>
          );
        } else if (['+', '-', '*', '='].includes(part)) {
           return <span key={idx} className="mx-1 font-bold">{part === '*' ? '×' : part}</span>;
        } else {
           return <span key={idx}>{part}</span>;
        }
      })}
    </div>
  );
};

const Keypad = ({ onInput, onDelete, onClear, onEnter, isVisible, toggleVisibility }) => {
  const keys = [
    '7', '8', '9', '/', '(', ')',
    '4', '5', '6', '*', 'x', 'y',
    '1', '2', '3', '+', '-', '=',
    'AC', '0', 'DEL', 'Enter'
  ];

  if (!isVisible) return (
     <button 
       onClick={toggleVisibility}
       className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition"
       title="開啟小鍵盤"
     >
       <KeyboardIcon size={24} />
     </button>
  );

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 md:bottom-4 md:right-4 bg-gray-100 p-2 border md:border-2 border-gray-300 md:rounded-xl shadow-2xl z-50 pb-6 md:pb-2 transition-all">
      <div className="flex justify-between items-center mb-2 px-1">
         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Math Keypad</span>
         <button onClick={toggleVisibility} className="text-gray-400 hover:text-gray-600">
            <KeyboardIcon size={20}/>
         </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {keys.map((k) => {
          if (k === 'Enter') return (
            <button key={k} onClick={onEnter} className="col-span-2 bg-blue-600 text-white p-3 md:p-2 rounded-lg font-bold active:bg-blue-700 shadow hover:bg-blue-500 text-lg">提交</button>
          );
          if (k === 'AC') return (
            <button key={k} onClick={onClear} className="bg-red-200 p-3 md:p-2 rounded-lg font-bold text-red-800 active:bg-red-300 shadow hover:bg-red-100">AC</button>
          );
          if (k === 'DEL') return (
            <button key={k} onClick={onDelete} className="bg-orange-200 p-3 md:p-2 rounded-lg font-bold text-orange-800 active:bg-orange-300 shadow hover:bg-orange-100">
               <Delete size={20} className="mx-auto"/>
            </button>
          );
          return (
            <button key={k} onClick={() => onInput(k)} className="bg-white p-3 md:p-2 rounded-lg shadow font-bold text-lg md:text-xl active:bg-gray-200 hover:bg-gray-50 text-gray-700">
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CheatsheetModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition"
        >
            <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-4 flex items-center border-b pb-2 text-gray-800 pr-10">
            <BookOpen className="mr-2"/> 關鍵字筆記
        </h3>
        <div className="space-y-3">
          {CHEATSHEET.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
              <span className="font-medium text-gray-700 text-sm">{item.key}</span>
              <span className="font-mono text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-sm">{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function EquationQuizApp() {
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState([]); 
  const [score, setScore] = useState(0);
  
  const [lv1Inputs, setLv1Inputs] = useState({});
  const [activeInput, setActiveInput] = useState(null); 
  const [lv2Inputs, setLv2Inputs] = useState(["", ""]);
  
  const [showNotes, setShowNotes] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [highlightHint, setHighlightHint] = useState(false);
  const [lv1Completed, setLv1Completed] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState(null);

  useEffect(() => {
    const indices = Array.from({ length: QUESTIONS.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQuestionOrder(indices);
  }, []); 

  const currentQ = questionOrder.length > 0 ? QUESTIONS[questionOrder[qIndex]] : QUESTIONS[0];
  
  const inputRefs = useRef({});

  useEffect(() => {
    if (questionOrder.length > 0) {
        resetState();
    }
  }, [qIndex, level, questionOrder]);

  const resetState = () => {
    setLv1Inputs({});
    setLv2Inputs(["", ""]);
    setFeedback(null);
    setInlineFeedback(null);
    setLv1Completed(false);
    setHighlightHint(false);
    setActiveInput(null);
  };

  const handleVirtualInput = (char) => {
    if (!activeInput) return;
    
    let currentVal = "";
    if (activeInput.type === 'lv1') {
        currentVal = lv1Inputs[`${activeInput.index}-${activeInput.partIdx}`] || "";
    } else {
        currentVal = lv2Inputs[activeInput.index];
    }

    const newVal = currentVal + char;
    handleInputChange(newVal, activeInput.type, activeInput.index, activeInput.partIdx);
    
    let refKey = "";
    if (activeInput.type === 'lv1') {
        refKey = `lv1-${activeInput.index}-${activeInput.partIdx}`;
    } else {
        refKey = `lv2-${activeInput.index}`;
    }

    if(inputRefs.current[refKey]) {
        inputRefs.current[refKey].focus();
    }
  };
  
  const handleVirtualDelete = () => {
    if (!activeInput) return;
    let currentVal = "";
    if (activeInput.type === 'lv1') {
        currentVal = lv1Inputs[`${activeInput.index}-${activeInput.partIdx}`] || "";
    } else {
        currentVal = lv2Inputs[activeInput.index];
    }
    const newVal = currentVal.slice(0, -1);
    handleInputChange(newVal, activeInput.type, activeInput.index, activeInput.partIdx);
  };

  const handleVirtualClear = () => {
    if (!activeInput) return;
    handleInputChange("", activeInput.type, activeInput.index, activeInput.partIdx);
  };

  const handleInputChange = (newVal, type, index, partIdx) => {
    if (!type) return;

    if (type === 'lv1') {
      setLv1Inputs(prev => ({
          ...prev,
          [`${index}-${partIdx}`]: newVal
      }));
    } else {
      const newInputs = [...lv2Inputs];
      newInputs[index] = newVal;
      setLv2Inputs(newInputs);
    }
  };

  const normalize = (str) => {
    return str.toLowerCase().replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/:/g, '/');
  };

  const getCombinedLv1String = (segIdx) => {
    const segment = currentQ.segments[segIdx];
    const escapedKeywords = segment.keywords.map(escapeRegExp);
    const parts = segment.text.split(new RegExp(`(${escapedKeywords.join('|')})`, 'g'));
    
    const inputValues = {};
    let keywordIndex = 0;
    parts.forEach((_, i) => {
        if (i % 2 === 1) {
            inputValues[keywordIndex] = lv1Inputs[`${segIdx}-${i}`] || "";
            keywordIndex++;
        }
    });

    if (segment.previewOrder) {
        return segment.previewOrder
            .map(idx => inputValues[idx] || "")
            .join("");
    }

    return parts.map((part, i) => {
        if (i % 2 === 1) {
             return lv1Inputs[`${segIdx}-${i}`] || "";
        }
        return ""; 
    }).join("");
  };

  const checkAnswer = () => {
    let allCorrect = true;
    let correctCount = 0;
    let correctAnswersText = "";

    if (level === 1) {
        currentQ.segments.forEach((seg, idx) => {
            const userVal = normalize(getCombinedLv1String(idx));
            const validVals = seg.valid.map(normalize);
            
            if (validVals.includes(userVal)) {
                correctCount++;
            } else {
                allCorrect = false;
            }
            correctAnswersText += `${idx === 0 ? "第一個方程" : "第二個方程"}: ${seg.valid[0]}\n`;
        });

        setScore(prev => prev + correctCount);

        if (allCorrect) {
            setInlineFeedback({ 
                type: 'success', 
                msg: `全對！做得好！ (+${correctCount} 分)`,
                action: nextQuestion
            });
            setLv1Completed(true);
        } else {
            setInlineFeedback({ 
                type: 'error', 
                msg: `${correctCount > 0 ? `答對 ${correctCount} 個方程 (+${correctCount} 分)\n\n` : ''}正確答案參考：\n${correctAnswersText}`,
                action: nextQuestion
            });
        }
    } else {
        if (lv2Inputs.length < 2) {
            allCorrect = false;
        } else {
            lv2Inputs.forEach((input, idx) => {
                const userVal = normalize(input || "");
                if (currentQ.answers[idx]) {
                    const validVals = currentQ.answers[idx].map(normalize);
                    if (validVals.includes(userVal)) {
                        correctCount++;
                    } else {
                        allCorrect = false;
                    }
                    correctAnswersText += `方程 (${idx + 1}): ${currentQ.answers[idx][0]}\n`;
                }
            });
        }

        setScore(prev => prev + correctCount);

        if (allCorrect) {
            setFeedback({ 
                type: 'success', 
                msg: `全對！ (+${correctCount} 分)`, 
                action: nextQuestion 
            });
            setLv1Completed(true);
        } else {
            setFeedback({ 
                type: 'error', 
                msg: `${correctCount > 0 ? `答對 ${correctCount} 個方程 (+${correctCount} 分)\n\n` : ''}正確答案參考：\n${correctAnswersText}`,
                action: nextQuestion 
            });
        }
    }
  };

  const nextQuestion = () => {
    setQIndex(prev => (prev + 1) % QUESTIONS.length);
    setFeedback(null); 
    setInlineFeedback(null);
  };

  const renderLv1Segment = (segment, idx) => {
    const escapedKeywords = segment.keywords.map(escapeRegExp);
    const parts = segment.text.split(new RegExp(`(${escapedKeywords.join('|')})`, 'g'));
    const skipInputIndices = segment.skipInputIndices || [];

    return (
      <div 
        key={idx} 
        className={`
          mb-8 p-4 rounded-xl border-l-8 transition-all relative
          ${segment.borderColor} bg-white shadow-sm
        `}
      >
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-white text-xs font-bold text-gray-500 rounded border shadow-sm">
            {idx === 0 ? "第一個方程" : "第二個方程"}
        </div>

        <div className="mb-4 text-lg md:text-xl leading-loose text-gray-700 font-serif break-words">
          {parts.map((part, i) => {
             const isKeyword = i % 2 === 1;
             
             if (isKeyword) {
                 const keywordIndex = (i - 1) / 2;
                 const shouldSkip = skipInputIndices.includes(keywordIndex);
                 
                 if (shouldSkip) {
                   return <span key={i} className={`${segment.color} font-bold`}>{part}</span>;
                 }
                 
                 const isActive = activeInput?.type === 'lv1' && activeInput?.index === idx && activeInput?.partIdx === i;
                 return (
                   <span key={i} className="inline-flex flex-col items-center mx-2 align-top">
                     <input
                        ref={el => inputRefs.current[`lv1-${idx}-${i}`] = el}
                        type="text"
                        value={lv1Inputs[`${idx}-${i}`] || ""}
                        onChange={(e) => handleInputChange(e.target.value, 'lv1', idx, i)}
                        onFocus={() => setActiveInput({ type: 'lv1', index: idx, partIdx: i })}
                        style={{ width: `${Math.max(4, (lv1Inputs[`${idx}-${i}`] || "").length + 1)}ch` }}
                        className={`
                            h-10 text-center font-mono text-lg border-2 rounded-md shadow-sm min-w-[4rem]
                            focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors
                            ${isActive ? 'border-blue-500 bg-white' : 'border-gray-300 bg-gray-50'}
                            ${segment.color.replace('text-', 'text-')}
                        `}
                        placeholder="..."
                      />
                      <span className={`text-sm mt-1 font-bold ${segment.color} opacity-70 whitespace-nowrap`}>
                        {part}
                      </span>
                   </span>
                 );
             } else {
               return <span key={i}>{part}</span>;
             }
          })}
        </div>

        <div className="mt-2 bg-gray-100 p-3 rounded-lg flex items-center gap-2">
            <span className="text-sm text-gray-500 font-bold">預覽:</span>
            <div className="flex-1 overflow-x-auto">
                <MathRenderer expression={getCombinedLv1String(idx)} />
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white shadow-2xl min-h-screen md:min-h-[90vh] md:my-4 md:rounded-2xl overflow-hidden flex flex-col relative">
            
            <header className="bg-slate-800 text-white p-4 md:p-6 flex justify-between items-center z-10">
                <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Calculator className="text-blue-400"/> 
                    <span>聯立方程特訓</span>
                    <span className="text-sm bg-blue-600 px-2 py-0.5 rounded-full">LV{level}</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <Trophy className="text-yellow-400" size={20}/>
                    <span className="text-lg font-bold text-yellow-400">{score} 分</span>
                </div>
                </div>
                <div className="flex gap-2">
                <button onClick={() => setLevel(level === 1 ? 2 : 1)} className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition border border-slate-600">
                    切換模式
                </button>
                <button onClick={() => setShowNotes(true)} className="p-2 hover:bg-slate-700 rounded-lg transition text-blue-300">
                    <BookOpen size={24}/>
                </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8">
                {currentQ && (
                    <>
                    <div className="bg-white p-4 mb-4 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-800 text-lg leading-relaxed font-serif">{currentQ.text}</p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                       <p className="text-blue-900 font-medium md:text-lg">
                         <span className="font-bold">題目：</span>{currentQ.vars}
                       </p>
                    </div>

                    {level === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-2">{currentQ.title}</h2>
                            {currentQ.segments.map((seg, idx) => renderLv1Segment(seg, idx))}
                            
                            {inlineFeedback && (
                                <div className={`p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 ${inlineFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                         {inlineFeedback.type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                                         {inlineFeedback.type === 'success' ? '答對了！' : '再試一次'}
                                    </h3>
                                    <div className="font-mono whitespace-pre-wrap pl-7">
                                        {inlineFeedback.msg}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button 
                                            onClick={inlineFeedback.action} 
                                            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
                                        >
                                            下一題
                                        </button>
                                        {inlineFeedback.type === 'error' && (
                                            <button onClick={() => setInlineFeedback(null)} className="text-sm underline opacity-70 hover:opacity-100 px-4 py-2">
                                                關閉提示
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {level === 2 && (
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">{currentQ.title}</h2>
                                <p className="text-lg md:text-xl text-gray-700 leading-loose">
                                    {highlightHint ? (
                                        (() => {
                                            const allKeywords = currentQ.segments.flatMap(s => s.keywords);
                                            const escapedAllKeywords = allKeywords.map(escapeRegExp);
                                            const uniquePattern = [...new Set(escapedAllKeywords)].join('|');
                                            
                                            return currentQ.text.split(new RegExp(`(${uniquePattern})`, 'g')).map((part, i) => 
                                                allKeywords.includes(part) 
                                                ? <span key={i} className="bg-yellow-200 px-1 rounded">{part}</span> 
                                                : part
                                            );
                                        })()
                                    ) : currentQ.text}
                                </p>
                                <button 
                                    onClick={() => setHighlightHint(!highlightHint)}
                                    className="absolute top-6 right-6 text-amber-500 bg-amber-50 p-2 rounded-full hover:bg-amber-100 transition"
                                >
                                    <Lightbulb size={24} className={highlightHint ? "fill-current" : ""}/>
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {[0, 1].map((idx) => (
                                    <div 
                                        key={idx}
                                        className={`
                                            p-4 rounded-xl border-2 transition-all cursor-text relative
                                            ${activeInput?.type === 'lv2' && activeInput?.index === idx ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-gray-50'}
                                        `}
                                        onClick={() => {
                                            setActiveInput({ type: 'lv2', index: idx });
                                            if(inputRefs.current[`lv2-${idx}`]) inputRefs.current[`lv2-${idx}`].focus();
                                        }}
                                    >
                                        <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-bold text-gray-500 border rounded">
                                            方程 ({idx + 1})
                                        </span>
                                        <div className="flex items-center mt-2">
                                            <input
                                                ref={el => inputRefs.current[`lv2-${idx}`] = el}
                                                type="text"
                                                value={lv2Inputs[idx]}
                                                onChange={(e) => handleInputChange(e.target.value, 'lv2', idx)}
                                                className="w-full bg-transparent text-xl md:text-2xl font-mono focus:outline-none"
                                                placeholder="..."
                                            />
                                        </div>
                                        <div className="mt-2 h-8 flex items-center justify-end text-gray-400">
                                             <MathRenderer expression={lv2Inputs[idx]} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>
                )}
            </main>

            <div className="bg-gray-800 text-white p-2 md:px-8 text-center md:text-left z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">輸入值:</span>
                    <div className="bg-gray-700 px-4 py-1 rounded-lg min-w-[100px]">
                        <MathRenderer expression={
                            activeInput 
                            ? (activeInput.type === 'lv1' 
                                ? lv1Inputs[`${activeInput.index}-${activeInput.partIdx}`] 
                                : lv2Inputs[activeInput.index]) 
                            : ""
                        } />
                    </div>
                </div>
                <button onClick={checkAnswer} className="hidden md:block bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-bold shadow">
                    檢查答案
                </button>
            </div>
            
            <Keypad 
                isVisible={showKeypad}
                toggleVisibility={() => setShowKeypad(!showKeypad)}
                onInput={handleVirtualInput} 
                onDelete={handleVirtualDelete} 
                onClear={handleVirtualClear} 
                onEnter={checkAnswer} 
            />
            
            <CheatsheetModal isOpen={showNotes} onClose={() => setShowNotes(false)} />

            {feedback && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in duration-200">
                        {feedback.type === 'success' ? (
                            <div className="text-green-600 flex flex-col items-center">
                                <CheckCircle size={64} className="mb-4"/>
                                <h3 className="text-2xl font-bold mb-2">答對了！</h3>
                                <p className="text-gray-500">正在前往下一題...</p>
                            </div>
                        ) : (
                            <div className="text-red-500 flex flex-col items-center">
                                <XCircle size={64} className="mb-4"/>
                                <h3 className="text-2xl font-bold mb-2">再試一次</h3>
                                <div className="bg-red-50 p-4 rounded-xl w-full mb-4">
                                    <p className="text-gray-800 font-mono break-all whitespace-pre-wrap">{feedback.msg}</p>
                                </div>
                                <button 
                                    onClick={feedback.action} 
                                    className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition"
                                >
                                    下一題
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
