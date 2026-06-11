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
  const [aperture, setAperture] = useState<number>(2.8); // f/number (1.4, 1.8, 2.8, 4, 5.6, 8, 11, 16)
  const [iso, setIso] = useState<number>(400); // 100, 200, 400, 800, 1600, 3200, 6400
  const [shutterSpeed, setShutterSpeed] = useState<string>("1/125"); // 1/1000, 1/500, 1/250, 1/125, 1/60, 1/30, 1/15, 1s
  const [whiteBalance, setWhiteBalance] = useState<string>("Daylight"); // Tungsten, Daylight, Cloudy, Shade

  // Sync settings when selecting preset
  useEffect(() => {
    const preset = cameraPresets[selectedPreset];
    if (preset) {
      if (preset.aperture.includes("f/")) {
        setAperture(parseFloat(preset.aperture.replace("f/", "")));
      }
      setIso(parseInt(preset.iso) || 400);
      setShutterSpeed(preset.shutterSpeed);
      if (preset.whiteBalance.includes("Daylight")) setWhiteBalance("Daylight");
      else if (preset.whiteBalance.includes("Tungsten")) setWhiteBalance("Tungsten");
      else if (preset.whiteBalance.includes("Cloudy")) setWhiteBalance("Cloudy");
      else setWhiteBalance("Daylight");
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
      "1/1000": -3,
      "1/500": -2,
      "1/250": -1,
      "1/125": 0,
      "1/60": 1,
      "1/30": 2,
      "1/15": 3,
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
    if (aperture <= 1.4) return "8px";
    if (aperture <= 1.8) return "6px";
    if (aperture <= 2.8) return "4px";
    if (aperture <= 4.0) return "2px";
    if (aperture <= 5.6) return "1px";
    return "0px";
  };

  // Color temperature tint filter
  const getWBTintClass = () => {
    switch (whiteBalance) {
      case "Tungsten": return "bg-blue-500/15"; // Cool blue filter
      case "Cloudy": return "bg-orange-500/15"; // Warm amber filter
      case "Shade": return "bg-orange-600/20"; // Dark warm tint
      default: return ""; // Neutral daylight
    }
  };

  const isTripodWarningNeeded = () => {
    return shutterSpeed === "1/30" || shutterSpeed === "1/15" || shutterSpeed === "1s";
  };

  return (
    <div 
      className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col mx-auto w-full" 
      id="camera_workbench_main"
      style={{ maxWidth: '1700px', height: '687px' }}
    >
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg sm:text-2xl">
            <Sliders className="w-5.5 h-5.5 text-indigo-600" />
            ตู้การตั้งค่ากล้องพื้นฐาน (Virtual Camera Viewfinder)
          </h3>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            เครื่องมือช่วยฝึกปรับแต่งค่า ISO, Shutter, F-Stop, WB สำหรับการบันทึกวิดีโอและถ่ายภาพนิเทศศาสตร์
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 font-bold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          สื่อการสอนแนะนำ
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Viewfinder Preview Stage - 7 Cols */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-3">
          <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
            {/* Background Mountains (Bokeh subject simulation) */}
            <div 
              className="absolute inset-0 transition-all duration-300 transform scale-105"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${getBlurValue()}) brightness(${brightnessPercent}%)`
              }}
            />

            {/* Foreground Focused Subject (Subject is always in focus, F-stop blurs back) */}
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-48 transition-all duration-300"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=400&q=80")',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom center',
                filter: `brightness(${brightnessPercent}%) ${iso > 1600 ? 'contrast(95%) saturate(85%) drop-shadow(0 2px 8px rgba(0,0,0,0.3))' : ''}`
              }}
            />

            {/* WB overlay filter tint */}
            <div className={`absolute inset-0 pointer-events-none mix-blend-color transition-colors duration-500 ${getWBTintClass()}`} />

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
            <div className="absolute bottom-3 inset-x-3 flex justify-between items-center text-xs sm:text-sm font-mono font-bold text-white bg-black/80 backdrop-blur-md rounded-xl px-4 py-2.5 pointer-events-none shadow-lg">
              <span className="text-yellow-400">ISO {iso}</span>
              <span>{shutterSpeed}</span>
              <span className="text-emerald-400">f/{aperture}</span>
              <span className="text-teal-300">{whiteBalance}</span>
              <span className={exposureStops > 0 ? "text-amber-400" : exposureStops < 0 ? "text-cyan-400" : "text-emerald-400"}>
                EV {exposureStops.toFixed(1)}
              </span>
            </div>

            {/* Over/Under Exposure Alerts */}
            {isOverExposed && (
              <div className="absolute top-4 right-4 bg-red-600/95 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg shadow-md animate-pulse">
                ☀️ OVEREXPOSED (สว่างเกินไป)
              </div>
            )}
            {isUnderExposed && (
              <div className="absolute top-4 right-4 bg-slate-950/95 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg shadow-md animate-pulse">
                🌙 UNDEREXPOSED (มืดเกินไป)
              </div>
            )}
            {isTripodWarningNeeded() && (
              <div className="absolute top-4 left-4 bg-yellow-500/95 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
                ⚠️ ระวังภาพเบลอ! ควรใช้ขาตั้งกล้อง
              </div>
            )}
          </div>

          <div className="bg-indigo-50/45 rounded-xl p-4 border border-indigo-100/50 text-sm">
            <span className="font-bold text-slate-800 block text-[15px] mb-1.5">สัมผัสภาพผลลัพธ์:</span>
            <p className="text-slate-700 text-[13px] sm:text-sm space-y-1.5 leading-relaxed">
              • รูรับแสง <strong className="text-indigo-600 font-bold">f/{aperture}</strong>: {aperture <= 2.8 ? 'เกิดโบเก้หน้าชัดหลังละลายได้อย่างยอดเยี่ยม' : 'ภาพคมชัดลึกเก็บระนาบฉากหลังได้ชัดถ้วน'} <br />
              • ความเร็วชัตเตอร์ <strong className="text-indigo-600 font-bold">{shutterSpeed}</strong>: {isTripodWarningNeeded() ? 'สปีดต่ำระวังอาการเบลอเมื่อขยับกล้อง' : 'สปีดสูงพอสำหรับจัดถ่ายความเร็วปกติโดยไม่ต้องใช้ขาตั้ง'} <br />
              • ความไวแสง <strong className="text-indigo-600 font-bold">ISO {iso}</strong>: {iso >= 1600 ? 'แสงสว่างในที่มืดดีขึ้น แต่ระวังมลภาวะสัญญาณรบกวน (Noise/Grain)' : 'ภาพเคลียร์ใส สัญญาวนรบกวนต่ำมาก'}
            </p>
          </div>
        </div>

        {/* Configurations Side - 5 Cols */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-slate-800 block mb-2.5">เลือกสถานการณ์จำลอง (Presets):</label>
            <div className="grid grid-cols-2 gap-1.5">
              {cameraPresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  id={`preset_btn_${index}`}
                  onClick={() => setSelectedPreset(index)}
                  className={`text-xs sm:text-[13px] text-left p-2.5 sm:p-3 rounded-xl border transition-all font-semibold ${
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
              <div className="mt-4 p-4 bg-slate-950/95 border border-slate-800 rounded-xl shadow-inner shadow-black/20">
                <span className="text-xs sm:text-sm font-bold text-orange-400 block flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  🎯 สถานการณ์:
                </span>
                <p className="text-xs sm:text-sm text-white mt-1.5 pl-0.5 leading-relaxed font-semibold">
                  {cameraPresets[selectedPreset].situation}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <span className="text-xs sm:text-[13px] text-orange-400 block pl-0.5 leading-relaxed font-bold">
                    💡 คำแนะนำ: {cameraPresets[selectedPreset].tip}
                  </span>
                </div>
              </div>
            )}
          </div>
 
          <div className="space-y-4.5 border-t border-slate-100 pt-4">
            <h4 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-600" />
              การปรับแต่งด้วยมือ (Manual override)
            </h4>
 
            {/* Aperture */}
            <div>
              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className="text-slate-700 font-semibold">Aperture (รูรับแสง - F stop)</span>
                <span className="font-mono text-indigo-600 font-black text-sm sm:text-base">f/{aperture}</span>
              </div>
              <div className="flex gap-1.5">
                {[1.4, 2.8, 5.6, 11, 16].map((fVal) => (
                  <button
                    key={fVal}
                    type="button"
                    onClick={() => setAperture(fVal)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border font-extrabold cursor-pointer transition-all ${
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
              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className="text-slate-700 font-semibold">Shutter Speed (ความยาวชัตเตอร์)</span>
                <span className="font-mono text-indigo-600 font-black text-sm sm:text-base">{shutterSpeed}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["1/1000", "1/250", "1/125", "1/30", "1s"].map((speedVal) => (
                  <button
                    key={speedVal}
                    type="button"
                    onClick={() => setShutterSpeed(speedVal)}
                    className={`px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border font-extrabold cursor-pointer transition-all ${
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
              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className="text-slate-700 font-semibold">ISO (ความไวแสงเซนเซอร์)</span>
                <span className="font-mono text-indigo-600 font-black text-sm sm:text-base">ISO {iso}</span>
              </div>
              <div className="flex gap-1.5">
                {[100, 400, 1600, 3200, 6400].map((isoVal) => (
                  <button
                    key={isoVal}
                    type="button"
                    onClick={() => setIso(isoVal)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border font-extrabold cursor-pointer transition-all ${
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
              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className="text-slate-700 font-semibold">White Balance (สมดุลแสงสีขาว)</span>
                <span className="font-mono text-indigo-600 font-black text-sm sm:text-base">{whiteBalance}</span>
              </div>
              <div className="flex gap-1.5">
                {["Tungsten", "Daylight", "Cloudy"].map((wbVal) => (
                  <button
                    key={wbVal}
                    type="button"
                    onClick={() => setWhiteBalance(wbVal)}
                    className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border font-extrabold cursor-pointer transition-all ${
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
