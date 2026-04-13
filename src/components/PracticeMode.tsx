import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Flashcard } from '@/src/types';
import { CheckCircle2, XCircle, ArrowRight, Trophy, Volume2, BookOpen, CheckCircle, Trash2, AlertCircle } from 'lucide-react';

interface PracticeModeProps {
  cards: Flashcard[];
  onComplete: (id: string, isCorrect: boolean) => void;
  onUpdateCategory: (id: string, learned: boolean) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PracticeMode({ cards, onComplete, onUpdateCategory, onDelete, onClose }: PracticeModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [mode, setMode] = useState<'direct' | 'context' | 'complex' | 'grammar'>('direct');
  const [complexFormIndex, setComplexFormIndex] = useState(0);
  const [grammarChallengeIndex, setGrammarChallengeIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    if (!currentCard) return;
    
    const rand = Math.random();
    
    // For learned cards, ONLY use grammar challenges (or context as fallback for old cards)
    if (currentCard.learned) {
      if (currentCard.grammarChallenges && currentCard.grammarChallenges.length > 0) {
        setMode('grammar');
        setGrammarChallengeIndex(Math.floor(Math.random() * currentCard.grammarChallenges.length));
      } else {
        // Fallback to context mode for old learned cards, but never 'direct'
        setMode('context');
      }
      return;
    }

    // For learning cards, use context or direct
    if (currentCard.exampleContext && rand > 0.5) {
      setMode('context');
    } else {
      setMode('direct');
    }
  }, [currentIndex, currentCard?.exampleContext, currentCard?.learned, currentCard?.grammarChallenges]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showResult || showDeleteConfirm) return;

    let targetValue = currentCard.word;
    if (mode === 'complex') {
      targetValue = currentCard.complexForms![complexFormIndex].value;
    } else if (mode === 'grammar') {
      targetValue = currentCard.grammarChallenges![grammarChallengeIndex].answer;
    }

    const correct = userInput.trim().toLowerCase() === targetValue.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    onComplete(currentCard.id, correct);

    if (correct) {
      speak(targetValue);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
      setShowResult(false);
    } else {
      setShowResult(false);
      setIsCorrect(null);
      setCurrentIndex(prev => prev + 1); // Move to "finished" state
    }
  };

  const confirmDelete = () => {
    onDelete(currentCard.id);
    setShowDeleteConfirm(false);
    // If we deleted the last card, the currentIndex logic in App.tsx/PracticeMode will handle it
    // But we should reset state for the next card if there is one
    setUserInput('');
    setIsCorrect(null);
    setShowResult(false);
  };

  if (currentIndex >= cards.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-3xl font-bold mb-2">Practice Complete!</h3>
        <p className="text-muted-foreground mb-8">You've successfully reviewed all words in this session.</p>
        <Button onClick={onClose} size="lg" className="rounded-2xl px-12">
          Back to Home
        </Button>
      </motion.div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">No words to practice!</h3>
        <p className="text-muted-foreground">Add some words to your learning list first.</p>
        <Button onClick={onClose} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative">
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center border-2 border-destructive/20"
          >
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h4 className="text-lg font-bold mb-2">Delete this card?</h4>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Word {currentIndex + 1} of {cards.length}
        </span>
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="mb-6 border-2 border-primary/10">
            <CardContent className="pt-12 pb-12 text-center relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 px-3 text-[10px] uppercase tracking-wider ${
                    !currentCard.learned ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => onUpdateCategory(currentCard.id, false)}
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Learning
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 px-3 text-[10px] uppercase tracking-wider ${
                    currentCard.learned ? 'bg-green-500/10 text-green-600' : 'text-muted-foreground'
                  }`}
                  onClick={() => onUpdateCategory(currentCard.id, true)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Learned
                </Button>
              </div>
              <span className="text-sm uppercase tracking-widest text-muted-foreground mb-4 block">
                {mode === 'direct' ? 'Translate to English' : 
                 mode === 'context' ? 'Complete the Sentence' : 
                 mode === 'grammar' ? 'Grammar Challenge' :
                 `Provide: ${currentCard.complexForms![complexFormIndex].label}`}
              </span>
              <h3 className={`font-bold text-primary ${mode === 'direct' ? 'text-4xl' : 'text-2xl leading-relaxed'}`}>
                {mode === 'direct' ? currentCard.translation : 
                 mode === 'context' ? (
                   <span>
                     {currentCard.exampleContext.replace(/\[(.*?)\]/, '___ ($1)')}
                   </span>
                 ) : 
                 mode === 'grammar' ? (
                   <span>
                     {currentCard.grammarChallenges![grammarChallengeIndex].sentence} ({currentCard.grammarChallenges![grammarChallengeIndex].translation})
                   </span>
                 ) :
                 currentCard.word}
              </h3>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the English word..."
                className={`text-lg h-14 px-6 rounded-2xl transition-all ${
                  showResult 
                    ? isCorrect 
                      ? 'border-green-500 bg-green-50/50' 
                      : 'border-red-500 bg-red-50/50'
                    : 'border-primary/20 focus:border-primary'
                }`}
                disabled={showResult || showDeleteConfirm}
                autoFocus
              />
              {showResult && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {showResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                {!isCorrect && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <p className="text-red-500 font-medium">
                      Correct: <span className="font-bold underline">
                        {mode === 'complex' ? currentCard.complexForms![complexFormIndex].value : 
                         mode === 'grammar' ? currentCard.grammarChallenges![grammarChallengeIndex].answer :
                         currentCard.word}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={() => speak(currentCard.word)}
                    >
                      <Volume2 className="w-4 h-4 text-primary" />
                    </Button>
                  </div>
                )}
                <Button onClick={nextCard} className="w-full h-12 rounded-2xl text-lg">
                  {currentIndex === cards.length - 1 ? 'Finish' : 'Next Word'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {!showResult && (
              <Button type="submit" className="w-full h-12 rounded-2xl text-lg" disabled={showDeleteConfirm}>
                Check
              </Button>
            )}
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
