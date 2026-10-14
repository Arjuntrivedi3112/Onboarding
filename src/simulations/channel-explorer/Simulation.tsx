import { useEffect, useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Image as ImageIcon, LayoutList, MapPin, PlayCircle, Radio, Search, Smartphone, Tv, XCircle } from "lucide-react";

import { enumCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import { ChallengeMet, Panel, PlaybackControls, SimStage, Stat, useChallenge, useDescribe, usePlayback } from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  BRIEFS,
  CHANNELS,
  QUARTILES,
  allBriefsMatched,
  briefIsCorrect,
  channelById,
  correctCount,
  firedQuartiles,
  type BriefAnswers,
  type ChannelId,
} from "@/simulations/channel-explorer/logic";
import { AudioMock, CtvMock, DisplayMock, DoohMock, MobileMock, NativeMock, SearchMock, VideoMock } from "@/simulations/channel-explorer/mockups";

/**
 * Channel and format studio: the same campaign previewed in every channel,
 * each with the standard that delivers it and how targeting and measurement
 * change. Player-based channels (video, CTV, audio) fire VAST quartile events
 * as they play. The challenge matches three briefs to their best channel.
 */

const channelCodec = enumCodec(CHANNELS.map((c) => c.id));
/** Every player ad plays out in about six real seconds, whatever its length. */
const REAL_PLAY_MS = 6000;

