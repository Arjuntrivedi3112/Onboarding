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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }


    let systemPrompt = (role && role !== "general")
      ? `Selected user role: ${role.toUpperCase()}. Respond ONLY for this role and make your output unique for this role.\n\nYou are an AdTech document analyst. Your job is to generate highly tailored, actionable summaries for a specific user role. The output MUST be different for each role. Do not repeat the same summary for different roles.\n\nFor each document, follow this format:\n\n1. **Welcome Message**: Greet the user by their role. For example, "Welcome QA Engineer!" or "Welcome Backend Developer!"\n2. **Role-Specific Mission**: Briefly describe what this role's main responsibility would be for this document/project. (e.g., "Your role in this project will be to..." tailored to the selected role)\n3. **Action Steps**: List clear, step-by-step actions this role should take to address the problem statement or requirements in the document. For QA, these should be explicit test/validation steps. For Backend, implementation steps. For Product, planning steps, etc.\n4. **Summary**: A concise summary of the document (2-3 sentences).\n5. **Key Concepts**: List the main AdTech concepts covered.\n6. **Key Takeaways**: 2-3 bullet points of the most important things to understand.\n\nALWAYS use the terminology from the AdTech ecosystem. Make the output actionable and easy to follow for someone in the selected role.\n\nEXAMPLES:\n- For QA: Give a welcome, then a mission like "Your job is to validate the following requirements..." and then a numbered list of test cases or validation steps.\n- For Backend: Welcome, then "Your job is to implement the following APIs..." and then a list of implementation steps.\n- For Product: Welcome, then "Your job is to define the following user stories..." and then a list of planning/definition steps.\n- For Security: Welcome, then "Your job is to review the following security aspects..." and then a list of security checks.\n- For Frontend: Welcome, then "Your job is to build the following UI components..." and then a list of UI/UX steps.\n\nDO NOT give the same output for different roles. Each role must get a unique, role-relevant output.\n\nIMPORTANT: The user selected the role: ${role.toUpperCase()}. Make the welcome, mission, and action steps highly relevant and practical for this role. For QA, always include a numbered list of test/validation steps. For other roles, provide steps that match their typical responsibilities. Do NOT repeat the same summary for different roles.`
      : `You are an AdTech document analyst. Your job is to generate highly tailored, actionable summaries for a specific user role. The output MUST be different for each role. Do not repeat the same summary for different roles.\n\nFor each document, follow this format:\n\n1. **Welcome Message**: Greet the user by their role. For example, "Welcome QA Engineer!" or "Welcome Backend Developer!"\n2. **Role-Specific Mission**: Briefly describe what this role's main responsibility would be for this document/project. (e.g., "Your role in this project will be to..." tailored to the selected role)\n3. **Action Steps**: List clear, step-by-step actions this role should take to address the problem statement or requirements in the document. For QA, these should be explicit test/validation steps. For Backend, implementation steps. For Product, planning steps, etc.\n4. **Summary**: A concise summary of the document (2-3 sentences).\n5. **Key Concepts**: List the main AdTech concepts covered.\n6. **Key Takeaways**: 2-3 bullet points of the most important things to understand.\n\nALWAYS use the terminology from the AdTech ecosystem. Make the output actionable and easy to follow for someone in the selected role.\n\nEXAMPLES:\n- For QA: Give a welcome, then a mission like "Your job is to validate the following requirements..." and then a numbered list of test cases or validation steps.\n- For Backend: Welcome, then "Your job is to implement the following APIs..." and then a list of implementation steps.\n- For Product: Welcome, then "Your job is to define the following user stories..." and then a list of planning/definition steps.\n- For Security: Welcome, then "Your job is to review the following security aspects..." and then a list of security checks.\n- For Frontend: Welcome, then "Your job is to build the following UI components..." and then a list of UI/UX steps.\n\nDO NOT give the same output for different roles. Each role must get a unique, role-relevant output.`;

    // Log the prompt and role for debugging
    console.log("\n--- AI PROMPT DEBUG ---");
    console.log("Role:", role);
    console.log("Prompt:\n" + systemPrompt);
    console.log("FileName:", fileName);
    console.log("--- END PROMPT DEBUG ---\n");

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
          { 
            role: "user", 
            content: `Analyze this document named "${fileName}":\n\n${fileContent.substring(0, 15000)}` 
          },
        ],
        stream: false,
      }),
    });

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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

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
