import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Flashcard } from '@/src/types';
import { Check, RotateCcw, Volume2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlashcardProps {
  card: Flashcard;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function FlashcardComponent({ card, onToggleLearned, onDelete, onRestore }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isArchived = card.status === 'archived';

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRestore) onRestore(card.id);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(card.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative w-full h-64 perspective-1000">
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center border-2 border-destructive/20"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h4 className="text-lg font-bold mb-2">Archive this card?</h4>
            <p className="text-sm text-muted-foreground mb-6">It will be moved to the Archive tab.</p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={confirmDelete}>
                Archive
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full h-full transition-all duration-500 preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => !showDeleteConfirm && setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <Card className={`absolute inset-0 backface-hidden flex items-center justify-center p-6 border-2 transition-colors ${isArchived ? 'border-muted bg-muted/20' : 'border-primary/20 hover:border-primary/40'}`}>
          <CardContent className="text-center relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.word);
                }}
              >
                <Volume2 className="w-5 h-5 text-primary" />
              </Button>
              {isArchived ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 text-primary"
                  onClick={handleRestoreClick}
                  title="Restore from Archive"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
            <h3 className={`text-3xl font-bold ${isArchived ? 'text-muted-foreground' : 'text-primary'}`}>{card.word}</h3>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Click to flip</p>
              {(card.totalCount || 0) > 0 && (
                <div className="bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Stats: {card.correctCount || 0} / {card.totalCount || 0} Correct
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <Card className={`absolute inset-0 backface-hidden flex items-center justify-center p-6 border-2 rotate-y-180 ${isArchived ? 'border-muted bg-muted/10' : 'border-primary/20 bg-primary/5'}`}>
          <CardContent className="text-center w-full relative h-full flex flex-col items-center justify-center">
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(card.word);
                }}
              >
                <Volume2 className="w-5 h-5 text-primary" />
              </Button>
              {isArchived ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 text-primary"
                  onClick={handleRestoreClick}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
            <h3 className={`text-3xl font-bold mb-4 ${isArchived ? 'text-muted-foreground' : 'text-primary'}`}>{card.translation}</h3>
            
            {(card.totalCount || 0) > 0 && (
              <div className="bg-primary/5 px-3 py-1 rounded-full border border-primary/10 mb-6">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Practice: {card.correctCount || 0} / {card.totalCount || 0} Correct
                </span>
              </div>
            )}
            
            {!isArchived && (
              <Button
                variant={card.learned ? "outline" : "default"}
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLearned(card.id);
                }}
              >
                {card.learned ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Mark as Unlearned
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Learned
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
