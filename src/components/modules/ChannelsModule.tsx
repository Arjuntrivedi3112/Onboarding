import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, Smartphone, Tv, Radio, Globe, 
  MessageSquare, Search, MapPin, PlayCircle, ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChannelType = "display" | "native" | "video" | "audio" | "social" | "ctv" | "dooh" | "search" | "mobile";

interface Channel {
  id: ChannelType;
  title: string;
  icon: React.ReactNode;
  description: string;
  formats: string[];
  keyFeatures: string[];
  techDetails: string;
  color: string;
}

const channels: Channel[] = [
  {
    id: "display",
    title: "Display Advertising",
    icon: <ImageIcon className="w-5 h-5" />,
    description: "Text and image ads displayed on websites, the original online ad format",
    color: "from-blue-500 to-cyan-500",
    formats: ["Banner ads (728×90, 300×250)", "Skyscraper ads", "Rectangle ads", "Interstitials", "Pop-ups"],
    keyFeatures: [
      "Loaded via ad tags (JavaScript or iframe)",
      "Rendered in isolated containers",
      "RTB auction determines placement",
      "Creative fetched from advertiser's CDN",
    ],
    techDetails: "Display ads use HTML snippets that act as placeholders, instructing the browser to fetch content from an ad server. The ad is rendered in an iframe to isolate it from the page's scripts.",
  },
  {
    id: "native",
    title: "Native Advertising",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Ads designed to match the look and feel of surrounding content",
    color: "from-green-500 to-emerald-500",
    formats: ["In-feed ads", "Recommended content", "Sponsored articles", "Promoted listings", "Search ads"],
    keyFeatures: [
      "Blends with editorial content",
      "Higher engagement than banners",
      "Less vulnerable to ad blockers",
      "Platform-specific formatting",
    ],
    techDetails: "Native ads are assembled from components (headline, image, description) that can be styled to match the publisher's site. They're often served via APIs rather than iframes.",
  },
  {
    id: "video",
    title: "Video Advertising",
    icon: <PlayCircle className="w-5 h-5" />,
    description: "Video content shown before, during, or after streaming video",
    color: "from-red-500 to-rose-500",
    formats: ["Pre-roll (before content)", "Mid-roll (during content)", "Post-roll (after content)", "Outstream (in-article)", "Rewarded video"],
    keyFeatures: [
      "VAST protocol for ad serving",
      "VPAID for interactive ads",
      "Viewability measurement critical",
      "Skippable vs non-skippable options",
    ],
    techDetails: "Video ads use VAST (Video Ad Serving Template) to define how ads are served and tracked. VMAP handles ad pod timing, while SIMID/VPAID enable interactive overlays.",
  },
  {
    id: "audio",
    title: "Audio Advertising",
    icon: <Radio className="w-5 h-5" />,
    description: "Audio ads on streaming services, podcasts, and online radio",
    color: "from-purple-500 to-pink-500",
    formats: ["Pre-roll audio", "Mid-roll audio", "Ad pods", "Dynamic ads", "Companion banners"],
    keyFeatures: [
      "Uses latest VAST for serving",
      "Dynamic ads personalized per listener",
      "Companion display ads shown during audio",
      "Podcast-specific attribution",
    ],
    techDetails: "Audio ads leverage the same VAST protocol as video. Dynamic audio ads can change based on user location, time of day, and weather conditions.",
  },
  {
    id: "social",
    title: "Social Media Advertising",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Native ads within social media feeds and stories",
    color: "from-indigo-500 to-violet-500",
    formats: ["Feed ads", "Story ads", "Carousel ads", "Video ads", "Lead gen forms", "Shopping ads"],
    keyFeatures: [
      "Advanced demographic targeting",
      "Retargeting via email lists",
      "Higher engagement than display",
      "Cost-effective for reach",
    ],
    techDetails: "Social platforms like Facebook and LinkedIn collect extensive demographic and behavioral data, enabling highly refined audience targeting through their walled-garden ecosystems.",
  },
  {
    id: "ctv",
    title: "Connected TV (CTV)",
    icon: <Tv className="w-5 h-5" />,
    description: "Ads on smart TVs, streaming devices, and OTT services",
    color: "from-amber-500 to-orange-500",
    formats: ["Pre-roll", "Mid-roll", "Pause ads", "Interactive overlays", "Sponsored content"],
    keyFeatures: [
      "TV-quality viewing experience",
      "Precise digital targeting",
      "Improved attribution vs linear TV",
      "Addressable advertising",
    ],
    techDetails: "CTV includes smart TVs, gaming consoles, and streaming devices. It enables addressable TV where different viewers see different ads during the same program based on household data.",
  },
  {
    id: "dooh",
    title: "Digital Out-of-Home (DOOH)",
    icon: <MapPin className="w-5 h-5" />,
    description: "Digital screens in public spaces like billboards and transit",
    color: "from-teal-500 to-cyan-500",
    formats: ["Digital billboards", "Transit screens", "Mall kiosks", "Airport displays", "Gas station screens"],
    keyFeatures: [
      "Dynamic content updates",
      "Weather/time-triggered ads",
      "Location-based targeting",
      "Measurable impressions",
    ],
    techDetails: "Unlike static billboards, DOOH delivers dynamic content including videos and animations. It supports advanced targeting based on location, time of day, and even weather conditions.",
  },
  {
    id: "search",
    title: "Search Advertising",
    icon: <Search className="w-5 h-5" />,
    description: "Text ads triggered by user search queries",
    color: "from-yellow-500 to-amber-500",
    formats: ["Text ads", "Shopping ads", "Local ads", "App install ads", "Call-only ads"],
    keyFeatures: [
      "Intent-based targeting",
      "Keyword bidding (CPC)",
      "Quality Score ranking",
      "Real-time bidding for keywords",
    ],
    techDetails: "Search ads appear on SERPs when users enter specific keywords. Ad rank is determined by bid amount × Quality Score. Google's ecosystem dominates, but retail media search is growing.",
  },
  {
    id: "mobile",
    title: "Mobile App Advertising",
    icon: <Smartphone className="w-5 h-5" />,
    description: "In-app ads rendered via SDKs in mobile applications",
    color: "from-pink-500 to-rose-500",
    formats: ["Banner ads", "Interstitials", "Rewarded video", "Native ads", "Playable ads", "Offerwall"],
    keyFeatures: [
      "SDK-based rendering",
      "Device ID targeting (IDFA/GAID)",
      "App-specific attribution",
      "In-app purchases tracking",
    ],
    techDetails: "Unlike mobile web, in-app advertising requires SDK integration. App developers define ad space and formats. Attribution relies on device IDs and postback URLs for install tracking.",
  },
];

