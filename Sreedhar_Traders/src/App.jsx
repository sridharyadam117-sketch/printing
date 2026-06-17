import { useState, useEffect, useRef } from 'react';
import qz from 'qz-tray';

export default function App() {
  const [numPrints, setNumPrints] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  
  // State variables pre-filled with the values from your hand-drawn sketch
  const [centerText, setCenterText] = useState('');
  const [boxTL, setBoxTL] = useState(''); 
  const [boxTR, setBoxTR] = useState(''); 
  const [boxBL, setBoxBL] = useState(''); 
  const [boxBR, setBoxBR] = useState('');  

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

      // CONFIG FOR 4-COLUMN ROLL (106mm wide total)
      const config = qz.configs.create(printer, {
        copies: 1, // We generate the exact quantity in the HTML loop below
        size: { width: 106, height: 25 }, 
        units: 'mm',
        margins: 0,
      });

      let htmlContent = '';
      const labelsPerRow = 4;

      for (let i = 0; i < totalLabels; i += labelsPerRow) {
        htmlContent += `<div class="row">`;
        
        for (let j = 0; j < labelsPerRow; j++) {
          if (i + j < totalLabels) {
            htmlContent += `
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
            // Invisible placeholder for empty spots in a row
            htmlContent += `<div class="label empty-label"></div>`;
          }
        }
        htmlContent += `</div>`;
      }

      const printData = [
        {
          type: 'html',
          format: 'plain',
          data: `
            <html>
            <head>
              <style>
                body { margin: 0; padding: 0; font-family: sans-serif; background: white; color: black; width: 106mm; }
                .row { display: flex; gap: 2mm; width: 106mm; page-break-after: always; align-items: flex-start; }
                .label { width: 25mm; height: 25mm; display: flex; flex-direction: column; box-sizing: border-box; padding: 1mm; border: 1px solid black; }
                .empty-label { border: none !important; }
                
                .header { text-align: center; font-size: 7px; font-weight: bold; text-transform: uppercase; margin-top: 1mm; margin-bottom: 0; line-height: 1.1; }
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
              ${htmlContent}
            </body>
            </html>
          `
        }
      ];

      await qz.print(config, printData);

    } catch (err) {
      console.error('Print Error:', err);
      alert('Failed to print. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      {/* Top Header Section */}
      <header className="bg-black text-white py-6 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
              Sreedhar Traders
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Label Printing Console — 4-Column Roll (106×25mm width)
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left Column: Label Preview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-10">
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                Live Label Preview
              </h2>
            </div>

            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              
              {/* Visual Preview Box (Horizontal Scroll Fix Applied) */}
              <div className="w-full bg-gray-50 border border-gray-200 shadow-inner rounded-md overflow-x-auto p-4 sm:p-6" ref={labelRef}>
                <div className="flex gap-2 sm:gap-3 w-max mx-auto">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="w-[110px] h-[110px] sm:w-[125px] sm:h-[125px] border border-black flex flex-col bg-white shadow-sm shrink-0 box-border">
                      <div className="text-center font-bold uppercase text-[10px] sm:text-[11px] leading-tight mt-2 px-1">
                        Sreedhar<br />Traders
                      </div>
                      
                      {/* Dynamic Center Text */}
                      <div className="h-[22px] w-full flex items-center justify-center overflow-hidden px-1">
                        <span className="text-black text-[10px] font-bold tracking-widest select-none">
                          {centerText}
                        </span>
                      </div>
                      
                      {/* Dynamic Grid Boxes */}
                      <div className="flex-1 w-full grid grid-cols-[7fr_3fr] grid-rows-2 border-t border-black text-[9px] font-bold">
                        <div className="border-r border-b border-black flex items-center justify-center overflow-hidden px-1">{boxTL}</div>
                        <div className="border-b border-black flex items-center justify-center overflow-hidden px-1">{boxTR}</div>
                        <div className="border-r border-black flex items-center justify-center overflow-hidden px-1">{boxBL}</div>
                        <div className="flex items-center justify-center overflow-hidden px-1">{boxBR}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-400 text-xs mt-6 text-center max-w-sm">
                Labels print exactly as shown above. 4 labels per row.
              </p>
            </div>
          </div>

          {/* Right Column: Print Controls Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                Configuration
              </h2>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-8">
              
              {/* SECTION: LABEL CONTENT */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b pb-2">1. Label Content</h3>
                
                {/* Center Text Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Center Text (Below Header)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={centerText}
                    onChange={(e) => setCenterText(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase font-medium"
                    placeholder="e.g. 5563"
                  />
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-[7fr_3fr] gap-x-3 gap-y-3 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Top Left Box</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={boxTL}
                      onChange={(e) => setBoxTL(e.target.value.toUpperCase())}
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Top Right Box</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={boxTR}
                      onChange={(e) => setBoxTR(e.target.value.toUpperCase())}
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bottom Left Box</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={boxBL}
                      onChange={(e) => setBoxBL(e.target.value.toUpperCase())}
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Bottom Right Box</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={boxBR}
                      onChange={(e) => setBoxBR(e.target.value.toUpperCase())}
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black focus:ring-1 focus:ring-black uppercase font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: PRINTING */}
              <div className="flex flex-col gap-4 mt-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest border-b pb-2">2. Print Execution</h3>
                
                <div>
                  <label htmlFor="copies" className="block text-xs font-bold text-gray-600 mb-1">
                    Total Number of Labels
                  </label>
                  <input
                    id="copies"
                    type="number"
                    min="1"
                    value={numPrints}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNumPrints(val === '' ? '' : parseInt(val, 10));
                    }}
                    onBlur={() => {
                      if (numPrints === '' || numPrints < 1) {
                        setNumPrints(1);
                      }
                    }}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    onClick={handlePrint}
                    disabled={!isConnected}
                    className={`w-full font-bold py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-200 ${isConnected
                        ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Print {numPrints || 0} Labels
                  </button>

                  {!isConnected && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                      <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        QZ Tray is disconnected.
                      </p>
                      <p className="text-xs text-red-500 mt-1 ml-7">
                        Ensure the QZ Tray application is running on your computer, then refresh this page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Footer Section */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sreedhar Traders. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            System configured for 4-up continuous thermal rolls. Ensure Windows printer width is 106mm.
          </p>
        </div>
      </footer>

    </div>
  );
}