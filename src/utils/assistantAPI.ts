// src/utils/assistantAPI.ts
import axios from "axios";

/**
 * Calls the LLM API for a given role with the provided messages.
 * @param role - The role of the LLM to be invoked (e.g., 'moderator', 'planner', 'researcher').
 * @param messages - The conversation history.
 * @returns The text response from the LLM.
 */
export const callLLM = async (
  role: string,
  messages: any[]
): Promise<string> => {
  try {
    const response = await axios.post("/api/llm", { role, messages });
    console.log(`Role: ${role}`);
    console.log("Messages:", messages);
    return response.data.text;
  } catch (error: any) {
    console.error(
      `Error calling LLM for role ${role}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
