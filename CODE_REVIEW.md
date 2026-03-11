# Code Review: Thinking Higher Experiment

## 1. frontend/src/shared/templates/thinking_higher.ts

*   **Improvement (Prompt Length):** The `EVALUATOR_PROMPT` is quite long, combining 5 complex ELIPSS dimensions into a single zero-shot prompt. While Gemini 1.5 Pro handles long contexts well, a very long output requirement (scoring 22 subcategories) might lead to missed categories or degraded adherence. Consider splitting the assessment into multiple agents (e.g., one for Critical Thinking & Problem Solving, another for the rest) or using structured JSON output to guarantee all 22 subcategories are addressed.
*   **Nit (Survey Question):** The "overall-experience" survey question uses a 1-5 scale. This is fine, but for NPS-style questions like "would-recommend", a 0-10 scale is standard.
*   **Nit (Stage Configs):** The Assessment chat has `minNumberOfTurns: 0` and `maxNumberOfTurns: 2`. This works well to allow the Evaluator to send the assessment without requiring a participant reply. The conversation turn limits for other stages (e.g., min 2, max 6) seem reasonable for short focused interactions.
*   **Improvement (Distinct Personas):** The personas (Marcus, Alex, Sarah) are distinct and have clear goals. Marcus is focused on UX and inclusivity, Alex on technical code validation, and Sarah on timelines and plain-language explanation. This creates a good variety of interactions.

## 2. functions/src/utils/firestore.ts

*   **Bug/Edge Case (Firestore Filtering):** In `getFirestoreActiveMediators`, the filter `(stageId ? mediator.activeStageMap?.[stageId] : true)` correctly passes if `stageId` is null. However, if `stageId` is passed as an empty string `""` (which is falsy), it will return `true` for all mediators, bypassing the `activeStageMap` check. In `thinking_higher.ts`, the Evaluator is set up with `prompt: createDefaultPromptFromText(EVALUATOR_PROMPT, '')` to include context from all past stages. Ensure that callers of `getFirestoreActiveMediators` do not inadvertently pass `""` expecting it to filter, or explicitly handle `""` vs `null` if they have different semantics.

## 3. frontend/src/components/stages/private_chat_participant_view.ts

*   **Improvement (UX):** The check `const isLast = this.participantService.isLastStage();` is used to toggle between "simulation complete" and "proceed to next stage". This is a good UX improvement.
*   **Edge Case (Mid-assessment refresh):** If the participant refreshes the page mid-assessment (before the evaluator sends the message), they will still see the chat interface because `isLastStage` is true, but the conversation hasn't ended. Once the evaluator sends the message and the conversation ends (since max turns is reached or they manually end), the "simulation complete" text will correctly appear. No major issues here.

## 4. scripts/run_in_silico.ts

*   **Improvement (Race Conditions):** The stage monitoring loop polls `getParticipantState` every few seconds. This is generally safe for an in-silico script, but if a stage transition happens very quickly, it might not log the intermediate stage. Not a critical issue for a test script.
*   **Improvement (Error Handling):** The script currently throws raw errors if Firebase operations fail. Wrapping the main orchestration in a broader `try/catch` and logging specific Firestore errors (e.g., "Failed to fetch cohort", "Failed to write participant") would make debugging easier.
*   **Nit (Transcript Export):** The export captures messages, but it might be useful to also capture the final survey responses to ensure the entire pipeline (including data collection) is working end-to-end.

## 5. General Codebase

*   **Security:** Ensure that the Gemini API key stored in `experimenterData` is not exposed to the client side. The current implementation fetches it server-side via Cloud Functions, which is correct. Firestore rules should prevent unauthorized access to `experimenterData`.
*   **Type Safety:** The use of `as ChatMessage` and `as StageConfig` after Firestore `.get()` calls is standard for Firebase but bypasses runtime type checking. Using a validation library like Zod or the existing custom validators when reading from Firestore could improve safety, though this is a larger architectural change.
