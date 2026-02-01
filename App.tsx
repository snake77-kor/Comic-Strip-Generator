
import React, { useState, useRef } from 'react';
import { generateComicScript, generateSingleImage } from './services/geminiService';
import type { ComicPanelData, ComicStripScript, Passage } from './types';
import { ComicPanel } from './components/ComicPanel';
import { DownloadIcon, MagicWandIcon, LoadingSpinner, PlusIcon, CloseIcon } from './components/Icons';
import { passageData } from './passages';

// This is a global declaration for html2canvas which is loaded from a CDN
declare const html2canvas: any;

const comicStyles = [
  { value: 'cinematic', label: 'Cinematic Comic', promptSuffix: 'cinematic comic book art, vibrant colors, detailed illustration' },
  { value: 'manga', label: 'Manga Style', promptSuffix: 'black and white manga style, dynamic action lines, scretones, detailed character art' },
  { value: 'vintage', label: 'Vintage Comic', promptSuffix: 'vintage 1950s comic book art style, faded colors, Ben Day dots, retro aesthetic' },
  { value: 'cartoon', label: 'Cartoon Fun', promptSuffix: 'bright and cheerful cartoon style, simple shapes, bold outlines, fun and playful' },
  { value: 'noir', label: 'Noir Mystery', promptSuffix: 'dark noir comic style, high contrast black and white, dramatic shadows, mystery atmosphere' },
];

const passageOptions = [
  { value: 'custom', label: '직접 입력' },
  { value: '18', label: '18번' },
  { value: '19', label: '19번' },
  { value: '20', label: '20번' },
  { value: '21', label: '21번' },
  { value: '22', label: '22번' },
  { value: '23', label: '23번' },
  { value: '24', label: '24번' },
  { value: '26', label: '26번' },
  { value: '29', label: '29번' },
  { value: '30', label: '30번' },
  { value: '31', label: '31번' },
  { value: '32', label: '32번' },
  { value: '33', label: '33번' },
  { value: '34', label: '34번' },
  { value: '35', label: '35번' },
  { value: '36', label: '36번' },
  { value: '37', label: '37번' },
  { value: '38', label: '38번' },
  { value: '39', label: '39번' },
  { value: '40', label: '40번' },
  { value: '41-42', label: '41-42' },
  { value: '43-45', label: '43-45' },
];


