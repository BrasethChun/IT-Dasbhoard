/**
 * Centralized Gemini SDK & AI Studio Configuration
 * Defines supported models, default parameters, system instructions, and schemas.
 */

export const GEMINI_CONFIG = {
  // Recommended standard model for text enhancement, proofreading, and titling
  DEFAULT_TEXT_MODEL: 'gemini-3.8-flash',
  
  // Model generation options
  GENERATION_CONFIG: {
    temperature: 0.3,
    topP: 0.85,
    maxOutputTokens: 2048,
  },

  // Telemetry client headers per AI Studio guidelines
  CLIENT_HEADERS: {
    'User-Agent': 'aistudio-build'
  },

  // System Instructions
  SYSTEM_INSTRUCTIONS: {
    ENHANCE_NOTE: `You are an executive editor and document assistant for hospital IT management and technical staff.
Enhance the given note content for clarity, grammatical accuracy, structured formatting, and professional flow while strictly preserving the original facts and technical details.
Return ONLY the clean, enhanced note content formatted with clean paragraphs or bullet points as appropriate. Do not add conversational commentary or pleasantries.`,
    GENERATE_TITLE: `You are an automated document titling assistant. Generate a concise, informative, high-impact title (maximum 5 to 7 words) that captures the core subject of the provided note content. Return ONLY the plain text title without quotes or introductory phrases.`
  }
} as const;
