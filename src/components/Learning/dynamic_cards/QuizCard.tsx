"use client";

import React, { useState, useEffect } from 'react';
import { QuizPayload } from '@/app/lib/hooks/useVideoEvents';

interface QuizCardProps {
  quiz: QuizPayload | {
    question: string;
    alternatives: string[];
    answer: number;
  };
  onClose: () => void;
}

export default function QuizCard({ quiz, onClose }: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const getCorrectIndex = (): number => {
    if ('correctIndex' in quiz) {
      return quiz.correctIndex ?? 0;
    } else if ('answer' in quiz) {
      return quiz.answer ?? 0;
    }
    return 0;
  };
  
  const correctIndex = getCorrectIndex();
  
  const handleAlternativeClick = (index: number) => {
    if (showAnswer) return;
    
    setSelectedIndex(index);
    setShowAnswer(true);
    
    // Auto-close if correct after a delay
    if (index === correctIndex) {
      setTimeout(() => {
        handleClose();
      }, 2500);
    }
  };
  
  const handleClose = () => {
    setIsClosing(true);
    // Delay actual closing to allow animation to play
    setTimeout(() => {
      onClose();
    }, 300); // Reduced duration for just the fade out
  };
  
  const handleAskExplanation = () => {
    // This would be implemented to request an explanation
    console.log('User requested explanation for question:', quiz.question);
    // You could add actual implementation here later
    alert('Essa funcionalidade será implementada em breve!');
  };
  
  return (
    <>
      <style jsx>{`
        /* Card container animation */
        .card-container {
          position: relative;
          overflow: hidden;
          animation: fadeIn 0.8s ease forwards;
          transition: opacity 0.3s ease;
        }
        
        .card-closing {
          opacity: 0;
        }
        
        /* Card reveal animation */
        .card-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, white 50%);
          animation: revealCard 1.2s ease-out forwards;
          z-index: 5;
          pointer-events: none;
          border-radius: inherit;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .fade-in-content {
          animation: fadeIn 1s ease forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .correct-answer-banner {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .explanation-button {
          animation: fadeIn 0.5s ease forwards;
        }
        
        .correct-option {
          background: rgba(16, 185, 129, 0.35);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(16, 185, 129, 0.5) !important;
          box-shadow: 0 4px 12px -2px rgba(16, 185, 129, 0.18);
        }
        
        .wrong-option {
          background: rgba(239, 68, 68, 0.35);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(239, 68, 68, 0.5) !important;
          box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.18);
        }
        
        @keyframes slideIn {
          0% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes revealCard {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      
      <div className={`card-container w-full overflow-hidden backdrop-blur-md bg-white/50 rounded-xl border border-white/30 shadow-md p-6 relative ${isClosing ? 'card-closing' : ''}`}>
        {/* Close button - top right corner */}
        <div className="absolute top-3 right-3 z-10">
          <button 
            onClick={handleClose}
            className="backdrop-blur-md bg-white/40 rounded-full p-2 hover:bg-white/60 transition-all shadow-sm"
            aria-label="Close"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="rgba(28, 28, 30, 0.8)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Question Pill - with subtle shadow */}
          <div className="fade-in-content bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center justify-center border border-white/50 shadow-sm">
            <p className="text-[18px] font-normal text-[#1C1C1E] font-inter text-center">{quiz.question}</p>
          </div>
          
          {/* Alternatives Grid */}
          <div className="fade-in-content grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {quiz.alternatives.map((alternative, index) => (
              <button
                key={index}
                onClick={() => handleAlternativeClick(index)}
                className={`w-full text-left px-6 py-4 rounded-full backdrop-blur-sm transition-all duration-300
                  ${!showAnswer 
                    ? 'bg-white/80 hover:bg-white/90 hover:shadow-sm border border-white/40' 
                    : index === correctIndex 
                      ? 'correct-option' 
                      : selectedIndex === index 
                        ? 'wrong-option' 
                        : 'bg-white/60 opacity-70 border border-white/40'
                  }`}
                disabled={showAnswer}
              >
                <div className="flex items-center">
                  {/* ABCD icon */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 
                    ${showAnswer && index === correctIndex 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : showAnswer && selectedIndex === index 
                        ? 'bg-red-50 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    <span className="text-[14px] font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  
                  <span className={`text-[16px] font-normal font-inter ${
                    showAnswer && index === correctIndex
                      ? 'text-emerald-800' 
                      : showAnswer && selectedIndex === index 
                        ? 'text-red-800' 
                        : showAnswer && index !== correctIndex && index !== selectedIndex 
                          ? 'text-gray-500' 
                          : 'text-[#1C1C1E]'
                  }`}>
                    {alternative}
                  </span>
                  
                  {/* Correct/incorrect icons */}
                  {showAnswer && (index === correctIndex || selectedIndex === index) && (
                    <span className="ml-auto">
                      {index === correctIndex ? (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : selectedIndex === index ? (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      ) : null}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Correct answer banner */}
          {showAnswer && selectedIndex === correctIndex && (
            <div className="correct-answer-banner mt-4 backdrop-blur-md bg-emerald-100/90 rounded-xl p-4 flex items-center justify-center space-x-3 border border-emerald-300/70 shadow-sm">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-emerald-800 font-semibold text-lg">Resposta Correta!</span>
            </div>
          )}
          
          {/* Ask for explanation button (only shown when answer is wrong) */}
          {showAnswer && selectedIndex !== null && selectedIndex !== correctIndex && (
            <div className="mt-4 flex justify-center explanation-button">
              <button 
                onClick={handleAskExplanation}
                className="flex items-center gap-2 backdrop-blur-md bg-white/85 hover:bg-white/95 px-5 py-3 rounded-full border border-gray-300/70 shadow-sm text-gray-800 transition-all hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Pedir uma explicação</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 