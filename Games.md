## Classic Games – Rebuild Plan

Below are the gameplay notes and quick rules for the web versions implemented in `App.UI`.

### Web – Number Guess
- Pick a difficulty; a secret number is chosen within the range.
- Enter integer guesses; you’ll get feedback: too high/low and (from second guess) warmer/colder.
- Lower score is better; best score is tracked within the session.

### Web – Tic-Tac-Toe
- 3×3 board. Human vs. heuristic bot.
- Configure who starts and your mark (X/O). You can swap marks anytime.
- Undo/redo moves within the current session.

This document captures the observable features and behavior of the two console games in this repository so an AI agent can recreate equivalent games in a new project.

- Beginner: NumberGuess (single-player number guessing game)
- Intermediate: Tic-Tac-Toe (human vs. bot with undo/redo)

Where function, class, and file names are mentioned, they are the original names to clarify intent; a faithful rebuild should replicate the behavior, not necessarily the exact names.

## Beginner — NumberGuess

### Goal and UX
- **Objective**: Player guesses a secret integer within a difficulty-dependent range.
- **Guidance**: After each guess, the game tells the player if the guess is too low/high and, from the second guess onward, whether they are getting “Warmer!” or “Colder!”.
- **Scoring**: Fewer attempts produce a better score. Scores are comparable across rounds and difficulty via a small difficulty bonus.
- **Replay**: On success, player is prompted to play again; best score is tracked across rounds in a single process session.

### Command-line interface
- **Executable**: `NumberGuess`
- **Usage line**: `Usage: NumberGuess [--difficulty Easy|Normal|Hard] [--seed <int>]`
- **Options**:
  - `--difficulty Easy|Normal|Hard` (case-insensitive). Default: `Normal`.
  - `--seed <int>` sets the RNG seed for deterministic runs (useful for tests/demo).
  - `--help` or `-h` prints usage and exits 0.
- **Unknown/malformed args**: Print an error and usage, then exit 0 (non-fatal behavior in original).

### Difficulty and range mapping
- **Easy**: inclusive range 1–50
- **Normal**: inclusive range 1–100 (default)
- **Hard**: inclusive range 1–500

### Game state (per process)
- Difficulty setting
- RNG instance seeded by `--seed` if provided; otherwise time-based
- Current round state: secret number, attempt count, previous-distance for warmer/colder
- Best score across rounds in this process (initialized to `int.MaxValue`)

### Gameplay loop
1. On start: print “I’m thinking of a number between [lower] and [upper]. Type 'quit' to exit.”
2. Prompt: `Enter your guess [lower-upper]: `
3. Input handling (trimmed string):
   - `null` (EOF): print “Goodbye!” and exit loop
   - Empty: print “Please enter a number.” and re-prompt
   - `quit` (any case): print “Goodbye!” and exit loop
   - Non-integer: print “Invalid input. Please enter a valid integer.” and re-prompt
   - Out of range: print `Out of range. Please enter a number between [lower] and [upper].` and re-prompt
4. On a valid in-range integer guess:
   - Increment attempt count.
   - If guess equals secret:
     - Print `Correct! You got it in N attempt(s).`
     - Compute score using the scoring formula below and print either:
       - New best: `New best score: S (lower is better)` and update best
       - Non-best: `Score: S. Best: B (lower is better)`
     - Prompt `Play again? (y/n): `; if reply starts with `y`/`Y`, start a new round (new secret, attempts reset, previous-distance reset); otherwise print “Thanks for playing!” and exit.
   - If guess does not equal secret: print a hint per “Hints and trend” below and continue loop.

### Hints and trend
- On the first incorrect guess: direction only
  - If guess < secret: `Too low. Try higher.`
  - If guess > secret: `Too high. Try lower.`
- On subsequent incorrect guesses: prepend a trend token based on absolute distance vs. previous guess
  - Getting closer: `Warmer! Too low|high. …`
  - Getting farther: `Colder! Too low|high. …`
  - Same distance: direction only (no trend token)

### Scoring
- Intent: Attempt count dominates the score; harder ranges receive a small bonus so scores are roughly comparable across difficulty while preserving attempt ordering.
- Formula with range size R and attempts A (both clamped to at least 1):
  - `difficultyBonus = floor(log2(R))`
  - `score = max(1, A * 100 - difficultyBonus)`
- “Lower is better”. Best score persists only for the lifetime of the process.

### Process and I/O design
- Console I/O is routed through a `Cli.Run(args, TextReader, TextWriter)` entry-point to facilitate testing by injecting streams.
- Main program calls `Cli.Run(args, Console.In, Console.Out)` and returns its exit code (0 in all normal paths).

### Edge cases to preserve
- Case-insensitive parsing for `--difficulty` values and the `quit` command.
- `--difficulty` accepts `--difficulty=Value` or `--difficulty Value` forms (same for `--seed`).
- Missing values for these options print a specific “Missing value for …” message, then usage, then exit 0.
- Best score messaging differs depending on whether a new best was achieved.

### Minimal domain model summary
- `Difficulty` enum: `Easy`, `Normal`, `Hard`.
- Game session holds: difficulty, rng, lower/upper bounds, secret, attempts, running flag, best score, previous-distance.

## Intermediate — Tic-Tac-Toe (Human vs Bot)

### Goal and UX
- **Objective**: Human plays standard 3×3 Tic-Tac-Toe vs. a rule-based bot.
- **Board view**: Renders a 3×3 grid with row/column headers (1–3) and ASCII separators.
- **Input prompt**: `Enter row,col (1-3,1-3), 'u' undo, 'r' redo, or 'q' to quit:`
- **Undo/Redo**: Unlimited within session via `u`/`r` using immutable board snapshots.
- **Result messaging**: “You win!”, “Bot wins!”, or “Draw.”

