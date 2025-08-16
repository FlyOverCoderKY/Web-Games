import { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NumberGuessPage from "./games/number-guess/NumberGuessPage";
import TicTacToePage from "./games/tic-tac-toe/TicTacToePage";
import SudokuPage from "./games/sudoku/SudokuPage";
import CheckersPage from "./games/checkers/CheckersPage";
import ChessPage from "./games/chess/ChessPage";
import NotFoundPage from "./pages/NotFoundPage";
import GoPage from "./games/go/GoPage";

export const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/games/number-guess", element: <NumberGuessPage /> },
  { path: "/games/tic-tac-toe", element: <TicTacToePage /> },
  { path: "/games/chess", element: <ChessPage /> },
  { path: "/games/sudoku", element: <SudokuPage /> },
  { path: "/games/checkers", element: <CheckersPage /> },
  { path: "/games/go", element: <GoPage /> },
  { path: "*", element: <NotFoundPage /> },
];
