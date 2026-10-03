"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "@/components/common/useDialogFocus";

const emptySubscribe = () => () => {};
import {
  Gamepad2,
  RotateCcw,
  Trophy,
  X,
  Bot,
  User,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Player = "X" | "O" | null;
type BoardState = Player[];

// Standard 3x3 Tic Tac Toe with Minimax AI
const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: BoardState): { winner: Player; line: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: null, line: null }; // Draw
  }
  return { winner: null, line: null };
}

// Minimax algorithm for unbeatable AI
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
): { score: number; move?: number } {
  const result = checkWinner(board);
  if (result.winner === "O") return { score: 10 - depth };
  if (result.winner === "X") return { score: depth - 10 };
  if (board.every((cell) => cell !== null)) return { score: 0 };

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove: number | undefined;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, depth + 1, false).score;
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove: number | undefined;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "X";
        const score = minimax(board, depth + 1, true).score;
        board[i] = null;
        if (score < bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return { score: bestScore, move: bestMove };
  }
}

export default function SuperTicTacToeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [vsAi, setVsAi] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { winner, line } = checkWinner(board);
  const isDraw = !winner && board.every((cell) => cell !== null);

  const makeMove = useCallback((index: number, player: "X" | "O") => {
    setBoard((prev) => {
      if (prev[index] || checkWinner(prev).winner) return prev;
      const newBoard = [...prev];
      newBoard[index] = player;

      const check = checkWinner(newBoard);
      if (check.winner) {
        setScores((s) => ({ ...s, [check.winner!]: s[check.winner!] + 1 }));
      } else if (newBoard.every((c) => c !== null)) {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setIsXNext(player === "O");
      }
      return newBoard;
    });
  }, []);

  // AI Move turn
  useEffect(() => {
    if (vsAi && !isXNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const { move } = minimax([...board], 0, true);
        if (move !== undefined && board[move] === null) {
          makeMove(move, "O");
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [vsAi, isXNext, winner, isDraw, board, makeMove]);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw) return;
    if (vsAi && !isXNext) return; // Prevent move during AI turn
    makeMove(index, isXNext ? "X" : "O");
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const dialogRef = useDialogFocus(open, onClose);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Super Tic Tac Toe Game Engine"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--portfolio-rule)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-blue-soft)] text-[var(--portfolio-accent)]">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-[var(--portfolio-ink)]">
                  Super Tic Tac Toe
                </h2>
                <span className="portfolio-impact-pill">Minimax Engine</span>
              </div>
              <p className="font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
                Zero-dependency game state logic &amp; recursive evaluation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close game modal"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] text-[var(--portfolio-muted)] transition-colors hover:border-[var(--portfolio-accent)] hover:text-[var(--portfolio-accent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode & Score Bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--portfolio-rule)] bg-muted/20 p-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setVsAi(true);
                resetGame();
              }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 font-utility text-xs font-semibold transition-all cursor-pointer",
                vsAi
                  ? "bg-[var(--portfolio-accent)] text-white shadow-xs"
                  : "text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]",
              )}
            >
              <Bot className="h-3 w-3" />
              <span>vs Minimax AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVsAi(false);
                resetGame();
              }}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 font-utility text-xs font-semibold transition-all cursor-pointer",
                !vsAi
                  ? "bg-[var(--portfolio-accent)] text-white shadow-xs"
                  : "text-[var(--portfolio-muted)] hover:text-[var(--portfolio-ink)]",
              )}
            >
              <User className="h-3 w-3" />
              <span>2-Player</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-utility text-[0.68rem] text-[var(--portfolio-muted)]">
            <span>X: <strong className="text-[var(--portfolio-ink)]">{scores.X}</strong></span>
            <span>·</span>
            <span>O: <strong className="text-[var(--portfolio-ink)]">{scores.O}</strong></span>
            <span>·</span>
            <span>Ties: <strong className="text-[var(--portfolio-ink)]">{scores.draws}</strong></span>
          </div>
        </div>

        {/* Turn Status */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {winner ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                <Trophy className="h-3.5 w-3.5" />
                Player {winner} Won!
              </span>
            ) : isDraw ? (
              <span className="font-semibold text-amber-500">
                Stalemate! Game is a draw.
              </span>
            ) : (
              <span className="text-[var(--portfolio-muted)] font-medium">
                Turn: <strong className="text-[var(--portfolio-accent)]">{isXNext ? "Player X (You)" : vsAi ? "Minimax AI (O)..." : "Player O"}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="flex items-center gap-1 font-utility text-[0.68rem] text-[var(--portfolio-muted)] hover:text-[var(--portfolio-accent)] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restart</span>
          </button>
        </div>

        {/* 3x3 Grid Board */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-[var(--portfolio-rule)] bg-muted/30 p-2.5">
          {board.map((cell, idx) => {
            const isWinningCell = line?.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={Boolean(cell || winner || isDraw || (vsAi && !isXNext))}
                className={cn(
                  "flex h-20 sm:h-24 w-full items-center justify-center rounded-xl border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] font-display text-3xl sm:text-4xl font-bold transition-all cursor-pointer disabled:cursor-not-allowed",
                  !cell && !winner && "hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)]/50",
                  cell === "X" && "text-[var(--portfolio-accent)]",
                  cell === "O" && "text-rose-500",
                  isWinningCell && "border-emerald-500 bg-emerald-500/15 shadow-sm",
                )}
                aria-label={`Cell ${idx + 1}, currently ${cell || "empty"}`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--portfolio-rule)] pt-3 text-[0.68rem] font-utility text-[var(--portfolio-muted)]">
          <span>Minimax explores state tree with alpha-beta pruning</span>
          <a
            href="https://github.com/CVamsi27/Super-Tic-Tac-Toe"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--portfolio-accent)] hover:underline"
          >
            View GitHub Source →
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
