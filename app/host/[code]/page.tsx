"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import BackgroundShapes from "@/components/BackgroundShapes";
import CountdownRing from "@/components/CountdownRing";
import Podium from "@/components/Podium";
import Confetti from "@/components/Confetti";
import SoundToggle from "@/components/SoundToggle";
import { useGameRealtime } from "@/lib/useGameRealtime";
import { useSoundToggle } from "@/lib/useSoundToggle";
import { soundEngine } from "@/lib/soundEngine";
import { OPTION_COLORS, OPTION_LETTERS } from "@/lib/colors";
import type { LeaderboardEntry, RevealQuestion } from "@/lib/types";

export default function HostProjectorPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code as string)?.toUpperCase();
  const { game, teams, loading } = useGameRealtime(code);
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundToggle();

  const [joinUrl, setJoinUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/play/${code}`);
    }
  }, [code]);

  const [question, setQuestion] = useState<RevealQuestion | null>(null);
  const [progress, setProgress] = useState({ answered: 0, totalTeams: teams.length });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [busy, setBusy] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!code || !game || game.current_question < 0) return;
    const res = await fetch(`/api/game/${code}/question?idx=${game.current_question}`);
    const data = await res.json();
    if (res.ok) setQuestion(data);
  }, [code, game?.current_question, game?.phase]);

  useEffect(() => {
    setAutoRevealed(false);
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.current_question, game?.phase]);

  // Poll answer progress while a question is live
  useEffect(() => {
    if (!code || game?.phase !== "question") return;
    const poll = async () => {
      const res = await fetch(`/api/game/${code}/progress`);
      const data = await res.json();
      if (res.ok) setProgress(data);
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [code, game?.phase, game?.current_question]);

  useEffect(() => {
    if (game?.phase === "leaderboard" && code) {
      fetch(`/api/game/${code}/leaderboard`)
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setLeaderboard(d.leaderboard);
            setConfettiTrigger((n) => n + 1);
            // Slight delay so the podium celebration lands with its reveal animation.
            setTimeout(() => soundEngine.podiumCelebrate(), 600);
          }
        });
    }
  }, [game?.phase, code]);

  // Short chime whenever a new team joins the lobby (skips the initial load).
  const prevTeamCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (loading) return;
    if (
      prevTeamCountRef.current !== null &&
      teams.length > prevTeamCountRef.current
    ) {
      soundEngine.teamJoin();
    }
    prevTeamCountRef.current = teams.length;
  }, [teams.length, loading]);

  // Suspense sting right as the reveal begins, and a fanfare once the quiz finishes.
  const prevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!game) return;
    const prevPhase = prevPhaseRef.current;
    if (prevPhase !== game.phase) {
      if (prevPhase === "question" && game.phase === "reveal") {
        soundEngine.suspense();
      }
      if (prevPhase !== "leaderboard" && game.phase === "leaderboard") {
        soundEngine.gameOverFanfare();
      }
      prevPhaseRef.current = game.phase;
    }
  }, [game?.phase]);

  const allAnswered = teams.length > 0 && progress.answered >= teams.length;

  const revealNow = useCallback(async () => {
    if (!code || busy) return;
    setBusy(true);
    await fetch(`/api/game/${code}/reveal`, { method: "POST" }).catch(() => {});
    setBusy(false);
  }, [code, busy]);

  useEffect(() => {
    if (game?.phase === "question" && allAnswered && !autoRevealed) {
      setAutoRevealed(true);
      revealNow();
    }
  }, [allAnswered, game?.phase, autoRevealed, revealNow]);

  async function startQuiz() {
    // Starting the quiz is a reliable user gesture — unlock audio here too,
    // in case the host arrived via a resumed game code instead of "Create Game".
    soundEngine.unlock();
    soundEngine.click();
    setBusy(true);
    setStartError(null);
    const res = await fetch(`/api/game/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testMode }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStartError(data.error ?? "Could not start the quiz.");
    }
    setBusy(false);
  }

  async function nextQuestion() {
    soundEngine.click();
    setBusy(true);
    setLeaderboard(null);
    await fetch(`/api/game/${code}/advance`, { method: "POST" });
    setBusy(false);
  }

  async function playAgain() {
    soundEngine.click();
    setBusy(true);
    setLeaderboard(null);
    setQuestion(null);
    await fetch(`/api/game/${code}/reset`, { method: "POST" });
    setBusy(false);
  }

  const questionNumberLabel = useMemo(() => {
    if (!game || game.current_question < 0) return "";
    return `Question ${game.current_question + 1} / ${game.total_questions}`;
  }, [game]);

  const answeredFraction =
    teams.length > 0 ? Math.min(1, progress.answered / teams.length) : 0;

  if (loading || !game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-display text-xl text-white/70 animate-pulse">Loading game…</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-6 py-8 md:px-12 md:py-10 flex flex-col">
      <BackgroundShapes />
      <Confetti trigger={confettiTrigger} />

      <header className="relative z-10 flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl md:text-3xl">
          <span className="text-white">RAGGING? </span>
          <span className="text-gamepink">GAME OVER.</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 font-display font-bold text-sm md:text-base">
            Code: <span className="text-gameyellow tracking-widest">{code}</span>
          </div>
          <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {game.phase === "lobby" && (
            <motion.section
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8"
            >
              <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <p className="font-display font-bold text-white/80 mb-3">
                  Scan to join
                </p>
                <div className="bg-white p-4 rounded-2xl shadow-pop">
                  {joinUrl && <QRCodeCanvas value={joinUrl} size={200} />}
                </div>
                <p className="mt-4 text-sm text-white/60">or enter code at</p>
                <p className="font-display font-bold text-gameyellow">{joinUrl.replace(/^https?:\/\//, "")}</p>
                <div className="mt-6 font-display font-black text-5xl tracking-[0.3em] text-gamegreen">
                  {code}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setTestMode((v) => !v)}
                    className={`font-display font-bold text-xs px-3 py-1.5 rounded-full border-2 transition ${
                      testMode
                        ? "bg-gameorange text-ink border-gameorange"
                        : "bg-transparent text-white/60 border-white/25 hover:border-white/50"
                    }`}
                  >
                    🧪 TEST MODE {testMode ? "ON" : "OFF"}
                  </button>
                  {testMode && (
                    <span className="text-xs text-gameorange font-semibold">
                      Dev only
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-extrabold text-xl">
                    Teams joined ({teams.length}/8)
                  </h2>
                  <motion.button
                    onClick={startQuiz}
                    disabled={(testMode ? teams.length === 0 : teams.length !== 8) || busy}
                    whileHover={{
                      scale:
                        (testMode ? teams.length === 0 : teams.length !== 8) || busy
                          ? 1
                          : 1.04,
                    }}
                    whileTap={{ scale: 0.96 }}
                    className="card-pop font-display font-extrabold px-6 py-3 rounded-xl bg-gamegreen text-ink shadow-pop disabled:opacity-40"
                  >
                    ▶ START QUIZ{testMode ? " (TEST)" : ""}
                  </motion.button>
                </div>

                {!testMode && teams.length !== 8 && (
                  <p className="text-white/50 text-xs mb-3 -mt-2">
                    Exactly 8 teams are required to start the real event. Enable Test
                    Mode above to try the quiz with fewer.
                  </p>
                )}
                {startError && (
                  <p className="text-gamepink text-xs font-semibold mb-3 -mt-1">
                    {startError}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
                  {teams.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      className="rounded-2xl p-4 shadow-pop font-display font-extrabold text-ink text-center break-words"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </motion.div>
                  ))}
                  {Array.from({ length: Math.max(0, 8 - teams.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="rounded-2xl p-4 border-2 border-dashed border-white/20 text-white/30 text-center font-display"
                    >
                      Waiting…
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {(game.phase === "question" || game.phase === "reveal") && question && (
            <motion.section
              key={`q-${game.current_question}-${game.phase}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-bold text-white/70">
                  {questionNumberLabel}
                </span>
                {game.phase === "question" ? (
                  <CountdownRing
                    startedAt={game.question_started_at}
                    limitSeconds={question.timeLimit}
                    onComplete={revealNow}
                    size={90}
                  />
                ) : (
                  <span className="font-display font-extrabold text-gameyellow text-lg animate-popIn">
                    ✅ Answer revealed
                  </span>
                )}
              </div>

              <div className="glass rounded-3xl p-6 md:p-10 mb-6 flex-1 flex items-center justify-center">
                <h2 className="font-display font-extrabold text-2xl md:text-4xl text-center leading-tight">
                  {question.question}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {question.options.map((opt, i) => {
                  const isCorrect =
                    game.phase === "reveal" && question.correctIndex === i;
                  const isWrong =
                    game.phase === "reveal" && question.correctIndex !== i;
                  return (
                    <motion.div
                      key={i}
                      animate={
                        isCorrect
                          ? { scale: [1, 1.06, 1] }
                          : isWrong
                          ? { opacity: 0.35 }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                      className={`glow-card ${isCorrect ? "is-glowing" : ""} rounded-2xl px-6 py-5 flex items-center gap-4 shadow-pop font-display font-bold text-lg md:text-xl relative overflow-hidden`}
                      style={{ backgroundColor: OPTION_COLORS[i], color: "#161235" }}
                    >
                      {isCorrect && (
                        <span className="absolute inset-0 rounded-2xl border-4 border-gamegreen animate-pulseRing" />
                      )}
                      <span className="w-9 h-9 flex items-center justify-center rounded-full bg-ink text-white font-black shrink-0">
                        {OPTION_LETTERS[i]}
                      </span>
                      <span>{opt}</span>
                      {isCorrect && (
                        <span className="ml-auto text-2xl animate-popIn">🎉</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {game.phase === "question" && (
                <div className="mb-2">
                  <p className="text-center text-white/60 font-medium mb-2">
                    {progress.answered}/{teams.length} teams answered
                  </p>
                  <div className="h-2.5 w-full max-w-md mx-auto rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gamegreen via-gameyellow to-gamepink"
                      initial={{ width: 0 }}
                      animate={{ width: `${answeredFraction * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {game.phase === "reveal" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between"
                  >
                    <p className="text-white/85 font-medium text-center md:text-left">
                      💡 {question.explanation}
                    </p>
                    <motion.button
                      onClick={nextQuestion}
                      disabled={busy}
                      whileHover={{ scale: busy ? 1 : 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="card-pop shrink-0 font-display font-extrabold px-6 py-3 rounded-xl bg-gamepink text-white shadow-pop disabled:opacity-50"
                    >
                      {game.current_question + 1 >= game.total_questions
                        ? "SHOW FINAL RESULTS 🏆"
                        : "NEXT QUESTION ➜"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {game.phase === "leaderboard" && (
            <motion.section
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.h2
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 10 }}
                className="text-shimmer animate-shimmer font-display font-black text-4xl md:text-6xl mb-8 bg-clip-text text-transparent"
              >
                🏆 FINAL RESULTS 🏆
              </motion.h2>

              {leaderboard ? (
                <>
                  <Podium top3={leaderboard.slice(0, 3)} />

                  <div className="mt-10 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {leaderboard.map((t, i) => (
                      <motion.div
                        key={t.teamId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.08 }}
                        className="flex items-center gap-3 glass rounded-xl px-4 py-3"
                      >
                        <span className="font-display font-black w-6 text-white/70">
                          {i + 1}
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="font-bold flex-1 text-left truncate">
                          {t.name}
                        </span>
                        <span className="text-white/60 text-sm">
                          {t.correct}/{game.total_questions} correct
                        </span>
                        <span className="font-display font-extrabold text-gameyellow">
                          {t.score}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    onClick={playAgain}
                    disabled={busy}
                    whileHover={{ scale: busy ? 1 : 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="card-pop mt-10 font-display font-extrabold px-8 py-4 rounded-2xl bg-gamegreen text-ink shadow-pop"
                  >
                    🔁 PLAY AGAIN
                  </motion.button>

                  <p className="mt-8 font-display font-bold text-lg text-gameyellow max-w-xl">
                    Know the signs. Speak up. Stand together.
                  </p>
                </>
              ) : (
                <p className="font-display animate-pulse text-white/70">
                  Tallying scores…
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
