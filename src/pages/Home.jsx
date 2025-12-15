import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, BookOpen, Award } from 'lucide-react';

const Home = () => {
  const [activeFilter, setActiveFilter] = useState('全部');

  const apps = [
    {
      id: 'angle-quiz',
      title: '角的標記',
      description: '學習如何正確標記和命名角度 (使用三個英文字母)',
      icon: Calculator,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/angle-quiz',
      level: 'F1',
      chapter: 'CH5',
      subject: '面積和體積（一）',
      category: '初中',
      topics: ['角度命名', '幾何圖形', '三點標記法']
    },
    { 
      id: 'circle-theorems',
      title: '高中DSE圓形定理',
      description: 'DSE 圓形幾何互動模型：不同核心定理動態演示，可拖動點觀察數值變化',
      icon: Calculator,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/circle-theorems',
      level: 'F5',
      chapter: 'CH12-13',
      subject: '圓的基本性質 · 圓的切線',
      category: '高中',
      topics: ['圓形性質', '切線', '圓內接四邊形']
    },
    {  
      id: 'identity',  
      title: '恆等式展開/因式分解',  
      description: '恆等式展開與因式分解練習',  
      icon: Calculator,  
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',  
      path: '/identity-quiz',  
      level: 'F2',
      chapter: 'CH3-4',
      subject: '恆等式 · 因式分解',
      category: '初中',
      topics: ['完全平方', '展開', '因式分解']
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                遊數得計
              </h1>
              <p className="text-lg text-slate-600">數學自習天地</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            歡迎來到數學自習天地 🎓
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            透過互動式學習工具，讓你以輕鬆的遊戲方式去鞏固知識，溫習測考！選擇下方的應用程式開始你的學習之旅。
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{apps.length}</div>
            <div className="text-sm text-slate-600">個學習工具</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">多個</div>
            <div className="text-sm text-slate-600">數學主題</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">即時</div>
            <div className="text-sm text-slate-600">互動練習</div>
          </div>
        </div>

        {/* ✅ 篩選器 Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full font-bold transition-all text-sm ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.id}
                  to={app.path}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-300 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className={`${app.color} p-6 ${app.hoverColor} transition-colors`}>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-10 h-10 text-white" />
                      <ArrowRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {app.title}
                    </h3>
                    {/* ✅ 課程標籤 (Form + Chapter) */}
                    <div className="flex gap-2 mb-2">
                      <span className="inline-block bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                        {app.level} {app.chapter}
                      </span>
                    </div>
                    {/* ✅ 課題名稱 */}
                    <p className="text-white/90 text-sm font-medium">
                      {app.subject}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {app.description}
                    </p>
                    
                    {/* Topics */}
                    <div className="flex flex-wrap gap-2">
                      {app.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700">
                      開始練習
                      <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            // ✅ 空狀態處理
            <div className="col-span-full text-center py-12">
              <p className="text-slate-400 text-xl font-medium">
                暫無符合條件的學習工具 😔
              </p>
              <button 
                onClick={() => setActiveFilter('全部')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                查看全部
              </button>
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">更多工具即將推出...</h3>
          <p className="text-slate-600">我們正在開發更多互動式學習工具，敬請期待！</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-slate-600 text-sm">
          <p>© 2025 遊數得計 數學自習天地 | 創建者:李柏熹老師</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
