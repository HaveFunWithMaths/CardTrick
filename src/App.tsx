import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Club, Diamond, Heart, Spade, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

interface Card {
  id: string;
  suit: Suit;
  value: CardValue;
  displayValue: string;
}

// --- CONSTANTS ---
const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
const SUIT_ICONS = {
  spades: Spade,
  hearts: Heart,
  clubs: Club,
  diamonds: Diamond,
};
const SUIT_COLORS = {
  spades: 'text-black',
  hearts: 'text-red-500',
  clubs: 'text-black',
  diamonds: 'text-red-400',
};

// Tie-breaker order: Clubs < Diamonds < Hearts < Spades
const SUIT_ORDER = {
  clubs: 0,
  diamonds: 1,
  hearts: 2,
  spades: 3,
};

// --- LOGIC: Fitch Cheney ---

// Strict comparison value for sorting: Value primary, Suit secondary (for tie-breaking)
// Actually, strict lexicographical sort usually puts Value first.
// But we need a strict constraint. Let's use (Value-1)*4 + SuitOrder.
const getCardRank = (c: Card) => (c.value - 1) * 4 + SUIT_ORDER[c.suit];

function getFitchCheneyArrangement(hand: Card[]) {
  if (hand.length !== 5) throw new Error("Need exactly 5 cards");

  // 1. Find the suit with at least 2 cards (Pigeonhole)
  const suitCounts: Record<Suit, Card[]> = { clubs: [], diamonds: [], hearts: [], spades: [] };
  hand.forEach(c => suitCounts[c.suit].push(c));

  let sameSuitPair: Card[] = [];
  for (const suit of SUITS) {
    if (suitCounts[suit].length >= 2) {
      sameSuitPair = suitCounts[suit].slice(0, 2); // Take first two found
      break;
    }
  }

  // 2. Determine Hidden vs Indicator
  const [c1, c2] = sameSuitPair;
  // Calculate distance on 13-clock
  // dist(a, b) = (b - a + 13) % 13
  const v1 = c1.value;
  const v2 = c2.value;
  const dist1to2 = (v2 - v1 + 13) % 13;
  const dist2to1 = (v1 - v2 + 13) % 13;

  let indicator: Card, hidden: Card, offset: number;

  // We need the distance to be <= 6
  if (dist1to2 > 0 && dist1to2 <= 6) {
    indicator = c1;
    hidden = c2;
    offset = dist1to2;
  } else {
    indicator = c2;
    hidden = c1;
    offset = dist2to1;
  }

  // 3. Identify the remaining 3 cards 
  const remaining = hand.filter(c => c.id !== indicator.id && c.id !== hidden.id);
  // Sort them strictly to define Small, Medium, Large
  const sortedRemaining = [...remaining].sort((a, b) => getCardRank(a) - getCardRank(b));
  const [low, mid, high] = sortedRemaining;

  // 4. Permute based on offset (1-6)
  let codeCards: Card[] = [];
  switch (offset) {
    case 1: codeCards = [low, mid, high]; break;
    case 2: codeCards = [low, high, mid]; break;
    case 3: codeCards = [mid, low, high]; break;
    case 4: codeCards = [mid, high, low]; break;
    case 5: codeCards = [high, low, mid]; break;
    case 6: codeCards = [high, mid, low]; break;
    default: codeCards = [low, mid, high]; // Should not happen
  }

  return { indicator, hidden, codeCards };
}


// --- COMPONENTS ---

const CardView = React.memo(({ card, onClick, isSelected, isFaceDown, size = 'md', layoutId }: {
  card?: Card;
  onClick?: () => void;
  isSelected?: boolean;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layoutId?: string;
}) => {
  const finalLayoutId = layoutId || (card?.id ? `card-${card.id}` : undefined);

  if (isFaceDown) {
    return (
      <motion.div
        layoutId={finalLayoutId}
        className={cn(
          "relative rounded-xl border-2 border-indigo-900/50 bg-slate-900 shadow-xl overflow-hidden cursor-pointer",
          size === 'sm' ? "w-12 h-16" : size === 'md' ? "w-16 h-24" : "w-24 h-36"
        )}
        onClick={onClick}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-purple-900 to-black" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-indigo-400 opacity-50" size={size === 'sm' ? 16 : 24} />
        </div>
      </motion.div>
    );
  }

  if (!card) return null;

  const Icon = SUIT_ICONS[card.suit];
  const colorClass = SUIT_COLORS[card.suit];

  return (
    <motion.div
      layoutId={finalLayoutId}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative rounded-xl bg-slate-100 shadow-md flex flex-col items-center justify-center select-none cursor-pointer border transition-colors duration-200",
        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/50" : "border-slate-300",
        size === 'sm' ? "w-12 h-16 text-xs" : size === 'md' ? "w-16 h-24 text-base" : "w-32 h-48 text-2xl"
      )}
    >
      <div className={cn("absolute top-1 left-1 font-bold", colorClass, size === 'lg' && "top-3 left-3")}>{card.displayValue}</div>
      <Icon className={cn(colorClass, size === 'sm' ? "w-4 h-4" : size === 'md' ? "w-6 h-6" : "w-12 h-12")} />
      <div className={cn("absolute bottom-1 right-1 font-bold rotate-180", colorClass, size === 'lg' && "bottom-3 right-3")}>{card.displayValue}</div>
    </motion.div>
  );
});

