"use client";

import { cn } from "@/lib/utils";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const glyphs: Record<string, string> = {
  p: "♟",
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  P: "♙",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔"
};

export function ChessBoard({
  fen,
  orientation = "white",
  selectable = false,
  selectedSquare,
  moveHints = [],
  lastMove = [],
  onSquareClick
}: {
  fen: string;
  orientation?: "white" | "black";
  selectable?: boolean;
  selectedSquare?: string | null;
  moveHints?: string[];
  lastMove?: string[];
  onSquareClick?: (square: string) => void;
}) {
  const board = parseFenBoard(fen);
  const visualFiles = orientation === "white" ? files : [...files].reverse();
  const visualRanks = orientation === "white" ? ranks : [...ranks].reverse();

  return (
    <div className="grid grid-cols-8 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-glow">
      {visualRanks.flatMap((rank) =>
        visualFiles.map((file, fileIndex) => {
          const square = `${file}${rank}`;
          const piece = board[8 - rank][files.indexOf(file)];
          const dark = (fileIndex + rank) % 2 === 0;
          const isSelected = square === selectedSquare;
          const isHint = moveHints.includes(square);
          const isLastMove = lastMove.includes(square);

          return (
            <button
              key={square}
              type="button"
              onClick={() => onSquareClick?.(square)}
              className={cn(
                "relative aspect-square flex items-center justify-center text-[1.8rem] md:text-[2rem]",
                dark ? "bg-[#22355f]" : "bg-[#dce8ff]",
                selectable && "cursor-pointer",
                isSelected && "ring-2 ring-accent ring-inset",
                isLastMove && "bg-[#7c83ff]/60 text-white"
              )}
            >
              <span
                className={cn(
                  "select-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]",
                  piece && /[A-Z]/.test(piece) ? "text-white" : "text-[#111827]"
                )}
              >
                {glyphs[piece] ?? ""}
              </span>

              {isHint ? (
                <span className="absolute h-4 w-4 rounded-full bg-accent/80 shadow-[0_0_12px_rgba(109,93,246,0.9)]" />
              ) : null}

              <span className="absolute bottom-1 left-1 text-[10px] font-medium text-slate-500/70">{square}</span>
            </button>
          );
        })
      )}
    </div>
  );
}

function parseFenBoard(fen: string) {
  const [placement] = fen.split(" ");
  const rows = placement.split("/");
  return rows.map((row) => {
    const squares: string[] = [];
    for (const char of row) {
      const empty = Number(char);
      if (Number.isInteger(empty) && empty > 0) {
        for (let i = 0; i < empty; i += 1) squares.push("");
      } else {
        squares.push(char);
      }
    }
    return squares;
  });
}
