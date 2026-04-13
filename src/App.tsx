import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WordInput } from './components/WordInput';
import { FlashcardComponent } from './components/FlashcardComponent';
import { PracticeMode } from './components/PracticeMode';
import { SuggestionsList } from './components/SuggestionsList';
import { Flashcard, WordData } from './types';
import { processWord, suggestWords } from './services/geminiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, GraduationCap, LayoutGrid, Play, Sparkles, X, LogIn, LogOut, User as UserIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [suggestions, setSuggestions] = useState<WordData[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user || !isAuthReady) {
      setCards([]);
      return;
    }

    const q = query(
      collection(db, 'flashcards'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Flashcard[];
      setCards(fetchedCards);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Load suggestions from localStorage
  useEffect(() => {
    const savedSuggestions = localStorage.getItem('lexilearn_suggestions');
    if (savedSuggestions) {
      setSuggestions(JSON.parse(savedSuggestions));
    } else {
      fetchSuggestions();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lexilearn_suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const data = await suggestWords(15);
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAddWord = async (word: string | WordData) => {
    if (!user) {
      alert('Please log in to add words');
      return;
    }

    try {
      let wordData: WordData;
      if (typeof word === 'string') {
        wordData = await processWord(word);
      } else {
        wordData = word;
        setSuggestions(prev => prev.filter(s => s.word !== wordData.word));
      }

      const cardId = crypto.randomUUID();
      const newCardData = {
        ...wordData,
        createdAt: Date.now(),
        learned: false,
        status: 'learning' as const,
        userId: user.uid,
        correctCount: 0,
        totalCount: 0,
      };

      await setDoc(doc(db, 'flashcards', cardId), newCardData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flashcards');
    }
  };

  const handleToggleLearned = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    try {
      await updateDoc(doc(db, 'flashcards', id), {
        learned: !card.learned,
        status: !card.learned ? 'learned' : 'learning'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${id}`);
    }
  };

  const handlePracticeResult = async (id: string, isCorrect: boolean) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    try {
      await updateDoc(doc(db, 'flashcards', id), {
        correctCount: isCorrect ? (card.correctCount || 0) + 1 : (card.correctCount || 0),
        totalCount: (card.totalCount || 0) + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${id}`);
    }
  };

  const handleUpdateCategory = async (id: string, learned: boolean) => {
    try {
      await updateDoc(doc(db, 'flashcards', id), {
        learned: learned,
        status: learned ? 'learned' : 'learning'
      });
      
      // Update session cards locally so the UI reflects the change immediately
      setSessionCards(prev => prev.map(card => 
        card.id === id ? { ...card, learned, status: learned ? 'learned' : 'learning' } : card
      ));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Instead of deleting, we update status to 'archived' and reset counters
      await updateDoc(doc(db, 'flashcards', id), {
        status: 'archived',
        correctCount: 0,
        totalCount: 0
      });
      
      // If in practice mode, we might need to adjust the session
      if (isPracticeMode) {
        setSessionCards(prev => prev.filter(card => card.id !== id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${id}`);
    }
  };

  const handleRestore = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    
    try {
      await updateDoc(doc(db, 'flashcards', id), {
        status: card.learned ? 'learned' : 'learning'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${id}`);
    }
  };

  const startPractice = () => {
    if (filteredCards.length > 0) {
      setSessionCards(filteredCards);
      setIsPracticeMode(true);
    }
  };

  const filteredCards = cards.filter((card) => {
    if (activeTab === 'archive') return card.status === 'archived';
    
    // For all other tabs, strictly exclude archived cards
    if (card.status === 'archived') return false;
    
    if (activeTab === 'learning') return !card.learned;
    if (activeTab === 'learned') return card.learned;
    return true; // 'all' tab now excludes archived due to the check above
  });

  const learningCards = cards.filter(c => !c.learned && c.status !== 'archived');
  const learnedCount = cards.filter(c => c.learned && c.status !== 'archived').length;
  const totalActiveCount = cards.filter(c => c.status !== 'archived').length;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPracticeMode) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Play className="w-6 h-6 text-primary" />
              Practice Session
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setIsPracticeMode(false)}>
              <X className="w-6 h-6" />
            </Button>
          </div>
          <PracticeMode 
            cards={sessionCards} 
            onComplete={handlePracticeResult}
            onUpdateCategory={handleUpdateCategory}
            onDelete={handleDelete}
            onClose={() => setIsPracticeMode(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">PractyLearn</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Badge variant="secondary" className="px-3 py-1 hidden sm:flex">
                  {learnedCount} / {totalActiveCount} Learned
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium leading-none">{user.displayName}</p>
                    <p className="text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleLogin} className="rounded-full px-6">
                <LogIn className="w-4 h-4 mr-2" />
                Login with Google
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!user ? (
          <section className="py-20 text-center">
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <UserIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Welcome to PractyLearn</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
              Log in to save your progress, sync words across devices, and start your personalized learning journey.
            </p>
            <Button onClick={handleLogin} size="lg" className="rounded-2xl px-12 h-14 text-lg">
              Get Started
            </Button>
          </section>
        ) : (
          <>
            {/* Input Section */}
            <section className="mb-12 text-center">
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
                Master New Vocabulary
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Add your own words or choose from our AI suggestions below.
              </p>
              <WordInput onAddWord={handleAddWord} />
            </section>

            {/* Suggestions Section */}
            <section className="mb-16">
              <SuggestionsList 
                suggestions={suggestions} 
                onAdd={handleAddWord} 
                isLoading={isLoadingSuggestions}
                onRefresh={fetchSuggestions}
              />
            </section>

            {/* Flashcards Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="learning" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Learning
                  </TabsTrigger>
                  <TabsTrigger value="learned" className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Learned
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Archive
                  </TabsTrigger>
                </TabsList>

                {filteredCards.length > 0 && (
                  <Button 
                    onClick={startPractice}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Start Practice
                  </Button>
                )}
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {filteredCards.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/30">
                    <p className="text-muted-foreground">
                      {activeTab === 'all' 
                        ? "No flashcards yet. Add your first word above!" 
                        : activeTab === 'learning' 
                        ? "All words mastered! Great job!" 
                        : "No words learned yet. Keep practicing!"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {filteredCards.map((card) => (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FlashcardComponent
                            card={card}
                            onToggleLearned={handleToggleLearned}
                            onDelete={handleDelete}
                            onRestore={card.status === 'archived' ? handleRestore : undefined}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
