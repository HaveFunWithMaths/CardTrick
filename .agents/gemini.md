# Project Context: The Mind Reader (Fitch Cheney Protocol)

## Overview
We are building a web-based magic trick app where the computer acts as the Magician's Assistant. The user selects 5 cards, and the system arranges 4 of them to encode the identity of the 5th (hidden) card.

## The Algorithm (Strict Logic)

### 1. Card Values & Ranking
- **Rank Values:** A=1, 2=2, ..., 10=10, J=11, Q=12, K=13.
- **Suit Priority (Tie-Breaker):** Clubs (Lowest) < Diamonds < Hearts < Spades (Highest).
- **Card Comparison:** Card A < Card B if A.value < B.value. If A.value == B.value, compare Suit Priority.

### 2. Selection Logic (The Assistant's Brain)
Given 5 random cards:
1.  **Find the Suit:** Identify the suit with $\ge 2$ cards. (Pigeonhole principle guarantees this).
2.  **Select the Pair:** If multiple suits have pairs, pick the first valid pair found. Let the cards be $C_1$ and $C_2$.
3.  **Calculate Distance:**
    - Distance is clockwise on a 13-hour clock.
    - Calculate $d = (C_2.value - C_1.value + 13) \pmod{13}$.
    - If $d \le 6$, then $C_1$ is the **Table Card** and $C_2$ is the **Hidden Card**. Target number is $d$.
    - If $d > 6$, then swap them. $C_2$ is the **Table Card**, $C_1$ is the **Hidden Card**. Target number is $(C_1.value - C_2.value + 13) \pmod{13}$.
4.  **Encode the Target Number (1-6):**
    - Sort the remaining 3 cards using the **Card Comparison** logic into Small (S), Medium (M), Large (L).
    - Arrange them to encode the target number:
        - 1: S, M, L
        - 2: S, L, M
        - 3: M, S, L
        - 4: M, L, S
        - 5: L, S, M
        - 6: L, M, S

## User Flow
1.  **Select Phase:** User picks 5 cards from a grid. Selected cards dim out.
2.  **Display Phase:** Show the 5 selected cards clearly.
3.  **Magic Phase:** User clicks "Arrange". The app:
    - Moves the "Table Card" to position 1.
    - Moves the 3 code cards to positions 2, 3, 4 based on the code.
    - Places the "Hidden Card" face down in position 5.
4.  **Reveal:** User clicks "Reveal". Card 5 flips over.