import React, { useRef, useEffect } from 'react';
import type { ComicPanelData } from '../types';
import { LoadingSpinner, RegenerateIcon, ImageIcon } from './Icons';

interface SpeechBubbleProps {
  text: string;
  position: 'top-left' | 'bottom-right';
  onTextChange: (newText: string) => void;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, position, onTextChange }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (bubbleRef.current && bubbleRef.current.textContent !== text) {
      bubbleRef.current.textContent = text;
    }
  }, [text]);

  const positionClasses = {
    'top-left': 'top-2 left-2 items-start',
    'bottom-right': 'bottom-2 right-2 items-end',
  };

  const bubbleAlignment = {
    'top-left': 'self-start',
    'bottom-right': 'self-end',
  }

  const tailClasses = {
    'top-left': 'left-4 -bottom-2', // points down
    'bottom-right': 'right-4 -top-2 transform rotate-180', // points up
  }
  
  return (
    <div className={`absolute flex flex-col ${positionClasses[position]}`} style={{ maxWidth: '80%' }}>
      <div 
        className={`relative ${bubbleAlignment[position]} bg-white text-black font-comic font-bold text-sm rounded-xl p-2 shadow-md outline-none focus:ring-2 focus:ring-indigo-500`}
        ref={bubbleRef}
        contentEditable
        suppressContentEditableWarning={true}
        onBlur={(e) => onTextChange(e.currentTarget.textContent || '')}
        aria-label={`Editable speech bubble. Current text: ${text}`}
      >
        <svg className={`absolute w-4 h-3 text-white ${tailClasses[position]}`} viewBox="0 0 20 15" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>
          <path d="M0 0 L10 15 L20 0 Z" />
        </svg>
      </div>
    </div>
  );
};


interface ComicPanelProps {
  panel: ComicPanelData;
  isLoading: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onCaptionChange: (newCaption: string) => void;
  onDialogueChange: (side: 'left' | 'right', newText: string) => void;
}

export const ComicPanel: React.FC<ComicPanelProps> = ({ panel, isLoading, onGenerate, onRegenerate, onCaptionChange, onDialogueChange }) => {
  const captionRef = useRef<HTMLDivElement>(null);
  const hasDialogue = panel.dialogue && (panel.dialogue.left || panel.dialogue.right);

  useEffect(() => {
    // Keep the editable div's content in sync with the caption prop from parent state for non-dialogue panels.
    if (!hasDialogue && captionRef.current && captionRef.current.textContent !== panel.caption) {
      captionRef.current.textContent = panel.caption;
    }
  }, [panel.caption, hasDialogue]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (panel.imageUrl) {
      return (
        <>
          <img 
            src={panel.imageUrl} 
            alt={panel.caption || 'Comic panel image'} 
            className="w-full h-full object-cover transition-opacity duration-300"
            crossOrigin="anonymous" 
          />
          {hasDialogue && panel.dialogue?.left && (
            <SpeechBubble 
              text={panel.dialogue.left} 
              position="top-left" 
              onTextChange={(newText) => onDialogueChange('left', newText)} 
            />
          )}
          {hasDialogue && panel.dialogue?.right && (
            <SpeechBubble 
              text={panel.dialogue.right} 
              position="bottom-right" 
              onTextChange={(newText) => onDialogueChange('right', newText)} 
            />
          )}
          <button
              onClick={onRegenerate}
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-black/75"
              aria-label="Regenerate panel"
          >
              <RegenerateIcon />
          </button>
        </>
      );
    }
    
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
          <button 
            onClick={onGenerate}
            className="flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors duration-200"
          >
            <ImageIcon />
            <span className="text-sm font-semibold">Generate Image</span>
          </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-700 rounded-lg overflow-hidden shadow-lg">
      <div className="relative group aspect-square w-full bg-slate-900 flex items-center justify-center">
        {renderContent()}
      </div>
      {!hasDialogue && (
        <div className="p-3 bg-white text-black flex-grow flex items-center justify-center">
          <div
            ref={captionRef}
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={(e) => onCaptionChange(e.currentTarget.textContent || '')}
            className="w-full text-center font-comic font-bold text-sm md:text-base text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-indigo-400 rounded-md p-1 m-0 outline-none"
            aria-label="Editable panel caption"
          />
        </div>
      )}
    </div>
  );
};