const App: React.FC = () => {
  const [passages, setPassages] = useState<Passage[]>([
    { id: Date.now(), title: 'Passage 1', text: '', selectedOption: 'custom' }
  ]);
  const [comicPanels, setComicPanels] = useState<ComicPanelData[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [comicStripTitles, setComicStripTitles] = useState<string[]>([]);
  const [comicStyle, setComicStyle] = useState<string>('cinematic');
  const [scriptType, setScriptType] = useState<'moments' | 'sentence' | 'dialogue'>('moments');
  const [loadingPanel, setLoadingPanel] = useState<[number, number] | null>(null);
  const [imageGenerationDelay, setImageGenerationDelay] = useState<number>(2);


  const comicContainerRef = useRef<HTMLDivElement>(null);

  const handleAddPassage = () => {
    setPassages(prev => [
      ...prev,
      { id: Date.now(), title: `Passage ${prev.length + 1}`, text: '', selectedOption: 'custom' }
    ]);
  };

  const handleRemovePassage = (id: number) => {
    setPassages(prev => prev.filter(p => p.id !== id));
  };

  const handlePassageChange = (id: number, field: 'title' | 'text', value: string) => {
    setPassages(prev => prev.map(p => {
      if (p.id !== id) {
        return p;
      }
      
      // If the passage was one of the predefined options
      if (p.selectedOption !== 'custom') {
        if (field === 'title') {
          // When editing the title of a predefined passage,
          // clear the text and convert it to a custom passage.
          return { ...p, title: value, text: '', selectedOption: 'custom' };
        }
        if (field === 'text') {
          // When editing the text of a predefined passage,
          // just update the text and convert it to a custom passage.
          return { ...p, text: value, selectedOption: 'custom' };
        }
      }

      // If it was already a custom passage, just update the changed field.
      return { ...p, [field]: value };
    }));
  };

  const handleOptionChange = (id: number, selectedValue: string) => {
    const selectedOptionData = passageOptions.find(opt => opt.value === selectedValue);

    setPassages(prev => prev.map((p, index) => {
        if (p.id === id) {
            if (selectedOptionData && selectedValue !== 'custom') {
                return {
                    ...p,
                    selectedOption: selectedValue,
                    title: selectedOptionData.label,
                    text: '',
                };
            } else {
                return {
                    ...p,
                    selectedOption: 'custom',
                    title: '',
                    text: '',
                };
            }
        }
        return p;
    }));
  };

  const handleCaptionChange = (stripIndex: number, panelIndex: number, newCaption: string) => {
    setComicPanels(prevPanels =>
      prevPanels.map((strip, sIndex) => {
        if (sIndex !== stripIndex) return strip;
        return strip.map((panel, pIndex) => {
          if (pIndex !== panelIndex) return panel;
          return { ...panel, caption: newCaption };
        });
      })
    );
  };

  const handleDialogueChange = (stripIndex: number, panelIndex: number, side: 'left' | 'right', newText: string) => {
    setComicPanels(prevPanels =>
      prevPanels.map((strip, sIndex) => {
        if (sIndex !== stripIndex) return strip;
        return strip.map((panel, pIndex) => {
          if (pIndex !== panelIndex) return panel;
          const newDialogue = { ...(panel.dialogue || { left: '', right: '' }) };
          if (side === 'left') {
            newDialogue.left = newText;
          } else {
            newDialogue.right = newText;
          }
          return { ...panel, dialogue: newDialogue };
        });
      })
    );
  };

  const handleGenerateScript = async () => {
    const activePassages = passages.filter(p => p.text.trim());
    if (activePassages.length === 0 || isLoading) return;
    
    const combinedText = activePassages.map(p => p.text.trim()).join('\n---\n');

    setIsLoading(true);
    setComicPanels([]);
    setError(null);
    setComicStripTitles(activePassages.map(p => p.title));

    try {
      setLoadingMessage('AI is crafting your comic script(s)...');
      const scripts: ComicStripScript[][] = await generateComicScript(combinedText, scriptType);

      if (!scripts || scripts.length === 0 || scripts.some(s => s.length === 0)) {
        throw new Error('Failed to generate a valid comic script.');
      }

      const panelsWithoutImages = scripts.map(stripScript =>
        stripScript.map(panelScript => ({
          ...panelScript,
          imageUrl: null,
        }))
      );
      setComicPanels(panelsWithoutImages);

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate comic script. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleImageGenerationForPanel = async (stripIndex: number, panelIndex: number) => {
    if (isLoading || loadingPanel) return;

    const panelToGenerate = comicPanels[stripIndex]?.[panelIndex];
    if (!panelToGenerate?.image_prompt) return;

    setLoadingPanel([stripIndex, panelIndex]);
    setError(null);

    try {
        const selectedStyle = comicStyles.find(s => s.value === comicStyle);
        const stylePrompt = selectedStyle ? selectedStyle.promptSuffix : comicStyles[0].promptSuffix;
        
        const newImageUrl = await generateSingleImage(panelToGenerate.image_prompt, stylePrompt);

        setComicPanels(prevPanels => 
            prevPanels.map((strip, sIndex) => {
                if (sIndex !== stripIndex) return strip;
                return strip.map((panel, pIndex) => {
                    if (pIndex !== panelIndex) return panel;
                    return { ...panel, imageUrl: newImageUrl };
                });
            })
        );
    } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setLoadingPanel(null);
    }
  };

  const handleGenerateAllImages = async () => {
    setIsLoading(true);
    setLoadingMessage('AI is drawing all comic panels...');
    setError(null);
    
    const selectedStyle = comicStyles.find(s => s.value === comicStyle);
    const stylePrompt = selectedStyle ? selectedStyle.promptSuffix : comicStyles[0].promptSuffix;

    let currentPanels = JSON.parse(JSON.stringify(comicPanels));

    try {
      for (let sIndex = 0; sIndex < currentPanels.length; sIndex++) {
          for (let pIndex = 0; pIndex < currentPanels[sIndex].length; pIndex++) {
              const panel = currentPanels[sIndex][pIndex];
              if (!panel.imageUrl) {
                  if (sIndex > 0 || pIndex > 0) {
                      await new Promise(resolve => setTimeout(resolve, imageGenerationDelay * 1000));
                  }
                  setLoadingPanel([sIndex, pIndex]);
                  const newImageUrl = await generateSingleImage(panel.image_prompt, stylePrompt);
                  currentPanels[sIndex][pIndex].imageUrl = newImageUrl;
                  setComicPanels(JSON.parse(JSON.stringify(currentPanels)));
              }
          }
      }
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setLoadingPanel(null);
    }
  };

  const handleDownload = async () => {
    if (!comicContainerRef.current) return;

    // Wait for fonts to load to ensure they are rendered in the canvas
    await document.fonts.ready;

    html2canvas(comicContainerRef.current, {
        backgroundColor: '#0f172a', // slate-900
        useCORS: true,
        scale: 2,
    }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = 'ai-comic-strips.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
  };

  const hasScript = comicPanels.length > 0;
  const hasAllImages = hasScript && comicPanels.every(strip => strip.every(panel => !!panel.imageUrl));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          AI Comic Strip Generator
        </h1>
        <p className="text-lg text-slate-400">Transform your text into a vibrant comic strip.</p>
      </header>

      <main className="w-full max-w-4xl flex-grow">
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 backdrop-blur-sm">
          
          <h2 className="text-2xl font-bold mb-1 text-slate-100">Enter Your Text (English or Korean)</h2>
          <p className="text-slate-400 mb-6">Provide a story in the text area(s) below. The AI will first generate a script, then you can generate the images for each panel.</p>

          <div className="space-y-4">
            {passages.map((passage, passageIndex) => (
              <div key={passage.id} className="relative group rounded-lg border border-slate-700 bg-slate-900/40 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <div className="border-b border-slate-700 flex">
                  <select
                    id={`option-${passage.id}`}
                    value={passage.selectedOption}
                    onChange={(e) => handleOptionChange(passage.id, e.target.value)}
                    className="pl-4 pr-2 py-3 bg-transparent border-0 border-r border-slate-700 text-slate-300 font-medium focus:ring-0 focus:outline-none"
                    disabled={isLoading}
                    aria-label="Select a predefined passage"
                  >
                    {passageOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-slate-800">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    id={`title-${passage.id}`}
                    type="text"
                    value={passage.title}
                    onChange={(e) => handlePassageChange(passage.id, 'title', e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-0 text-slate-300 placeholder-slate-500 font-medium focus:ring-0 focus:outline-none"
                    placeholder={`Enter passage title (e.g., Passage ${passageIndex + 1})`}
                    disabled={isLoading}
                    aria-label="Passage Title"
                  />
                </div>
                
                <textarea
                  id={`text-${passage.id}`}
                  value={passage.text}
                  onChange={(e) => handlePassageChange(passage.id, 'text', e.target.value)}
                  placeholder="Paste or write your story, passage, or text here..."
                  className="w-full h-40 p-4 bg-transparent border-0 text-slate-300 placeholder-slate-500 focus:ring-0 focus:outline-none resize-y"
                  disabled={isLoading}
                  aria-label="Passage Content"
                />

                {passages.length > 1 && (
                  <button
                    onClick={() => handleRemovePassage(passage.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove passage"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            ))}
          </div>


          <div className="mt-4">
            <button
              onClick={handleAddPassage}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700/50 hover:border-slate-500 disabled:cursor-not-allowed transition-all duration-300"
            >
              <PlusIcon />
              <span>Add another passage</span>
            </button>
          </div>
          
          <div className="mt-6">
            <label htmlFor="comic-style" className="block text-sm font-medium text-slate-300 mb-2">Comic Style</label>
            <select
              id="comic-style"
              value={comicStyle}
              onChange={(e) => setComicStyle(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-900/40 border border-slate-600 rounded-lg text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select Comic Style"
            >
              {comicStyles.map(style => (
                <option key={style.value} value={style.value} className="bg-slate-800">
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Script Generation Type</label>
            <div className="flex space-x-1 rounded-lg bg-slate-900/40 border border-slate-600 p-1">
              <button 
                onClick={() => setScriptType('moments')}
                disabled={isLoading}
                aria-pressed={scriptType === 'moments'}
                className={`w-1/3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${scriptType === 'moments' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                By Key Moments
              </button>
              <button 
                onClick={() => setScriptType('sentence')}
                disabled={isLoading}
                aria-pressed={scriptType === 'sentence'}
                className={`w-1/3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${scriptType === 'sentence' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                By Sentence
              </button>
              <button 
                onClick={() => setScriptType('dialogue')}
                disabled={isLoading}
                aria-pressed={scriptType === 'dialogue'}
                className={`w-1/3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${scriptType === 'dialogue' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700/50'}`}
              >
                Dialogue
              </button>
            </div>
          </div>


          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={handleGenerateScript}
              disabled={isLoading || !passages.some(p => p.text.trim())}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isLoading && !loadingPanel ? (
                <>
                  <LoadingSpinner />
                  <span>Generating Script...</span>
                </>
              ) : (
                <>
                  <MagicWandIcon />
                  <span>Generate Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {isLoading && loadingMessage && (
            <div className="mt-8 text-center text-cyan-400">
                <p className="text-lg animate-pulse">{loadingMessage}</p>
            </div>
        )}

        {hasScript && (
          <div className="mt-10">
            <div ref={comicContainerRef} className="p-4 bg-slate-900 space-y-8">
                {comicPanels.map((strip, stripIndex) => (
                    <div key={stripIndex}>
                         <h2 className="text-2xl font-bold text-center mb-4 text-cyan-400 border-b-2 border-slate-600 pb-2">
                            {comicStripTitles[stripIndex] || `Comic Strip #${stripIndex + 1}`}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-4 border-slate-600 p-4 rounded-lg bg-slate-800">
                            {strip.map((panel, panelIndex) => (
                                <ComicPanel 
                                  key={panelIndex} 
                                  panel={panel}
                                  isLoading={loadingPanel?.[0] === stripIndex && loadingPanel?.[1] === panelIndex}
                                  onGenerate={() => handleImageGenerationForPanel(stripIndex, panelIndex)}
                                  onRegenerate={() => handleImageGenerationForPanel(stripIndex, panelIndex)}
                                  onCaptionChange={(newCaption) => handleCaptionChange(stripIndex, panelIndex, newCaption)}
                                  onDialogueChange={(side, newText) => handleDialogueChange(stripIndex, panelIndex, side, newText)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-6">
                {!hasAllImages && (
                    <div className="w-full max-w-sm flex flex-col items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="w-full">
                          <label htmlFor="delay-slider" className="mb-2 text-sm font-medium text-slate-300 text-center block">
                              Delay Between Images: {imageGenerationDelay}s
                          </label>
                          <input
                              id="delay-slider"
                              type="range"
                              min="0"
                              max="10"
                              step="1"
                              value={imageGenerationDelay}
                              onChange={(e) => setImageGenerationDelay(Number(e.target.value))}
                              disabled={isLoading || !!loadingPanel}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              aria-label="Set delay between image generations to avoid API rate limits"
                          />
                          <p className="text-xs text-slate-500 mt-1 text-center">Set a delay to help avoid API rate limits during batch generation.</p>
                        </div>
                        <button
                            onClick={handleGenerateAllImages}
                            disabled={isLoading || !!loadingPanel}
                            className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
                        >
                        {isLoading && !loadingPanel ? (
                            <>
                                <LoadingSpinner />
                                <span>Generating...</span>
                            </>
                            ) : (
                            <span>Generate All Images</span>
                        )}
                        </button>
                    </div>
                )}
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105"
                    >
                        <DownloadIcon />
                        <span>Download as Image</span>
                    </button>
                </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl text-center mt-12 pb-4">
        <p className="text-slate-500 text-sm">Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
