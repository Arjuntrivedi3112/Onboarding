import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileContent, role } = await req.json();
    
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured. Get it free at https://aistudio.google.com");
    }

    // New simple system prompt: always return a plain-language formatted summary suitable for end users
    let systemPrompt = `You are an AdTech document analyst. Provide a single, plain-language, easy-to-read summary of the uploaded document. Format the output in Markdown for display, with the following sections:

  1. # Title: A one-line title for the summary
  2. ## Short Summary: 2-3 simple sentences in everyday language
  3. ## Key Points: 3 bullet points with the most important facts
  4. ## Suggested Next Steps: 3 concrete next steps a user can take (implementation, testing, or planning)

  Keep language simple and non-technical unless the document requires otherwise. Use short sentences and clear bullets. Do not include role-based greetings or role-specific sections—this endpoint returns a single plain-language summary for the uploaded file.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: "user",
              parts: [{ text: `Analyze this document named "${fileName}":\n\n${fileContent.substring(0, 15000)}` }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Google AI error:", response.status, errorText);
      throw new Error("Google AI error");
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate summary.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
