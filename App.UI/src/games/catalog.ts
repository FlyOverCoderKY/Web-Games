export type GameDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type GameStatus = "In progress" | "Playable" | "Planned";

export interface GameCatalogItem {
  id: string;
  title: string;
  description: string;
  difficulty: GameDifficulty;
  route: string;
  status: GameStatus;
  icon?: string;
}

export const gamesCatalog: GameCatalogItem[] = [
  {
    id: "number-guess",
    title: "Number Guess",
    description:
      "Guess the secret number within a range based on difficulty. Get hints after each guess and “Warmer/Colder” guidance from the second guess.",
    difficulty: "Beginner",
    route: "/games/number-guess",
    status: "In progress",
    icon: "/number-guess.svg",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description:
      "Classic 3×3 Tic-Tac-Toe vs. a heuristic bot. Choose who starts, pick X or O, and use undo/redo to revisit moves.",
    difficulty: "Intermediate",
    route: "/games/tic-tac-toe",
    status: "In progress",
    icon: "/tic-tac-toe.svg",
  },
  {
    id: "chess",
    title: "Chess",
    description:
      "Classic chess vs. an AI with Easy/Medium/Hard difficulties. Play as White or Black, undo/redo moves.",
    difficulty: "Advanced",
    route: "/games/chess",
    status: "In progress",
    icon: "/chess.svg",
  },
  {
    id: "sudoku",
    title: "Sudoku",
    description:
      "Generate and solve unique-solution Sudoku puzzles with difficulty settings and optional seeds.",
    difficulty: "Advanced",
    route: "/games/sudoku",
    status: "In progress",
    icon: "/sudoku.svg",
  },
  {
    id: "checkers",
    title: "Checkers",
    description:
      "Classic 8×8 checkers. Click a piece to see legal moves; click a highlighted square to move. Kings are crowned on the back rank.",
    difficulty: "Intermediate",
    route: "/games/checkers",
    status: "In progress",
    icon: "/checkers.svg",
  },
];
