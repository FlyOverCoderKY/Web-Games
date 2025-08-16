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
];
