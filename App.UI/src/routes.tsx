import { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NumberGuessPage from "./games/number-guess/NumberGuessPage";
import TicTacToePage from "./games/tic-tac-toe/TicTacToePage";
import SudokuPage from "./games/sudoku/SudokuPage";
import NotFoundPage from "./pages/NotFoundPage";

export const routes: RouteObject[] = [
  { path: "/", element: <HomePage /> },
  { path: "/games/number-guess", element: <NumberGuessPage /> },
  { path: "/games/tic-tac-toe", element: <TicTacToePage /> },
  { path: "/games/sudoku", element: <SudokuPage /> },
  { path: "*", element: <NotFoundPage /> },
];
