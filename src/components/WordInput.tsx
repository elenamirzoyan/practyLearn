import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface WordInputProps {
  onAddWord: (word: string) => Promise<void>;
}

export function WordInput({ onAddWord }: WordInputProps) {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onAddWord(word.trim());
      setWord('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md mx-auto">
      <Input
        placeholder="Enter an English word..."
        value={word}
        onChange={(e) => setWord(e.target.value)}
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading || !word.trim()}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </>
        )}
      </Button>
    </form>
  );
}
