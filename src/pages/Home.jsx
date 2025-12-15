import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Circle, BookOpen } from 'lucide-react';

const Home = () => {
  const [activeFilter, setActiveFilter] = useState('全部');

  // 定義所有 APP 資料
  const apps = [
    {
      id: 'angle-marking',
      title: '角的標記',
      path: '/angle-marking',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      level: 'F1',
      chapter: 'CH5',
      subject: '面積和體積（一）',
      description: '學習如何正確標記和命名角度(使用三個英文字母)',
      tags: ['角度命名', '幾何圖形', '三點標記法'],
      category: '初中'
    },
    {
      id: 'circle-theorems',
      title: '高中DSE圓形定理',
      path: '/circle-theorems',
      icon: <Circle className="w-8 h-8" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      level: 'F5',
      chapter: 'CH12-13',
      subject: '圓的基本性質 · 圓的切線',
      description: 'DSE 圓形幾何互動模型:不同核心定理動態演示,可拖動點觀察數值變化',
      tags: ['圓形性質', '切線', '圓內接四邊形'],
      category: '高中'
    },
    {
      id: 'identity-quiz',
      title: '恆等式展開/因式分解',
      path: '/identity-quiz',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      level: 'F2',
      chapter: 'CH3-4',
      subject: '恆等式 · 因式分解',
      description: '恆等式展開與因式分解練習',
      tags: ['完全平方', '展開', '因式分解'],
      category: '初中'
    }
  ];

  // 篩選邏輯
  const filters = ['全部', '初中', '高中', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6'];

  const filteredApps = apps.filter(app => {
    if (activeFilter === '全部') return true;
    if (activeFilter === '初中' || activeFilter === '高中') {
      return app.category === activeFilter;
    }
    return app.level === activeFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-10">
      
      {/* 頁面標題 */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-3 tracking-tight">
          數學互動學習平台
        </h1>
        <p className="text-slate-600 text-lg">
          選擇你想練習的主題，開始互動學習之旅 🚀
        </p>
      </div>

      {/* 篩選器 */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full font-bold transition-all ${
                  activeFilter === filter
                    ? 'bg-indigo-500 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* APP 卡片網格 */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <Link
              key={app.id}
              to={app.path}
              className={`block ${app.bgColor} rounded-2xl shadow-lg border-2 ${app.borderColor} overflow-hidden transition-all hover:shadow-2xl hover:scale-105 hover:-translate-y-1`}
            >
              {/* 課程標籤 */}
              <div className="p-4 pb-0">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-${app.color}-500 text-white shadow-sm`}>
                  {app.level} {app.chapter}
                </span>
              </div>

              {/* 卡片內容 */}
              <div className="p-6">
                {/* Icon */}
                <div className={`mb-4 inline-block p-3 bg-white rounded-xl shadow-sm text-${app.color}-500`}>
                  {app.icon}
                </div>

                {/* 標題 */}
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {app.title}
                </h2>

                {/* 副標題 */}
                <p className="text-sm text-slate-500 font-medium mb-3">
                  {app.subject}
                </p>

                {/* 描述 */}
                <p className="text-slate-600 mb-4 leading-relaxed">
                  {app.description}
                </p>

                {/* 標籤 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {app.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 按鈕 */}
                <button className={`w-full ${app.buttonColor} text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2`}>
                  開始練習
                  <span>→</span>
                </button>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 text-xl font-medium">
              暫無符合條件的學習工具 😔
            </p>
          </div>
        )}
      </div>

      {/* 頁腳資訊 */}
      <div className="max-w-6xl mx-auto mt-12 text-center text-slate-500 text-sm">
        <p>💡 提示：所有練習都支援即時互動和視覺化學習</p>
      </div>

    </div>
  );
};

export default Home;