// --- MAIN APP ---

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'selection' | 'stage' | 'reveal'>('selection');
  const [activeSuit, setActiveSuit] = useState<Suit>('spades');
  const [solution, setSolution] = useState<{ indicator: Card, hidden: Card, codeCards: Card[] } | null>(null);
  const [isHiddenRevealed, setIsHiddenRevealed] = useState(false);

  // Initialize Deck
  useEffect(() => {
    const newDeck: Card[] = [];
    SUITS.forEach(suit => {
      for (let v = 1; v <= 13; v++) {
        let displayValue = `${v}`;
        if (v === 1) displayValue = 'A';
        if (v === 11) displayValue = 'J';
        if (v === 12) displayValue = 'Q';
        if (v === 13) displayValue = 'K';

        newDeck.push({
          id: `${suit}-${v}`,
          suit,
          value: v as CardValue,
          displayValue,
        });
      }
    });
    setDeck(newDeck);
  }, []);

  const handleCardClick = (card: Card) => {
    if (phase !== 'selection') return;

    if (hand.find(h => h.id === card.id)) {
      setHand(h => h.filter(c => c.id !== card.id));
    } else {
      if (hand.length < 5) {
        setHand(h => [...h, card]);
      }
    }
  };

  const performMagic = () => {
    if (hand.length !== 5) return;
    const sol = getFitchCheneyArrangement(hand);
    setSolution(sol);
    setPhase('stage');
  };

  const reset = () => {
    setHand([]);
    setPhase('selection');
    setSolution(null);
    setIsHiddenRevealed(false);
  };

  // Filtered Deck for Display
  const visibleDeck = useMemo(() => {
    return deck.filter(c => c.suit === activeSuit);
  }, [deck, activeSuit]);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans selection:bg-indigo-500/30">

      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Fitch Cheney Decoder
        </h1>
        {phase !== 'selection' && (
          <button onClick={reset} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RefreshCw size={20} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        <AnimatePresence mode="wait">

          {/* PHASE 1: SELECTION */}
          {phase === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col h-full"
            >

              {/* Hand Preview (Sticky Top) */}
              <div className="p-4 bg-black/40 border-b border-white/5 shadow-2xl z-40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-400">Your Hand ({hand.length}/5)</span>
                  {hand.length === 5 && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={performMagic}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    >
                      PERFORM MAGIC
                    </motion.button>
                  )}
                </div>
                <div className="h-24 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {hand.length === 0 && (
                    <span className="text-slate-600 text-sm italic w-full text-center">Select 5 cards to begin...</span>
                  )}
                  <AnimatePresence>
                    {hand.map(card => (
                      <CardView
                        key={card.id}
                        card={card}
                        onClick={() => handleCardClick(card)}
                        size="md"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Suit Filter Tabs */}
              <div className="grid grid-cols-4 border-b border-white/10 bg-black/20">
                {SUITS.map(suit => {
                  const Icon = SUIT_ICONS[suit];
                  const isActive = activeSuit === suit;
                  return (
                    <button
                      key={suit}
                      onClick={() => setActiveSuit(suit)}
                      className={cn(
                        "flex justify-center items-center py-4 relative transition-all",
                        isActive ? "bg-white/5 active-tab-glow" : "hover:bg-white/5 opacity-50 hover:opacity-100"
                      )}
                    >
                      <Icon className={cn("w-6 h-6 transition-transform", isActive ? "scale-125 text-white" : SUIT_COLORS[suit])} />
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Deck Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-3 place-items-center pb-20">
                  <AnimatePresence mode="popLayout">
                    {visibleDeck.map((card, i) => {
                      const isInHand = !!hand.find(c => c.id === card.id);
                      return (
                        <motion.div
                          key={card.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isInHand ? 0.3 : 1, scale: isInHand ? 0.9 : 1 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <CardView
                            card={card}
                            isSelected={isInHand}
                            onClick={() => handleCardClick(card)}
                            size="md" // Slightly smaller on grid
                            layoutId={`grid-${card.id}`}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* PHASE 2: STAGE & REVEAL */}
          {phase === 'stage' && solution && (
            <motion.div
              key="stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 bg-gradient-to-b from-background to-black"
            >
              <div className="w-full max-w-md space-y-8">

                {/* 1. The Sequence (Indicator + 3 Code Cards) */}
                <div className="flex flex-col items-center w-full">
                  <h2 className="text-indigo-300 text-sm font-bold tracking-widest uppercase mb-6 opacity-80">The Sequence</h2>
                  <div className="flex items-center justify-center gap-3 sm:gap-6">
                    {/* Indicator */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <CardView card={solution.indicator} size="md" />
                    </motion.div>



                    {/* Code Cards */}
                    {solution.codeCards.map((card, idx) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.2 }}
                      >
                        <CardView card={card} size="md" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 3. The Reveal (Hidden Card) */}
                <div className="flex flex-col items-center relative pt-8">
                  <h2 className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-4 opacity-80">The Prediction</h2>

                  <div className="relative w-32 h-48 cursor-pointer group perspective-1000" onClick={() => setIsHiddenRevealed(true)}>
                    <motion.div
                      animate={{ rotateY: isHiddenRevealed ? 180 : 0 }}
                      transition={{ duration: 0.8, type: "spring" }}
                      className="w-full h-full relative preserve-3d"
                    >
                      {/* Front (Face Down) */}
                      <div className="absolute inset-0 backface-hidden">
                        <CardView isFaceDown size="lg" />
                      </div>

                      {/* Back (Revealed) */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180">
                        <CardView card={solution.hidden} size="lg" />
                      </div>
                    </motion.div>
                  </div>

                  {!isHiddenRevealed && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5 }}
                      onClick={() => setIsHiddenRevealed(true)}
                      className="mt-8 flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Eye size={18} />
                      REVEAL
                    </motion.button>
                  )}
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
