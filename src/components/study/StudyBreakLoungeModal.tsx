"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Music,
  Headphones,
  Radio,
  Clock,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  Search,
  Copy,
  Check,
  Brain,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { playSuccessChime, playAttentionPing } from "@/lib/audio-cue";
import { cn } from "@/lib/utils";

export interface TechPodcastItem {
  id: string;
  rank: number;
  title: string;
  host: string;
  badge: string;
  description: string;
  recommendedTopic: string;
  audioDuration: string;
  youtubeMusicQuery: string;
  directUrl: string;
  videoId: string;
}

export const TOP_10_TECH_PODCASTS: TechPodcastItem[] = [
  {
    id: "se-daily",
    rank: 1,
    title: "Software Engineering Daily",
    host: "Sean Falconer & Engineering Leaders",
    badge: "Distributed Systems & Architecture",
    description: "Deep technical interviews on real-world production systems: distributed databases, Kafka internals, Kubernetes scale, and microservices.",
    recommendedTopic: "PostgreSQL internals, transactional outbox & microservice communication",
    audioDuration: "45–60 mins · Audio-first",
    youtubeMusicQuery: "Software Engineering Daily podcast",
    directUrl: "https://music.youtube.com/search?q=Software+Engineering+Daily+podcast",
    videoId: "1wZf76N3r9Y",
  },
  {
    id: "lex-fridman",
    rank: 2,
    title: "Lex Fridman Podcast (Computer Science Series)",
    host: "Lex Fridman",
    badge: "AI, Foundational CS & Visionaries",
    description: "Multi-hour philosophical and technical conversations with computing pioneers (Guido van Rossum, Yann LeCun, Andrej Karpathy, John Carmack).",
    recommendedTopic: "Ep #392 Andrej Karpathy on LLM OS, neural networks & compute scale",
    audioDuration: "2–4 hours · Deep Immersion",
    youtubeMusicQuery: "Lex Fridman Podcast",
    directUrl: "https://music.youtube.com/search?q=Lex+Fridman+Podcast",
    videoId: "zjkBMFhNj_g",
  },
  {
    id: "the-changelog",
    rank: 3,
    title: "The Changelog: Software Development",
    host: "Adam Stacoviak & Jerod Santo",
    badge: "Open Source, Languages & Tooling",
    description: "Conversations with the hackers, founders, and maintainers building modern open-source software, developer tools, and compilers.",
    recommendedTopic: "Deep dive on Zig, Bun runtime, and the future of JavaScript tooling",
    audioDuration: "60–75 mins · Conversational",
    youtubeMusicQuery: "The Changelog software podcast",
    directUrl: "https://music.youtube.com/search?q=The+Changelog+podcast",
    videoId: "u2p18G6V_wM",
  },
  {
    id: "prime-time",
    rank: 4,
    title: "The Prime Time / ThePrimeagen (Audio)",
    host: "ThePrimeagen",
    badge: "Engineering Mindset & Real-World Code",
    description: "High-energy engineering discussions, Neovim workflows, performance bottlenecks, tech layoff reality checks, and architectural debates.",
    recommendedTopic: "Senior engineer communication, writing performant Go/Rust, and tech career sanity",
    audioDuration: "20–40 mins · High Energy",
    youtubeMusicQuery: "ThePrimeagen The Prime Time",
    directUrl: "https://music.youtube.com/search?q=ThePrimeagen+The+Prime+Time",
    videoId: "oJYZq_m6f68",
  },
  {
    id: "latent-space",
    rank: 5,
    title: "Latent Space: The AI Engineer Podcast",
    host: "Swyx (Shawn Wang) & Alessio Fanelli",
    badge: "AI Engineering & LLM Systems",
    description: "The definitive technical show for software engineers transitioning into AI engineering: agent architectures, evals, fine-tuning, and inference scale.",
    recommendedTopic: "Production RAG patterns, structured outputs, and Autonomous Coding Agents",
    audioDuration: "45–60 mins · Cutting Edge",
    youtubeMusicQuery: "Latent Space AI Engineer Podcast",
    directUrl: "https://music.youtube.com/search?q=Latent+Space+AI+Engineer+Podcast",
    videoId: "9dGf8B-mK5w",
  },
  {
    id: "syntax-fm",
    rank: 6,
    title: "Syntax: Tasty Web Development Treats",
    host: "Wes Bos & Scott Tolinski",
    badge: "Full-Stack Web & TypeScript",
    description: "Bite-sized and deep-dive technical rundowns of React 19, TypeScript strict mode, CSS subgrid, Node vs Deno, and web performance.",
    recommendedTopic: "Full-stack server actions, caching invalidation, and TypeScript tricks",
    audioDuration: "40–55 mins · Practical Web",
    youtubeMusicQuery: "Syntax Tasty Web Development Treats",
    directUrl: "https://music.youtube.com/search?q=Syntax+Tasty+Web+Development+Treats",
    videoId: "yF6N1Jt7LqY",
  },
  {
    id: "corecursive",
    rank: 7,
    title: "CoRecursive: Stories in Code",
    host: "Adam Gordon Bell",
    badge: "Engineering Lore & Human Stories",
    description: "Riveting narrative stories behind software breakthroughs, SQLite's creation, debugging space probes, and overcoming catastrophic production failures.",
    recommendedTopic: "The untold story of SQLite: The database that conquered every phone",
    audioDuration: "50–70 mins · Narrative Documentary",
    youtubeMusicQuery: "CoRecursive Stories in Code",
    directUrl: "https://music.youtube.com/search?q=CoRecursive+Stories+in+Code",
    videoId: "v5x58m3mR4M",
  },
  {
    id: "acquired",
    rank: 8,
    title: "Acquired (Tech Architecture & Business)",
    host: "Ben Gilbert & David Rosenthal",
    badge: "Tech Giants & Business Architecture",
    description: "Legendary 3-4 hour examinations of how technology giants built their platforms, hardware supply chains, and network effect moats.",
    recommendedTopic: "NVIDIA (The GPU Architecture & CUDA Playbook) / TSMC fabrication",
    audioDuration: "3–4 hours · Masterclass",
    youtubeMusicQuery: "Acquired podcast",
    directUrl: "https://music.youtube.com/search?q=Acquired+podcast",
    videoId: "8A6o5q51h0I",
  },
  {
    id: "se-radio",
    rank: 9,
    title: "Software Engineering Radio (IEEE)",
    host: "IEEE Computer Society Experts",
    badge: "Formal CS & Systems Theory",
    description: "Rigorous academic and industrial deep dives into formal computer science, garbage collector algorithms, distributed consensus, and concurrency.",
    recommendedTopic: "Distributed Consensus: Raft vs Multi-Paxos in mission-critical storage",
    audioDuration: "45–60 mins · Academic Rigor",
    youtubeMusicQuery: "Software Engineering Radio podcast",
    directUrl: "https://music.youtube.com/search?q=Software+Engineering+Radio+podcast",
    videoId: "qC9hGv6uY10",
  },
  {
    id: "dwarkesh",
    rank: 10,
    title: "The Dwarkesh Podcast",
    host: "Dwarkesh Patel",
    badge: "Compute Infrastructure & AGI Horizons",
    description: "Intense, deeply researched technical interviews on semiconductor physics, compute clusters, transformer scaling laws, and supercomputing limits.",
    recommendedTopic: "Frontier model training infrastructure, GPU clusters & chip design",
    audioDuration: "90–120 mins · Intellectual Depth",
    youtubeMusicQuery: "Dwarkesh Podcast",
    directUrl: "https://music.youtube.com/search?q=Dwarkesh+Podcast",
    videoId: "eT7k4j2V4y4",
  },
];