export function ChannelsModule() {
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>("display");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("detail");

  const currentChannel = channels.find(c => c.id === selectedChannel)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Channels & Formats
        </h1>
        <p className="text-muted-foreground">
          With the rise of digital platforms, advertising has expanded far beyond traditional print and television. Explore the wide range of modern advertising formats and distribution channels.
        </p>
      </motion.div>

      {/* Channel Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2"
      >
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setSelectedChannel(channel.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
              selectedChannel === channel.id
                ? "bg-primary/10 border-primary/30"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
              channel.color
            )}>
              {channel.icon}
            </div>
            <span className={cn(
              "text-xs font-medium text-center",
              selectedChannel === channel.id ? "text-primary" : "text-muted-foreground"
            )}>
              {channel.title.split(" ")[0]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Selected Channel Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedChannel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              currentChannel.color
            )}>
              {currentChannel.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">{currentChannel.title}</h2>
              <p className="text-muted-foreground">{currentChannel.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formats */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Ad Formats</h3>
              <div className="flex flex-wrap gap-2">
                {currentChannel.formats.map((format, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Features</h3>
              <ul className="space-y-2">
                {currentChannel.keyFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              Technical Details
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentChannel.techDetails}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cross-Channel Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-4">Same Message, Multiple Channels</h2>
        <p className="text-muted-foreground mb-6">
          Modern campaigns run across multiple channels for maximum reach. Here's how the same brand message adapts:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { channel: "Display", format: "Banner 300×250", preview: "🖼️" },
            { channel: "Video", format: "15s Pre-roll", preview: "🎬" },
            { channel: "Social", format: "Feed Card", preview: "📱" },
            { channel: "CTV", format: "30s Spot", preview: "📺" },
          ].map((item, i) => (
            <motion.div
              key={item.channel}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 text-center"
            >
              <div className="text-4xl mb-2">{item.preview}</div>
              <h4 className="font-semibold text-foreground">{item.channel}</h4>
              <p className="text-xs text-muted-foreground">{item.format}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rich Media & Interactive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3">Rich Media Ads</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Interactive ads that go beyond static images with animations, video, and user interaction.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Expandable banners on hover/click</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Interactive games and quizzes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">360° product viewers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Shoppable hotspots in video</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3">Video Ad Standards</h3>
          <p className="text-sm text-muted-foreground mb-4">
            IAB standards that enable video ad serving and measurement across platforms.
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent">VAST</span>
              <span className="text-muted-foreground">— Video Ad Serving Template</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">VMAP</span>
              <span className="text-muted-foreground">— Video Multiple Ad Playlist</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">VPAID</span>
              <span className="text-muted-foreground">— Video Player Ad Interface</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">SIMID</span>
              <span className="text-muted-foreground">— Secure Interactive Media</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
