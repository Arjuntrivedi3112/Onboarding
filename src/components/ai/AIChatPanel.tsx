import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickPrompts = [
  "Explain DSP like I'm new",
  "What's the difference between SSP and Ad Exchange?",
  "Explain RTB from a PM perspective",
  "How does cookie-less targeting work?",
];

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AdTech explainer. Ask me anything about programmatic advertising, and I'll explain it in simple terms. Try asking about DSPs, RTB auctions, or cookie alternatives!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (will be replaced with real AI when Cloud is enabled)
    setTimeout(() => {
      const responses: Record<string, string> = {
        dsp: "A **DSP (Demand-Side Platform)** is like a smart shopping assistant for advertisers. Instead of manually calling publishers to buy ads, advertisers use a DSP to automatically bid on ad space across thousands of websites in milliseconds. Think of it as automated media buying on steroids! 🚀",
        ssp: "An **SSP (Supply-Side Platform)** is the publisher's best friend. It helps websites and apps sell their ad space to the highest bidder automatically. Imagine a super-fast auctioneer working 24/7 to get publishers the best price for every ad slot.",
        rtb: "**RTB (Real-Time Bidding)** is like a lightning-fast auction that happens every time you load a webpage. In under 100 milliseconds, dozens of advertisers bid for the chance to show you an ad. The highest bidder wins, and their ad appears. This happens billions of times per day!",
        cookie: "**Cookie-less targeting** is the future of digital advertising. As browsers block third-party cookies, advertisers are shifting to: \n\n1. **First-party data** - info collected directly from users\n2. **Contextual targeting** - matching ads to page content\n3. **Universal IDs** - privacy-safe user identifiers\n4. **Clean rooms** - secure data collaboration",
      };

      const inputLower = input.toLowerCase();
      let response = "That's a great question! I'd explain this concept by breaking it down into simple parts. Connect to Lovable Cloud to enable AI-powered explanations that adapt to your learning style.";

      if (inputLower.includes("dsp")) response = responses.dsp;
      else if (inputLower.includes("ssp")) response = responses.ssp;
      else if (inputLower.includes("rtb") || inputLower.includes("bidding")) response = responses.rtb;
      else if (inputLower.includes("cookie") || inputLower.includes("cookieless")) response = responses.cookie;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-semibold">AI Explainer</h2>
                  <p className="text-xs text-muted-foreground">Ask anything about AdTech</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" && "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-primary to-accent"
                      : "bg-muted"
                  )}>
                    {msg.role === "assistant" ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about AdTech concepts..."
                  className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Connect Lovable Cloud for AI-powered explanations
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