const ICONS: Record<ChannelId, ReactNode> = {
  display: <ImageIcon className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  ctv: <Tv className="h-4 w-4" />,
  audio: <Radio className="h-4 w-4" />,
  dooh: <MapPin className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  native: <LayoutList className="h-4 w-4" />,
  search: <Search className="h-4 w-4" />,
};

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const [channelId, setChannelId] = useShareableState<ChannelId>("channel", "display", channelCodec);
  const channel = channelById(channelId);
  const [visited, setVisited] = useState<Set<ChannelId>>(() => new Set([channelId]));
  const [answers, setAnswers] = useState<BriefAnswers>({});
  const tabsId = useId();

  const seconds = channel.adSeconds ?? 15;
  const playback = usePlayback(seconds * 1000, { realMsPerSimMs: REAL_PLAY_MS / (seconds * 1000) });
  const { reset } = playback;
  const hasPlayer = channel.adSeconds !== undefined;

  useEffect(() => {
    reset();
    setVisited((v) => (v.has(channelId) ? v : new Set(v).add(channelId)));
  }, [channelId, reset]);

  const progress = playback.t / (seconds * 1000);
  const started = playback.t > 0;
  const fired = hasPlayer ? firedQuartiles(progress, started) : [];
  const lastFired = fired.length ? QUARTILES.find((q) => q.event === fired[fired.length - 1]) : null;

  const met = allBriefsMatched(answers);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `Showing the ${channel.label} channel: delivered by ${channel.standard}. Targeting: ${channel.targeting} Measurement: ${channel.measurement}${
      hasPlayer ? ` The ${seconds}-second ad is ${started ? `${Math.round(progress * 100)}% played; VAST events fired: ${fired.join(", ") || "none"}` : "not playing yet"}.` : ""
    } Explored ${visited.size} of ${CHANNELS.length} channels. Briefs matched: ${correctCount(answers)} of ${BRIEFS.length}${
      Object.keys(answers).length
        ? ` (${BRIEFS.map((b) => `${b.client} → ${answers[b.id] ? channelById(answers[b.id] as ChannelId).label : "unanswered"}`).join("; ")})`
        : ""
    }.`
  );

  const narration = hasPlayer
    ? !started
      ? `Press Play to run the ${seconds}-second ${channel.label === "Audio" ? "audio" : "video"} ad and watch its VAST tracking events fire.`
      : playback.done
        ? "complete fired — the player has reported every quartile back to the ad server."
        : lastFired
          ? `${lastFired.event} fired at ${(lastFired.at * seconds).toFixed(1)} s — the player pings the tracking URL from the VAST response.`
          : ""
    : `${channel.label}: ${channel.standardDetail}`;

  const mock: Record<ChannelId, ReactNode> = {
    display: <DisplayMock />,
    video: <VideoMock progress={progress} started={started} seconds={seconds} />,
    ctv: <CtvMock progress={progress} started={started} seconds={seconds} />,
    audio: <AudioMock progress={progress} started={started} playing={playback.playing} seconds={seconds} />,
    dooh: <DoohMock />,
    mobile: <MobileMock />,
    native: <NativeMock />,
    search: <SearchMock />,
  };

  return (
    <div className="space-y-4">
      <SimStage label="Channel preview">
        <div role="tablist" aria-label="Channels" className="flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => {
            const on = c.id === channelId;
            return (
              <button
                key={c.id}
                id={`${tabsId}-${c.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setChannelId(c.id)}
                className={cn(
                  "interactive relative inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <span aria-hidden="true">{ICONS[c.id]}</span>
                {c.label}
                {visited.has(c.id) && !on && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span className="sr-only">(explored)</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${channelId}`} className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            {hasPlayer && <PlaybackControls playback={playback} clock={<span className="figure">{(progress * seconds).toFixed(1)} / {seconds} s</span>} />}
            <AnimatePresence mode="wait">
              <motion.div key={channelId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {mock[channelId]}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.dl
              key={channelId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 space-y-3 rounded-xl border border-border bg-background/80 p-4 text-sm"
            >
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Governing standard</dt>
                <dd className="mt-1 text-base text-primary">{channel.standard}</dd>
                <dd className="mt-1 text-muted-foreground">{channel.standardDetail}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Targeting</dt>
                <dd className="mt-0.5 text-foreground">{channel.targeting}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Measurement</dt>
                <dd className="mt-0.5 text-foreground">{channel.measurement}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Formats</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {channel.formats.map((f) => (
                    <span key={f} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground">
                      {f}
                    </span>
                  ))}
                </dd>
              </div>
            </motion.dl>
          </AnimatePresence>
        </div>

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {hasPlayer && started && <span className="figure text-primary">{(progress * seconds).toFixed(1)} s · </span>}
          {narration}
        </p>
      </SimStage>

      <Panel title="Media planner: match each brief" actions={<span className="figure text-xs text-muted-foreground">{correctCount(answers)} / {BRIEFS.length}</span>}>
        <ol className="space-y-3">
          {BRIEFS.map((b, i) => {
            const answer = answers[b.id] ?? "";
            const ok = briefIsCorrect(b, answer);
            const selectId = `${tabsId}-brief-${b.id}`;
            return (
              <li
                key={b.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  ok ? "border-primary/50 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.15)]" : answer ? "border-nobid/40" : "border-border"
                )}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Brief {i + 1} · {b.client}
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">{b.brief}</p>
                  </div>
                  <div>
                    <label htmlFor={selectId} className="sr-only">
                      Best channel for brief {i + 1}, {b.client}
                    </label>
                    <select
                      id={selectId}
                      value={answer}
                      onChange={(e) => setAnswers((a) => ({ ...a, [b.id]: e.target.value as ChannelId | "" }))}
                      className="min-h-[2.5rem] w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Choose a channel…</option>
                      {CHANNELS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {answer && (
                    <motion.p
                      key={answer}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn("mt-2 flex items-start gap-1.5 text-sm", ok ? "text-primary" : "text-nobid")}
                    >
                      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                      {ok ? b.why : `${channelById(answer as ChannelId).label} could run it, but it isn't the best fit. Where is this audience, and how do they take in the ad?`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Channels explored" value={`${visited.size} / ${CHANNELS.length}`} tone={visited.size === CHANNELS.length ? "primary" : "muted"} />
        <Stat label="Standard" value={<span className="text-base">{channel.standard.split(/ \(| ·/)[0]}</span>} sub={channel.label} />
        <Stat label="VAST events" value={hasPlayer ? `${fired.length} / ${QUARTILES.length}` : "—"} tone={fired.length === QUARTILES.length ? "primary" : "muted"} sub={hasPlayer ? "quartile pixels fired" : "no player in this channel"} />
        <Stat label="Briefs matched" value={`${correctCount(answers)} / ${BRIEFS.length}`} tone={met ? "primary" : correctCount(answers) ? "floor" : "muted"} />
      </div>

      <ChallengeMet show={met}>
        All three briefs land in the right channel — {BRIEFS.map((b) => channelById(b.answer).label).join(", ")}. Challenge complete!
      </ChallengeMet>
    </div>
  );
}
