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
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCurrent context: The user is viewing the "${context}" module in the AdTech Visual Explorer.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("adtech-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
