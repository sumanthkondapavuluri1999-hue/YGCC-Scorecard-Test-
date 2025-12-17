import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Save, Play, FileSpreadsheet, Image as ImageIcon, Loader2, ImagePlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from "@google/genai";
import { Picker, ThemeId } from '../types';
import { THEMES } from '../constants';

interface AdminPanelProps {
  data: Picker[];
  setData: (data: Picker[]) => void;
  siteName: string;
  setSiteName: (name: string) => void;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  globalTarget: number;
  setGlobalTarget: (target: number) => void;
  customLogo: string;
  setCustomLogo: (logo: string) => void;
  onPublish: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  setData,
  siteName,
  setSiteName,
  themeId,
  setThemeId,
  globalTarget,
  setGlobalTarget,
  customLogo,
  setCustomLogo,
  onPublish,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      handleSpreadsheetUpload(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          if (event.target?.result) {
              setCustomLogo(event.target.result as string);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsAnalyzing(true);
      
      // Convert image to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
           const result = reader.result as string;
           // Remove data url prefix (e.g. "data:image/png;base64,")
           const base64 = result.split(',')[1];
           resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using flash for speed/efficiency with images
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data
              }
            },
            {
              text: `Analyze this scoreboard/spreadsheet image. Extract the rows representing people/contestants. 
              Return a JSON object with a 'pickers' array. 
              Each item in the array must have:
              - 'name' (string): The name of the person.
              - 'hours' (array of numbers): The hourly values. Look for columns 1-10. Extract exactly 10 values if possible, or pad with 0 if fewer are found.
              - 'target' (number): The individual target/KPI if a specific column exists, otherwise default to 500.
              
              Ignore summary rows like "Total" or "Average".`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pickers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hours: { 
                      type: Type.ARRAY,
                      items: { type: Type.NUMBER }
                    },
                    target: { type: Type.NUMBER }
                  },
                  required: ["name", "hours"]
                }
              }
            }
          }
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("No data returned from AI");

      const result = JSON.parse(jsonText);
      
      if (result.pickers && Array.isArray(result.pickers)) {
        const newPickers: Picker[] = result.pickers.map((p: any, idx: number) => {
          // Ensure hours is exactly 10 numbers
          const hours = Array.isArray(p.hours) ? p.hours.map((n: any) => Number(n) || 0) : [];
          while (hours.length < 10) hours.push(0);
          const finalHours = hours.slice(0, 10);
          const total = finalHours.reduce((a: number, b: number) => a + b, 0);

          return {
            id: `img-${idx}-${Date.now()}`,
            name: p.name || `Unknown ${idx}`,
            hours: finalHours,
            target: Number(p.target) || 500,
            total: total
          };
        });
        
        setData(newPickers);
      } else {
        alert("Could not interpret the image data.");
      }

    } catch (error) {
      console.error("Image analysis failed:", error);
      alert("Failed to analyze image. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSpreadsheetUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Smart Parsing Logic
      let headerRowIndex = -1;
      
      // 1. Find the header row (look for "Contestant" or "Name" or "Hour 1")
      for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const rowStr = JSON.stringify(jsonData[i] || []).toLowerCase();
        if (rowStr.includes('contestant') || rowStr.includes('name') || rowStr.includes('hour 1')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert("Could not detect header row. Please ensure columns include 'Contestant' or 'Name' and 'Hour 1'.");
        return;
      }

      const headerRow = jsonData[headerRowIndex];
      const colMap: { name: number; target: number; hours: number[] } = {
        name: -1,
        target: -1,
        hours: []
      };

      // 2. Map Columns based on Header Text
      headerRow.forEach((cell: any, idx: number) => {
        const val = String(cell).toLowerCase().trim();
        
        if (val === 'contestant' || val === 'name' || val === 'operator') {
          colMap.name = idx;
        } else if (val.includes('target') || val.includes('kpi')) {
          colMap.target = idx;
        } else {
          // Check for "Hour X"
          const hourMatch = val.match(/hour\s*(\d+)/);
          if (hourMatch) {
            const hNum = parseInt(hourMatch[1]);
            if (hNum >= 1 && hNum <= 10) {
              colMap.hours[hNum - 1] = idx;
            }
          }
        }
      });

      // Fallback: If "Hour 1" headers aren't explicit, but we found name, assume H1 starts at Name + 1
      if (colMap.hours.length === 0 && colMap.name !== -1) {
         for(let i=0; i<10; i++) {
            colMap.hours[i] = colMap.name + 1 + i;
         }
      }

      // 3. Extract Data
      const parsedPickers: Picker[] = [];
      
      jsonData.slice(headerRowIndex + 1).forEach((row: any, index) => {
        // Skip empty or summary rows (check if name exists)
        if (!row || row.length === 0) return;
        const nameVal = colMap.name !== -1 ? row[colMap.name] : row[0];
        
        if (!nameVal || String(nameVal).toLowerCase() === 'total' || String(nameVal).trim() === '') return;

        // Parse Target
        let targetVal = 500;
        if (colMap.target !== -1) {
            targetVal = Number(row[colMap.target]) || 500;
        } else {
            // Fallback for specific "Blended Daily Target" usually at the end. 
            // In the provided screenshot it's column O (index 14).
            if (typeof row[14] === 'number') targetVal = row[14];
        }

        // Parse Hours
        const hoursArr: number[] = [];
        for (let i = 0; i < 10; i++) {
          const colIdx = colMap.hours[i];
          let val = 0;
          if (colIdx !== undefined && row[colIdx] !== undefined) {
             val = Number(row[colIdx]) || 0;
          }
          hoursArr.push(val);
        }

        const totalVal = hoursArr.reduce((a, b) => a + b, 0);

        parsedPickers.push({
          id: `imported-${index}-${Date.now()}`,
          name: String(nameVal),
          hours: hoursArr,
          target: targetVal,
          total: totalVal
        });
      });

      if(parsedPickers.length > 0) {
        setData(parsedPickers);
      } else {
        alert("No valid data rows found.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updatePicker = (id: string, field: keyof Picker | 'hour', value: any, hourIndex?: number) => {
    const newData = data.map((p) => {
      if (p.id !== id) return p;

      if (field === 'hour' && typeof hourIndex === 'number') {
        const newHours = [...p.hours];
        newHours[hourIndex] = Number(value) || 0;
        const newTotal = newHours.reduce((acc, curr) => acc + curr, 0);
        return { ...p, hours: newHours, total: newTotal };
      }

      if (field === 'target') {
         return { ...p, [field]: Number(value) || 0 };
      }

      return { ...p, [field]: value };
    });
    setData(newData);
  };

  const addRow = () => {
    const newPicker: Picker = {
      id: `new-${Date.now()}`,
      name: 'New Operator',
      hours: Array(10).fill(0),
      total: 0,
      target: 500,
    };
    setData([...data, newPicker]);
  };

  const deleteRow = (id: string) => {
    if (window.confirm('Delete this row?')) {
      setData(data.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Configuration Header - Redesigned based on Wireframe */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-30 shadow-md">
        <div className="max-w-full mx-auto px-4 py-4 flex flex-col xl:flex-row items-center justify-between gap-6">
          
          {/* Left: Upload Section */}
          <div className="flex flex-col gap-2 w-full xl:w-auto">
             <button
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className={`group flex items-center justify-center gap-3 bg-white border-2 border-dashed ${isAnalyzing ? 'border-blue-300 bg-blue-50' : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'} text-gray-600 px-6 py-3 rounded-xl transition-all duration-200 w-full xl:w-auto`}
            >
              {isAnalyzing ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : (
                <div className="flex gap-1 relative">
                    <FileSpreadsheet className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <ImageIcon className="w-4 h-4 absolute -right-2 -bottom-1 text-gray-400 group-hover:text-blue-400" />
                </div>
              )}
              <div className="text-left">
                <span className="block text-sm font-bold uppercase tracking-wider">{isAnalyzing ? 'Analyzing...' : 'Upload Data'}</span>
                <span className="block text-xs text-gray-400 font-medium">{isAnalyzing ? 'Extracting Data' : '.CSV, .XLSX, or Img'}</span>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .csv, .png, .jpg, .jpeg, .webp"
              onChange={handleFileUpload}
            />
          </div>

          {/* Middle: Site Name & Blended Target */}
          <div className="flex-1 w-full xl:max-w-4xl flex flex-col items-stretch gap-4">
             <div className="flex flex-col md:flex-row gap-4">
                {/* Site Name Input */}
                <div className="flex-1 flex flex-col md:flex-row items-center gap-3 bg-gray-100 p-2 rounded-lg border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap pl-2">
                    Site Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Site Name (e.g. Kmart Brisbane)"
                    className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-900 font-bold focus:ring-2 focus:ring-yellow-400 outline-none w-full"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>

                {/* Global Blended Target Input */}
                <div className="w-full md:w-64 flex flex-col md:flex-row items-center gap-3 bg-gray-100 p-2 rounded-lg border border-gray-200">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap pl-2">
                    Target:
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="flex-1 bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-900 font-bold focus:ring-2 focus:ring-yellow-400 outline-none w-full text-center"
                    value={globalTarget}
                    onChange={(e) => setGlobalTarget(Number(e.target.value))}
                  />
                </div>
             </div>

             {/* Custom Logo Upload */}
             <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-dashed border-gray-300">
                 <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                 >
                    <ImagePlus size={14} /> Upload Logo
                 </button>
                 <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                 
                 {customLogo ? (
                     <div className="flex items-center gap-2">
                        <img src={customLogo} alt="Logo Preview" className="h-6 w-auto object-contain" />
                        <button onClick={() => setCustomLogo('')} className="text-red-400 hover:text-red-600">
                            <Trash2 size={12} />
                        </button>
                        <span className="text-xs text-green-600 font-bold">Logo Set</span>
                     </div>
                 ) : (
                    <span className="text-xs text-gray-400 italic">No custom logo set (using theme default)</span>
                 )}
             </div>
          </div>

          {/* Right: Theme & Publish */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-auto">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Theme
                </label>
                <select
                className="w-full md:w-48 appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none cursor-pointer hover:border-gray-400"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value as ThemeId)}
                >
                {Object.values(THEMES).map((t) => (
                    <option key={t.id} value={t.id}>
                    {t.label}
                    </option>
                ))}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            <button
              onClick={onPublish}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <Play size={18} fill="currentColor" />
              PUBLISH
            </button>
          </div>
        </div>
      </header>

      {/* Editable Grid */}
      <main className="max-w-full mx-auto px-4 py-6 overflow-x-auto">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-12">#</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Contestant</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-24 bg-yellow-50 border-x border-yellow-100">Target</th>
                {Array.from({ length: 10 }).map((_, i) => (
                  <th key={i} scope="col" className="px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[60px]">
                    Hour {i + 1}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider w-24 bg-gray-100 border-l border-gray-200">Total</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((picker, idx) => (
                <tr key={picker.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-4 py-2 text-sm text-gray-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={picker.name}
                      onChange={(e) => updatePicker(picker.id, 'name', e.target.value)}
                      className="w-full border border-transparent hover:border-gray-200 focus:border-blue-400 rounded px-2 py-1 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 font-semibold text-gray-900 placeholder-gray-300 transition-all"
                      placeholder="Enter Name"
                    />
                  </td>
                  <td className="px-2 py-2 bg-yellow-50/30 border-x border-yellow-50">
                    <input
                      type="number"
                      value={picker.target}
                      onChange={(e) => updatePicker(picker.id, 'target', e.target.value)}
                      className="w-full text-center border border-transparent hover:border-yellow-300 focus:border-yellow-500 rounded px-1 py-1 bg-transparent focus:bg-white focus:ring-2 focus:ring-yellow-100 font-bold text-gray-700"
                    />
                  </td>
                  {picker.hours.map((h, hIdx) => (
                    <td key={hIdx} className="px-1 py-2">
                      <input
                        type="number"
                        value={h}
                        onChange={(e) => updatePicker(picker.id, 'hour', e.target.value, hIdx)}
                        className={`w-full text-center border rounded py-1 px-1 text-sm transition-all ${
                          h === 0 
                            ? 'text-gray-300 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-blue-400 focus:text-gray-900' 
                            : 'text-gray-900 border-gray-200 bg-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 bg-gray-50 border-l border-gray-100 text-center">
                    <span className="font-black text-gray-800 text-lg">{picker.total}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => deleteRow(picker.id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Row"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center">
             <button
              onClick={addRow}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full transition-colors border border-blue-200"
             >
               <Plus size={18} /> Add New Operator
             </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;