"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import BackgroundShapes from "@/components/BackgroundShapes";
import CountdownRing from "@/components/CountdownRing";
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
  const { enabled: soundEnabled, toggle: toggleSound } =
    useSoundToggle();

  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinUrl(`${window.location.origin}/play/${code}`);
    }
  }, [code]);

  const [question, setQuestion] =
    useState<RevealQuestion | null>(null);

  const [progress, setProgress] = useState({
    answered: 0,
    totalTeams: teams.length,
  });

  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[] | null>(null);

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [busy, setBusy] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [startError, setStartError] =
    useState<string | null>(null);

  /* ============================================================
     QUESTION
     ============================================================ */

  const fetchQuestion = useCallback(async () => {
    if (!code || !game || game.current_question < 0) return;

    const res = await fetch(
      `/api/game/${code}/question?idx=${game.current_question}`
    );

    const data = await res.json();

    if (res.ok) {
      setQuestion(data);
    }
  }, [code, game?.current_question, game?.phase]);

  useEffect(() => {
    setAutoRevealed(false);
    fetchQuestion();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.current_question, game?.phase]);

  /* ============================================================
     ANSWER PROGRESS
     ============================================================ */

  useEffect(() => {
    if (!code || game?.phase !== "question") return;

    const poll = async () => {
      const res = await fetch(
        `/api/game/${code}/progress`
      );

      const data = await res.json();

      if (res.ok) {
        setProgress(data);
      }
    };

    poll();

    const id = setInterval(poll, 1000);

    return () => clearInterval(id);
  }, [
    code,
    game?.phase,
    game?.current_question,
  ]);

  /* ============================================================
     LEADERBOARD
     ============================================================ */

  useEffect(() => {
    if (game?.phase === "leaderboard" && code) {
      fetch(`/api/game/${code}/leaderboard`)
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setLeaderboard(d.leaderboard);

            setConfettiTrigger(
              (n) => n + 1
            );

            setTimeout(() => {
              soundEngine.podiumCelebrate();
            }, 600);
          }
        });
    } else {
      setLeaderboard(null);
    }
  }, [game?.phase, code]);

  /* ============================================================
     TEAM JOIN SOUND
     ============================================================ */

  const prevTeamCountRef =
    useRef<number | null>(null);

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

  /* ============================================================
     PHASE SOUNDS
     ============================================================ */

  const prevPhaseRef =
    useRef<string | null>(null);

  useEffect(() => {
    if (!game) return;

    const prevPhase = prevPhaseRef.current;

    if (prevPhase !== game.phase) {
      if (
        prevPhase === "question" &&
        game.phase === "reveal"
      ) {
        soundEngine.suspense();
      }

      if (
        prevPhase !== "leaderboard" &&
        game.phase === "leaderboard"
      ) {
        soundEngine.gameOverFanfare();
      }

      prevPhaseRef.current = game.phase;
    }
  }, [game?.phase]);

  /* ============================================================
     AUTO REVEAL
     ============================================================ */

  const allAnswered =
    teams.length > 0 &&
    progress.answered >= teams.length;

  const revealNow = useCallback(async () => {
    if (!code || busy) return;

    setBusy(true);

    await fetch(`/api/game/${code}/reveal`, {
      method: "POST",
    }).catch(() => {});

    setBusy(false);
  }, [code, busy]);

  useEffect(() => {
    if (
      game?.phase === "question" &&
      allAnswered &&
      !autoRevealed
    ) {
      setAutoRevealed(true);
      revealNow();
    }
  }, [
    allAnswered,
    game?.phase,
    autoRevealed,
    revealNow,
  ]);

  /* ============================================================
     START QUIZ
     ============================================================ */

  async function startQuiz() {
    soundEngine.unlock();
    soundEngine.click();

    setBusy(true);
    setStartError(null);

    const res = await fetch(
      `/api/game/${code}/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testMode,
        }),
      }
    );

    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({}));

      setStartError(
        data.error ?? "Could not start the quiz."
      );
    }

    setBusy(false);
  }

  /* ============================================================
     NEXT QUESTION
     ============================================================ */

  async function nextQuestion() {
    soundEngine.click();

    setBusy(true);
    setLeaderboard(null);

    await fetch(
      `/api/game/${code}/advance`,
      {
        method: "POST",
      }
    );

    setBusy(false);
  }

  /* ============================================================
     PLAY AGAIN
     ============================================================ */

  async function playAgain() {
    soundEngine.click();

    setBusy(true);
    setLeaderboard(null);
    setQuestion(null);

    await fetch(
      `/api/game/${code}/reset`,
      {
        method: "POST",
      }
    );

    setBusy(false);
  }

  /* ============================================================
     QUESTION LABEL
     ============================================================ */

  const questionNumberLabel = useMemo(() => {
    if (!game || game.current_question < 0) {
      return "";
    }

    return `Question ${
      game.current_question + 1
    } / ${game.total_questions}`;
  }, [game]);

  const answeredFraction =
    teams.length > 0
      ? Math.min(
          1,
          progress.answered / teams.length
        )
      : 0;

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading || !game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-display text-xl text-white/70 animate-pulse">
          Loading game…
        </p>
      </main>
    );
  }

  /* ============================================================
     MAIN
     ============================================================ */

  return (
    <main className="relative min-h-screen px-6 py-8 md:px-12 md:py-10 flex flex-col">
      <BackgroundShapes />

      <Confetti trigger={confettiTrigger} />

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="relative z-10 flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl md:text-3xl">
          <span className="text-white">
            RAGGING?{" "}
          </span>

          <span className="text-gamepink">
            GAME OVER.
          </span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 font-display font-bold text-sm md:text-base">
            Code:{" "}
            <span className="text-gameyellow tracking-widest">
              {code}
            </span>
          </div>

          <SoundToggle
            enabled={soundEnabled}
            onToggle={toggleSound}
          />
        </div>
      </header>

      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait">

          {/* ==================================================
              LOBBY
              ================================================== */}

          {game.phase === "lobby" && (
            <motion.section
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8"
            >
              {/* QR */}
              <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy
                    size={18}
                    className="text-gameyellow"
                  />

                  <p className="font-display font-bold text-white/80">
                    Scan to join
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-pop">
                  {joinUrl && (
                    <QRCodeCanvas
                      value={joinUrl}
                      size={200}
                    />
                  )}
                </div>

                <p className="mt-4 text-sm text-white/60">
                  or enter code at
                </p>

                <p className="font-display font-bold text-gameyellow break-all">
                  {joinUrl.replace(
                    /^https?:\/\//,
                    ""
                  )}
                </p>

                <div className="mt-6 font-display font-black text-5xl tracking-[0.3em] text-gamegreen">
                  {code}
                </div>
              </div>

              {/* TEAMS */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() =>
                      setTestMode((v) => !v)
                    }
                    className={`font-display font-bold text-xs px-3 py-1.5 rounded-full border-2 transition ${
                      testMode
                        ? "bg-gameorange text-ink border-gameorange"
                        : "bg-transparent text-white/60 border-white/25 hover:border-white/50"
                    }`}
                  >
                    TEST MODE{" "}
                    {testMode ? "ON" : "OFF"}
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
                    disabled={
                      (
                        testMode
                          ? teams.length === 0
                          : teams.length !== 8
                      ) || busy
                    }
                    whileHover={{
                      scale:
                        (
                          testMode
                            ? teams.length === 0
                            : teams.length !== 8
                        ) || busy
                          ? 1
                          : 1.04,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    className="card-pop font-display font-extrabold px-6 py-3 rounded-xl bg-gamegreen text-ink shadow-pop disabled:opacity-40"
                  >
                    START QUIZ
                    {testMode ? " (TEST)" : ""}
                  </motion.button>
                </div>

                {!testMode &&
                  teams.length !== 8 && (
                    <p className="text-white/50 text-xs mb-3 -mt-2">
                      Exactly 8 teams are
                      required to start the real
                      event. Enable Test Mode above
                      to try the quiz with fewer.
                    </p>
                  )}

                {startError && (
                  <p className="text-gamepink text-xs font-semibold mb-3 -mt-1">
                    {startError}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 content-start">
                  {teams.map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{
                        scale: 0,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 14,
                      }}
                      className="rounded-2xl p-4 shadow-pop font-display font-extrabold text-ink text-center break-words"
                      style={{
                        backgroundColor: t.color,
                      }}
                    >
                      {t.name}
                    </motion.div>
                  ))}

                  {Array.from({
                    length: Math.max(
                      0,
                      8 - teams.length
                    ),
                  }).map((_, i) => (
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

          {/* ==================================================
              QUESTION / REVEAL
              ================================================== */}

          {(game.phase === "question" ||
            game.phase === "reveal") &&
            question && (
              <motion.section
                key={`q-${game.current_question}-${game.phase}`}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-white/70">
                    {questionNumberLabel}
                  </span>

                  {game.phase === "question" ? (
                    <CountdownRing
                      startedAt={
                        game.question_started_at
                      }
                      limitSeconds={
                        question.timeLimit
                      }
                      onComplete={revealNow}
                      size={90}
                    />
                  ) : (
                    <span className="font-display font-extrabold text-gameyellow text-lg animate-popIn flex items-center gap-2">
                      <CheckCircle2 size={21} />
                      Answer revealed
                    </span>
                  )}
                </div>

                <div className="glass rounded-3xl p-6 md:p-10 mb-6 flex-1 flex items-center justify-center">
                  <h2 className="font-display font-extrabold text-2xl md:text-4xl text-center leading-tight">
                    {question.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {question.options.map(
                    (opt, i) => {
                      const isCorrect =
                        game.phase === "reveal" &&
                        question.correctIndex === i;

                      const isWrong =
                        game.phase === "reveal" &&
                        question.correctIndex !== i;

                      return (
                        <motion.div
                          key={i}
                          animate={
                            isCorrect
                              ? {
                                  scale: [
                                    1,
                                    1.06,
                                    1,
                                  ],
                                }
                              : isWrong
                              ? {
                                  opacity: 0.35,
                                }
                              : {}
                          }
                          transition={{
                            duration: 0.5,
                          }}
                          className={`glow-card ${
                            isCorrect
                              ? "is-glowing"
                              : ""
                          } rounded-2xl px-6 py-5 flex items-center gap-4 shadow-pop font-display font-bold text-lg md:text-xl relative overflow-hidden`}
                          style={{
                            backgroundColor:
                              OPTION_COLORS[i],
                            color: "#161235",
                          }}
                        >
                          {isCorrect && (
                            <span className="absolute inset-0 rounded-2xl border-4 border-gamegreen animate-pulseRing" />
                          )}

                          <span className="w-9 h-9 flex items-center justify-center rounded-full bg-ink text-white font-black shrink-0">
                            {OPTION_LETTERS[i]}
                          </span>

                          <span>{opt}</span>

                          {isCorrect && (
                            <span className="ml-auto text-gamegreen animate-popIn">
                              <CheckCircle2
                                size={30}
                                strokeWidth={2.5}
                              />
                            </span>
                          )}
                        </motion.div>
                      );
                    }
                  )}
                </div>

                {/* PROGRESS */}
                {game.phase === "question" && (
                  <div className="mb-2">
                    <p className="text-center text-white/60 font-medium mb-2">
                      {progress.answered}/
                      {teams.length} teams answered
                    </p>

                    <div className="h-2.5 w-full max-w-md mx-auto rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gamegreen via-gameyellow to-gamepink"
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${
                            answeredFraction * 100
                          }%`,
                        }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* REVEAL FOOTER */}
                <AnimatePresence>
                  {game.phase === "reveal" && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="glass rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between"
                    >
                      <p className="text-white/85 font-medium text-center md:text-left">
                        <span className="inline-flex align-middle mr-2">
                          <Award
                            size={18}
                            className="text-gameyellow"
                          />
                        </span>

                        {question.explanation}
                      </p>

                      <motion.button
                        onClick={nextQuestion}
                        disabled={busy}
                        whileHover={{
                          scale: busy
                            ? 1
                            : 1.04,
                        }}
                        whileTap={{
                          scale: 0.96,
                        }}
                        className="card-pop shrink-0 font-display font-extrabold px-6 py-3 rounded-xl bg-gamepink text-white shadow-pop disabled:opacity-50"
                      >
                        {game.current_question + 1 >=
                        game.total_questions
                          ? "SHOW FINAL RESULTS"
                          : "NEXT QUESTION →"}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            )}

          {/* ==================================================
              FINAL LEADERBOARD
              ================================================== */}

          {game.phase === "leaderboard" && (
            <motion.section
              key="leaderboard"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex-1 flex flex-col items-center justify-center text-center w-full"
            >
              {/* HEADER */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 160,
                  damping: 12,
                }}
                className="mb-7"
              >
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                  }}
                  className="relative flex justify-center mb-4"
                >
                  <div className="absolute w-24 h-24 rounded-full bg-gameyellow/20 blur-3xl" />

                  <div className="relative w-20 h-20 rounded-3xl glass border border-gameyellow/30 flex items-center justify-center">
                    <Trophy
                      size={44}
                      strokeWidth={2}
                      className="text-gameyellow"
                    />
                  </div>
                </motion.div>

                <div className="flex items-center justify-center gap-3">
                  <Sparkles
                    size={20}
                    className="text-gameyellow"
                  />

                  <h2 className="text-shimmer animate-shimmer font-display font-black text-4xl md:text-6xl bg-clip-text text-transparent">
                    FINAL RESULTS
                  </h2>

                  <Sparkles
                    size={20}
                    className="text-gameyellow"
                  />
                </div>

                {leaderboard && (
                  <p className="mt-2 text-white/55 font-display text-sm md:text-base">
                    {leaderboard.length}{" "}
                    {leaderboard.length === 1
                      ? "team"
                      : "teams"}{" "}
                    competed
                  </p>
                )}
              </motion.div>

              {leaderboard ? (
                <>
                  {/* TOP 3 */}
                  {leaderboard.length > 0 && (
                    <div className="w-full max-w-5xl mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
                        {/* SECOND */}
                        {leaderboard[1] && (
                          <HostPodiumCard
                            entry={
                              leaderboard[1]
                            }
                            place={2}
                            delay={0.35}
                          />
                        )}

                        {/* FIRST */}
                        {leaderboard[0] && (
                          <HostPodiumCard
                            entry={
                              leaderboard[0]
                            }
                            place={1}
                            winner
                            delay={0.2}
                          />
                        )}

                        {/* THIRD */}
                        {leaderboard[2] && (
                          <HostPodiumCard
                            entry={
                              leaderboard[2]
                            }
                            place={3}
                            delay={0.5}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* COMPLETE RANKINGS */}
                  <div className="w-full max-w-4xl">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Award
                        size={17}
                        className="text-white/50"
                      />

                      <p className="font-display font-bold text-xs md:text-sm text-white/50 uppercase tracking-[0.18em]">
                        Complete Rankings
                      </p>

                      <Award
                        size={17}
                        className="text-white/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[35vh] overflow-y-auto pr-1">
                      {leaderboard.map(
                        (t, i) => (
                          <motion.div
                            key={t.teamId}
                            initial={{
                              opacity: 0,
                              x:
                                i % 2 === 0
                                  ? -20
                                  : 20,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay:
                                0.65 +
                                i * 0.06,
                            }}
                            className={`relative overflow-hidden flex items-center gap-3 rounded-2xl px-4 py-3 border ${
                              i < 3
                                ? "bg-white/5 border-white/10"
                                : "glass border-white/5"
                            }`}
                          >
                            {/* RANK */}
                            <div className="w-9 shrink-0 text-center">
                              {i === 0 ? (
                                <Crown
                                  size={19}
                                  className="mx-auto text-gameyellow"
                                />
                              ) : i ===
                                1 ? (
                                <Medal
                                  size={19}
                                  className="mx-auto text-white/80"
                                />
                              ) : i ===
                                2 ? (
                                <Medal
                                  size={19}
                                  className="mx-auto text-white/60"
                                />
                              ) : (
                                <span className="font-display font-black text-white/45">
                                  {i + 1}
                                </span>
                              )}
                            </div>

                            {/* TEAM COLOR */}
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  t.color,
                              }}
                            />

                            {/* TEAM NAME */}
                            <span className="font-display font-bold flex-1 text-left truncate">
                              {t.name}
                            </span>

                            {/* CORRECT */}
                            <span className="hidden sm:flex items-center gap-1.5 text-white/45 text-xs shrink-0">
                              <CheckCircle2
                                size={13}
                                className="text-gamegreen"
                              />

                              {t.correct}/
                              {game.total_questions}
                            </span>

                            {/* SCORE */}
                            <span className="font-display font-black text-gameyellow min-w-[60px] text-right">
                              {t.score}
                            </span>
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>

                  {/* PLAY AGAIN */}
                  <motion.button
                    onClick={playAgain}
                    disabled={busy}
                    whileHover={{
                      scale: busy
                        ? 1
                        : 1.04,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    className="card-pop mt-7 font-display font-extrabold px-8 py-4 rounded-2xl bg-gamegreen text-ink shadow-pop disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="text-lg">
                      ↻
                    </span>

                    PLAY AGAIN
                  </motion.button>

                  {/* FOOTER */}
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 1.2,
                    }}
                    className="flex items-center justify-center gap-2 mt-6"
                  >
                    <Sparkles
                      size={15}
                      className="text-gameyellow"
                    />

                    <p className="font-display font-bold text-sm md:text-base text-gameyellow">
                      Know the signs. Speak up.
                      Stand together.
                    </p>

                    <Sparkles
                      size={15}
                      className="text-gameyellow"
                    />
                  </motion.div>
                </>
              ) : (
                <div className="glass rounded-2xl px-8 py-7">
                  <Trophy
                    size={32}
                    className="mx-auto mb-3 text-gameyellow animate-pulse"
                  />

                  <p className="font-display animate-pulse text-white/70">
                    Tallying scores…
                  </p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ================================================================
   HOST PODIUM CARD
   ================================================================ */

function HostPodiumCard({
  entry,
  place,
  winner = false,
  delay,
}: {
  entry: LeaderboardEntry;
  place: number;
  winner?: boolean;
  delay: number;
}) {
  const Icon = place === 1 ? Crown : Medal;

  const placeLabel =
    place === 1
      ? "1ST"
      : place === 2
      ? "2ND"
      : "3RD";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 45,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay,
        type: "spring",
        stiffness: 170,
        damping: 15,
      }}
      className={`relative ${
        winner ? "md:-mt-7" : ""
      }`}
    >
      {/* WINNER GLOW */}
      {winner && (
        <motion.div
          animate={{
            opacity: [
              0.25,
              0.65,
              0.25,
            ],
            scale: [
              0.95,
              1.05,
              0.95,
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
          }}
          className="absolute -inset-5 bg-gameyellow/10 blur-3xl rounded-full"
        />
      )}

      <div
        className={`relative overflow-hidden rounded-3xl border p-5 md:p-6 ${
          winner
            ? "bg-gameyellow/8 border-gameyellow/40"
            : "glass border-white/10"
        }`}
      >
        {/* WINNER TOP LINE */}
        {winner && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gameyellow" />
        )}

        {/* ICON */}
        <div className="flex justify-center mb-3">
          <motion.div
            animate={
              winner
                ? {
                    y: [0, -4, 0],
                  }
                : {}
            }
            transition={{
              repeat: Infinity,
              duration: 2.5,
            }}
            className={`rounded-2xl flex items-center justify-center ${
              winner
                ? "w-16 h-16 bg-gameyellow/15"
                : "w-14 h-14 bg-white/5"
            }`}
          >
            <Icon
              size={winner ? 36 : 30}
              strokeWidth={2}
              className={
                winner
                  ? "text-gameyellow"
                  : place === 2
                  ? "text-white/80"
                  : "text-white/55"
              }
            />
          </motion.div>
        </div>

        {/* PLACE */}
        <p
          className={`font-display font-black ${
            winner
              ? "text-gameyellow text-2xl"
              : "text-white/75 text-xl"
          }`}
        >
          {placeLabel}
        </p>

        {/* TEAM COLOR */}
        <div className="flex justify-center mt-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                entry.color,
            }}
          />
        </div>

        {/* TEAM NAME */}
        <p className="font-display font-black text-xl md:text-2xl truncate mt-2 px-2">
          {entry.name}
        </p>

        {/* SCORE */}
        <div className="mt-4">
          <p
            className={`font-display font-black ${
              winner
                ? "text-4xl md:text-5xl text-gameyellow"
                : "text-3xl md:text-4xl text-white"
            }`}
          >
            {entry.score}
          </p>

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
            POINTS
          </p>
        </div>

        {/* CORRECT ANSWERS */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-white/55">
          <CheckCircle2
            size={15}
            className="text-gamegreen"
          />

          <span>
            {entry.correct} correct
          </span>
        </div>
      </div>
    </motion.div>
  );
}