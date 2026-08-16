"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  CheckCircle2,
  CircleUserRound,
  CircleX,
} from "lucide-react";

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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Record<number, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(
    null
  );
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prevent an older question request from overwriting newer reveal data.
  const questionRequestRef = useRef(0);

  // Restore saved team from this device
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem(storageKey)
        : null;

    if (raw) {
      try {
        setTeam(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [storageKey]);

  // If the host reset the game, our saved team no longer exists
  useEffect(() => {
    if (
      !loading &&
      team &&
      game &&
      game.phase === "lobby" &&
      teams.length >= 0
    ) {
      const stillThere = teams.some((t) => t.id === team.teamId);

      if (!stillThere && teams.length === 0) {
        // Likely a fresh/reset game.
        // Give realtime state a moment to settle.
      }
    }
  }, [loading, team, game, teams]);

  async function joinGame(e: React.FormEvent) {
    e.preventDefault();

    const name = nameInput.trim();

    if (!name) return;

    soundEngine.unlock();
    soundEngine.click();

    setJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/game/${code}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not join game.");
      }

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

  // ============================================================
  // QUESTION DATA
  // ============================================================

  useEffect(() => {
    if (!code || !game || game.current_question < 0) return;

    const questionIndex = game.current_question;
    const phase = game.phase;
    const requestId = ++questionRequestRef.current;
    const controller = new AbortController();

    // Only clear the old question when moving to a genuinely new question.
    // During question -> reveal we keep the player's selection visible.
    if (phase === "question") {
      setSelected(null);
      setSubmitted(false);
      setSubmitting(false);
      setSubmitError(null);
      setQuestion((current) =>
        current?.idx === questionIndex ? current : null
      );
    }

    async function loadQuestion() {
      try {
        const res = await fetch(
          `/api/game/${code}/question?idx=${questionIndex}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        // Ignore responses belonging to an older request.
        if (
          controller.signal.aborted ||
          requestId !== questionRequestRef.current
        ) {
          return;
        }

        // Never allow data for another question to enter this screen.
        if (data?.idx !== undefined && data.idx !== questionIndex) {
          return;
        }

        setQuestion(data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Question loading failed:", error);
      }
    }

    loadQuestion();

    return () => {
      controller.abort();
    };
  }, [code, game?.current_question, game?.phase]);

  // Fetch leaderboard when the game reaches the leaderboard phase
  useEffect(() => {
    if (game?.phase === "leaderboard" && code) {
      fetch(`/api/game/${code}/leaderboard`)
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setLeaderboard(d.leaderboard);
            setConfettiTrigger((n) => n + 1);

            setTimeout(() => {
              soundEngine.podiumCelebrate();
            }, 500);
          }
        });
    } else {
      setLeaderboard(null);
    }
  }, [game?.phase, code]);

  // Personal correct/incorrect feedback only after reveal data is ready.
  // This prevents the temporary wrong result caused by stale question data.
  const soundedRevealRef = useRef<number | null>(null);

  const revealDataReady =
    game?.phase === "reveal" &&
    !!question &&
    question.idx === game.current_question &&
    typeof question.correctIndex === "number" &&
    typeof question.explanation === "string";

  useEffect(() => {
    if (!revealDataReady || !game || !question) return;

    const questionIndex = game.current_question;

    if (soundedRevealRef.current === questionIndex) return;

    soundedRevealRef.current = questionIndex;

    const mySelection = myAnswers[questionIndex];

    if (mySelection === undefined) return;

    if (mySelection === question.correctIndex) {
      soundEngine.correct();
    } else {
      soundEngine.incorrect();
    }
  }, [
    revealDataReady,
    game?.current_question,
    question,
    myAnswers,
  ]);

  function selectAnswer(idx: number) {
    if (!team || !game) return;
    if (game.phase !== "question") return;
    if (submitted || submitting) return;

    soundEngine.click();
    setSelected(idx);
  }

  async function submitAnswer() {
    if (
      !team ||
      !game ||
      selected === null ||
      submitted ||
      submitting
    ) {
      return;
    }

    if (game.phase !== "question") return;

    const questionIndex = game.current_question;
    const selectedIndex = selected;

    soundEngine.click();

    // Lock locally immediately. The server still remains authoritative for
    // scoring and bonus time, so network latency cannot make the UI appear
    // unlocked after the player has already submitted.
    setSubmitError(null);
    setSubmitting(true);
    setSubmitted(true);

    // Keep the exact submitted choice locally so reveal feedback is available
    // even if the server response arrives after the host reveals the answer.
    setMyAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedIndex,
    }));

    try {
      const res = await fetch(`/api/game/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.teamId,
          questionIdx: questionIndex,
          selectedIndex,
        }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Could not submit answer.");
      }
    } catch (error) {
      console.error("Answer submission failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not submit answer."
      );

      // If the question is still live, unlock so the player can retry.
      // If reveal has already started, never unlock the answer UI.
      if (game.phase === "question") {
        setSubmitted(false);
        setMyAnswers((prev) => {
          const next = { ...prev };
          delete next[questionIndex];
          return next;
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const myRank = useMemo(() => {
    if (!leaderboard || !team) return null;

    const i = leaderboard.findIndex((t) => t.teamId === team.teamId);

    return i === -1
      ? null
      : {
          place: i + 1,
          entry: leaderboard[i],
        };
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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gameyellow/15 border border-gameyellow/30 flex items-center justify-center">
              <Trophy
                size={34}
                strokeWidth={2.4}
                className="text-gameyellow"
              />
            </div>
          </div>

          <h1 className="font-display font-black text-2xl mb-1">
            Join the Game
          </h1>

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
            <p className="text-gamepink text-sm font-semibold mb-4">
              {joinError}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={joining || !nameInput.trim()}
            whileHover={{
              scale: joining || !nameInput.trim() ? 1 : 1.03,
            }}
            whileTap={{ scale: 0.97 }}
            className="card-pop w-full font-display font-extrabold text-lg py-4 rounded-2xl bg-gamegreen text-ink shadow-pop disabled:opacity-50"
          >
            {joining ? "Joining…" : "JOIN TEAM"}
          </motion.button>
        </motion.form>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-display text-xl text-white/70 animate-pulse">
          Connecting…
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col px-4 py-6">
      <BackgroundShapes />

      <Confetti trigger={confettiTrigger} />

      <header className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />

          <span className="font-display font-bold truncate">
            {team.name}
          </span>
        </div>

        {game.phase === "question" || game.phase === "reveal" ? (
          <span className="font-display font-bold text-white/60 text-sm">
            Q{game.current_question + 1}/{game.total_questions}
          </span>
        ) : null}
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ---------------- LOBBY ---------------- */}
          {game.phase === "lobby" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                }}
                className="flex justify-center mb-5"
              >
                <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center border border-white/10">
                  <Trophy
                    size={42}
                    strokeWidth={2}
                    className="text-gameyellow"
                  />
                </div>
              </motion.div>

              <h2 className="font-display font-black text-2xl mb-2">
                You're in!
              </h2>

              <p className="text-white/70">
                Sit tight, the host will start the quiz on the big screen.
              </p>

              <div className="mt-8 glass rounded-2xl px-6 py-4 inline-block">
                <p className="text-sm text-white/60">Playing as</p>

                <p
                  className="font-display font-extrabold text-xl"
                  style={{ color: team.color }}
                >
                  {team.name}
                </p>
              </div>
            </motion.div>
          )}

          {/* ---------------- QUESTION / REVEAL ---------------- */}
          {(game.phase === "question" || game.phase === "reveal") &&
            question && (
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
                    className="mb-4 font-display font-bold text-gamegreen text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 size={17} />
                    {submitted ? "Answer locked" : "Answer selected"}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 gap-3 w-full">
                  {question.options.map((opt, i) => {
                    // Never show correct/wrong feedback until the reveal
                    // payload for THIS question is confirmed.
                    const showResult = revealDataReady;

                    const answerForDisplay = showResult
                      ? myAnswers[game.current_question] ?? selected
                      : selected;

                    const isSelected =
                      answerForDisplay === i;

                    const isCorrectOpt =
                      showResult &&
                      question.correctIndex === i;

                    const isWrongSelected =
                      showResult &&
                      isSelected &&
                      question.correctIndex !== i;

                    const dim =
                      showResult &&
                      !isCorrectOpt &&
                      !isWrongSelected;

                    return (
                      <motion.button
                        key={i}
                        type="button"
                        disabled={
                          game.phase === "reveal" ||
                          submitted ||
                          submitting
                        }
                        onClick={() => selectAnswer(i)}
                        whileHover={
                          game.phase === "question" &&
                          !submitted &&
                          !submitting
                            ? { scale: 1.02 }
                            : {}
                        }
                        whileTap={
                          game.phase === "question" &&
                          !submitted &&
                          !submitting
                            ? { scale: 0.96 }
                            : {}
                        }
                        animate={
                          isCorrectOpt
                            ? { scale: [1, 1.05, 1] }
                            : isWrongSelected
                            ? {
                                x: [0, -6, 5, -3, 2, 0],
                                opacity: 0.85,
                              }
                            : dim
                            ? { opacity: 0.35 }
                            : {}
                        }
                        className={`glow-card ${
                          isCorrectOpt
                            ? "is-glowing"
                            : ""
                        } card-pop min-h-[64px] rounded-2xl px-5 py-4 flex items-center gap-3 font-display font-bold text-lg shadow-pop text-left disabled:cursor-default relative overflow-hidden`}
                        style={{
                          backgroundColor: OPTION_COLORS[i],
                          color: "#161235",
                          outline: isWrongSelected
                            ? "4px solid #ef4444"
                            : isSelected && !showResult
                            ? "4px solid white"
                            : "none",
                          outlineOffset: 2,
                        }}
                      >
                        {isCorrectOpt && (
                          <span className="absolute inset-0 rounded-2xl border-4 border-gamegreen animate-pulseRing" />
                        )}

                        {isWrongSelected && (
                          <span className="absolute inset-0 rounded-2xl border-4 border-red-500" />
                        )}

                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-ink text-white font-black text-sm shrink-0">
                          {OPTION_LETTERS[i]}
                        </span>

                        <span className="flex-1 pr-10">
                          {opt}
                        </span>

                        {isCorrectOpt && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-gamegreen">
                            <CheckCircle2
                              size={28}
                              strokeWidth={2.5}
                            />
                          </span>
                        )}

                        {isWrongSelected && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-red-500">
                            <CircleX
                              size={28}
                              strokeWidth={2.5}
                            />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}

                  {submitError && game.phase === "question" && (
                  <p className="mt-3 text-center text-gamepink text-xs font-semibold">
                    {submitError}
                  </p>
                )}

                {game.phase === "question" && (
                    <motion.button
                      type="button"
                      onClick={submitAnswer}
                      disabled={
                        selected === null ||
                        submitted ||
                        submitting
                      }
                      whileHover={{
                        scale:
                          selected !== null &&
                          !submitted &&
                          !submitting
                            ? 1.03
                            : 1,
                      }}
                      whileTap={{
                        scale:
                          selected !== null &&
                          !submitted &&
                          !submitting
                            ? 0.97
                            : 1,
                      }}
                      className="mt-5 w-full max-w-md mx-auto py-4 rounded-2xl font-display font-extrabold text-lg bg-gamegreen text-ink shadow-pop transition-all disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      {submitting
                        ? "SUBMITTING..."
                        : submitted
                        ? "ANSWER LOCKED"
                        : selected === null
                        ? "SELECT AN ANSWER"
                        : "SUBMIT ANSWER"}
                    </motion.button>
                  )}

                </div>

                {revealDataReady && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 glass rounded-2xl p-4 text-center"
                  >
                    <p className="text-white/85 text-sm">
                      <span className="inline-flex align-middle mr-1">
                        <Award size={17} className="text-gameyellow" />
                      </span>
                      {question.explanation}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

          {/* ---------------- LEADERBOARD ---------------- */}
          {game.phase === "leaderboard" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center w-full max-w-4xl px-2"
            >
              {leaderboard ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-5 md:mb-7"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="relative flex justify-center mb-3"
                    >
                      <div className="absolute inset-0 bg-gameyellow/20 blur-2xl rounded-full" />
                      <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-3xl glass border border-gameyellow/30 flex items-center justify-center">
                        <Trophy size={36} className="md:hidden text-gameyellow" strokeWidth={2} />
                        <Trophy size={42} className="hidden md:block text-gameyellow" strokeWidth={2} />
                      </div>
                    </motion.div>

                    <div className="flex items-center justify-center gap-2">
                      <Sparkles size={17} className="text-gameyellow" />
                      <h2 className="text-shimmer animate-shimmer font-display font-black text-3xl md:text-5xl bg-clip-text text-transparent">
                        FINAL RESULTS
                      </h2>
                      <Sparkles size={17} className="text-gameyellow" />
                    </div>

                    <p className="mt-2 text-gameyellow/70 font-display font-bold text-[10px] md:text-xs uppercase tracking-[0.22em]">
                      YOUR FINAL POSITION
                    </p>

                    <p className="text-white/40 text-xs mt-1">
                      {leaderboard.length} {leaderboard.length === 1 ? "team" : "teams"} competed
                    </p>
                  </motion.div>

                  {myRank && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 170, damping: 16 }}
                      className="relative overflow-hidden mb-6 rounded-3xl border border-gameyellow/45 bg-gameyellow/10 backdrop-blur-xl px-5 py-5 shadow-xl"
                    >
                      <div className="absolute inset-0 bg-gameyellow/10 pointer-events-none" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gameyellow/15 border border-gameyellow/20 flex items-center justify-center shrink-0">
                          <CircleUserRound size={24} className="text-gameyellow" />
                        </div>

                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-gameyellow/65 font-black">
                            YOUR TEAM
                          </p>
                          <p className="font-display font-black text-lg md:text-xl truncate">
                            {team.name}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {myRank.entry.correct}/{game.total_questions} correct
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-display font-black text-3xl text-gameyellow">
                            #{myRank.place}
                          </p>
                          <p className="font-display font-bold text-xs text-white/45">
                            {myRank.entry.score} POINTS
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {leaderboard.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="mb-7"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
                        {leaderboard[1] && (
                          <PodiumCard
                            entry={leaderboard[1]}
                            place={2}
                            isMe={leaderboard[1].teamId === team.teamId}
                            delay={0.35}
                          />
                        )}

                        {leaderboard[0] && (
                          <PodiumCard
                            entry={leaderboard[0]}
                            place={1}
                            isMe={leaderboard[0].teamId === team.teamId}
                            delay={0.2}
                            winner
                          />
                        )}

                        {leaderboard[2] && (
                          <PodiumCard
                            entry={leaderboard[2]}
                            place={3}
                            isMe={leaderboard[2].teamId === team.teamId}
                            delay={0.5}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-left"
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Award size={16} className="text-white/50" />
                      <p className="font-display font-bold text-[10px] md:text-xs text-white/50 uppercase tracking-[0.2em]">
                        Everyone's Position
                      </p>
                      <Award size={16} className="text-white/50" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/15 backdrop-blur-sm p-2">
                      <div className="w-full max-h-[34vh] overflow-y-auto pr-1 space-y-2">
                        {leaderboard.map((entry, index) => {
                          const place = index + 1;
                          const isMe = entry.teamId === team.teamId;

                          return (
                            <motion.div
                              key={entry.teamId}
                              initial={{ opacity: 0, x: -15 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + index * 0.045 }}
                              className={`relative overflow-hidden flex items-center gap-3 rounded-xl px-3 py-3 md:px-4 border transition-all ${
                                isMe
                                  ? "bg-gameyellow/10 border-gameyellow/60 shadow-lg shadow-gameyellow/5"
                                  : index === 0
                                  ? "bg-gameyellow/5 border-gameyellow/20"
                                  : "glass border-white/5"
                              }`}
                            >
                              <div className="w-9 shrink-0 text-center">
                                {index === 0 ? (
                                  <Crown size={18} className="mx-auto text-gameyellow" />
                                ) : index === 1 ? (
                                  <Medal size={18} className="mx-auto text-white/80" />
                                ) : index === 2 ? (
                                  <Medal size={18} className="mx-auto text-white/55" />
                                ) : (
                                  <span className="font-display font-black text-white/50">
                                    {place}
                                  </span>
                                )}
                              </div>

                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-bold truncate text-sm">
                                    {entry.name}
                                  </span>
                                  {isMe && (
                                    <span className="text-[9px] font-black tracking-wider text-gameyellow bg-gameyellow/10 border border-gameyellow/20 px-1.5 py-0.5 rounded-md shrink-0">
                                      YOU
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <CheckCircle2 size={12} className="text-gamegreen" />
                                  <span className="text-[11px] text-white/40">
                                    {entry.correct}/{game.total_questions} correct
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="font-display font-black text-base md:text-lg text-gameyellow">
                                  {entry.score}
                                </p>
                                <p className="text-[8px] uppercase tracking-wider text-white/30 font-bold">
                                  points
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative mx-auto w-[280px] md:w-[320px] rounded-3xl border border-gameyellow/20 bg-black/45 backdrop-blur-2xl px-6 py-7 shadow-2xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gameyellow/10 border border-gameyellow/20"
                  >
                    <Trophy size={26} className="text-gameyellow" />
                  </motion.div>

                  <p className="font-display font-black text-sm uppercase tracking-[0.16em] text-white">
                    Calculating Scores
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Checking answers and finalising positions...
                  </p>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gameyellow"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/25 font-bold">
                    <span>Answers</span>
                    <span>•</span>
                    <span>Speed Bonus</span>
                    <span>•</span>
                    <span>Rankings</span>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2 mt-6"
              >
                <Sparkles size={13} className="text-gameyellow" />
                <p className="font-display font-bold text-gameyellow text-xs md:text-sm">
                  Know the signs. Speak up. Stand together.
                </p>
                <Sparkles size={13} className="text-gameyellow" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ============================================================
   PODIUM CARD
   ============================================================ */

function PodiumCard({
  entry,
  place,
  isMe,
  delay,
  winner = false,
}: {
  entry: LeaderboardEntry;
  place: number;
  isMe: boolean;
  delay: number;
  winner?: boolean;
}) {
  const Icon =
    place === 1 ? Crown : place === 2 ? Medal : Medal;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 35,
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
        stiffness: 180,
        damping: 16,
      }}
      className={`relative ${
        winner ? "sm:-mt-5" : ""
      }`}
    >
      {winner && (
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
          }}
          className="absolute -inset-4 bg-gameyellow/10 blur-2xl rounded-full"
        />
      )}

      <div
        className={`relative overflow-hidden rounded-3xl border p-5 ${
          isMe
            ? "border-gameyellow/70 bg-gameyellow/10"
            : winner
            ? "border-gameyellow/40 bg-gameyellow/5"
            : "border-white/10 glass"
        }`}
      >
        {winner && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gameyellow" />
        )}

        {/* ICON */}
        <div className="flex justify-center mb-3">
          <div
            className={`relative flex items-center justify-center rounded-2xl ${
              winner
                ? "w-16 h-16 bg-gameyellow/15"
                : "w-14 h-14 bg-white/5"
            }`}
          >
            {winner && (
              <div className="absolute inset-0 rounded-2xl border border-gameyellow/20 animate-pulse" />
            )}

            <Icon
              size={winner ? 34 : 29}
              strokeWidth={2}
              className={
                winner
                  ? "text-gameyellow"
                  : place === 2
                  ? "text-white/80"
                  : "text-white/60"
              }
            />
          </div>
        </div>

        {/* PLACE */}
        <p
          className={`font-display font-black ${
            winner
              ? "text-2xl text-gameyellow"
              : "text-xl text-white/80"
          }`}
        >
          {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
        </p>

        {/* TEAM COLOR */}
        <div className="flex justify-center mt-2 mb-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: entry.color,
            }}
          />
        </div>

        {/* NAME */}
        <p className="font-display font-black text-lg truncate px-1">
          {entry.name}
        </p>

        {isMe && (
          <span className="inline-block mt-2 text-[10px] font-black tracking-wider text-gameyellow bg-gameyellow/10 border border-gameyellow/20 px-2 py-1 rounded-md">
            YOUR TEAM
          </span>
        )}

        {/* SCORE */}
        <div className="mt-4">
          <p
            className={`font-display font-black ${
              winner
                ? "text-3xl text-gameyellow"
                : "text-2xl text-white"
            }`}
          >
            {entry.score}
          </p>

          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
            points
          </p>
        </div>

        {/* CORRECT */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-white/55">
          <CheckCircle2
            size={14}
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