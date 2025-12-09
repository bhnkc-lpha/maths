import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Info, RefreshCw, Home as HomeIcon } from 'lucide-react';

// --- 幾何輔助函數 ---

const getCoords = (angle, radius, center) => {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
};

const getAngle = (x, y, center) => {
  const dx = x - center.x;
  const dy = y - center.y;
  let theta = Math.atan2(dy, dx);
  if (theta < 0) theta += 2 * Math.PI;
  return theta;
};

const calculateAngleDegrees = (p1, vertex, p2) => {
  const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
  const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
  let diff = a2 - a1;
  while (diff <= -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return Math.abs(diff * (180 / Math.PI));
};

const getSmartArcData = (startAngle, endAngle) => {
    let start = startAngle;
    let end = endAngle;
    let diff = end - start;
    while (diff < 0) diff += 2 * Math.PI;
    while (diff >= 2 * Math.PI) diff -= 2 * Math.PI;

    if (diff > Math.PI) {
        [start, end] = [end, start];
        diff = 2 * Math.PI - diff;
    }
    return { start, end, diff };
};

const getAngleArcPath = (x, y, radius, angle1, angle2) => {
    const { start, end } = getSmartArcData(angle1, angle2);
    const startPt = getCoords(start, radius, {x, y});
    const endPt = getCoords(end, radius, {x, y});
    return ["M", x, y, "L", startPt.x, startPt.y, "A", radius, radius, 0, 0, 1, endPt.x, endPt.y, "Z"].join(" ");
};

const getCircleArcPath = (center, radius, startAngle, endAngle) => {
    let diff = endAngle - startAngle;
    while (diff < 0) diff += 2 * Math.PI;
    
    const start = getCoords(startAngle, radius, center);
    const end = getCoords(endAngle, radius, center);
    const largeArcFlag = diff > Math.PI ? 1 : 0;
    
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");
};

const getMinorArcData = (angleA, angleB) => {
    let diff = Math.abs(angleA - angleB);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    
    let start = angleA;
    let end = angleB;
    
    let ccwDist = end - start;
    if (ccwDist < 0) ccwDist += 2 * Math.PI;
    
    if (ccwDist > Math.PI) {
        [start, end] = [end, start];
    }
    
    return { start, end, diff };
};

const getTextPos = (x, y, radius, angle1, angle2) => {
    const { start, diff } = getSmartArcData(angle1, angle2);
    const midAngle = start + diff / 2;
    return getCoords(midAngle, radius, {x, y});
};

const getArcLabelPos = (center, radius, angleA, angleB, padding = 25) => {
    const ax = Math.cos(angleA);
    const ay = Math.sin(angleA);
    const bx = Math.cos(angleB);
    const by = Math.sin(angleB);
    
    const midX = ax + bx;
    const midY = ay + by;
    
    const midAngle = Math.atan2(midY, midX);
    return getCoords(midAngle, radius + padding, center);
};

// 直角標記組件
const RightAngleMark = ({ p, a, b, size = 18, color = "#2563eb" }) => {
  const dx1 = a.x - p.x; const dy1 = a.y - p.y;
  const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
  const u1 = { x: dx1/len1, y: dy1/len1 };

  const dx2 = b.x - p.x; const dy2 = b.y - p.y;
  const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
  const u2 = { x: dx2/len2, y: dy2/len2 };

  const p1 = { x: p.x + u1.x * size, y: p.y + u1.y * size };
  const p2 = { x: p.x + u2.x * size, y: p.y + u2.y * size };
  const p3 = { x: p.x + (u1.x + u2.x) * size, y: p.y + (u1.y + u2.y) * size };

  return <path d={`M ${p1.x} ${p1.y} L ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`} fill="none" stroke={color} strokeWidth="2" />;
};

// 等長標記組件
const EqualLengthMark = ({ p1, p2, count = 1 }) => {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy / len;
    const ny = dx / len;
    
    const size = 6;
    const gap = 3;
    
    const marks = [];
    for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * gap;
        const bx = mx + (dx/len) * offset;
        const by = my + (dy/len) * offset;
        
        marks.push(
            <line 
                key={i}
                x1={bx - nx * size} y1={by - ny * size}
                x2={bx + nx * size} y2={by + ny * size}
                className="stroke-red-600 stroke-2"
            />
        );
    }
    return <g>{marks}</g>;
};

