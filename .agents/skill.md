# Skills & Capabilities

## Core Competencies
- **Frontend Architecture:** React (Vite ecosystem), TypeScript, Component Composition.
- **State Management:** React Hooks (useState, useEffect, useMemo) for managing the "Deck" and "Hand" states.
- **UI/UX Design:** Responsive layouts (Mobile-first), Touch interactions, visual hierarchy.
- **Animation:** Framer Motion for layout transitions (layoutId), 3D transforms (perspective, rotateY) for card flips.

## Domain Specific Knowledge (Magic Logic)
- **Combinatorics:** Permutations of 3 items (3! = 6).
- **Modular Arithmetic:** Modulo 13 arithmetic for the "Clock" logic (Aces are 1, Kings are 13).
- **The Pigeonhole Principle:** Understanding how to guarantee a suit match among 5 cards.
- **Lexicographical Ordering:** Sorting logic for cards based on Value first, then Suit (Clubs < Diamonds < Hearts < Spades) to break ties deterministically.

## Algorithms
- **Fitch Cheney Algorithm:**
  1. Identify the repeated suit.
  2. Calculate the circular distance (clock) between the two cards of that suit.
  3. Select the "Base" card and the "Hidden" card such that distance <= 6.
  4. Encode the distance (1-6) using the permutation of the remaining 3 cards (S/M/L).