
// Mock types and logic from App.tsx
type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

interface Card {
    id: string;
    suit: Suit;
    value: CardValue;
    displayValue: string;
}

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
const SUIT_ORDER = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };

const getCardRank = (c: Card) => (c.value - 1) * 4 + SUIT_ORDER[c.suit];

function getFitchCheneyArrangement(hand: Card[]) {
    const suitCounts: Record<Suit, Card[]> = { clubs: [], diamonds: [], hearts: [], spades: [] };
    hand.forEach(c => suitCounts[c.suit].push(c));

    let sameSuitPair: Card[] = [];
    for (const suit of SUITS) {
        if (suitCounts[suit].length >= 2) {
            sameSuitPair = suitCounts[suit].slice(0, 2);
            break;
        }
    }

    const [c1, c2] = sameSuitPair;
    const v1 = c1.value;
    const v2 = c2.value;
    const dist1to2 = (v2 - v1 + 13) % 13;
    const dist2to1 = (v1 - v2 + 13) % 13;

    let indicator: Card, hidden: Card, offset: number;

    if (dist1to2 > 0 && dist1to2 <= 6) {
        indicator = c1;
        hidden = c2;
        offset = dist1to2;
    } else {
        indicator = c2;
        hidden = c1;
        offset = dist2to1;
    }

    const remaining = hand.filter(c => c.id !== indicator.id && c.id !== hidden.id);
    const sortedRemaining = [...remaining].sort((a, b) => getCardRank(a) - getCardRank(b));
    const [low, mid, high] = sortedRemaining;

    let codeCards: Card[] = [];
    switch (offset) {
        case 1: codeCards = [low, mid, high]; break;
        case 2: codeCards = [low, high, mid]; break;
        case 3: codeCards = [mid, low, high]; break;
        case 4: codeCards = [mid, high, low]; break;
        case 5: codeCards = [high, low, mid]; break;
        case 6: codeCards = [high, mid, low]; break;
        default: codeCards = [low, mid, high];
    }

    return { indicator, hidden, codeCards };
}

function decode(indicator: Card, codeCards: Card[]): Card {
    // Sort codeCards to determine L, M, H
    const sorted = [...codeCards].sort((a, b) => getCardRank(a) - getCardRank(b));
    const [L, M, H] = sorted;
    const [c1, c2, c3] = codeCards;

    // Determine Permutation
    let offset = 0;
    if (c1.id === L.id && c2.id === M.id && c3.id === H.id) offset = 1; // LMH
    else if (c1.id === L.id && c2.id === H.id && c3.id === M.id) offset = 2; // LHM
    else if (c1.id === M.id && c2.id === L.id && c3.id === H.id) offset = 3; // MLH
    else if (c1.id === M.id && c2.id === H.id && c3.id === L.id) offset = 4; // MHL
    else if (c1.id === H.id && c2.id === L.id && c3.id === M.id) offset = 5; // HLM
    else if (c1.id === H.id && c2.id === M.id && c3.id === L.id) offset = 6; // HML

    const hiddenValue = (indicator.value + offset - 1) % 13 + 1;
    return { ...indicator, value: hiddenValue as CardValue, id: 'predicted' };
}

// TEST RUN
console.log("Running Logic Verification...");

// Helper to generate a random card
let idCounter = 0;
const randomCard = (): Card => {
    const suit = SUITS[Math.floor(Math.random() * 4)];
    const value = Math.floor(Math.random() * 13) + 1 as CardValue;
    return { id: `${suit}-${value}-${idCounter++}`, suit, value, displayValue: `${value}` };
};

// Generate random hand of 5 unique cards
const generateHand = (): Card[] => {
    const hand: Card[] = [];
    while (hand.length < 5) {
        const c = randomCard();
        if (!hand.find(x => x.suit === c.suit && x.value === c.value)) {
            hand.push(c);
        }
    }
    return hand;
}

let passed = 0;
const TRIALS = 100;

for (let i = 0; i < TRIALS; i++) {
    const hand = generateHand();
    try {
        const { indicator, hidden, codeCards } = getFitchCheneyArrangement(hand);
        const predicted = decode(indicator, codeCards);

        if (predicted.value === hidden.value && predicted.suit === hidden.suit) {
            passed++;
        } else {
            console.error("Failed:", {
                indicator: `${indicator.value} ${indicator.suit}`,
                hidden: `${hidden.value} ${hidden.suit}`,
                code: codeCards.map(c => `${c.value} ${c.suit}`),
                predicted: `${predicted.value} ${predicted.suit}`
            });
        }
    } catch (e) {
        console.error("Error in trial", i, e);
    }
}

console.log(`Passed ${passed}/${TRIALS} tests.`);
if (passed === TRIALS) process.exit(0);
else process.exit(1);
