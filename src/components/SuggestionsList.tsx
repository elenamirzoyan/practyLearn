import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WordData } from '@/src/types';
import { Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SuggestionsListProps {
  suggestions: WordData[];
  onAdd: (word: WordData) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function SuggestionsList({ suggestions, onAdd, isLoading, onRefresh }: SuggestionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">Suggested for You</h3>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              Refresh Suggestions
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((item, index) => (
                  <motion.div
                    key={item.word}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-lg">{item.word}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{item.translation}</p>
                          {item.complexForms && item.complexForms.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.complexForms.slice(0, 2).map((form, i) => (
                                <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                                  {form.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-full hover:bg-primary hover:text-primary-foreground"
                          onClick={() => onAdd(item)}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
