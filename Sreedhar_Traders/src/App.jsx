import { useState, useEffect, useRef } from 'react';
import qz from 'qz-tray';

export default function App() {
  const [numPrints, setNumPrints] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  
  // State variables for Label Content
  const [centerText, setCenterText] = useState('555');
  const [boxTL, setBoxTL] = useState('666'); 
  const [boxTR, setBoxTR] = useState('60'); 
  const [boxBL, setBoxBL] = useState('10'); 
  const [boxBR, setBoxBR] = useState('1');  

  // Calibration (in millimeters)
  const [labelWidth, setLabelWidth] = useState(22);
  const [labelHeight, setLabelHeight] = useState(22);
  const [horizontalGap, setHorizontalGap] = useState(3.5); 
  const [leftMargin, setLeftMargin] = useState(1.5); 
  const [topMargin, setTopMargin] = useState(1);

  const labelRef = useRef(null);

  useEffect(() => {
    const connectQZ = async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        setIsConnected(true);
      } catch (err) {
        if (err.message?.includes('Waiting for previous disconnect') || err.message?.includes('cancelled')) {
          setIsConnected(true);
        } else {
          console.error('QZ Tray Connection Error:', err);
          setIsConnected(false);
        }
      }
    };
    connectQZ();
  }, []);

  const handlePrint = async () => {
    if (!isConnected) {
      alert('QZ Tray is not connected. Please ensure the application is running.');
      return;
    }

    try {
      const printer = await qz.printers.getDefault();
      const totalLabels = parseInt(numPrints, 10) || 1;

      // CONFIG: Exactly matches your Windows Driver 101.6mm
      const config = qz.configs.create(printer, {
        copies: 1, 
        size: { width: 101.6, height: 25 }, 
        units: 'mm',
        margins: 0,
        orientation: 'portrait' 
      });

      const printData = [];
      const labelsPerRow = 4;
      const totalRows = Math.ceil(totalLabels / labelsPerRow);

      for (let r = 0; r < totalRows; r++) {
        let rowHtml = `<div class="row">`;
        
        for (let c = 0; c < labelsPerRow; c++) {
          if (r * labelsPerRow + c < totalLabels) {
            rowHtml += `
              <div class="label">
                <div class="header">SREEDHAR<br/>TRADERS</div>
                <div class="center-text">${centerText}</div>
                <div class="grid">
                  <div class="box box-tl">${boxTL}</div>
                  <div class="box box-tr">${boxTR}</div>
                  <div class="box box-bl">${boxBL}</div>
                  <div class="box box-br">${boxBR}</div>
                </div>
              </div>
            `;
          } else {
            rowHtml += `<div class="label empty-label"></div>`;
          }
        }
        rowHtml += `</div>`;

        printData.push({
          type: 'html',
          format: 'plain',
          data: `
            <html>
            <head>
              <style>
                @page { size: 101.6mm 25mm; margin: 0; padding: 0; }
                body { margin: 0; padding: 0; font-family: sans-serif; background: white; color: black; width: 101.6mm; height: 25mm; overflow: hidden; }
                
                .row { 
                  display: flex; 
                  width: 101.6mm; 
                  height: 25mm; 
                  box-sizing: border-box; 
                  margin-left: ${leftMargin}mm;
                  margin-top: ${topMargin}mm;
                  gap: ${horizontalGap}mm; 
                }
                
                .label { 
                  width: ${labelWidth}mm; 
                  min-width: ${labelWidth}mm;
                  height: ${labelHeight}mm; 
                  min-height: ${labelHeight}mm;
                  display: flex; 
                  flex-direction: column; 
                  box-sizing: border-box; 
                  padding: 0; 
                  border: 1px solid black; 
                }
                
                .empty-label { border: none !important; }
                
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

    } catch (err) {
      console.error('Print Error:', err);
      alert('Failed to print. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      <header className="bg-black text-white py-6 px-8 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
              Sreedhar Traders
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Label Printing Console — Direct Margin Calibration
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-full border border-gray-700">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Printer Status:</span>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT COLUMN: Live Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-[120px]">
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                Live Layout Preview
              </h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
              
              <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mb-2">Red dashed box = 101.6mm Physical Roll Edge</p>

              <div className="w-full bg-gray-50 border border-gray-200 shadow-inner rounded-md overflow-x-auto p-4 sm:p-6" ref={labelRef}>
                
                <div 
                  className="bg-white border border-dashed border-red-400 mx-auto overflow-hidden relative"
                  style={{ width: `${101.6 * 5}px`, height: `${25 * 5}px` }}
                >
                  <div 
                    className="flex"
                    style={{ 
                      gap: `${horizontalGap * 5}px`, 
                      marginLeft: `${leftMargin * 5}px`, 
                      marginTop: `${topMargin * 5}px` 
                    }}
                  >
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="border border-black flex flex-col bg-white shrink-0 box-border" style={{ width: `${labelWidth * 5}px`, height: `${labelHeight * 5}px` }}>
                        <div className="text-center font-bold uppercase text-[12px] leading-tight mt-1 px-1">Sreedhar<br />Traders</div>
                        <div className="flex-1 flex items-center justify-center overflow-hidden px-1"><span className="text-black text-[13px] font-bold tracking-widest">{centerText}</span></div>
                        <div className="h-[40%] w-full grid grid-cols-[7fr_3fr] grid-rows-2 border-t border-black text-[12px] font-bold">
                          <div className="border-r border-b border-black flex items-center justify-center px-1">{boxTL}</div>
                          <div className="border-b border-black flex items-center justify-center px-1">{boxTR}</div>
                          <div className="border-r border-black flex items-center justify-center px-1">{boxBL}</div>
                          <div className="flex items-center justify-center px-1">{boxBR}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              
              <p className="text-gray-400 text-xs mt-6 text-center max-w-sm">
                If the left edge is missing on the printed paper, slowly increase the <strong>Left Margin</strong>.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Controls */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                  Printer Calibration
                </h2>
                <span className="text-xs font-bold text-gray-400">MEASUREMENTS IN MM</span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Label Box Width</label>
                  <input type="number" step="0.5" value={labelWidth} onChange={(e) => setLabelWidth(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Label Box Height</label>
                  <input type="number" step="0.5" value={labelHeight} onChange={(e) => setLabelHeight(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Left Margin (Nudge Right)</label>
                  <input type="number" step="0.5" value={leftMargin} onChange={(e) => setLeftMargin(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Gap Between Labels</label>
                  <input type="number" step="0.5" value={horizontalGap} onChange={(e) => setHorizontalGap(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Top Margin</label>
                  <input type="number" step="0.5" value={topMargin} onChange={(e) => setTopMargin(Number(e.target.value))} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
                <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                  Label Content
                </h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Center Text</label>
                  <input type="text" maxLength={10} value={centerText} onChange={(e) => setCenterText(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium" />
                </div>
                <div className="grid grid-cols-[7fr_3fr] gap-x-3 gap-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Top Left</label>
                    <input type="text" maxLength={8} value={boxTL} onChange={(e) => setBoxTL(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Top Right</label>
                    <input type="text" maxLength={4} value={boxTR} onChange={(e) => setBoxTR(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bottom Left</label>
                    <input type="text" maxLength={8} value={boxBL} onChange={(e) => setBoxBL(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bottom Right</label>
                    <input type="text" maxLength={4} value={boxBR} onChange={(e) => setBoxBR(e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium" />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2">Total Number of Labels</label>
                  <input type="number" min="1" value={numPrints} onChange={(e) => setNumPrints(e.target.value === '' ? '' : parseInt(e.target.value, 10))} onBlur={() => { if (numPrints === '' || numPrints < 1) setNumPrints(1); }} className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors mb-4" />
                  
                  <button onClick={handlePrint} disabled={!isConnected} className={`w-full font-bold py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-200 ${isConnected ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    Print {numPrints || 0} Labels
                  </button>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-3 text-center font-medium">QZ Tray is disconnected. Ensure it is running.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sreedhar Traders. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            System configured for 4-up continuous thermal rolls.
          </p>
        </div>
      </footer>

    </div>
  );
}