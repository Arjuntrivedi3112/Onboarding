import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert AdTech educator and explainer. Your role is to help users understand the advertising technology ecosystem in clear, simple terms.

GUIDELINES:
- Explain concepts at the user's level - if they say "like I'm new", use analogies and simple language
- If they mention a role (PM, developer, etc.), tailor your explanation to that perspective
- Use **bold** for key terms and concepts
- Keep responses concise but informative (2-4 paragraphs max)
- Include practical examples when helpful
- Reference how concepts connect to the broader AdTech ecosystem

KEY CONCEPTS YOU KNOW:
- DSP (Demand-Side Platform): Helps advertisers buy ad space programmatically
- SSP (Supply-Side Platform): Helps publishers sell their ad inventory
- Ad Exchange: Marketplace where DSPs and SSPs trade in real-time
- RTB (Real-Time Bidding): Auctions that happen in milliseconds when a page loads
- DMP (Data Management Platform): Collects and segments audience data
- CDP (Customer Data Platform): Unifies first-party customer data
- Programmatic Advertising: Automated buying/selling of digital ads
- CPM/CPC/CPA: Pricing models (per thousand impressions/click/action)
- Header Bidding: Publishers let multiple ad exchanges bid simultaneously
- Cookie deprecation: Shift to privacy-first targeting (contextual, first-party data)
- Attribution: Tracking which ads led to conversions

Be helpful, accurate, and encouraging. Make AdTech accessible to everyone.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages = [], context } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured. Get it free at https://console.groq.com/keys");
    }

    const sseMessage = (content: string, status = 200) => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    };

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCurrent context: The user is viewing the "${context}" module in the AdTech Visual Explorer.`;
    }

    // Use Groq (fast, free, OpenAI-compatible)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      console.error("Groq fetch error:", err);
      return sseMessage("⏳ AI service is slow to respond right now. Please retry in a moment.");
    }

    if (!response.ok) {
      if (response.status === 429) {
        return sseMessage("⏳ Rate limit exceeded. Groq free tier: 30 req/min, 14,400/day. Please wait a moment.");
      }
      if (response.status === 401) {
        return sseMessage("🔑 Invalid API key. Please check your Groq API key.");
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return sseMessage(`AI error (${response.status}). Please retry in a moment.`);
    }

    // OpenAI-compatible response format
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response from AI.";
    
    return sseMessage(text);
  } catch (error) {
    console.error("adtech-chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    await writer.write(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `⚠️ ${message}` } }] })}\n\n`));
    await writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
    await writer.close();
    return new Response(readable, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
