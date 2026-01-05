import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, Cookie, Smartphone, Globe, 
  Lock, Eye, EyeOff, Link, Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";

const identifiers = [
  {
    id: "firstparty",
    name: "First-Party Cookies",
    icon: <Cookie className="w-5 h-5" />,
    description: "Set by the website you're visiting",
    details: "Created and read only by the domain you're on. Used for login, preferences, and analytics. Generally accepted and less restricted by browsers.",
    status: "active",
  },
  {
    id: "thirdparty",
    name: "Third-Party Cookies",
    icon: <Cookie className="w-5 h-5" />,
    description: "Set by external domains (ad networks)",
    details: "Created by domains other than the one you're visiting. Used for cross-site tracking and retargeting. Being phased out by major browsers.",
    status: "deprecated",
  },
  {
    id: "maid",
    name: "Mobile Ad IDs (MAID)",
    icon: <Smartphone className="w-5 h-5" />,
    description: "IDFA (Apple) and GAID (Google)",
    details: "Device-level identifiers for mobile apps. Apple's ATT framework now requires user opt-in. Google is limiting GAID access on Android.",
    status: "restricted",
  },
  {
    id: "universal",
    name: "Universal IDs",
    icon: <Link className="w-5 h-5" />,
    description: "Cross-platform identifiers (UID2, ID5)",
    details: "Industry solutions for post-cookie identity. Based on hashed emails or other deterministic data. Require user authentication.",
    status: "emerging",
  },
  {
    id: "fingerprint",
    name: "Device Fingerprinting",
    icon: <Fingerprint className="w-5 h-5" />,
    description: "Unique device characteristics",
    details: "Combines browser, OS, fonts, screen resolution into a unique signature. Considered invasive and increasingly blocked by browsers.",
    status: "restricted",
  },
  {
    id: "contextual",
    name: "Contextual Signals",
    icon: <Globe className="w-5 h-5" />,
    description: "Content-based targeting without user data",
    details: "The privacy-friendly alternative. Targets based on page content, not user identity. Growing in importance as cookies disappear.",
    status: "active",
  },
];

const privacyRegulations = [
  {
    name: "GDPR",
    region: "European Union",
    key: "Consent required before processing personal data",
    impact: "CMPs, explicit opt-in, data subject rights",
  },
  {
    name: "CCPA/CPRA",
    region: "California, USA",
    key: "Right to opt-out of data sale",
    impact: "Do Not Sell links, data access requests",
  },
  {
    name: "Privacy Sandbox",
    region: "Chrome Browser",
    key: "Google's cookie replacement APIs",
    impact: "Topics API, Attribution Reporting, Protected Audience",
  },
  {
    name: "ATT",
    region: "Apple Devices",
    key: "App Tracking Transparency",
    impact: "Opt-in required for IDFA access",
  },
];

const privacySolutions = [
  {
    title: "Clean Rooms",
    description: "Secure environments where multiple parties can match and analyze data without exposing raw user information",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    title: "Consent Management Platforms",
    description: "Tools that capture and manage user consent preferences across properties",
    icon: <Lock className="w-5 h-5" />,
  },
  {
    title: "Privacy-Preserving Attribution",
    description: "Measurement without individual tracking using aggregation and differential privacy",
    icon: <Eye className="w-5 h-5" />,
  },
  {
    title: "First-Party Data Strategy",
    description: "Building direct relationships and collecting consented data from your own users",
    icon: <User className="w-5 h-5" />,
  },
];

export function IdentityModule() {
  const [selectedIdentifier, setSelectedIdentifier] = useState("firstparty");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-500";
      case "deprecated": return "bg-red-500/20 text-red-500";
      case "restricted": return "bg-amber-500/20 text-amber-500";
      case "emerging": return "bg-blue-500/20 text-blue-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const currentIdentifier = identifiers.find(i => i.id === selectedIdentifier)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          User Identity & Privacy
        </h1>
        <p className="text-muted-foreground">
          Understanding how users are identified across the web, and how privacy regulations are reshaping digital advertising. This is one of the most rapidly evolving areas in AdTech.
        </p>
      </motion.div>

      {/* Identifier Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {identifiers.map((identifier) => (
          <button
            key={identifier.id}
            onClick={() => setSelectedIdentifier(identifier.id)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              selectedIdentifier === identifier.id
                ? "bg-primary/10 border-primary/30"
                : "bg-card border-border hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                selectedIdentifier === identifier.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {identifier.icon}
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                getStatusColor(identifier.status)
              )}>
                {identifier.status}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">{identifier.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{identifier.description}</p>
          </button>
        ))}
      </motion.div>

      {/* Selected Identifier Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIdentifier}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              {currentIdentifier.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{currentIdentifier.name}</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {currentIdentifier.details}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cross-Device Identity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-4">Cross-Device Identity Resolution</h2>
        <p className="text-muted-foreground mb-6">
          Users interact with brands across multiple devices. Identity resolution connects these touchpoints into a unified profile.
        </p>

        <div className="flex items-center justify-center gap-4 py-8">
          {[
            { icon: <Smartphone className="w-8 h-8" />, label: "Mobile" },
            { icon: <Globe className="w-8 h-8" />, label: "Desktop" },
            { icon: <Smartphone className="w-8 h-8 rotate-90" />, label: "Tablet" },
          ].map((device, i) => (
            <motion.div
              key={device.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-2">
                {device.icon}
              </div>
              <span className="text-sm text-muted-foreground">{device.label}</span>
              {i < 2 && (
                <motion.div
                  className="absolute"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Unified User Profile</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Privacy Regulations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Key Privacy Regulations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacyRegulations.map((reg, i) => (
            <motion.div
              key={reg.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{reg.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {reg.region}
                </span>
              </div>
              <p className="text-sm text-primary mb-1">{reg.key}</p>
              <p className="text-xs text-muted-foreground">{reg.impact}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Privacy-First Solutions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Privacy-First Solutions</h2>
        <p className="text-muted-foreground mb-6">
          The industry is developing new approaches that balance effective advertising with user privacy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacySolutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent shrink-0">
                  {solution.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{solution.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{solution.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
