import { useState, useEffect } from "react";
import qz from "qz-tray";
import {
  Printer, X, Play, Loader2, Trash2, Tag, Plus
} from "lucide-react";

export default function App() {
  // --- STATE MANAGEMENT ---
  const [queue, setQueue] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [isPrinting, setIsPrinting] = useState(false);

  // --- STRICT PHYSICAL DIMENSIONS ---
  // Guaranteed to prevent 1st and 4th border cut-offs
  const PRINT_CONFIG = {
    paperWidth: 101.6,
    paperHeight: 25,
    labelWidth: 21,    // Shrunk to 21mm to create massive safety buffers
    labelHeight: 22,
    horizontalGap: 3.8, 
    leftMargin: 3,     // 3mm left buffer (Avoids left hardware dead-zone)
    topMargin: 1,
  };
  // Math Check: 3mm (Left Margin) + 84mm (4 Labels @ 21mm) + 11.4mm (3 Gaps @ 3.8mm) = 98.4mm.
  // 101.6mm (Total) - 98.4mm = 3.2mm Right Margin. Both sides are completely safe!

  const logStatus = (msg, isError = false) => {
    setStatus(isError ? `❌ ${msg}` : msg);
  };

  const initQZ = async () => {
    try {
      if (qz.websocket.isActive()) return;
      logStatus("Connecting to QZ Tray...");
      await qz.websocket.connect();
      logStatus("QZ Tray Connected.");
    } catch (err) {
      logStatus("QZ Tray not running.", true);
      throw err;
    }
  };

  const printBulkLabels = async () => {
    if (queue.length === 0) return;
    setIsPrinting(true);
    
    try {
      await initQZ();
      const printer = await qz.printers.getDefault();
      
      const config = qz.configs.create(printer, {
        copies: 1, 
        size: { width: PRINT_CONFIG.paperWidth, height: PRINT_CONFIG.paperHeight }, 
        units: 'mm',
        margins: 0,
        orientation: 'portrait' 
      });

      const printData = [];
      const labelsPerRow = 4;
      const totalRows = Math.ceil(queue.length / labelsPerRow);

      // Loop through queue and chunk into rows of 4
      for (let r = 0; r < totalRows; r++) {
        let rowHtml = `<div class="row">`;
        
        for (let c = 0; c < labelsPerRow; c++) {
          const itemIndex = r * labelsPerRow + c;
          
          if (itemIndex < queue.length) {
            const item = queue[itemIndex];
            
            // Map product data into the grid boxes
            rowHtml += `
              <div class="label">
                <div class="header">SREEDHAR<br/>TRADERS</div>
                <div class="center-text">${item.sku || ''}</div>
                <div class="grid">
                  <div class="box box-tl">${item.grams || ''}</div>
                  <div class="box box-tr">${item.stoneWeight || ''}</div>
                  <div class="box box-bl">${item.netWeight || ''}</div>
                  <div class="box box-br">${item.itemCode || ''}</div>
                </div>
              </div>
            `;
          } else {
            // Empty label placeholders must have transparent borders to keep grid size perfect
            rowHtml += `<div class="label empty-label"></div>`;
          }
        }
        rowHtml += `</div>`;

        // Wrap the row in the strict CSS layout engine
        printData.push({
          type: 'html',
          format: 'plain',
          data: `
            <html>
            <head>
              <style>
                @page { size: ${PRINT_CONFIG.paperWidth}mm ${PRINT_CONFIG.paperHeight}mm; margin: 0; padding: 0; }
                body { margin: 0; padding: 0; font-family: sans-serif; background: white; color: black; width: ${PRINT_CONFIG.paperWidth}mm; height: ${PRINT_CONFIG.paperHeight}mm; overflow: hidden; }
                
                .row { 
                  display: flex; 
                  width: ${PRINT_CONFIG.paperWidth}mm; 
                  height: ${PRINT_CONFIG.paperHeight}mm; 
                  box-sizing: border-box; 
                  margin-left: ${PRINT_CONFIG.leftMargin}mm;
                  margin-top: ${PRINT_CONFIG.topMargin}mm;
                  gap: ${PRINT_CONFIG.horizontalGap}mm; 
                }
                
                .label { 
                  width: ${PRINT_CONFIG.labelWidth}mm; 
                  min-width: ${PRINT_CONFIG.labelWidth}mm;
                  height: ${PRINT_CONFIG.labelHeight}mm; 
                  min-height: ${PRINT_CONFIG.labelHeight}mm;
                  display: flex; 
                  flex-direction: column; 
                  box-sizing: border-box; 
                  padding: 0; 
                  border: 1px solid black; 
                }
                
                .empty-label { border: 1px solid transparent !important; }
                
                .header { text-align: center; font-size: 7px; font-weight: bold; text-transform: uppercase; margin-top: 0.5mm; margin-bottom: 0; line-height: 1.1; }
                .center-text { height: 4mm; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; } 
                .grid { display: grid; grid-template-columns: 7fr 3fr; grid-template-rows: 1fr 1fr; flex-grow: 1; border-top: 1px solid black; }
                
                .box { display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; padding: 0.5mm; }
                .box-tl { border-right: 1px solid black; border-bottom: 1px solid black; }
                .box-tr { border-bottom: 1px solid black; }
                .box-bl { border-right: 1px solid black; }
                .box-br { }
              </style>
            </head>
            <body>
              ${rowHtml}
            </body>
            </html>
          `
        });
      }

      await qz.print(config, printData);
      logStatus(`Success: ${queue.length} labels printed.`);
      
    } catch (err) {
      logStatus(`Print Error: ${err.message}`, true);
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (qz.websocket.isActive()) {
        qz.websocket.disconnect().catch(console.error);
      }
    };
  }, []);

  // Helper to add mock items to queue for testing
  const addTestItem = () => {
    const randomNum = Math.floor(Math.random() * 900) + 100;
    setQueue([...queue, {
      id: Math.random().toString(36).substr(2, 9),
      name: "GOLD ITEM 22K",
      sku: `${randomNum}`,
      stoneWeight: 10,
      netWeight: 60,
      grams: 666,
      itemCode: "1"
    }]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 font-sans">
      
      {/* Background Main App UI (Just to show you how it works) */}
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Inventory Dashboard</h1>
        <p className="text-slate-500 mb-8">Add items to your print queue to test the 4-up barcode printer.</p>
        
        <button 
          onClick={addTestItem}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Test Product to Queue
        </button>
      </div>

      {/* --- FLOATING PRINT WIDGET --- */}
      <div className="fixed bottom-8 right-8 z-[100] w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-amber-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-500 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-serif font-bold text-sm leading-none">Print Registry</span>
              <span className="text-[10px] uppercase tracking-widest opacity-80">{queue.length} Items Selected</span>
            </div>
          </div>
          <button
            onClick={() => setQueue([])}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Area */}
        <div className="max-h-64 overflow-y-auto p-4 space-y-2 bg-[#FDFCFB] custom-scrollbar">
          {queue.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-300">
              <Tag className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-tighter">Queue is empty</p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-100/50 group hover:border-amber-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-700 border border-amber-100">
                    {item.sku.slice(-2)}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-800 uppercase leading-tight truncate w-40">{item.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[8px] font-bold text-amber-600 font-mono">SKU: {item.sku}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{item.grams}g</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setQueue(queue.filter(q => q.id !== item.id))}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-6 bg-white border-t border-amber-50">
          <div className={`text-[9px] text-center mb-4 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${status.includes('❌') ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
            {status}
          </div>

          <button
            disabled={isPrinting || queue.length === 0}
            className={`w-full font-black h-14 rounded-[1.25rem] shadow-xl transition-all flex items-center justify-center gap-3 text-xs tracking-widest uppercase ${
              isPrinting || queue.length === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-green-200 active:scale-95 cursor-pointer'
            }`}
            onClick={printBulkLabels}
          >
            {isPrinting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Print 4-Up Grid Labels
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}