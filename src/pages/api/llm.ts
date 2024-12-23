// src/pages/api/llm.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import userInstructions from "../../instructions/user_instructions.json";
import instructions from "../../instructions/instructions.json";
import teammateInstructions from "../../instructions/teammate_instructions.json";

const apiKey =
  process.env.GEMINI_API_KEY || "AIzaSyDKa7Gd5Xr1jmQ2v93jUZ3ZOi1ayUMzZyM";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Combine all instructions into a single system prompt without any restrictions on formatting
const combinedSystemPrompt = `
${userInstructions.introduction}

${userInstructions.instructions}

${instructions.main.instructions}

Team Members:
${instructions.main.team
  .map((member) => `- ${member.name}: ${member.specialty}`)
  .join("\n")}

Commands:
${instructions.main.commands
  .map((cmd) => `- ${cmd.cmd}: ${cmd.description}`)
  .join("\n")}

Tools:
${instructions.tools
  .map(
    (tool) => `
${tool.name}:
${tool.commands.map((cmd) => `  - ${cmd.cmd}: ${cmd.description}`).join("\n")}
`
  )
  .join("\n")}

Warnings:
${instructions.main.warnings.join("\n")}

Teammate Instructions:
${teammateInstructions.main}

Role Explanation:
${teammateInstructions.role_explanation}

Rules:
${teammateInstructions.rules.join("\n")}

Teammate Commands:
${teammateInstructions.commands
  .map((cmd) => `- ${cmd.cmd}: ${cmd.description}`)
  .join("\n")}

Important:
- Initial Response: When the session starts, respond with exactly !OK without backticks or markdown.
- Use only the defined commands to control the conversation flow. Do not include any additional text or formatting.
  
Example Commands:
!OK
!team {Hello team. The user needs help planning their project. Researcher, can you gather relevant data? Planner, can you draft a project plan based on the research?}
!allowspeak Researcher
!allowspeak Planner
`;

const model = genAI.getGenerativeModel({
  model: "gemini-exp-1206",
  systemInstruction: combinedSystemPrompt,
});

// Configuration for text generation
const generationConfig = {
  temperature: 0.01, // Adjust as needed
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 150, // Adjust based on response length requirements
  responseMimeType: "text/plain",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: "Missing messages in request body" });
  }

  // Prepare the chat history in the format expected by the API
  const history = messages.map((msg: any) => ({
    role: msg.role === "user" ? "user" : "assistant",
    parts: [{ text: msg.content }],
  }));

  try {
    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    const userInput = messages[messages.length - 1].content;
    const result = await chatSession.sendMessage(userInput);

    const responseText = result.response.text().trim();

    res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("LLM API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