// 交互點組件
const PointHandle = ({ id, coord, color = "fill-blue-500", label, onDown, isHidden = false }) => {
    if (isHidden) return null;
    return (
        <g className="cursor-grab active:cursor-grabbing" onPointerDown={(e) => onDown(id, e)}>
            <circle cx={coord.x} cy={coord.y} r={20} className="fill-transparent" />
            <circle cx={coord.x} cy={coord.y} r={6} className={`${color} stroke-white stroke-2 shadow-sm`} />
            <text x={coord.x} y={coord.y - 12} textAnchor="middle" className="text-sm font-bold fill-gray-700 pointer-events-none select-none drop-shadow-md filter">
                {label || id}
            </text>
        </g>
    );
};

const CircleTheorems = () => {
  const width = 700; 
  const height = 600;
  const center = { x: width / 2, y: height / 2 - 40 };
  const radius = 160;

  const [mode, setMode] = useState('center');

  const [angles, setAngles] = useState({
    A: Math.PI * 0.8, 
    B: Math.PI * 0.2, 
    P: Math.PI * 1.5, 
    Q: Math.PI * 1.3,
    C: Math.PI * 0.9,
    D: Math.PI * 0.1,
    T: Math.PI * 0.5,
  });

  const [draggingPoint, setDraggingPoint] = useState(null);
  const svgRef = useRef(null);

  React.useEffect(() => {
    const newAngles = { ...angles };
    switch (mode) {
        case 'semicircle':
            newAngles.A = Math.PI;
            newAngles.B = 0;
            newAngles.P = Math.PI * 1.5;
            break;
        case 'segment':
            newAngles.A = Math.PI * 0.7;
            newAngles.B = Math.PI * 0.3;
            newAngles.P = Math.PI * 1.4;
            newAngles.Q = Math.PI * 1.6;
            break;
        case 'prop_center':
        case 'prop_circum':
            newAngles.A = Math.PI * 0.8;
            newAngles.B = Math.PI * 0.6; 
            newAngles.C = Math.PI * 0.4;
            newAngles.D = Math.PI * 0.2; 
            newAngles.P = Math.PI * 1.3;
            newAngles.Q = Math.PI * 1.7;
            break;
        case 'cyclic_quad':
            newAngles.A = Math.PI * 0.75; 
            newAngles.B = Math.PI * 0.25; 
            newAngles.C = Math.PI * 1.8;  
            newAngles.D = Math.PI * 1.2;  
            break;
        case 'tangent_chord':
            newAngles.T = Math.PI * 0.5; 
            newAngles.A = Math.PI * 1.8; 
            newAngles.P = Math.PI * 1.2; 
            break;
        case 'tangent_props':
            newAngles.T = 0;
            break;
        default:
            newAngles.A = Math.PI * 0.8;
            newAngles.B = Math.PI * 0.2;
            newAngles.P = Math.PI * 1.5;
            break;
    }
    setAngles(newAngles);
  }, [mode]);

  const handlePointerDown = (id, e) => {
    e.preventDefault();
    setDraggingPoint(id);
  };

  const handlePointerUp = () => {
    setDraggingPoint(null);
  };

  const handlePointerMove = (e) => {
    if (!draggingPoint || !svgRef.current) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const newAngle = getAngle(e.clientX - rect.left, e.clientY - rect.top, center);

    setAngles(prev => {
      const next = { ...prev, [draggingPoint]: newAngle };

      if (mode === 'semicircle') {
        if (draggingPoint === 'A') next.B = newAngle + Math.PI;
        if (draggingPoint === 'B') next.A = newAngle + Math.PI;
      }
      return next;
    });
  };

  // 計算坐標
  const coords = {};
  Object.keys(angles).forEach(key => {
      coords[key] = getCoords(angles[key], radius, center);
  });
  coords.O = center;

  // Mode 8 計算
  const radiusExt = 280;
  const coordsTExt = {
      x: center.x + radiusExt * Math.cos(angles.T),
      y: center.y + radiusExt * Math.sin(angles.T)
  };
  const distOT = radiusExt;
  const angleOffset = Math.acos(radius / distOT);
  const angleTanA = angles.T - angleOffset;
  const angleTanB = angles.T + angleOffset;
  
  const coordsTanA = getCoords(angleTanA, radius, center);
  const coordsTanB = getCoords(angleTanB, radius, center);

  // 通用角度計算
  const calcDeg = (p1, v, p2) => Math.round(calculateAngleDegrees(p1, v, p2) * 10) / 10;
  
  const valP = calcDeg(coords.A, coords.P, coords.B);
  const valQ = calcDeg(coords.A, coords.Q, coords.B); 
  const valO = calcDeg(coords.A, coords.O, coords.B);

  // Mode 4, 5
  const arcDataAB = getMinorArcData(angles.A, angles.B);
  const arcDataCD = getMinorArcData(angles.C, angles.D);
  const arcLenAB = Math.round(arcDataAB.diff * radius);
  const arcLenCD = Math.round(arcDataCD.diff * radius);
  const angleO_AB = Math.round((arcDataAB.diff * 180 / Math.PI) * 10)/10;
  const angleO_CD = Math.round((arcDataCD.diff * 180 / Math.PI) * 10)/10;
  const angleP_AB = calcDeg(coords.A, coords.P, coords.B);
  const angleQ_CD = calcDeg(coords.C, coords.Q, coords.D);

  // Mode 6
  const angleQuadB = calcDeg(coords.A, coords.B, coords.C);
  const angleQuadD = calcDeg(coords.C, coords.D, coords.A);
  const vecAB = { x: coords.B.x - coords.A.x, y: coords.B.y - coords.A.y };
  const lenAB = Math.sqrt(vecAB.x**2 + vecAB.y**2);
  const coordsE = { x: coords.B.x + (vecAB.x/lenAB)*60, y: coords.B.y + (vecAB.y/lenAB)*60 };
  const angleExtB = calcDeg(coordsE, coords.B, coords.C);

  // Mode 7
  const angleT = angles.T;
  const tanLen = 200;
  const coordsT1 = { x: coords.T.x + tanLen * Math.sin(angleT), y: coords.T.y - tanLen * Math.cos(angleT) };
  const coordsT2 = { x: coords.T.x - tanLen * Math.sin(angleT), y: coords.T.y + tanLen * Math.cos(angleT) };
  const angleTanChord = calcDeg(coordsT1, coords.T, coords.A) < 90 ? calcDeg(coordsT1, coords.T, coords.A) : calcDeg(coordsT2, coords.T, coords.A);
  const angleAltSeg = calcDeg(coords.T, coords.P, coords.A);

  // Mode 8 Values
  const lenTanA = Math.sqrt(Math.pow(coordsTExt.x - coordsTanA.x, 2) + Math.pow(coordsTExt.y - coordsTanA.y, 2));
  const lenTanB = Math.sqrt(Math.pow(coordsTExt.x - coordsTanB.x, 2) + Math.pow(coordsTExt.y - coordsTanB.y, 2));
  const angleATO = calcDeg(coordsTanA, coordsTExt, center);
  const angleBTO = calcDeg(coordsTanB, coordsTExt, center);
  const angleAOT = calcDeg(coordsTanA, center, coordsTExt);
  const angleBOT = calcDeg(coordsTanB, center, coordsTExt);

  const modes = [
    { id: 'center', label: '1. 圓心角兩倍於圓周角' },
    { id: 'segment', label: '2. 同弓形圓周角相等' },
    { id: 'semicircle', label: '3. 半圓上的圓周角' },
    { id: 'prop_center', label: '4. 弧與圓心角成比例' },
    { id: 'prop_circum', label: '5. 弧與圓周角成比例' },
    { id: 'cyclic_quad', label: '6. 圓內接四邊形' },
    { id: 'tangent_chord', label: '7. 交錯弓形的圓周角' },
    { id: 'tangent_props', label: '8. 切線性質' },
  ];

  const ModeBtn = ({ m }) => (
      <button 
        onClick={() => setMode(m.id)}
        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all border ${
            mode === m.id 
            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        }`}
      >
        {m.label}
      </button>
  );

  const labelPosAB = getArcLabelPos(center, radius, angles.A, angles.B);
  const labelPosCD = getArcLabelPos(center, radius, angles.C, angles.D);

  return (
    <>
      <Link 
        to="/" 
        className="fixed top-4 left-4 z-50 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg shadow-md border border-slate-200 flex items-center gap-2 transition-all hover:shadow-lg"
      >
        <HomeIcon size={18} />
        <span className="font-medium">返回首頁</span>
      </Link>

      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 font-sans text-slate-800 select-none">
        
        <header className="mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <RefreshCw size={28} className="text-blue-600" />
            高中DSE圓形定理溫習
          </h1>
        </header>

        <div className="flex flex-wrap gap-2 mb-4 justify-center max-w-4xl">
          {modes.map(m => <ModeBtn key={m.id} m={m} />)}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 max-w-full w-[700px] flex flex-col items-center border border-slate-100">
          
          <div className="w-full mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 flex gap-3 min-h-[80px] items-center">
            <Info className="text-blue-500 shrink-0" size={24} />
            <div className="text-sm md:text-base text-blue-800">
              {mode === 'center' && "同弧所對的圓心角是圓周角的兩倍。 (∠AOB = 2 × ∠APB)"}
              {mode === 'segment' && "同弓形（同弧）內的圓周角相等。 (∠APB = ∠AQB)"}
              {mode === 'semicircle' && "半圓上的圓周角是直角 (90°)。"}
              {mode === 'prop_center' && "弧長與圓心角大小成正比。 (弧AB : 弧CD = ∠AOB : ∠COD)"}
              {mode === 'prop_circum' && "弧長與圓周角大小成正比。 (弧AB : 弧CD = ∠APB : ∠CQD)"}
              {mode === 'cyclic_quad' && <span>圓內接四邊形：<br/>1. 對角互補 (∠ABC + ∠CDA = 180°)<br/>2. 外角等於內對角 (∠CBE = ∠CDA)</span>}
              {mode === 'tangent_chord' && "切線弦角定理：弦切角等於其交錯弓形內的圓周角。"}
              {mode === 'tangent_props' && <span>切線性質：從圓外一點 T 引兩切線。<br/>1. 切線長相等 (AT = BT)<br/>2. 圓心連線平分夾角 (∠ATO=∠BTO, ∠AOT=∠BOT)</span>}
            </div>
          </div>

          <div className="relative w-full" style={{ aspectRatio: `${width}/${height}` }}>
              <svg 
                  ref={svgRef}
                  viewBox={`0 0 ${width} ${height}`} 
                  className="w-full h-full touch-none bg-slate-50 rounded-xl border border-slate-100"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
              >
                  <defs>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                      </marker>
                  </defs>

                  <circle cx={center.x} cy={center.y} r={radius} className="fill-white stroke-slate-300 stroke-2" />
                  <circle cx={center.x} cy={center.y} r={4} className="fill-slate-600" />
                  <text x={center.x + 10} y={center.y + 5} className="text-sm font-bold fill-slate-700">O</text>
                
                  {/* MODE 1, 2, 3 */}
                  {['center', 'segment', 'semicircle'].includes(mode) && (
                      <>
                          <path d={`M ${coords.A.x} ${coords.A.y} L ${coords.P.x} ${coords.P.y} L ${coords.B.x} ${coords.B.y}`} className="stroke-blue-400 stroke-2 fill-none" />
                          <line x1={coords.A.x} y1={coords.A.y} x2={coords.B.x} y2={coords.B.y} className={`stroke-slate-300 stroke-2 ${mode === 'semicircle' ? 'stroke-red-400 stroke-[3]' : 'stroke-dashed'}`} />
                          
                          {mode === 'center' && (
                              <path d={`M ${coords.A.x} ${coords.A.y} L ${center.x} ${center.y} L ${coords.B.x} ${coords.B.y}`} className="stroke-red-400 stroke-2 fill-none" />
                          )}
                          {mode === 'segment' && (
                              <path d={`M ${coords.A.x} ${coords.A.y} L ${coords.Q.x} ${coords.Q.y} L ${coords.B.x} ${coords.B.y}`} className="stroke-green-400 stroke-2 fill-none" />
                          )}

                          {mode === 'center' && (
                              <g>
                                  <path d={getAngleArcPath(center.x, center.y, 25, angles.A, angles.B)} className="fill-red-100 stroke-red-300" />
                                  <text x={getTextPos(center.x, center.y, 45, angles.A, angles.B).x} y={getTextPos(center.x, center.y, 45, angles.A, angles.B).y} className="text-xs font-bold fill-red-600" textAnchor="middle" dominantBaseline="middle">{valO}°</text>
                              </g>
                          )}

                          <g>
                              {mode === 'semicircle' && Math.abs(valP - 90) < 1 ? (
                                  <RightAngleMark p={coords.P} a={coords.A} b={coords.B} />
                              ) : (
                                  <path d={getAngleArcPath(coords.P.x, coords.P.y, 25, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P))} className="fill-blue-100 stroke-blue-300" />
                              )}
                              <text x={getTextPos(coords.P.x, coords.P.y, 45, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P)).x} y={getTextPos(coords.P.x, coords.P.y, 45, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{valP}°</text>
                          </g>

                          {mode === 'segment' && (
                              <g>
                                  <path d={getAngleArcPath(coords.Q.x, coords.Q.y, 25, getAngle(coords.A.x, coords.A.y, coords.Q), getAngle(coords.B.x, coords.B.y, coords.Q))} className="fill-green-100 stroke-green-300" />
                                  <text x={getTextPos(coords.Q.x, coords.Q.y, 45, getAngle(coords.A.x, coords.A.y, coords.Q), getAngle(coords.B.x, coords.B.y, coords.Q)).x} y={getTextPos(coords.Q.x, coords.Q.y, 45, getAngle(coords.A.x, coords.A.y, coords.Q), getAngle(coords.B.x, coords.B.y, coords.Q)).y} className="text-xs font-bold fill-green-600" textAnchor="middle" dominantBaseline="middle">{valQ}°</text>
                              </g>
                          )}
                      </>
                  )}

                  {/* MODE 4, 5 */}
                  {['prop_center', 'prop_circum'].includes(mode) && (
                      <>
                          <path d={getCircleArcPath(center, radius, arcDataAB.start, arcDataAB.end)} className="stroke-red-500 stroke-[6] fill-none opacity-50" />
                          <path d={getCircleArcPath(center, radius, arcDataCD.start, arcDataCD.end)} className="stroke-orange-500 stroke-[6] fill-none opacity-50" />

                          <text x={labelPosAB.x} y={labelPosAB.y} textAnchor="middle" className="text-xs font-bold fill-red-500">L={arcLenAB}</text>
                          <text x={labelPosCD.x} y={labelPosCD.y} textAnchor="middle" className="text-xs font-bold fill-orange-500">L={arcLenCD}</text>

                          {mode === 'prop_center' ? (
                              <>
                                  <path d={`M ${coords.A.x} ${coords.A.y} L ${center.x} ${center.y} L ${coords.B.x} ${coords.B.y}`} className="stroke-red-200 stroke-2 fill-none" />
                                  <path d={`M ${coords.C.x} ${coords.C.y} L ${center.x} ${center.y} L ${coords.D.x} ${coords.D.y}`} className="stroke-orange-200 stroke-2 fill-none" />
                                  
                                  <g>
                                      <path d={getAngleArcPath(center.x, center.y, 30, angles.A, angles.B)} className="fill-red-100 stroke-red-300" />
                                      <text x={getTextPos(center.x, center.y, 50, angles.A, angles.B).x} y={getTextPos(center.x, center.y, 50, angles.A, angles.B).y} className="text-xs font-bold fill-red-600" textAnchor="middle" dominantBaseline="middle">{angleO_AB}°</text>
                                  </g>
                                  <g>
                                      <path d={getAngleArcPath(center.x, center.y, 40, angles.C, angles.D)} className="fill-orange-100 stroke-orange-300" />
                                      <text x={getTextPos(center.x, center.y, 60, angles.C, angles.D).x} y={getTextPos(center.x, center.y, 60, angles.C, angles.D).y} className="text-xs font-bold fill-orange-600" textAnchor="middle" dominantBaseline="middle">{angleO_CD}°</text>
                                  </g>
                              </>
                          ) : (
                              <>
                                  <path d={`M ${coords.A.x} ${coords.A.y} L ${coords.P.x} ${coords.P.y} L ${coords.B.x} ${coords.B.y}`} className="stroke-blue-200 stroke-2 fill-none" />
                                  <path d={`M ${coords.C.x} ${coords.C.y} L ${coords.Q.x} ${coords.Q.y} L ${coords.D.x} ${coords.D.y}`} className="stroke-green-200 stroke-2 fill-none" />
                                  
                                  <g>
                                      <path d={getAngleArcPath(coords.P.x, coords.P.y, 25, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P))} className="fill-blue-100 stroke-blue-300" />
                                      <text x={getTextPos(coords.P.x, coords.P.y, 40, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P)).x} y={getTextPos(coords.P.x, coords.P.y, 40, getAngle(coords.A.x, coords.A.y, coords.P), getAngle(coords.B.x, coords.B.y, coords.P)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{angleP_AB}°</text>
                                  </g>
                                  <g>
                                      <path d={getAngleArcPath(coords.Q.x, coords.Q.y, 25, getAngle(coords.C.x, coords.C.y, coords.Q), getAngle(coords.D.x, coords.D.y, coords.Q))} className="fill-green-100 stroke-green-300" />
                                      <text x={getTextPos(coords.Q.x, coords.Q.y, 40, getAngle(coords.C.x, coords.C.y, coords.Q), getAngle(coords.D.x, coords.D.y, coords.Q)).x} y={getTextPos(coords.Q.x, coords.Q.y, 40, getAngle(coords.C.x, coords.C.y, coords.Q), getAngle(coords.D.x, coords.D.y, coords.Q)).y} className="text-xs font-bold fill-green-600" textAnchor="middle" dominantBaseline="middle">{angleQ_CD}°</text>
                                  </g>
                              </>
                          )}
                      </>
                  )}

                  {/* MODE 6 */}
                  {mode === 'cyclic_quad' && (
                      <>
                          <polygon points={`${coords.A.x},${coords.A.y} ${coords.B.x},${coords.B.y} ${coords.C.x},${coords.C.y} ${coords.D.x},${coords.D.y}`} className="fill-blue-50 stroke-blue-500 stroke-2 opacity-80" />
                          
                          <line x1={coords.A.x} y1={coords.A.y} x2={coordsE.x} y2={coordsE.y} className="stroke-slate-400 stroke-2 stroke-dasharray-4" markerEnd="url(#arrow)" />
                          <text x={coordsE.x + 5} y={coordsE.y} className="text-xs fill-slate-500">E</text>

                          <path d={getAngleArcPath(coords.B.x, coords.B.y, 25, getAngle(coords.A.x, coords.A.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B))} className="fill-blue-100 stroke-blue-300" />
                          <text x={getTextPos(coords.B.x, coords.B.y, 40, getAngle(coords.A.x, coords.A.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B)).x} y={getTextPos(coords.B.x, coords.B.y, 40, getAngle(coords.A.x, coords.A.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{angleQuadB}°</text>

                          <path d={getAngleArcPath(coords.D.x, coords.D.y, 25, getAngle(coords.C.x, coords.C.y, coords.D), getAngle(coords.A.x, coords.A.y, coords.D))} className="fill-green-100 stroke-green-300" />
                          <text x={getTextPos(coords.D.x, coords.D.y, 40, getAngle(coords.C.x, coords.C.y, coords.D), getAngle(coords.A.x, coords.A.y, coords.D)).x} y={getTextPos(coords.D.x, coords.D.y, 40, getAngle(coords.C.x, coords.C.y, coords.D), getAngle(coords.A.x, coords.A.y, coords.D)).y} className="text-xs font-bold fill-green-600" textAnchor="middle" dominantBaseline="middle">{angleQuadD}°</text>

                          <path d={getAngleArcPath(coords.B.x, coords.B.y, 20, getAngle(coordsE.x, coordsE.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B))} className="fill-green-100 stroke-green-500" />
                          <text x={getTextPos(coords.B.x, coords.B.y, 35, getAngle(coordsE.x, coordsE.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B)).x + 10} y={getTextPos(coords.B.x, coords.B.y, 35, getAngle(coordsE.x, coordsE.y, coords.B), getAngle(coords.C.x, coords.C.y, coords.B)).y} className="text-xs font-bold fill-green-700" textAnchor="middle" dominantBaseline="middle">{angleExtB}°</text>
                      </>
                  )}

                  {/* MODE 7 */}
                  {mode === 'tangent_chord' && (
                      <>
                          <polygon points={`${coords.T.x},${coords.T.y} ${coords.A.x},${coords.A.y} ${coords.P.x},${coords.P.y}`} className="fill-none stroke-blue-400 stroke-2" />
                          
                          <line x1={coordsT1.x} y1={coordsT1.y} x2={coordsT2.x} y2={coordsT2.y} className="stroke-red-500 stroke-2" />
                          
                          <line x1={center.x} y1={center.y} x2={coords.T.x} y2={coords.T.y} className="stroke-slate-300 stroke-1 stroke-dasharray-4" />
                          <RightAngleMark p={coords.T} a={center} b={coordsT1} color="#cbd5e1" />

                          <g>
                              <path d={getAngleArcPath(coords.T.x, coords.T.y, 30, getAngle(coordsT1.x, coordsT1.y, coords.T), getAngle(coords.A.x, coords.A.y, coords.T))} className="fill-red-100 stroke-red-500" />
                               <text x={coords.T.x} y={coords.T.y - 40} className="text-xs font-bold fill-red-600" textAnchor="middle">{angleTanChord}°</text>
                          </g>

                          <g>
                              <path d={getAngleArcPath(coords.P.x, coords.P.y, 25, getAngle(coords.T.x, coords.T.y, coords.P), getAngle(coords.A.x, coords.A.y, coords.P))} className="fill-blue-100 stroke-blue-500" />
                              <text x={getTextPos(coords.P.x, coords.P.y, 40, getAngle(coords.T.x, coords.T.y, coords.P), getAngle(coords.A.x, coords.A.y, coords.P)).x} y={getTextPos(coords.P.x, coords.P.y, 40, getAngle(coords.T.x, coords.T.y, coords.P), getAngle(coords.A.x, coords.A.y, coords.P)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{angleAltSeg}°</text>
                          </g>
                      </>
                  )}

                  {/* MODE 8 */}
                  {mode === 'tangent_props' && (
                      <>
                          <line x1={center.x} y1={center.y} x2={coordsTanA.x} y2={coordsTanA.y} className="stroke-slate-300 stroke-2 stroke-dasharray-4" />
                          <line x1={center.x} y1={center.y} x2={coordsTanB.x} y2={coordsTanB.y} className="stroke-slate-300 stroke-2 stroke-dasharray-4" />
                          
                          <line x1={coordsTExt.x} y1={coordsTExt.y} x2={coordsTanA.x} y2={coordsTanA.y} className="stroke-red-500 stroke-2" />
                          <line x1={coordsTExt.x} y1={coordsTExt.y} x2={coordsTanB.x} y2={coordsTanB.y} className="stroke-red-500 stroke-2" />
                          
                          <line x1={center.x} y1={center.y} x2={coordsTExt.x} y2={coordsTExt.y} className="stroke-slate-400 stroke-1 stroke-dasharray-2" />
                          
                          <RightAngleMark p={coordsTanA} a={center} b={coordsTExt} />
                          <RightAngleMark p={coordsTanB} a={center} b={coordsTExt} />
                          
                          <EqualLengthMark p1={coordsTExt} p2={coordsTanA} count={2} />
                          <EqualLengthMark p1={coordsTExt} p2={coordsTanB} count={2} />
                          
                          <g>
                              <path d={getAngleArcPath(coordsTExt.x, coordsTExt.y, 60, angles.T, getAngle(coordsTanA.x, coordsTanA.y, coordsTExt))} className="fill-blue-100 stroke-blue-500" />
                               <text x={getTextPos(coordsTExt.x, coordsTExt.y, 75, angles.T, getAngle(coordsTanA.x, coordsTanA.y, coordsTExt)).x} y={getTextPos(coordsTExt.x, coordsTExt.y, 75, angles.T, getAngle(coordsTanA.x, coordsTanA.y, coordsTExt)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{angleATO}°</text>
                          </g>
                           <g>
                              <path d={getAngleArcPath(coordsTExt.x, coordsTExt.y, 60, angles.T, getAngle(coordsTanB.x, coordsTanB.y, coordsTExt))} className="fill-blue-100 stroke-blue-500" />
                               <text x={getTextPos(coordsTExt.x, coordsTExt.y, 75, angles.T, getAngle(coordsTanB.x, coordsTanB.y, coordsTExt)).x} y={getTextPos(coordsTExt.x, coordsTExt.y, 75, angles.T, getAngle(coordsTanB.x, coordsTanB.y, coordsTExt)).y} className="text-xs font-bold fill-blue-600" textAnchor="middle" dominantBaseline="middle">{angleBTO}°</text>
                          </g>
                          
                          <g>
                              <path d={getAngleArcPath(center.x, center.y, 30, angles.T, getAngle(coordsTanA.x, coordsTanA.y, center))} className="fill-green-100 stroke-green-500" />
                               <text x={getTextPos(center.x, center.y, 45, angles.T, getAngle(coordsTanA.x, coordsTanA.y, center)).x} y={getTextPos(center.x, center.y, 45, angles.T, getAngle(coordsTanA.x, coordsTanA.y, center)).y} className="text-xs font-bold fill-green-600" textAnchor="middle" dominantBaseline="middle">{angleAOT}°</text>
                          </g>
                           <g>
                              <path d={getAngleArcPath(center.x, center.y, 30, angles.T, getAngle(coordsTanB.x, coordsTanB.y, center))} className="fill-green-100 stroke-green-500" />
                               <text x={getTextPos(center.x, center.y, 45, angles.T, getAngle(coordsTanB.x, coordsTanB.y, center)).x} y={getTextPos(center.x, center.y, 45, angles.T, getAngle(coordsTanB.x, coordsTanB.y, center)).y} className="text-xs font-bold fill-green-600" textAnchor="middle" dominantBaseline="middle">{angleBOT}°</text>
                          </g>
                          
                           <text x={coordsTanA.x} y={coordsTanA.y - 10} className="text-sm font-bold fill-slate-700">A</text>
                           <text x={coordsTanB.x} y={coordsTanB.y + 20} className="text-sm font-bold fill-slate-700">B</text>
                      </>
                  )}

                  {/* HANDLES */}
                  {['center', 'segment', 'semicircle'].includes(mode) && (
                      <>
                          <PointHandle id="A" coord={coords.A} onDown={handlePointerDown} />
                          <PointHandle id="B" coord={coords.B} onDown={handlePointerDown} />
                          <PointHandle id="P" coord={coords.P} onDown={handlePointerDown} color="fill-blue-600" />
                          <PointHandle id="Q" coord={coords.Q} onDown={handlePointerDown} color="fill-green-600" isHidden={mode !== 'segment'} />
                      </>
                  )}
                  {['prop_center', 'prop_circum'].includes(mode) && (
                      <>
                          <PointHandle id="A" coord={coords.A} onDown={handlePointerDown} color="fill-red-600" label="A" />
                          <PointHandle id="B" coord={coords.B} onDown={handlePointerDown} color="fill-red-600" label="B" />
                          <PointHandle id="C" coord={coords.C} onDown={handlePointerDown} color="fill-orange-600" label="C" />
                          <PointHandle id="D" coord={coords.D} onDown={handlePointerDown} color="fill-orange-600" label="D" />
                          <PointHandle id="P" coord={coords.P} onDown={handlePointerDown} color="fill-blue-600" isHidden={mode !== 'prop_circum'} />
                          <PointHandle id="Q" coord={coords.Q} onDown={handlePointerDown} color="fill-green-600" isHidden={mode !== 'prop_circum'} />
                      </>
                  )}
                  {mode === 'cyclic_quad' && (
                      <>
                          <PointHandle id="A" coord={coords.A} onDown={handlePointerDown} />
                          <PointHandle id="B" coord={coords.B} onDown={handlePointerDown} />
                          <PointHandle id="C" coord={coords.C} onDown={handlePointerDown} />
                          <PointHandle id="D" coord={coords.D} onDown={handlePointerDown} />
                      </>
                  )}
                  {mode === 'tangent_chord' && (
                      <>
                          <PointHandle id="T" coord={coords.T} onDown={handlePointerDown} color="fill-red-600" label="T (切點)" />
                          <PointHandle id="A" coord={coords.A} onDown={handlePointerDown} label="A" />
                          <PointHandle id="P" coord={coords.P} onDown={handlePointerDown} label="P" />
                      </>
                  )}
                  {mode === 'tangent_props' && (
                      <>
                          <PointHandle id="T" coord={coordsTExt} onDown={handlePointerDown} color="fill-red-600" label="T" />
                      </>
                  )}

              </svg>
          </div>

          {/* Data Panel */}
          <div className="mt-4 w-full bg-slate-50 p-4 rounded border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {mode === 'prop_center' && (
                  <>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-red-600 font-bold">紅色組 (A-B)</span>
                          <span>弧長: {arcLenAB} / 角度: {angleO_AB}°</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-orange-600 font-bold">橙色組 (C-D)</span>
                          <span>弧長: {arcLenCD} / 角度: {angleO_CD}°</span>
                      </div>
                      <div className="col-span-full text-center text-slate-500 mt-1">
                          比率 (弧/角): {(arcLenAB/angleO_AB).toFixed(2)} vs {(arcLenCD/angleO_CD).toFixed(2)} (相等)
                      </div>
                  </>
              )}
              {mode === 'prop_circum' && (
                  <>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-blue-600 font-bold">藍色組 (∠P 對 弧AB)</span>
                          <span>弧長: {arcLenAB} / 角度: {angleP_AB}°</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-green-600 font-bold">綠色組 (∠Q 對 弧CD)</span>
                          <span>弧長: {arcLenCD} / 角度: {angleQ_CD}°</span>
                      </div>
                  </>
              )}
              {mode === 'cyclic_quad' && (
                  <>
                       <div className="flex justify-between items-center border-b pb-1">
                          <span>對角和 (∠ABC + ∠CDA)</span>
                          <span className="font-mono font-bold">{angleQuadB}° + {angleQuadD}° = {(angleQuadB + angleQuadD).toFixed(0)}°</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span>外角 vs 內對角</span>
                          <span className="font-mono font-bold text-green-600">∠CBE = {angleExtB}° / ∠CDA = {angleQuadD}°</span>
                      </div>
                  </>
              )}
              {mode === 'tangent_chord' && (
                  <div className="col-span-full flex justify-center gap-8 text-base">
                      <span className="text-red-600 font-bold">弦切角: {angleTanChord}°</span>
                      <span className="text-slate-400">=</span>
                      <span className="text-blue-600 font-bold">交錯弓形圓周角: {angleAltSeg}°</span>
                  </div>
              )}
               {mode === 'tangent_props' && (
                  <>
                       <div className="flex justify-between items-center border-b pb-1">
                          <span className="font-bold">切線長度 (AT vs BT)</span>
                          <span className="font-mono">{lenTanA.toFixed(1)} vs {lenTanB.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                          <span className="font-bold">切線夾角半角 (∠ATO vs ∠BTO)</span>
                          <span className="font-mono text-blue-600">{angleATO}° vs {angleBTO}°</span>
                      </div>
                       <div className="flex justify-between items-center border-b pb-1">
                          <span className="font-bold">圓心夾角半角 (∠AOT vs ∠BOT)</span>
                          <span className="font-mono text-green-600">{angleAOT}° vs {angleBOT}°</span>
                      </div>
                  </>
              )}
              {['center', 'segment', 'semicircle'].includes(mode) && (
                  <div className="col-span-full text-center text-slate-500">
                      拖動圓上的點來觀察數值變化
                  </div>
              )}
          </div>

        </div>
      </div>
    </>
  );
};

export default CircleTheorems;
