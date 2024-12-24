// src/utils/assistantPrompts.ts

import instructions from "../instructions/instructions.json";
import teammateInstructions from "../instructions/teammate_instructions.json";

/**
 * Generates the system prompt for a given role.
 * @param role - The role of the assistant ('moderator' or a teammate's name).
 * @returns The system prompt string tailored to that role.
 */
export const getAssistantSystemPrompt = (role: string): string => {
  // Moderator
  if (role.toLowerCase() === "moderator") {
    return `
${instructions.main.instructions}

Team Members:
${instructions.main.team
  .map((member: any) => `- ${member.name}: ${member.specialty}`)
  .join("\n")}

Commands:
${instructions.main.commands
  .map((cmd: any) => `- ${cmd.cmd}: ${cmd.description}`)
  .join("\n")}

Warnings:
${instructions.main.warnings.join("\n")}
`;
  }

  // Else, assume it’s a teammate. Let's find them in instructions.main.team
  const found = instructions.main.team.find(
    (member: any) => member.name.toLowerCase() === role.toLowerCase()
  );

  if (!found) {
    // Then maybe it's a known teammate role that didn't appear? Throw an error
    throw new Error(`No system prompt defined for assistant: ${role}`);
  }

  // Build the teammate system instructions
  return `
${teammateInstructions.main}

${teammateInstructions.role_explanation.replace("<NAME>", found.name)}

Team Members:
${instructions.main.team
  .map((member: any) => `- ${member.name}: ${member.specialty}`)
  .join("\n")}

Specialty:
${found.specialty}

Rules:
${teammateInstructions.rules.join("\n")}

Remember; you are ${found.name}, you are a teammate, act accordingly.
`;
};
