import React, { useState } from 'react';
import './App.css';

function App() {
  const [step, setStep] = useState(1);
  const [poleInputText, setPoleInputText] = useState('');
  const [framingInputText, setFramingInputText] = useState('');
  const [downguyInputText, setDownguyInputText] = useState('');
  const [spanguyInputText, setSpanguyInputText] = useState('');
  const [output, setOutput] = useState('');

  const handleGenerateOutput = () => {
    const poleLines = poleInputText.split('\n');
    const framingLines = framingInputText.split('\n');
    const downguyLines = downguyInputText.split('\n');
    const spanguyLines = spanguyInputText.split('\n');
    let outputText = '';
    let seqEntries = {};

    poleLines.forEach((line) => {
      const columns = line.split(/\t+/);
      if (columns.length > 1) {
        const structureName = columns[2];
        const poleHeight = parseFloat(columns[18]); // Structure Height or Pole Length (ft) column
        const sequenceMatch = structureName.match(/SEQ (\d+)/);
        const heightMatch = structureName.match(/ST(\d+)\.\d+/);

        if (sequenceMatch && heightMatch && poleHeight > 0) {
          const sequence = sequenceMatch[1];
          const poleClassHeight = parseFloat(heightMatch[1]);
          const depth = (poleHeight * 0.1 + 3).toFixed(1);
          const framingInfo = parseFramingInfo(structureName);
          const downguyInfo = parseDownguyInfo(sequence, downguyLines);
          const spanguyInfo = parseSpanguyInfo(sequence, spanguyLines);

          if (!seqEntries[sequence]) {
            seqEntries[sequence] = {
              structureName,
              entries: [],
              framingInfo,
              downguyInfo,
              spanguyInfo
            };
          }

          seqEntries[sequence].entries.push({
            poleClassHeight,
            depth
          });
        }
      }
    });

    Object.keys(seqEntries).forEach((sequence) => {
      outputText += `SEQ${sequence}:\nINSTALL:\n`;
      seqEntries[sequence].entries.forEach(entry => {
        outputText += `    - ${entry.poleClassHeight}' CL 1 STEEL POLE [${entry.depth}' DEEP]\n`;
      });
      outputText += `    - ${seqEntries[sequence].framingInfo}\n${seqEntries[sequence].downguyInfo}${seqEntries[sequence].spanguyInfo}\n\nTRANSFERS\n\n`;
    });

    outputText += 'INSTALL GUYS AND ANCHORS PER EG307, 308, 411, 421\n';

    setOutput(outputText);
    downloadOutput(outputText);
  };

  const parseFramingInfo = (structureName) => {
    const normalizedLine = structureName.toUpperCase();

    if (normalizedLine.includes('EJ300')) {
      if (normalizedLine.includes('TAN')) return '3PH TAN WITH 1PH TAP (EJ300, FIG 1 WITH EH236)';
      if (normalizedLine.includes('ANGLE')) return '3PH ANGLE (EJ300, FIG 2)';
      if (normalizedLine.includes('DDE ANG')) return '3PH DDE ANG (EJ300, FIG 3)';
      if (normalizedLine.includes('DE')) return '3PH DE (EJ300, FIG 4)';
      if (normalizedLine.includes('CORNER')) return '3PH CORNER WITH 1PH TAP (EJ300, FIG 5 WITH EH226)';
    }

    if (normalizedLine.includes('EH')) return 'EH standards – no FIG #';

    if (normalizedLine.includes('EI')) {
      if (normalizedLine.includes('EI221')) return 'EI221 standards – FIG 1&2 = high neutral, FIG 3&4 = low neutral';
      return 'EI standards – FIG 1 = high neutral, FIG 2 = low neutral';
    }

    if (normalizedLine.includes('TF')) return 'TF standards – no FIG #';

    return 'Unknown framing info';
  };

  const parseDownguyInfo = (sequence, lines) => {
    let downguyInfo = '';
    const downguyPattern = new RegExp(`^${sequence}\\s+`, 'i');

    lines.forEach(line => {
      if (downguyPattern.test(line)) {
        const columns = line.split(/\t+/);
        const leadLength = columns[6];
        const direction = columns[7];
        downguyInfo += `    - (2) 7/16" GUY & 24" PLATE ${leadLength}’ LEAD ${direction}\n`;
      }
    });

    return downguyInfo;
  };

  const parseSpanguyInfo = (sequence, lines) => {
    let spanguyInfo = '';
    const spanguyPattern = new RegExp(`^${sequence}\\s+`, 'i');

    lines.forEach(line => {
      if (spanguyPattern.test(line)) {
        const columns = line.split(/\t+/);
        if (columns[5] === 'Span Guy') {
          const leadLength = columns[6];
          const direction = columns[7];
          const targetSeq = columns[8].split(' ')[2];
          spanguyInfo += `    - (2) 7/16" SPAN GUY ${leadLength}’ ${direction} TO SEQ ${targetSeq}\n`;
        }
      }
    });

    return spanguyInfo;
  };

  const downloadOutput = (outputText) => {
    const element = document.createElement('a');
    const file = new Blob([outputText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'output.txt';
    document.body.appendChild(element);
    element.click();
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sequence Data Input</h1>
        {step === 1 && (
          <div>
            <h2>Step 1: Enter Pole Data</h2>
            <textarea
              rows="10"
              cols="50"
              placeholder="Paste your Excel data here..."
              value={poleInputText}
              onChange={(e) => setPoleInputText(e.target.value)}
            />
            <button onClick={handleNextStep}>Next</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2>Step 2: Enter Framing Data</h2>
            <textarea
              rows="10"
              cols="50"
              placeholder="Paste your framing sequences here..."
              value={framingInputText}
              onChange={(e) => setFramingInputText(e.target.value)}
            />
            <button onClick={handleNextStep}>Next</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2>Step 3: Enter Downguy Data</h2>
            <textarea
              rows="10"
              cols="50"
              placeholder="Paste your guy staking report here..."
              value={downguyInputText}
              onChange={(e) => setDownguyInputText(e.target.value)}
            />
            <button onClick={handleNextStep}>Next</button>
          </div>
        )}
        {step === 4 && (
          <div>
            <h2>Step 4: Enter Span Guy Data</h2>
            <textarea
              rows="10"
              cols="50"
              placeholder="Paste your span guy report here..."
              value={spanguyInputText}
              onChange={(e) => setSpanguyInputText(e.target.value)}
            />
            <button onClick={handleGenerateOutput}>Generate Output</button>
          </div>
        )}
        {output && (
          <div>
            <h2>Generated Output</h2>
            <pre>{output}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
