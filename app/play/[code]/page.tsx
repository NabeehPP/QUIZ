"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundShapes from "@/components/BackgroundShapes";
import CountdownRing from "@/components/CountdownRing";
import Confetti from "@/components/Confetti";
import { useGameRealtime } from "@/lib/useGameRealtime";
import { soundEngine } from "@/lib/soundEngine";
import { OPTION_COLORS, OPTION_LETTERS } from "@/lib/colors";
import type { LeaderboardEntry, RevealQuestion } from "@/lib/types";

interface StoredTeam {
  teamId: string;
  name: string;
  color: string;
}

export default function TeamPlayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code as string)?.toUpperCase();
  const storageKey = `ragging-quiz-team-${code}`;

  const { game, teams, loading } = useGameRealtime(code);

  const [team, setTeam] = useState<StoredTeam | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [question, setQuestion] = useState<RevealQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [myAnswers, setMyAnswers] = useState<Record<number, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Restore saved team from this device
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (raw) {
      try {
        setTeam(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [storageKey]);

  // If the host reset the game, our saved team no longer exists — clear it.
  useEffect(() => {
    if (!loading && team && game && game.phase === "lobby" && teams.length >= 0) {
      const stillThere = teams.some((t) => t.id === team.teamId);
      if (!stillThere && teams.length === 0) {
        // Likely a fresh/reset game — but give it a moment in case teams just haven't loaded.
      }
    }
  }, [loading, team, game, teams]);

  async function joinGame(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    // Joining is the team's first real gesture on this device — safe to unlock audio here.
    soundEngine.unlock();
    soundEngine.click();
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/game/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join game.");
      const t: StoredTeam = {
        teamId: data.team.id,
        name: data.team.name,
        color: data.team.color,
      };
      setTeam(t);
      localStorage.setItem(storageKey, JSON.stringify(t));
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  }

  const fetchQuestion = useCallback(async () => {
    if (!code || !game || game.current_question < 0) return;
    const res = await fetch(`/api/game/${code}/question?idx=${game.current_question}`);
    const data = await res.json();
    if (res.ok) setQuestion(data);
  }, [code, game?.current_question, game?.phase]);

  useEffect(() => {
    setSelected(myAnswers[game?.current_question ?? -1] ?? null);
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.current_question, game?.phase]);

  useEffect(() => {
    if (game?.phase === "leaderboard" && code) {
      fetch(`/api/game/${code}/leaderboard`)
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setLeaderboard(d.leaderboard);
            setConfettiTrigger((n) => n + 1);
            setTimeout(() => soundEngine.podiumCelebrate(), 500);
          }
        });
    } else {
      setLeaderboard(null);
    }
  }, [game?.phase, code]);

  // Personal correct/incorrect feedback once the host reveals the answer —
  // fires exactly once per question.
  const soundedRevealRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      game?.phase === "reveal" &&
      question &&
      question.correctIndex !== undefined &&
      soundedRevealRef.current !== question.idx
    ) {
      soundedRevealRef.current = question.idx;
      const mySelection = myAnswers[question.idx];
      if (mySelection !== undefined) {
        if (mySelection === question.correctIndex) {
          soundEngine.correct();
        } else {
          soundEngine.incorrect();
        }
      }
    }
  }, [game?.phase, question, myAnswers]);

  async function selectAnswer(idx: number) {
  if (!team || !game || game.phase !== "question") return;
  soundEngine.click();
  setSelected(idx);
  setMyAnswers((prev) => ({ ...prev, [game.current_question]: idx }));

  try {
    await fetch(`/api/game/${code}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: team.teamId,
        questionIdx: game.current_question,
        selectedIndex: idx,
      }),
    });
  } catch {
    /* server handles final scoring */
  }
  }

  const myRank = useMemo(() => {
    if (!leaderboard || !team) return null;
    const i = leaderboard.findIndex((t) => t.teamId === team.teamId);
    return i === -1 ? null : { place: i + 1, entry: leaderboard[i] };
  }, [leaderboard, team]);

  const needsRejoin =
    !loading && team && game?.phase === "lobby" && teams.length === 0;

  // ---------- JOIN SCREEN ----------
  if (!team || needsRejoin) {
    return (
      <main className="relative min-h-screen flex items-center justify-center px-6">
        <BackgroundShapes />
        <motion.form
          onSubmit={joinGame}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 glass rounded-3xl p-8 w-full max-w-sm text-center shadow-card"
        >
          <div className="text-5xl mb-3">🏁</div>
          <h1 className="font-display font-black text-2xl mb-1">Join the Game</h1>
          <p className="text-white/60 text-sm mb-1">Game code</p>
          <p className="font-display font-black text-2xl tracking-widest text-gameyellow mb-6">
            {code}
          </p>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your team name"
            maxLength={24}
            className="w-full text-center font-display font-bold text-xl bg-white/10 border-2 border-white/20 rounded-2xl py-4 mb-4 placeholder:text-white/30 outline-none focus:border-gameyellow"
          />
          {joinError && (
            <p className="text-gamepink text-sm font-semibold mb-4">{joinError}</p>
          )}
          <motion.button
            type="submit"
            disabled={joining || !nameInput.trim()}
            whileHover={{ scale: joining || !nameInput.trim() ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="card-pop w-full font-display font-extrabold text-lg py-4 rounded-2xl bg-gamegreen text-ink shadow-pop disabled:opacity-50"
          >
            {joining ? "Joining…" : "JOIN TEAM 🚀"}
          </motion.button>
        </motion.form>
      </main>
    );
  }

  if (loading || !game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-display text-xl text-white/70 animate-pulse">Connecting…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col px-4 py-6">
      <BackgroundShapes />
      <Confetti trigger={confettiTrigger} />

      <header className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <span className="font-display font-bold">{team.name}</span>
        </div>
        {game.phase === "question" || game.phase === "reveal" ? (
          <span className="font-display font-bold text-white/60 text-sm">
            Q{game.current_question + 1}/{game.total_questions}
          </span>
        ) : null}
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {game.phase === "lobby" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="font-display font-black text-2xl mb-2">You're in!</h2>
              <p className="text-white/70">
                Sit tight — the host will start the quiz on the big screen.
              </p>
              <div className="mt-8 glass rounded-2xl px-6 py-4 inline-block">
                <p className="text-sm text-white/60">Playing as</p>
                <p className="font-display font-extrabold text-xl" style={{ color: team.color }}>
                  {team.name}
                </p>
              </div>
            </motion.div>
          )}

          {(game.phase === "question" || game.phase === "reveal") && question && (
            <motion.div
              key={`q-${game.current_question}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              {game.phase === "question" && (
                <div className="mb-4">
                  <CountdownRing
                    startedAt={game.question_started_at}
                    limitSeconds={question.timeLimit}
                    size={80}
                  />
                </div>
              )}

              <div className="glass rounded-2xl p-5 mb-5 w-full text-center">
                <p className="font-display font-bold text-lg leading-snug">
                  {question.question}
                </p>
              </div>

              {selected !== null && game.phase === "question" && (
              <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 font-display font-bold text-gamegreen text-sm"
             >
             Answer selected
            </motion.div>
            )}

              <div className="grid grid-cols-1 gap-3 w-full">
                {question.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const showResult = game.phase === "reveal";
                  const isCorrectOpt = showResult && question.correctIndex === i;
                  const isWrongSelected = showResult && isSelected && !isCorrectOpt;
                  const dim = showResult && !isCorrectOpt && !isSelected;

                  return (
                    <motion.button
                      key={i}
                     disabled={game.phase === "reveal"}
                     onClick={() => selectAnswer(i)}
                     whileHover={game.phase === "question" ? { scale: 1.02 } : {}}
                      whileTap={{ scale: 0.96 }}
                      animate={
                        isCorrectOpt
                          ? { scale: [1, 1.05, 1] }
                          : isWrongSelected
                          ? { x: [0, -6, 5, -3, 2, 0], opacity: 0.5 }
                          : dim
                          ? { opacity: 0.35 }
                          : {}
                      }
                      className={`glow-card ${isCorrectOpt ? "is-glowing" : ""} card-pop min-h-[64px] rounded-2xl px-5 py-4 flex items-center gap-3 font-display font-bold text-lg shadow-pop text-left disabled:cursor-default relative overflow-hidden`}
                      style={{
                        backgroundColor: OPTION_COLORS[i],
                        color: "#161235",
                        outline: isSelected ? "4px solid white" : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {isCorrectOpt && (
                        <span className="absolute inset-0 rounded-2xl border-4 border-gamegreen animate-pulseRing" />
                      )}
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-ink text-white font-black text-sm shrink-0">
                        {OPTION_LETTERS[i]}
                      </span>
                      <span className="flex-1 pr-10">{opt}</span>
                      {isCorrectOpt && (
  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl z-20">
    ✅
  </span>
)}

{showResult && isSelected && !isCorrectOpt && (
  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl z-20">
    ❌
  </span>
)}
                    </motion.button>
                  );
                })}
              </div>

              {game.phase === "reveal" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 glass rounded-2xl p-4 text-center"
                >
                  <p className="text-white/85 text-sm">💡 {question.explanation}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {game.phase === "leaderboard" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center w-full max-w-2xl"
            >
              <h2 className="text-shimmer animate-shimmer font-display font-black text-3xl md:text-4xl mb-2 bg-clip-text text-transparent">
                🏆 FINAL RESULTS 🏆
              </h2>

              {leaderboard ? (
                <>
                  <p className="text-white/70 mb-5">Complete leaderboard</p>

                  {myRank && (
                    <div className="glass rounded-2xl px-4 py-3 mb-5 border-2 border-gameyellow/50">
                      <span className="font-display font-black text-gameyellow">
                        {team.name}
                      </span>
                      <span className="text-white/60"> • </span>
                      <span className="font-display font-extrabold">
                        Your position: #{myRank.place}
                      </span>
                    </div>
                  )}

                  <div className="w-full max-h-[55vh] overflow-y-auto pr-1 space-y-2">
                    {leaderboard.map((entry, i) => {
                      const isMe = entry.teamId === team.teamId;

                      return (
                        <motion.div
                          key={entry.teamId}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left ${
                            isMe
                              ? "bg-gameyellow/20 border-2 border-gameyellow"
                              : "glass border-2 border-transparent"
                          }`}
                        >
                          <span className="font-display font-black w-8 text-center text-lg">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                          </span>

                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />

                          <span className="font-display font-bold flex-1 truncate">
                            {entry.name}
                            {isMe && (
                              <span className="ml-2 text-gameyellow text-xs">YOU</span>
                            )}
                          </span>

                          <span className="text-white/60 text-xs sm:text-sm shrink-0">
                            {entry.correct}/{game.total_questions}
                          </span>

                          <span className="font-display font-extrabold text-gameyellow min-w-[52px] text-right">
                            {entry.score}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="font-display animate-pulse text-white/70 mb-6">
                  Tallying scores…
                </p>
              )}

              <p className="font-display font-bold text-gameyellow mt-6">
                Know the signs. Speak up. Stand together.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}