export const YOUTUBE_MUSIC_FLOW_STATIONS = [
  {
    id: "lofi-coding",
    name: "Lo-Fi Coding Beats",
    genre: "Chillhop / Beats to Relax & Focus",
    query: "lofi coding beats to study to",
    url: "https://music.youtube.com/search?q=lofi+coding+beats+to+study+to",
    videoId: "jfKfPfyJRdk",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  },
  {
    id: "synthwave-flow",
    name: "Synthwave / Cyberpunk Flow",
    genre: "Retrowave / High Velocity Coding",
    query: "synthwave coding flow chillwave",
    url: "https://music.youtube.com/search?q=synthwave+coding+flow+chillwave",
    videoId: "4xDzrJKXOOY",
    color: "from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/30",
  },
  {
    id: "ambient-alpha",
    name: "432Hz Deep Focus Soundscape",
    genre: "Ambient / Binaural Alpha Waves",
    query: "432hz deep focus study music ambient",
    url: "https://music.youtube.com/search?q=432hz+deep+focus+study+music+ambient",
    videoId: "WPni755-Krg",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
  },
  {
    id: "classical-baroque",
    name: "Baroque & Classical Focus",
    genre: "Bach, Vivaldi & Piano Concentration",
    query: "classical concentration for programming",
    url: "https://music.youtube.com/search?q=classical+concentration+for+programming",
    videoId: "mIYzp5maRm8",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
];

export const HIGH_YIELD_BREAK_QUESTIONS = [
  {
    topic: "Distributed Systems & Storage",
    question: "How does Cassandra achieve high write throughput, and what is the exact write path from node to disk?",
    answer: "Writes append to CommitLog on disk (sequential I/O for durability) while simultaneously writing to in-memory Memtable. When Memtable is full, it is flushed sequentially to an immutable SSTable file. No in-place updates or disk seeks occur during writes.",
  },
  {
    topic: "Databases & MVCC",
    question: "How does PostgreSQL MVCC handle updates, and why does VACUUM exist?",
    answer: "In Postgres, an UPDATE creates a new row tuple with an incremented xmin and marks the old row tuple with xmax. The old row becomes a dead tuple once no active transaction can see it. VACUUM scans table pages, reclaims dead tuples, and updates the visibility map to prevent transaction ID wraparound.",
  },
  {
    topic: "Operating Systems & Networking",
    question: "Why is Linux epoll O(1) compared to select/poll O(N) when handling 100,000 concurrent sockets?",
    answer: "select and poll pass the entire file descriptor set to the kernel on every call (O(N) copy and scan). epoll registers file descriptors once in an in-kernel Red-Black tree and uses a kernel callback when a socket is ready, placing only the ready events into a ready list (O(1) retrieval).",
  },
  {
    topic: "Networking & Protocols",
    question: "How does HTTP/3 (QUIC over UDP) solve Head-of-Line (HoL) blocking compared to HTTP/2?",
    answer: "HTTP/2 multiplexes multiple streams over a single TCP connection. If one TCP packet drops, TCP pauses all streams while waiting for retransmission. HTTP/3 runs over QUIC/UDP where packet loss on stream A only delays stream A; streams B and C continue uninterrupted.",
  },
  {
    topic: "System Design & Rate Limiting",
    question: "Compare Token Bucket vs Leaky Bucket algorithms for API rate limiting.",
    answer: "Token Bucket accumulates tokens at a steady rate up to a capacity burst limit; requests consume tokens, allowing bursty traffic. Leaky Bucket queues requests and processes them at a strictly constant rate, smoothing out bursts into uniform traffic.",
  },
  {
    topic: "System Design & Caching",
    question: "How does Consistent Hashing minimize cache reorganization when nodes are added or removed?",
    answer: "Nodes and cache keys are mapped onto a 360-degree hash ring. When a node is added or removed, only keys in the immediate adjacent range between neighboring nodes need to be remapped (1/N of keys on average), rather than re-hashing all keys as with hash(key) % N.",
  },
  {
    topic: "Distributed Consensus",
    question: "In Raft consensus, how does a leader prevent split-brain and ensure stale leaders cannot commit conflicting entries?",
    answer: "Every candidate must win votes from a strict majority of nodes (quorum: N/2 + 1) in a strictly monotonic term. A node will refuse to vote for any candidate whose log is less up-to-date than its own. Heartbeats with the current term force stale leaders into follower state.",
  },
  {
    topic: "Web Architecture & React",
    question: "What is the architectural difference between React Server Components (RSC) and traditional Client-Side Hydration?",
    answer: "RSC execute purely on the server and emit a serialized component tree stream (RSC payload), never bundling their server dependencies into the client JavaScript bundle. Client hydration recreates React fiber tree and attaches DOM listeners to server-rendered HTML.",
  },
];

interface StudyBreakLoungeModalProps {
  open: boolean;
  onClose: () => void;
  defaultTimerMinutes?: number;
}

interface ActivePlayingStream {
  id: string;
  title: string;
  host: string;
  badge: string;
  videoId: string;
}

export default function StudyBreakLoungeModal({
  open,
  onClose,
  defaultTimerMinutes = 5,
}: StudyBreakLoungeModalProps) {
  const [, startTransition] = useTransition();
  const [selectedMinutes, setSelectedMinutes] = useState(defaultTimerMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(defaultTimerMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"podcasts" | "music">("podcasts");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Focus barrier states
  const [playingStream, setPlayingStream] = useState<ActivePlayingStream | null>(null);
  const [isOledBlackout, setIsOledBlackout] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Reset timer if duration preset selected
  const handleSelectPreset = (minutes: number) => {
    setSelectedMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsTimerRunning(false);
  };

  // Launch audio stream with 100% opaque barrier locked on top
  const handlePlayAudioStream = (stream: ActivePlayingStream) => {
    setPlayingStream(stream);
    setIsAudioPlaying(true);
    setIsAnswerRevealed(false);
    setIsOledBlackout(false);
    if (!isTimerRunning && secondsRemaining > 0) {
      setIsTimerRunning(true);
      playAttentionPing();
    }
  };

  // Copy link helper
  const handleCopyLink = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (!open || !isTimerRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          playSuccessChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isTimerRunning]);

  // Keyboard navigation: Esc to close or stop stream
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (playingStream) {
          setPlayingStream(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, playingStream]);

  if (!open) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const totalSeconds = selectedMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  const categories = ["all", "Systems", "AI", "Open Source", "Mindset", "Web", "History"];

  const filteredPodcasts = TOP_10_TECH_PODCASTS.filter((podcast) => {
    const matchesCategory =
      filterCategory === "all"
        ? true
        : filterCategory === "Systems"
        ? podcast.badge.includes("Systems") || podcast.badge.includes("Architecture")
        : filterCategory === "AI"
        ? podcast.badge.includes("AI")
        : filterCategory === "Open Source"
        ? podcast.badge.includes("Open Source")
        : filterCategory === "Mindset"
        ? podcast.badge.includes("Mindset")
        : filterCategory === "Web"
        ? podcast.badge.includes("Web")
        : filterCategory === "History"
        ? podcast.badge.includes("History") || podcast.badge.includes("Lore")
        : true;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      podcast.title.toLowerCase().includes(q) ||
      podcast.host.toLowerCase().includes(q) ||
      podcast.description.toLowerCase().includes(q) ||
      podcast.recommendedTopic.toLowerCase().includes(q) ||
      podcast.badge.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const currentQ = HIGH_YIELD_BREAK_QUESTIONS[questionIndex % HIGH_YIELD_BREAK_QUESTIONS.length];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ─── 100% OPAQUE FULL-SCREEN BARRIER ON TOP OF YOUTUBE AUDIO ─────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {playingStream ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mindful Audio Focus Shield"
          className={cn(
            "fixed inset-0 z-[99999] flex flex-col justify-between overflow-y-auto animate-in fade-in duration-300",
            isOledBlackout ? "bg-black text-slate-400" : "bg-slate-950 text-slate-100"
          )}
        >
          {/* Hidden YouTube Audio Iframe: zero dimensions, no video visible */}
          <div className="sr-only pointer-events-none opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            {isAudioPlaying && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playingStream.videoId}?autoplay=1&enablejsapi=1&playsinline=1`}
                title="Audio Stream"
                allow="autoplay; encrypted-media"
                className="w-1 h-1 pointer-events-none"
              />
            )}
          </div>

          {/* Top Shield Header Bar */}
          <header className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b transition-colors",
            isOledBlackout ? "border-zinc-900 bg-black" : "border-white/10 bg-slate-950/80 backdrop-blur-md"
          )}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-white tracking-wide">
                    Focus Shield Active // YouTube Screen Locked
                  </span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    Audio Only · Zero Video
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Visual working memory protected. Cognitive recall in progress.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Break Countdown Timer */}
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 shadow-xs">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-sm font-bold tabular-nums text-white">
                  {timeFormatted}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={isTimerRunning ? "Pause break timer" : "Resume break timer"}
                >
                  {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* OLED Blackout Toggle */}
              <button
                type="button"
                onClick={() => setIsOledBlackout(!isOledBlackout)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                  isOledBlackout
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                )}
                title="Toggle OLED Pure Black mode for eye relaxation"
              >
                {isOledBlackout ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{isOledBlackout ? "Lights On" : "OLED Blackout"}</span>
              </button>

              {/* Exit to Study Button */}
              <button
                type="button"
                onClick={() => {
                  setPlayingStream(null);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                <span>Return to Study</span>
              </button>
            </div>
          </header>

          {/* Central Body Content */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            {isOledBlackout ? (
              /* OLED Minimalist Blackout Mode */
              <div
                onClick={() => setIsOledBlackout(false)}
                className="text-center space-y-4 py-20 cursor-pointer select-none"
              >
                <div className="font-mono text-6xl font-extrabold text-zinc-700 tracking-tight">
                  {timeFormatted}
                </div>
                <p className="text-xs font-mono text-zinc-600">
                  OLED Eye Rest Active · Click anywhere to reveal controls
                </p>
              </div>
            ) : (
              /* Full Architectural Recall and Equalizer View */
              <>
                {/* Now Playing Banner with Equalizer */}
                <div className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                          {playingStream.badge}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">Audio Stream Active</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-display font-extrabold text-white">
                        {playingStream.title}
                      </h2>
                      <p className="text-xs text-slate-300 font-mono">{playingStream.host}</p>
                    </div>

                    {/* Equalizer Waveform Animation */}
                    <div className="flex items-end gap-1 h-9 px-4 py-1 rounded-xl bg-black/40 border border-white/10 shrink-0">
                      {[14, 28, 18, 34, 22, 12, 30, 24, 16, 32].map((height, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-emerald-400 animate-pulse"
                          style={{
                            height: isAudioPlaying ? `${height}px` : "4px",
                            animationDelay: `${i * 120}ms`,
                            animationDuration: "900ms",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Audio Controls Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAudioPlaying(!isAudioPlaying)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer"
                      >
                        {isAudioPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        <span>{isAudioPlaying ? "Pause Audio" : "Play Audio"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPlayingStream(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                      >
                        <Radio className="h-3.5 w-3.5 text-primary" />
                        <span>Switch Channel / Station</span>
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Break timer: <span className="text-white font-bold">{timeFormatted}</span> remaining
                    </div>
                  </div>
                </div>

                {/* High-Yield Architectural Recall Card */}
                <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-amber-400" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                        High-Yield Engineering Recall // {currentQ.topic}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuestionIndex((prev) => prev + 1);
                        setIsAnswerRevealed(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                    &ldquo;{currentQ.question}&rdquo;
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isAnswerRevealed ? "Hide Verified Invariants" : "Reveal Verified Model Invariants & Solution"}</span>
                    </button>

                    {isAnswerRevealed && (
                      <div className="mt-3 rounded-xl border border-amber-500/30 bg-slate-900/80 p-4 text-xs sm:text-sm text-slate-200 leading-relaxed animate-in fade-in duration-200">
                        <p className="font-mono text-[10px] font-bold uppercase text-amber-400 mb-1">Model Solution</p>
                        {currentQ.answer}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>

          {/* Footer Bar */}
          <footer className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t text-xs",
            isOledBlackout ? "border-zinc-900 bg-black text-zinc-500" : "border-white/10 bg-slate-950/80 text-slate-400"
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% barrier screen prevents video feeds &amp; recommendation dopamine traps.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPlayingStream(null);
                onClose();
              }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              Finished Break &rarr; Return to Deep Study
            </button>
          </footer>
        </div>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ─── BREAK LOUNGE BROWSING MODAL (PRE-PLAYBACK) ──────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-200"
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-muted/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Mindful Audio Break Lounge
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    YouTube Audio with Focus Shield
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  High-yield audio only — 100% barrier screen covers all video &amp; feeds.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Close Break Lounge (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Break Timer Ribbon */}
          <div className="px-5 py-3 border-b border-border/60 bg-primary/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-mono text-lg font-bold text-foreground tracking-tight">
                  {timeFormatted}
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 rounded-lg bg-card border border-border/70 p-0.5">
                {[5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectPreset(m)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                      selectedMinutes === m
                        ? "bg-primary text-primary-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>

              {/* Play/Pause & Reset */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isTimerRunning) playAttentionPing();
                    setIsTimerRunning(!isTimerRunning);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                    isTimerRunning
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border-primary bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{isTimerRunning ? "Pause" : "Start Break"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset(selectedMinutes)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Break Progress: {Math.round(progressPercent)}%
              </span>
              <div className="w-24 h-2 rounded-full bg-muted/60 overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 pt-3 border-b border-border/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("podcasts")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  activeTab === "podcasts"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Top 10 Tech Podcasts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("music")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                  activeTab === "music"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Music className="h-3.5 w-3.5" />
                <span>Flow &amp; Focus Music Streams</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Full Barrier Screen On Top</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === "podcasts" ? (
              <div>
                {/* Search & Category Filter Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search topics (e.g. Postgres, Karpathy, SQLite, Rust)..."
                      className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary/70 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1 hidden md:inline">Filter:</span>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilterCategory(cat)}
                        className={cn(
                          "px-2.5 py-0.5 text-xs font-medium rounded-full border transition-all cursor-pointer",
                          filterCategory === cat
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {cat === "all" ? "All Top 10" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empty Search State */}
                {filteredPodcasts.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-border/70 p-6 space-y-2">
                    <Radio className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-bold text-foreground">No tech podcasts found matching &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-xs text-muted-foreground">Try clearing your search query or switching category filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterCategory("all");
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  /* Podcast Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredPodcasts.map((podcast) => (
                      <div
                        key={podcast.id}
                        className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/10 hover:bg-muted/20 p-4 transition-all hover:border-primary/40 group hover:-translate-y-0.5 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-bold">
                              #{podcast.rank}
                            </span>
                            <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground border border-border/60">
                              {podcast.badge}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {podcast.title}
                          </h3>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {podcast.description}
                          </p>

                          <div className="rounded-lg bg-card/80 border border-border/60 p-2 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground/90">Curated Topic:</span>{" "}
                            {podcast.recommendedTopic}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Volume2 className="h-3 w-3 text-emerald-400" />
                            {podcast.audioDuration}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(podcast.id, podcast.directUrl)}
                              className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                              title="Copy search query"
                            >
                              {copiedId === podcast.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handlePlayAudioStream({
                                  id: podcast.id,
                                  title: podcast.title,
                                  host: podcast.host,
                                  badge: podcast.badge,
                                  videoId: podcast.videoId,
                                })
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Play with Focus Shield</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Curated soundscapes tuned for cognitive recovery and deep focus. Full screen barrier engaged automatically:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {YOUTUBE_MUSIC_FLOW_STATIONS.map((station) => (
                    <div
                      key={station.id}
                      className={cn(
                        "rounded-xl border bg-gradient-to-br p-4 flex flex-col justify-between space-y-3 transition-all hover:scale-[1.01]",
                        station.color
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                          <Music className="h-4 w-4 text-primary" />
                          <span>{station.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{station.genre}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Non-intrusive soundscape
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePlayAudioStream({
                              id: station.id,
                              title: station.name,
                              host: station.genre,
                              badge: "Focus Soundscape",
                              videoId: station.videoId,
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xs cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Play with Shield</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer info bar */}
          <div className="px-5 py-3 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pure audio keeps visual working memory clear for returning to your study topic.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Finished Break &rarr; Return to Study
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
