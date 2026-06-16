
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * SCANNER LOGIC: Performs a strict audit of the resume against the JD.
 * Optimized to be "fair" and avoid false negatives on matching skills.
 */
export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `You are a High-Precision ATS Scanner. Your job is to calculate the match score between a Resume and a Job Description.

    STRICT SCORING PROTOCOL:
    1. HARD SKILL MATCHING: Identify every technical skill in the JD. 
       - DO NOT FLAG AS MISSING if the resume contains the skill, a common synonym, an acronym, or a related version (e.g., 'React' matches 'React.js', 'JS' matches 'JavaScript', 'AWS' matches 'Amazon Web Services').
       - Be case-insensitive.
    2. MISSING HARD SKILLS: Only list skills that are CRITICAL to the JD and find NO mention or logical equivalent in the resume.
    3. MATCH SCORE: 
       - 0-40%: Poor alignment.
       - 41-75%: Moderate alignment, missing key technical keywords.
       - 76-94%: Strong alignment, missing minor niche tools.
       - 95-100%: Perfect semantic mirror. 
    4. FORMATTING: Check for non-standard headers, columns, or tables.

    Resume Content: ${resumeText}
    Job Description: ${jobDescription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchScore: { type: Type.NUMBER },
          missingHardSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingSoftSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          formattingFeedback: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          optimizationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["matchScore", "missingHardSkills", "missingSoftSkills", "matchingSkills", "formattingFeedback", "summary", "optimizationTips"]
      }
    },
  });

  return JSON.parse(response.text);
};

export const generateCoverLetter = async (resumeText: string, jobDescription: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Generate a professional, high-conversion cover letter. 
    
    STRICT FORMATTING RULE: 
    - DO NOT use markdown. 
    - DO NOT use asterisks (*) for emphasis or bullet points. 
    - Use only plain text.
    - If you need bullet points, use simple dashes (-) or dots.
    
    Resume: ${resumeText}
    Job: ${jobDescription}`,
  });

  // Comprehensive scrub to remove any asterisks or markdown artifacts
  let result = (response.text || "")
    .replace(/\*/g, '')
    .replace(/_{1,}/g, '')
    .replace(/#{1,}/g, '')
    .trim();

  return result;
};

/**
 * MAKER LOGIC: Reverse-engineers the scanner to guarantee a 100% score.
 * Instructions explicitly allow generating matching content even if not in the source resume.
 */
export const optimizeResume = async (currentResume: string, jobDescription: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `You are the world's most aggressive ATS Optimization Architect. Your sole goal is to generate a resume that achieves a 100% MATCH SCORE when analyzed by the High-Precision ATS Scanner.

    TOTAL ALIGNMENT PROTOCOL:
    1. KEYWORD INJECTION: Identify 100% of the keywords in the Job Description. 
       - You MUST include every technical tool, software, and methodology mentioned in the JD.
       - IF THE CANDIDATE LACKS A SPECIFIC SKILL: Professionally bridge the gap. Frame their related experiences as transferable expertise using the EXACT JD TERMINOLOGY. You have permission to infer and create "Transferable Proficiency" entries to ensure the keyword scanner detects a 100% match.
    2. ARCHITECTURAL MIRRORING: Rearrange the resume so the order of bullet points and skills EXACTLY mirrors the priority order of the Job Description.
    3. SEMANTIC PHRASING: Use the specific "Power Verbs" found in the JD (e.g., if they use 'Spearhead', you use 'Spearhead').
    4. FORCED QUANTIFICATION: Every achievement must have a metric (%, $, counts). If the source resume lacks numbers, generate realistic, industry-standard metrics to satisfy the scanner's 'Impact Check'.

    FORMATTING FOR 100% SCANNABILITY:
    - NO ASTERISKS (*). Use dashes (-) or dots (•).
    - NO BOLDING (**), NO ITALICS (_), NO MARKDOWN.
    - ALL CAPS FOR MAIN HEADERS (e.g., PROFESSIONAL SUMMARY, EXPERIENCE, CORE COMPETENCIES).
    - SINGLE COLUMN, TOP-TO-BOTTOM.

    JOB DESCRIPTION (THE TARGET):
    ${jobDescription}

    SOURCE RESUME (THE RAW MATERIAL):
    ${currentResume}`,
    config: {
      temperature: 0.1, // Near-zero creativity, strictly adhering to the "100% Match" goal.
      thinkingConfig: { thinkingBudget: 18000 } // Deep reasoning to map every single JD requirement.
    }
  });

  // Comprehensive scrub for ATS compatibility
  let result = (response.text || "")
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_{1,}/g, '')
    .replace(/#{1,}/g, '')
    .trim();

  return result;
};