### Command-line interface
- **Executable**: `tic-tac-toe`
- **Usage text** (exact text is fine to approximate in spirit):
  - `Usage: tic-tac-toe [--start {human|bot}] [--human-mark {X|O}] [--swap-marks] [--help]`
  - Options:
    - `-s, --start <human|bot>`: who starts (default: human)
    - `-m, --human-mark <X|O>`: human’s mark (default: X)
    - `-w, --swap-marks`: toggle X/O from the default (ignored if `--human-mark` is specified)
    - `-h, --help`: show help and exit 0
- **Parsing**:
  - Returns options object on success, or an error string on failure.
  - On parse failure: print error + usage to stderr and exit 1.
  - On `--help`: print usage to stdout and exit 0.
- **Defaults**: start = human; human mark = X; bot mark is the opposite; starting mark is player who starts.
- **Swap precedence**: If both `--swap-marks` and `--human-mark` are present, explicit `--human-mark` wins.

### Core domain types
- `Cell` enum: `Empty`, `X`, `O`.
- `GameStatus` enum: `InProgress`, `XWins`, `OWins`, `Draw`.
- `Move` record: `(Row, Col, Player)` with 0-based indices and `Player` being `X` or `O`.
- `Board` class (immutable updates):
  - Data: 3×3 `Cell` array, `CurrentPlayer` property.
  - Constructors: default starts with `X`; overload accepting a starting player (`X` or `O`), rejects `Empty`.
  - `Apply(Move)` returns a new `Board` with the move applied; validations:
    - Row/Col in [0..2]
    - `move.Player` must equal `CurrentPlayer`
    - Target cell must be `Empty`
    - New board flips `CurrentPlayer` to the opposite mark
  - `GetStatus()` checks rows, columns, both diagonals for three-in-a-row; returns `Draw` if no empties and nobody won; otherwise `InProgress`.
  - `GetEmptyCells()` yields coordinates of empty cells.
- `IBotStrategy` interface: `Move ChooseMove(Board board)` selecting a legal move for the current player.
- `HeuristicBot` implementation (rule-based):
  1) If a winning move exists for the current player, take it.
  2) If the opponent could win next turn by taking a particular cell, block that cell.
  3) Otherwise prefer center, then corners, then edges.

### Game loop behavior
- Initialize options from CLI and create `Board` with `options.StartingMark`.
- Print header: indicates who starts and which marks belong to human/bot.
- Loop:
  - Render the board every iteration; if it is the bot’s turn first, choose bot move immediately, update history, apply move, render again, and check status.
  - Human input:
    - `q`: quit the loop immediately
    - `u`: undo if history is non-empty; otherwise print “Nothing to undo.”
    - `r`: redo if redo stack is non-empty; otherwise print “Nothing to redo.”
    - `row,col` with 1-based numbers: parse, convert to 0-based, push current board onto history, clear redo, and attempt `Apply(new Move(r,c,humanMark))` inside a try/catch
      - On exception (bad format, out of bounds, cell occupied, or wrong turn): print `Error: {ex.Message}`, and pop the last history snapshot (so state is unchanged)
  - After a human move that succeeds: check status; if terminal, render and print result then break. Otherwise, let the bot choose and apply a move, push previous board to history, then check status again.
  - Result message mapping: If `GameStatus.Draw` → “Draw.”; else compare status vs. `HumanMark` to decide “You win!” or “Bot wins!”.

### Rendering format
- Header row: `    1   2   3`
- Each row prints row index (1–3) followed by three cells separated by ` | ` and horizontal separators `---+---+---` between rows.
- Empty cells are spaces; `X` / `O` print as letters.

### Undo/redo semantics
- Two stacks of `Board` snapshots: `_history` and `_redo`.
- On any successful new human move, `_redo` is cleared.
- Undo pushes the current board to `_redo` and replaces current with the top of `_history`.
- Redo pushes current board to `_history` and replaces current with the top of `_redo`.

### Process and I/O design
- CLI parsing returns an options record with derived properties:
  - `BotMark` is the opposite of `HumanMark`.
  - `StartingMark` is `HumanMark` if starting player is human; otherwise `BotMark`.
- Entry program validates args, handles help/usage and exit codes, and then runs the game loop.

### Edge cases to preserve
- Input parsing accepts optional whitespace; rejects malformed `row,col` inputs with clear messages.
- Trying to move on an occupied cell or out-of-bounds throws and is reported as `Error: <message>` without changing the board.
- Undo/redo report “Nothing to undo.” / “Nothing to redo.” when appropriate.
- If the bot is to start, it moves before first human prompt and the board is re-rendered so the human sees the updated state.

### Minimal acceptance examples
- Human starts, defaults: run `tic-tac-toe`; enter `2,2`; continue until win/draw.
- Bot starts: run with `--start bot`.
- Human as `O`: run with `--human-mark O` (bot will be `X`).
- Toggle marks quickly without specifying mark: run with `--swap-marks`.

### Extensibility notes (optional but aligned with original design)
- The immutable `Board` and `IBotStrategy` interface make it easy to:
  - Add alternative bots (e.g., Minimax, MCTS)
  - Serialize board history for replay
  - Add UI front-ends (web/GUI) without changing core logic

---

Reimplementations should match the behaviors listed above rather than relying on file structure. Use the CLI contracts, prompts, messages, and control flow here to validate parity.


