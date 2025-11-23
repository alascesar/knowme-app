import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { storage } from '../services/storage';
import { CardStatus, ProfileCard } from '../types';
import { DeckCard } from '../components/DeckCard';
import { Button } from '../components/Button';
import { IconArrowLeft, IconCheck, IconX } from '../components/Icons';

export const DeckPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [deck, setDeck] = useState<{ card: ProfileCard, status?: CardStatus }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'UNKNOWN' | 'KNOWN'>('UNKNOWN');

  // Swipe State
  const [dragX, setDragX] = useState(0);
  const [exitX, setExitX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  
  // Refs for gesture tracking
  const startXRef = useRef(0);
  const dragXRef = useRef(0); 
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (groupId && user) {
        const allCards = storage.getDeckForGroup(groupId, user.id);
        setDeck(allCards);
    }
  }, [groupId, user]);

  // Helper to get counts
  const getCount = (type: 'UNKNOWN' | 'KNOWN') => {
      if (type === 'UNKNOWN') return deck.filter(i => !i.status || !i.status.isKnown).length;
      if (type === 'KNOWN') return deck.filter(i => i.status && i.status.isKnown).length;
      return 0;
  };

  // Memoize filtered deck
  const filteredDeck = useMemo(() => deck.filter(item => {
      if (filter === 'UNKNOWN') return !item.status || !item.status.isKnown;
      if (filter === 'KNOWN') return item.status && item.status.isKnown;
      return false;
  }), [deck, filter]);

  const validIndex = (filteredDeck.length > 0 && currentIndex >= filteredDeck.length) 
    ? 0 
    : currentIndex;
    
  const currentCardItem = filteredDeck[validIndex];
  
  // Calculate next card for background rendering (preloading)
  const nextIndex = (validIndex + 1) % filteredDeck.length;
  const showNextCard = filteredDeck.length > 1;
  const nextCardItem = showNextCard ? filteredDeck[nextIndex] : null;

  const resetCardPosition = () => {
      setDragX(0);
      setExitX(null);
      dragXRef.current = 0;
      setIsDragging(false);
      isDraggingRef.current = false;
  };

  const handleNext = () => {
      setIsExpanded(false);
      resetCardPosition();
      if (validIndex < filteredDeck.length - 1) {
          setCurrentIndex(validIndex + 1);
      } else {
          setCurrentIndex(0);
      }
  };

  const handleMarkKnown = () => {
      if (!user || !groupId || !currentCardItem) return;
      
      storage.markAsKnown(user.id, currentCardItem.card.id, groupId, true);
      
      setDeck(prev => prev.map(item => {
          if (item.card.id === currentCardItem.card.id) {
              return { ...item, status: { 
                  id: item.status?.id || 'temp', 
                  viewerUserId: user.id, 
                  profileCardId: item.card.id, 
                  groupId, 
                  isKnown: true, 
                  lastReviewedAt: Date.now() 
                }};
          }
          return item;
      }));

      resetCardPosition();
      
      if (filter === 'UNKNOWN') {
        setIsExpanded(false);
        // Ensure we don't jump past end if list shrinks effectively (though we keep same index usually)
        if (currentIndex >= filteredDeck.length - 1) {
             // If we were at the last item, stay at last valid index or loop
             // For unknown flow, usually we just show the next one which slides into this index slot
             // But since we filtered out the item we just marked known, the array shrinks.
             // We should stay at 'currentIndex' but clamp it.
             setCurrentIndex(Math.max(0, filteredDeck.length - 2)); 
             // Note: filteredDeck is calculated from 'deck' state. 
             // On next render filteredDeck length will decrease by 1.
        }
      } else {
        handleNext();
      }
  };

  const handleFilterChange = (newFilter: 'UNKNOWN' | 'KNOWN') => {
      setFilter(newFilter);
      setCurrentIndex(0);
      setIsExpanded(false);
      resetCardPosition();
  };

  const handleResetKnowledge = () => {
      if (!user || !groupId) return;
      storage.resetGroupKnowledge(user.id, groupId);
      setDeck(storage.getDeckForGroup(groupId, user.id));
      setFilter('UNKNOWN');
      setCurrentIndex(0);
      resetCardPosition();
  };

  // Swipe Completion Logic with Animation
  const completeSwipe = (direction: 'left' | 'right') => {
      setExitX(direction === 'right' ? 1000 : -1000);
      setIsDragging(false);
      isDraggingRef.current = false;
      
      setTimeout(() => {
          const { handleMarkKnown, handleNext, filter } = handlersRef.current;
          
          if (direction === 'right') {
              if (filter === 'UNKNOWN') {
                  handleMarkKnown();
              } else {
                  handleNext();
              }
          } else {
              handleNext();
          }
      }, 200);
  };

  const handlersRef = useRef({ handleNext, handleMarkKnown, resetCardPosition, filter });
  useEffect(() => { handlersRef.current = { handleNext, handleMarkKnown, resetCardPosition, filter }; });

  const handleStart = (clientX: number) => {
      if (exitX !== null) return;
      setIsDragging(true);
      isDraggingRef.current = true;
      setWasDragged(false);
      startXRef.current = clientX;
      dragXRef.current = 0;
  };

  useEffect(() => {
      if (!isDragging) return;

      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
          if (!isDraggingRef.current) return;
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          const diff = clientX - startXRef.current;
          if (Math.abs(diff) > 5) setWasDragged(true);
          setDragX(diff);
          dragXRef.current = diff;
      };

      const handleGlobalEnd = () => {
          if (!isDraggingRef.current) return;
          const threshold = 75; 
          const finalDrag = dragXRef.current;
          if (finalDrag > threshold) completeSwipe('right');
          else if (finalDrag < -threshold) completeSwipe('left');
          else {
              setDragX(0);
              dragXRef.current = 0;
              setIsDragging(false);
              isDraggingRef.current = false;
          }
      };

      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove);
      window.addEventListener('touchend', handleGlobalEnd);

      return () => {
          window.removeEventListener('mousemove', handleGlobalMove);
          window.removeEventListener('mouseup', handleGlobalEnd);
          window.removeEventListener('touchmove', handleGlobalMove);
          window.removeEventListener('touchend', handleGlobalEnd);
      };
  }, [isDragging]); 

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);

  const toggleExpandWithCheck = () => {
      if (!wasDragged && !isDragging && exitX === null) {
          setIsExpanded(!isExpanded);
      }
  };

  if (!user) return null;

  const currentX = exitX !== null ? exitX : dragX;
  const rotateDeg = (currentX / 25); 
  const opacity = exitX !== null ? 0 : (1 - Math.min(Math.abs(currentX) / 600, 0.1));
  
  const cardStyle: React.CSSProperties = {
      transform: `translateX(${currentX}px) rotate(${rotateDeg}deg)`,
      opacity: opacity,
      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s', 
      cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div className="h-screen fixed inset-0 w-full flex flex-col bg-slate-50 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-white">
       <header className="bg-white/80 backdrop-blur-md px-4 py-3 shadow-sm flex items-center justify-between shrink-0 z-20 border-b border-slate-100">
         <Link to={`/group/${groupId}`} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><IconArrowLeft className="w-6 h-6"/></Link>
         <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            {(['UNKNOWN', 'KNOWN'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {f.charAt(0) + f.slice(1).toLowerCase()} ({getCount(f)})
                </button>
            ))}
         </div>
         <div className="w-10" /> 
       </header>

       <div className="flex-1 flex flex-col items-center justify-center p-4 relative select-none">
            {filteredDeck.length > 0 && currentCardItem ? (
                <div className="relative w-full max-w-md flex flex-col items-center">
                     
                     {/* Background Card (Next) - Rendered behind for preloading/smooth transition */}
                     {showNextCard && nextCardItem && (
                        <div 
                            className="absolute top-0 w-full z-0 transition-all duration-300 ease-out pointer-events-none"
                            style={{ 
                                transform: 'scale(0.92) translateY(24px)', 
                                opacity: 0.5,
                            }}
                        >
                            <DeckCard 
                                key={`bg-${nextCardItem.card.id}`}
                                profile={nextCardItem.card}
                                isExpanded={false} // Always collapsed in background
                                onToggleExpand={() => {}}
                            />
                        </div>
                     )}

                     {/* Foreground Card (Current) */}
                     <div 
                        className="w-full relative z-10"
                        style={{ ...cardStyle, touchAction: 'none' }} 
                        onTouchStart={onTouchStart}
                        onMouseDown={onMouseDown}
                     >
                         {/* Overlays */}
                         
                         {/* KNOWN (Swipe Right) */}
                         <div 
                            className="absolute top-8 left-8 z-50 text-green-500 font-bold text-4xl tracking-widest transform -rotate-12 pointer-events-none drop-shadow-sm border-4 border-green-500/50 rounded-xl px-4 py-1 bg-white/20 backdrop-blur-sm"
                            style={{ opacity: dragX > 0 ? Math.min(dragX / 100, 0.9) : 0 }}
                         >
                            KNOWN
                         </div>

                         {/* NEXT (Swipe Left) */}
                         <div 
                            className="absolute top-8 right-8 z-50 text-pink-500 font-bold text-4xl tracking-widest transform rotate-12 pointer-events-none drop-shadow-sm border-4 border-pink-500/50 rounded-xl px-4 py-1 bg-white/20 backdrop-blur-sm"
                            style={{ opacity: dragX < 0 ? Math.min(Math.abs(dragX) / 100, 0.9) : 0 }}
                         >
                            NEXT
                         </div>

                        <DeckCard 
                            key={`fg-${currentCardItem.card.id}`} // Unique key forces remount to prevent stale visuals
                            profile={currentCardItem.card}
                            isExpanded={isExpanded}
                            onToggleExpand={toggleExpandWithCheck}
                        />
                     </div>
                </div>
            ) : (
                <div className="text-center max-w-xs animate-fade-in">
                    <div className="text-7xl mb-6 filter drop-shadow-lg">🎉</div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">All Caught Up!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        {filter === 'UNKNOWN' ? "You've learned everyone in this list." : "No cards in this list yet."}
                    </p>
                    
                    {filter === 'UNKNOWN' && getCount('KNOWN') > 0 && (
                        <Button onClick={handleResetKnowledge} variant="secondary" className="shadow-xl shadow-pink-500/20">
                            Reset & Review All
                        </Button>
                    )}
                </div>
            )}
       </div>

       <div className="shrink-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-20 h-32 flex items-center justify-center">
            {filteredDeck.length > 0 ? (
                <div className="flex flex-col items-center w-full">
                     <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">
                          {validIndex + 1} / {filteredDeck.length}
                     </div>

                     {filter === 'UNKNOWN' ? (
                         <div className="flex items-center justify-center gap-10 w-full max-w-md">
                            <button 
                              type="button"
                              onClick={() => completeSwipe('left')}
                              className="w-16 h-16 rounded-full bg-white text-slate-400 border border-slate-100 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 hover:scale-105 transition-all shadow-lg shadow-slate-200"
                              title="Skip"
                            >
                                <IconX className="w-8 h-8" />
                            </button>
          
                            <button 
                              type="button"
                              onClick={() => completeSwipe('right')}
                              className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-indigo-500/30"
                              title="I Know Them"
                            >
                                <IconCheck className="w-8 h-8" />
                            </button>
                         </div>
                     ) : (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => completeSwipe('left')}
                            className="px-8 py-3"
                        >
                            Next Card
                        </Button>
                     )}
                </div>
            ) : (
                <div className="w-full flex justify-center">
                    <Link to={`/group/${groupId}`}>
                        <Button type="button" variant="outline">Back to Group</Button>
                    </Link>
                </div>
            )}
       </div>
    </div>
  );
};