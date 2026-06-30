/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sliders, HelpCircle, Eye, RefreshCw, Layers, ShieldCheck, Sun } from 'lucide-react';
import { CameraPreset } from '../types';
import { cameraPresets } from '../data/presets';

export default function CameraWorkbench() {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  
  // Custom manual state bindings
  const [aperture, setAperture] = useState<number>(2.8); // f/number (1.4, 2.8, 4, 8, 22)
  const [iso, setIso] = useState<number>(400); // 100, 400, 800, 1600, 3200, 6400
  const [shutterSpeed, setShutterSpeed] = useState<string>("1/125"); // 1s, 1/50, 1/125, 1/400, 1/800
  const [whiteBalance, setWhiteBalance] = useState<string>("5,000 - 5,500 K"); // Kelvin scale ranges

  // Sync settings when selecting preset
  useEffect(() => {
    const preset = cameraPresets[selectedPreset];
    if (preset) {
      if (preset.aperture.includes("f/")) {
        setAperture(parseFloat(preset.aperture.replace("f/", "")));
      }
      setIso(parseInt(preset.iso) || 400);
      setShutterSpeed(preset.shutterSpeed);
      if (preset.whiteBalance.includes("Daylight")) setWhiteBalance("5,000 - 5,500 K");
      else if (preset.whiteBalance.includes("Tungsten")) setWhiteBalance("2,500 - 3,000 K");
      else if (preset.whiteBalance.includes("Cloudy")) setWhiteBalance("7,000 - 10,000 K");
      else setWhiteBalance("5,000 - 5,500 K");
    }
  }, [selectedPreset]);

  // Exposure calculation for simulation feedback
  // baseline F/2.8, ISO400, Shutter 1/125s, Daylight as 0% exposure deviation
  const getExposureLevel = () => {
    // F-stop effect: wide aperture (eg f1.4) yields more light, narrow aperture (f16) yields less light
    const baseAperture = 2.8;
    const apertureDelta = Math.log2(baseAperture / aperture) * 2; // stops

    // ISO Effect: high iso yields more brightness
    const baseIso = 400;
    const isoDelta = Math.log2(iso / baseIso);

    // Shutter speed effect
    const speedMap: Record<string, number> = {
      "1/800": -3,
      "1/400": -1.7,
      "1/125": 0,
      "1/50": 1.3,
      "1s": 5
    };
    const speedDelta = speedMap[shutterSpeed] !== undefined ? speedMap[shutterSpeed] : 0;

    const totalStops = apertureDelta + isoDelta + speedDelta;
    return totalStops; // Returns exposure stops difference
  };

  const exposureStops = getExposureLevel();
  const brightnessPercent = Math.max(20, Math.min(220, 100 + (exposureStops * 22)));
  const isOverExposed = exposureStops > 2.5;
  const isUnderExposed = exposureStops < -2.5;

  // Background Blur Amount (Bokeh simulation based on aperture)
  const getBlurValue = () => {
    if (aperture <= 1.4) return "14px";
    if (aperture <= 2.8) return "8px";
    if (aperture <= 4) return "4px";
    if (aperture <= 8) return "1.5px";
    return "0px";
  };

  // Color temperature tint filter
  const getWBTintClass = () => {
    switch (whiteBalance) {
      case "2,500 - 3,000 K": 
        return "bg-blue-500/15"; // Cool blue filter for tungsten setting
      case "7,000 - 10,000 K": 
        return "bg-orange-500/15"; // Warm amber filter for cloudy/overcast setting
      case "5,000 - 5,500 K":
      default: 
        return ""; // Neutral daylight
    }
  };

  const isTripodWarningNeeded = () => {
    return shutterSpeed === "1/50" || shutterSpeed === "1s";
  };

  return (
    <div 
      className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col mx-auto w-full" 
      id="camera_workbench_main"
      style={{ maxWidth: '100%' }}
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-base sm:text-lg">
            <Sliders className="w-5 h-5 text-indigo-600" />
            ตู้การตั้งค่ากล้องพื้นฐาน (Virtual Camera Viewfinder)
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            เครื่องมือช่วยฝึกปรับแต่งค่า ISO, Shutter, F-Stop, WB สำหรับการบันทึกวิดีโอและถ่ายภาพนิเทศศาสตร์
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 font-bold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          สื่อการสอนแนะนำ
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Viewfinder Preview Stage - 7 Cols */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center">

            {/* Main Visual Wrapper with exposure, ISO grain contrast adjustments */}
            <div 
              className="absolute inset-0 transition-all duration-300"
              style={{
                filter: `brightness(${brightnessPercent}%) ${iso > 1600 ? 'contrast(95%) saturate(85%)' : ''}`
              }}
            >
              {/* Background Layer (Bokeh blur applied dynamically) */}
              <div 
                className="absolute inset-0 transition-all duration-300 transform scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: `blur(${getBlurValue()})`
                }}
              />

              {/* Foreground Layer (Always Sharp, masked to keep the foreground stairs and handrails perfectly in focus) */}
              <div 
                className="absolute inset-0 transition-all duration-300 transform scale-105"
                style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 80%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 80%)'
                }}
              />
            </div>

            {/* WB overlay filter tint */}
            <div className={`absolute inset-0 pointer-events-none mix-blend-color transition-colors duration-500 z-20 ${getWBTintClass()}`} />

            {/* Simulated Digital Noise grain overlays if ISO is very high */}
            {iso >= 1600 && (
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle, #fff 10%, transparent 11%)`,
                  backgroundSize: `${iso >= 3200 ? '3px 3px' : '6px 6px'}`
                }}
              />
            )}

            {/* Grid Lines Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-slate-700/40">
              <div className="border-r border-b border-dashed border-slate-100"></div>
              <div className="border-r border-b border-dashed border-slate-100"></div>
              <div className="border-b border-dashed border-slate-100"></div>
              <div className="border-r border-b border-dashed border-slate-100"></div>
              <div className="border-r border-b border-dashed border-slate-100"></div>
              <div className="border-b border-dashed border-slate-100"></div>
            </div>

            {/* Technical HUD Overlay */}
            <div className="absolute bottom-3 inset-x-3 flex justify-between items-center text-xs font-mono font-bold text-white bg-black/80 backdrop-blur-md rounded-xl px-4 py-2 pointer-events-none shadow-lg">
              <span className="text-yellow-400">ISO {iso}</span>
              <span className="text-white" style={{ color: '#ffffff' }}>{shutterSpeed}</span>
              <span className="text-emerald-400">f/{aperture}</span>
              <span className="text-teal-300">{whiteBalance}</span>
              <span className={exposureStops > 0 ? "text-amber-400" : exposureStops < 0 ? "text-cyan-400" : "text-emerald-400"}>
                EV {exposureStops.toFixed(1)}
              </span>
            </div>

            {/* Over/Under Exposure Alerts */}
            {isOverExposed && (
              <div className="absolute top-3 right-3 bg-red-600/95 text-white text-[10px] font-mono font-bold px-2 py-1 rounded shadow-md animate-pulse">
                ☀️ OVEREXPOSED (สว่างเกินไป)
              </div>
            )}
            {isUnderExposed && (
              <div className="absolute top-3 right-3 bg-slate-950/95 text-white text-[10px] font-mono font-bold px-2 py-1 rounded shadow-md animate-pulse">
                🌙 UNDEREXPOSED (มืดเกินไป)
              </div>
            )}
            {isTripodWarningNeeded() && (
              <div className="absolute top-3 left-3 bg-yellow-500/95 text-black text-[10px] font-bold px-2 py-1 rounded shadow-md">
                ⚠️ ระวังภาพเบลอ! ควรใช้ขาตั้งกล้อง
              </div>
            )}
          </div>

          <div className="bg-indigo-50/45 rounded-xl p-3 border border-indigo-100/50 text-xs">
            <span className="font-bold text-slate-800 block text-xs mb-1">สัมผัสภาพผลลัพธ์:</span>
            <p className="text-slate-700 text-xs space-y-1 leading-relaxed">
              • รูรับแสง <strong className="text-indigo-600 font-bold">f/{aperture}</strong>: {aperture <= 2.8 ? 'เกิดโบเก้หน้าชัดหลังละลายได้อย่างยอดเยี่ยม' : 'ภาพคมชัดลึกเก็บระนาบฉากหลังได้ชัดถ้วน'} <br />
              • ความเร็วชัตเตอร์ <strong className="text-indigo-600 font-bold">{shutterSpeed}</strong>: {isTripodWarningNeeded() ? 'สปีดต่ำระวังอาการเบลอเมื่อขยับกล้อง' : 'สปีดสูงพอสำหรับจัดถ่ายความเร็วปกติโดยไม่ต้องใช้ขาตั้ง'} <br />
              • ความไวแสง <strong className="text-indigo-600 font-bold">ISO {iso}</strong>: {iso >= 1600 ? 'แสงสว่างในที่มืดดีขึ้น แต่ระวังมลภาวะสัญญาณรบกวน (Noise/Grain)' : 'ภาพเคลียร์ใส สัญญาณรบกวนต่ำมาก'}
            </p>
          </div>
        </div>

        {/* Configurations Side - 5 Cols */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-3 min-h-0">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">เลือกสถานการณ์จำลอง (Presets):</label>
            <div className="grid grid-cols-2 gap-1.5">
              {cameraPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  id={`preset_btn_${index}`}
                  onClick={() => setSelectedPreset(index)}
                  className={`text-[11px] sm:text-xs text-left p-2 rounded-lg border transition-all font-semibold ${
                    selectedPreset === index
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-800 font-bold shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span className="block truncate">{preset.name}</span>
                </button>
              ))}
            </div>
            {cameraPresets[selectedPreset] && (
              <div className="mt-2.5 p-3 bg-indigo-50/45 border border-indigo-100/40 rounded-xl text-xs">
                <span className="text-[11px] font-extrabold text-orange-600 block flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  🎯 สถานการณ์:
                </span>
                <p className="text-[11px] sm:text-xs text-slate-800 mt-1 pl-0.5 leading-relaxed font-semibold">
                  {cameraPresets[selectedPreset].situation}
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-indigo-100/40">
                  <span className="text-[11px] text-orange-600 block pl-0.5 leading-normal font-bold">
                    💡 คำแนะนำ: {cameraPresets[selectedPreset].tip}
                  </span>
                </div>
              </div>
            )}
          </div>
 
          <div className="space-y-3.5 border-t border-slate-100 pt-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              การปรับแต่งด้วยมือ (Manual override)
            </h4>
 
            {/* Aperture */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 font-medium text-[11px]">Aperture (รูรับแสง - F stop)</span>
                <span className="font-mono text-indigo-600 font-black text-xs">f/{aperture}</span>
              </div>
              <div className="flex gap-1">
                {[1.4, 2.8, 4, 8, 22].map((fVal) => (
                  <button
                    key={fVal}
                    type="button"
                    onClick={() => setAperture(fVal)}
                    className={`flex-1 py-1.5 rounded-lg text-xs border font-extrabold cursor-pointer transition-all ${
                      aperture === fVal
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    f/{fVal}
                  </button>
                ))}
              </div>
            </div>

            {/* shutter speed */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 font-medium text-[11px]">Shutter Speed (ความยาวชัตเตอร์)</span>
                <span className="font-mono text-indigo-600 font-black text-xs">{shutterSpeed}</span>
              </div>
              <div className="flex gap-1">
                {["1s", "1/50", "1/125", "1/400", "1/800"].map((speedVal) => (
                  <button
                    key={speedVal}
                    type="button"
                    onClick={() => setShutterSpeed(speedVal)}
                    className={`flex-1 py-1.5 rounded-lg text-xs border font-extrabold cursor-pointer transition-all ${
                      shutterSpeed === speedVal
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {speedVal}
                  </button>
                ))}
              </div>
            </div>

            {/* ISO */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 font-medium text-[11px]">ISO (ความไวแสงเซนเซอร์)</span>
                <span className="font-mono text-indigo-600 font-black text-xs">ISO {iso}</span>
              </div>
              <div className="flex gap-1">
                {[100, 400, 800, 1600, 3200, 6400].map((isoVal) => (
                  <button
                    key={isoVal}
                    type="button"
                    onClick={() => setIso(isoVal)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] sm:text-xs border font-extrabold cursor-pointer transition-all ${
                      iso === isoVal
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isoVal}
                  </button>
                ))}
              </div>
            </div>
 
            {/* WB */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 font-medium text-[11px]">White Balance (สมดุลแสงสีขาว)</span>
                <span className="font-mono text-indigo-600 font-black text-xs">{whiteBalance}</span>
              </div>
              <div className="flex gap-1">
                {["2,500 - 3,000 K", "5,000 - 5,500 K", "7,000 - 10,000 K"].map((wbVal) => (
                  <button
                    key={wbVal}
                    type="button"
                    onClick={() => setWhiteBalance(wbVal)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs border font-extrabold cursor-pointer transition-all ${
                      whiteBalance === wbVal
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {wbVal}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
