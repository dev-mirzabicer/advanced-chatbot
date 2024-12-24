// src/pages/api/llm.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAssistantSystemPrompt } from "../../utils/assistantPrompts";
import instructions from "../../instructions/instructions.json";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 0,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Distinguish user vs. model
function mapRoleToAllowedRole(oldRole: string, role: string): "user" | "model" {
  if (oldRole.toLowerCase() === "user") return "user";
  if (oldRole.toLowerCase() !== role.toLowerCase()) return "user";
  // everything else => 'model'
  return "model";
}

/**
 * Returns a prefix for a given message role to help the LLM see the difference.
 */
function getPrefixForRole(oldRole: string): string {
  if (oldRole.toLowerCase() === "user") {
    return "[User] "; // user lines have no prefix
  }
  if (oldRole.toLowerCase() === "moderator") {
    return "[Moderator] ";
  }
  if (oldRole.startsWith("assistant-")) {
    // e.g. 'assistant-planner'
    const name = oldRole.split("-")[1];
    return `[Assistant (${name})] `;
  }
  return "[Assistant] ";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let { messages, role } = req.body;
  const { chatId } = req.body; // Added chatId

  if (!messages || !role || !chatId) {
    return res
      .status(400)
      .json({ error: "Missing messages, role, or chatId in request body" });
  }

  // Validate the role
  const validRoles = [
    "moderator",
    ...instructions.main.team.map((m: any) => m.name.toLowerCase()),
  ];
  if (
    !validRoles.includes(role.toLowerCase().replace("{", "").replace("}", ""))
  ) {
    return res.status(400).json({ error: `Invalid role: ${role}` });
  }

  role = role.replace("{", "").replace("}", "");

  let systemPrompt: string;
  try {
    systemPrompt = getAssistantSystemPrompt(role.toLowerCase());
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  // Build chat history
  const history = messages.map((msg: any) => {
    const mappedRole = mapRoleToAllowedRole(msg.role, role);
    const prefix = getPrefixForRole(msg.role);
    return {
      role: mappedRole,
      parts: [{ text: prefix + msg.content }],
    };
  });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-exp-1206",
      systemInstruction: systemPrompt,
    });

    // Start a chat
    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    // We'll pass the last user content as the "prompt," but it's optional
    // const userInput = messages[messages.length - 1].content;
    // const result = await chatSession.sendMessage(userInput);
    const result = await chatSession.sendMessage("[Assistant " + role + "]: ");

    const responseText = result.response.text().trim();

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error("LLM API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
