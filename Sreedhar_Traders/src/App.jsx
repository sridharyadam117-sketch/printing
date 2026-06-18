import { useState, useEffect, useRef } from 'react';
import qz from 'qz-tray';

export default function App() {
  const [numPrints, setNumPrints] = useState(1);
  const [isConnected, setIsConnected] = useState(false);

  // Label Content
  const [centerText, setCenterText] = useState('555');
  const [boxTL, setBoxTL] = useState('666');
  const [boxTR, setBoxTR] = useState('60');
  const [boxBL, setBoxBL] = useState('10');
  const [boxBR, setBoxBR] = useState('1');

  // Physical Calibration (millimeters)
  // NO left padding on the row — labels start at position 0
  // Only gap between labels is controlled here
  const [labelWidth, setLabelWidth] = useState(23);
  const [labelHeight, setLabelHeight] = useState(24);
  const [horizontalGap, setHorizontalGap] = useState(2);

  const labelRef = useRef(null);

  useEffect(() => {
    const connectQZ = async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }
        setIsConnected(true);
      } catch (err) {
        if (
          err.message?.includes('Waiting for previous disconnect') ||
          err.message?.includes('cancelled')
        ) {
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

      const config = qz.configs.create(printer, {
        copies: 1,
        size: { width: 101.6, height: 25 },
        units: 'mm',
        margins: 0,
        orientation: 'portrait',
        rotation: 0,
        colorType: 'blackWhite',
        duplex: false,
      });

      const printData = [];
      const labelsPerRow = 4;
      const totalRows = Math.ceil(totalLabels / labelsPerRow);

      for (let r = 0; r < totalRows; r++) {
        let rowHtml = `<div class="row">`;

        for (let c = 0; c < labelsPerRow; c++) {
          if (r * labelsPerRow + c < totalLabels) {
            rowHtml += `
              <div class="label${c > 0 ? ' label-gap' : ''}">
                <div class="header">SREEDHAR<br/>TRADERS</div>
                <div class="center-text">${centerText}</div>
                <div class="grid-box">
                  <div class="box box-tl">${boxTL}</div>
                  <div class="box box-tr">${boxTR}</div>
                  <div class="box box-bl">${boxBL}</div>
                  <div class="box box-br">${boxBR}</div>
                </div>
              </div>
            `;
          } else {
            rowHtml += `<div class="label${c > 0 ? ' label-gap' : ''} empty-label"></div>`;
          }
        }
        rowHtml += `</div>`;

        printData.push({
          type: 'html',
          format: 'plain',
          data: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    size: 101.6mm 25mm;
    margin: 0 !important;
    padding: 0 !important;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    width: 101.6mm;
    height: 25mm;
    max-height: 25mm;
    overflow: hidden;
    background: white;
    color: black;
    font-family: Arial, Helvetica, sans-serif;
  }
  /* NO padding-left, NO padding-top — start at absolute zero */
  .row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 101.6mm;
    height: 25mm;
    overflow: hidden;
  }
  .label {
    width: ${labelWidth}mm;
    height: ${labelHeight}mm;
    display: flex;
    flex-direction: column;
    border: 0.3mm solid black;
    flex-shrink: 0;
    overflow: hidden;
  }
  /* Gap applied only as margin-left on 2nd, 3rd, 4th labels — NOT on the first */
  .label-gap {
    margin-left: ${horizontalGap}mm;
  }
  .empty-label {
    border: none !important;
  }
  .header {
    text-align: center;
    font-size: 5.5px;
    font-weight: bold;
    text-transform: uppercase;
    padding-top: 0.4mm;
    line-height: 1.2;
    flex-shrink: 0;
  }
  .center-text {
    height: 4mm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
    font-weight: bold;
    overflow: hidden;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .grid-box {
    display: grid;
    grid-template-columns: 7fr 3fr;
    grid-template-rows: 1fr 1fr;
    flex-grow: 1;
    border-top: 0.3mm solid black;
    overflow: hidden;
  }
  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6px;
    font-weight: bold;
    overflow: hidden;
    white-space: nowrap;
    padding: 0.3mm;
  }
  .box-tl { border-right: 0.3mm solid black; border-bottom: 0.3mm solid black; }
  .box-tr { border-bottom: 0.3mm solid black; }
  .box-bl { border-right: 0.3mm solid black; }
  .box-br { }
</style>
</head>
<body>
  ${rowHtml}
</body>
</html>`,
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

      {/* Header */}
      <header className="bg-black text-white py-6 px-8 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide uppercase">
              Sreedhar Traders
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Label Printing Console — 4-Column Roll
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

      {/* Main */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT: Live Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-[120px]">
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                Live Layout Preview
              </h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
              <div
                className="w-full bg-gray-50 border border-gray-200 shadow-inner rounded-md overflow-x-auto p-4 sm:p-6"
                ref={labelRef}
              >
                {/* Preview mirrors exact print HTML: no left padding, gap only between labels */}
                <div className="flex justify-start w-max">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="border border-black flex flex-col bg-white shadow-sm shrink-0"
                      style={{
                        width: `${labelWidth * 4}px`,
                        height: `${labelHeight * 4}px`,
                        marginLeft: idx > 0 ? `${horizontalGap * 4}px` : '0px',
                      }}
                    >
                      <div className="text-center font-bold uppercase text-[9px] leading-tight mt-1 px-1">
                        Sreedhar<br />Traders
                      </div>
                      <div className="flex items-center justify-center overflow-hidden px-1" style={{ height: '16px' }}>
                        <span className="text-black text-[10px] font-bold tracking-widest">{centerText}</span>
                      </div>
                      <div className="flex-grow w-full grid grid-cols-[7fr_3fr] grid-rows-2 border-t border-black text-[9px] font-bold">
                        <div className="border-r border-b border-black flex items-center justify-center px-1">{boxTL}</div>
                        <div className="border-b border-black flex items-center justify-center px-1">{boxTR}</div>
                        <div className="border-r border-black flex items-center justify-center px-1">{boxBL}</div>
                        <div className="flex items-center justify-center px-1">{boxBR}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live width checker */}
              <div className="mt-4 bg-gray-100 rounded-lg px-4 py-3 text-xs text-gray-600 w-full text-center font-mono">
                {(labelWidth * 4 + horizontalGap * 3).toFixed(1)}mm used of 101.6mm
                <span className={`ml-2 font-bold ${(labelWidth * 4 + horizontalGap * 3) <= 101.6 ? 'text-green-600' : 'text-red-600'}`}>
                  {(labelWidth * 4 + horizontalGap * 3) <= 101.6 ? '✓ fits' : '✗ overflows — reduce width or gap'}
                </span>
              </div>

              <p className="text-gray-400 text-xs mt-3 text-center max-w-sm">
                Labels start at position zero — no left margin. Only adjust Gap if stickers have physical spacing between them.
              </p>
            </div>
          </div>

          {/* RIGHT: Config Panels */}
          <div className="flex flex-col gap-6">

            {/* Calibration — removed leftOffset and topOffset entirely */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                  Printer Calibration
                </h2>
                <span className="text-xs font-bold text-gray-400">MEASUREMENTS IN MM</span>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'Label Width', value: labelWidth, setter: setLabelWidth, hint: 'Physical sticker width' },
                  { label: 'Label Height', value: labelHeight, setter: setLabelHeight, hint: 'Physical sticker height' },
                  { label: 'Gap Between Labels', value: horizontalGap, setter: setHorizontalGap, hint: 'Space between stickers' },
                ].map(({ label, value, setter, hint }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-gray-600 mb-0.5">{label}</label>
                    <p className="text-[10px] text-gray-400 mb-1">{hint}</p>
                    <input
                      type="number"
                      step="0.5"
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Label Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
                <h2 className="text-sm font-bold tracking-widest uppercase text-gray-700">
                  Label Content
                </h2>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Center Text</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={centerText}
                    onChange={(e) => setCenterText(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium"
                  />
                </div>
                <div className="grid grid-cols-[7fr_3fr] gap-x-3 gap-y-3">
                  {[
                    { label: 'Top Left', value: boxTL, setter: setBoxTL, max: 8 },
                    { label: 'Top Right', value: boxTR, setter: setBoxTR, max: 4 },
                    { label: 'Bottom Left', value: boxBL, setter: setBoxBL, max: 8 },
                    { label: 'Bottom Right', value: boxBR, setter: setBoxBR, max: 4 },
                  ].map(({ label, value, setter, max }) => (
                    <div key={label}>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
                      <input
                        type="text"
                        maxLength={max}
                        value={value}
                        onChange={(e) => setter(e.target.value.toUpperCase())}
                        className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-black uppercase font-medium"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <label className="block text-xs font-bold text-gray-600 mb-2">
                    Total Number of Labels
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={numPrints}
                    onChange={(e) =>
                      setNumPrints(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    onBlur={() => {
                      if (numPrints === '' || numPrints < 1) setNumPrints(1);
                    }}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors mb-4"
                  />
                  <button
                    onClick={handlePrint}
                    disabled={!isConnected}
                    className={`w-full font-bold py-4 px-6 rounded-lg uppercase tracking-wider transition-all duration-200 ${
                      isConnected
                        ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Print {numPrints || 0} Labels
                  </button>
                  {!isConnected && (
                    <p className="text-xs text-red-500 mt-3 text-center font-medium">
                      QZ Tray is disconnected. Ensure it is running.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sreedhar Traders. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            System configured for 4-up continuous thermal rolls (101.6mm × 25mm).
          </p>
        </div>
      </footer>

    </div>
  );
}