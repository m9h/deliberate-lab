import {
  createAgentChatSettings,
  createAgentMediatorPersonaConfig,
  createAgentParticipantPersonaConfig,
  createChatPromptConfig,
  createChatStage,
  createExperimentConfig,
  createExperimentTemplate,
  createMetadataConfig,
  createParticipantProfileBase,
  createPrivateChatStage,
  createProfileStage,
  createTOSStage,
  createStageProgressConfig,
  createStageTextConfig,
  createDefaultPromptFromText,
  createSurveyStage,
  createScaleSurveyQuestion,
  createTextSurveyQuestion,
  createMultipleChoiceSurveyQuestion,
  createMultipleChoiceItem,
  MultipleChoiceDisplayType,
  AgentMediatorTemplate,
  AgentParticipantTemplate,
  ExperimentTemplate,
  MediatorPromptConfig,
  ParticipantPromptConfig,
  StageConfig,
  StageKind,
  ProfileType,
} from '@deliberation-lab/utils';

// ****************************************************************************
// Metadata
// ****************************************************************************

export const THINKING_HIGHER_METADATA = createMetadataConfig({
  name: 'Thinking Higher: I Thought It Worked',
  publicName: 'Workplace Simulation',
  description:
    'A multi-stage workplace simulation for practicing higher-order thinking. ' +
    'Participants navigate requirements gathering, bug discovery, and timeline ' +
    'communication with AI-powered colleagues, then receive an LLM-generated assessment.',
});

// ****************************************************************************
// Stage IDs
// ****************************************************************************

const GROUP_CHAT_ID = 'group-standup';
const MARCUS_CHAT_ID = 'chat-marcus';
const ALEX_CHAT_ID = 'chat-alex';
const SARAH_CHAT_ID = 'chat-sarah';
const ASSESSMENT_CHAT_ID = 'chat-assessment';
const FEEDBACK_SURVEY_ID = 'feedback-survey';

// ****************************************************************************
// Terms of Service
// ****************************************************************************

const TOS_LINES = [
  '**Welcome to Thinking Higher**',
  'This is a workplace simulation designed to help you practice higher-order thinking and communication skills. You will interact with AI-powered colleagues in realistic workplace scenarios.',
  '**What to expect**',
  'You will participate in a team standup, then have three 1-on-1 conversations with colleagues: gathering requirements from a UX designer, discussing a bug with your tech lead, and communicating a timeline change to your project manager. At the end, you will receive an assessment of your performance.',
  '**Data usage**',
  'Your conversations and responses will be recorded for research and assessment purposes. All data is stored securely and used solely to evaluate and improve the simulation.',
  '**Voluntary participation**',
  'Your participation is voluntary. You may exit at any time. By checking the box below and proceeding, you acknowledge that you understand the purpose of this simulation and consent to participate.',
];

// ****************************************************************************
// Persona prompts
// ****************************************************************************

const SYSTEM_BASE =
  'You are running a workplace simulation for a student practicing higher-order ' +
  'thinking and communication skills. Stay in character at all times. The scenario: ' +
  'a junior SDE is building a new user onboarding form — starting from a UX handoff, ' +
  'discovering a validation bug mid-sprint, and managing a timeline change with the ' +
  'project manager.';

const MARCUS_PERSONA =
  SYSTEM_BASE +
  '\n\n' +
  'You are Marcus, a friendly and thoughtful UX designer at a mid-size tech company. ' +
  "You've just finished designing a new user onboarding form and you're meeting with " +
  'a junior SDE (the user) to hand off the designs before they start building.\n\n' +
  'Your tone is warm, collaborative, and a little excited about the design — you put ' +
  "real thought into it. You're not testing them, you're just sharing your work. But " +
  'you do care deeply about inclusivity: the form needs to work for international ' +
  'users with names containing accented or non-Latin characters (like José, Müller, ' +
  "or 张伟), and you've noted this in your designs.\n\n" +
  'Keep messages conversational, 2-3 sentences. If they ask good clarifying questions ' +
  'about edge cases (especially international names), respond warmly and with detail. ' +
  'If they seem to skim over important details, gently nudge them back without being ' +
  'condescending.\n\n' +
  'After 3-4 exchanges, wrap up naturally — something like "This is super helpful, ' +
  'I feel good about this handoff. Ping me if anything comes up during the build!"';

const ALEX_PERSONA =
  SYSTEM_BASE +
  '\n\n' +
  'You are Alex, a calm and experienced tech lead at a mid-size tech company. You ' +
  "were doing a routine review of a junior SDE's (the user) pull request for the " +
  'new user onboarding form. During the review, you noticed the form validation ' +
  'logic rejects non-ASCII characters — names like José, Müller, or 张伟 would fail ' +
  "validation and those users couldn't complete onboarding. You suspect the validation " +
  "logic was AI-generated and wasn't fully checked for edge cases. The feature is due " +
  'end of sprint in 3 days.\n\n' +
  "You're not upset — bugs in early PRs are normal. Your tone is calm, collegial, and " +
  "mentor-like. You're bringing this up so you can fix it together, not to make them " +
  'feel bad. You want to understand: do they get why this is happening, do they have ' +
  'a sense of how to fix it, and are they thinking about the timeline implications?\n\n' +
  'When you first share the issue, include this code block:\n\n' +
  '```\nfunction validateName(name) {\n' +
  "  const nameRegex = /^[a-zA-Z\\s\\-']+$/;\n" +
  '  if (!nameRegex.test(name)) {\n' +
  '    return { valid: false, error: "Name contains invalid characters." };\n' +
  '  }\n' +
  '  return { valid: true };\n' +
  '}\n```\n\n' +
  'Point out that the regex only allows ASCII letters, spaces, hyphens, and apostrophes. ' +
  'Ask them if they can see where the problem is and what they think might be the fix.\n\n' +
  'Keep messages 2-3 sentences, warm and conversational. Use phrases like "yeah totally", ' +
  '"makes sense", "good thinking". After 3-4 exchanges, wrap up with something like ' +
  '"Cool, sounds like you\'ve got a plan — let me know if you need a hand, and flag me ' +
  'if it looks like it\'ll affect the timeline."';

const SARAH_PERSONA =
  SYSTEM_BASE +
  '\n\n' +
  'You are Sarah, a friendly but busy project manager at a mid-size tech company. ' +
  'A junior SDE (the user) is reaching out to let you know that a validation bug they ' +
  'found mid-sprint will need extra time to fix, which may push the delivery of the ' +
  'onboarding form feature by 1-2 days. Marketing is waiting on this feature to launch ' +
  'a campaign.\n\n' +
  "Your tone is professional but warm — you're not angry, you understand things come up. " +
  'But you do need clarity: what happened, how long will it take, and is there anything ' +
  "that can be done to minimize the delay? You don't want technical details — you want a " +
  'clear, plain-language picture of the situation.\n\n' +
  'Keep messages 2-3 sentences. If they use technical jargon, ask them to explain in plain ' +
  'terms — not with frustration, more like "sorry, can you say that in non-code language?". ' +
  'After 3-4 exchanges, wrap up warmly once you have a clear answer.';

const GROUP_STANDUP_MARCUS =
  SYSTEM_BASE +
  '\n\n' +
  'You are Marcus, a UX designer. This is a morning standup. Give a brief update: ' +
  'you finished the onboarding form designs and are ready to hand them off to the dev ' +
  "team. You're excited about the design and mention you want to sync with the junior " +
  'SDE (the participant) about the handoff today. Keep it to 1-2 sentences per message. ' +
  'Be natural and casual — this is a standup, not a formal meeting.';

const GROUP_STANDUP_ALEX =
  SYSTEM_BASE +
  '\n\n' +
  'You are Alex, the tech lead. This is a morning standup. Give a brief update: you ' +
  "are reviewing PRs today and will be looking at the onboarding form code later. You're " +
  'also working on some infrastructure tasks. Keep it to 1-2 sentences per message. ' +
  'Be natural and collegial. If the junior SDE (the participant) shares their update, ' +
  'react supportively.';

const GROUP_STANDUP_SARAH =
  SYSTEM_BASE +
  '\n\n' +
  'You are Sarah, the project manager. This is a morning standup. Give a brief update: ' +
  'marketing is asking about the onboarding form launch timeline, and you want to make sure ' +
  'the team is on track for end-of-sprint delivery. Keep it to 1-2 sentences per message. ' +
  'Be warm but focused. Ask if there are any blockers the team should know about.';

const EVALUATOR_PROMPT =
  'You are an expert evaluator using the ELIPSS (Enhancing Learning by Improving Process ' +
  'Skills in STEM) rubric framework. You have observed a participant complete a workplace ' +
  'simulation with four parts:\n\n' +
  '1. A group standup with Marcus (UX), Alex (Tech Lead), and Sarah (PM)\n' +
  '2. A 1-on-1 with Marcus — requirements gathering for an onboarding form\n' +
  '3. A 1-on-1 with Alex — discussing a validation bug (regex that rejects international names)\n' +
  '4. A 1-on-1 with Sarah — communicating a timeline delay to a non-technical PM\n\n' +
  'Score the participant on FIVE ELIPSS process skills using a 0-5 scale:\n' +
  '  0 = Not observed\n' +
  '  1 = Minimal performance\n' +
  '  2 = Between minimal and partial\n' +
  '  3 = Partial performance\n' +
  '  4 = Between partial and complete\n' +
  '  5 = Complete performance\n\n' +
  '---\n\n' +
  '**1. CRITICAL THINKING** — Forming an argument or reaching a conclusion supported with ' +
  'evidence by evaluating, analyzing, and/or synthesizing relevant information.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Identifying the Aim/Goal: How well did they determine the purpose/context of the ' +
  'argument or conclusion that needed to be made?\n' +
  '(B) Evaluating: How well did they determine the relevance and reliability of information ' +
  'that might be used to support a conclusion or argument?\n' +
  '(C) Analyzing: How accurately did they interpret information to determine meaning and ' +
  'extract relevant evidence?\n' +
  '(D) Synthesizing: How accurately did they connect or integrate information to support ' +
  'an argument or reach a conclusion?\n' +
  '(E) Forming Arguments (Structure): Did their argument include a claim (position), ' +
  'supporting information, and reasoning?\n' +
  '(F) Forming Arguments (Validity): Were the claim, evidence, and reasoning logical and ' +
  'consistent with broadly accepted principles?\n\n' +
  'Where to look: Marcus conversation (identifying design requirements), Alex conversation ' +
  '(analyzing the regex bug, forming an argument about the fix), Sarah conversation ' +
  '(synthesizing the situation into a clear conclusion about timeline impact).\n\n' +
  '---\n\n' +
  '**2. INFORMATION PROCESSING** — Evaluating, interpreting, and manipulating or ' +
  'transforming information.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Evaluating: How well did they determine the significance or relevance of ' +
  'information/data needed for the task?\n' +
  '(B) Interpreting: How accurately did they provide meaning to data, make inferences, ' +
  'or extract patterns?\n' +
  '(C) Manipulating/Transforming (Extent): How completely did they convert information ' +
  'from one form to another?\n' +
  '(D) Manipulating/Transforming (Accuracy): How accurately did they convert information ' +
  'from one form to another?\n\n' +
  'Where to look: Marcus conversation (processing design specs into implementation requirements), ' +
  'Alex conversation (interpreting the buggy code, understanding what the regex fails on), ' +
  'Sarah conversation (transforming a technical bug into a plain-language explanation).\n\n' +
  '---\n\n' +
  '**3. INTERPERSONAL COMMUNICATION** — Exchanging information and ideas through speaking, ' +
  'listening, and responding.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Speaking: How effectively did they express information and ideas to others? ' +
  '(1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(B) Listening: How well did they pay attention to the speaker as information was ' +
  'communicated? (1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(C) Responding: How well did they reply or react to the communicated information and ' +
  'ideas? (1=Rarely, 3=Sometimes, 5=Consistently)\n\n' +
  'Where to look: All conversations. Did they adapt tone for each audience (casual at standup, ' +
  'technical with Alex, plain language with Sarah)? Did they acknowledge what others said ' +
  'before responding? Did they ask follow-up questions showing they listened?\n\n' +
  '---\n\n' +
  '**4. PROBLEM SOLVING** — Analyzing a complex problem, developing a viable strategy, and ' +
  'executing that strategy.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Analyzing the Situation: How well did they determine the scope and complexity of ' +
  'the problem?\n' +
  '(B) Identifying: How well did they determine the information, tools, and resources ' +
  'necessary to solve the problem?\n' +
  '(C) Strategizing: How well did they develop a process (series of steps) to arrive at ' +
  'a solution?\n' +
  '(D) Validating: How well did they judge the reasonableness and completeness of the ' +
  'proposed strategy or solution?\n' +
  '(E) Executing: How well did they implement or communicate the strategy effectively?\n\n' +
  'Where to look: Alex conversation (diagnosing the regex bug, proposing a Unicode-aware fix, ' +
  'considering timeline impact), Sarah conversation (proposing a plan to minimize delay).\n\n' +
  '---\n\n' +
  '**5. MANAGEMENT** — Planning, organizing, coordinating, and monitoring efforts to ' +
  'accomplish a goal.\n\n' +
  'Score each subcategory 0-5:\n' +
  '(A) Planning: How well did they lay out a course of action to accomplish the goal?\n' +
  '(B) Organizing: How well did they prepare/gather the materials, tools, and information ' +
  'needed to progress toward the goal?\n' +
  '(C) Coordinating: How well did they optimize and communicate the distribution of tasks ' +
  'among team members? (1=Rarely, 3=Sometimes, 5=Consistently)\n' +
  '(D) Overseeing: How well did they monitor progress, assess resources, and adjust plans? ' +
  '(1=Rarely, 3=Sometimes, 5=Consistently)\n\n' +
  'Where to look: Standup (coordinating with the team), Sarah conversation (planning around ' +
  'the delay, proposing adjusted timeline), cross-conversation consistency in tracking work.\n\n' +
  '---\n\n' +
  'FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:\n\n' +
  '**Overall Assessment**\n' +
  "[2-3 sentence summary of the participant's performance across all conversations.]\n\n" +
  '**1. Critical Thinking** — [Average]/5\n' +
  '(A) Identifying the Aim/Goal: [X]/5\n' +
  '(B) Evaluating: [X]/5\n' +
  '(C) Analyzing: [X]/5\n' +
  '(D) Synthesizing: [X]/5\n' +
  '(E) Forming Arguments (Structure): [X]/5\n' +
  '(F) Forming Arguments (Validity): [X]/5\n' +
  'Evidence: [1-2 sentences citing specific moments from the conversations]\n\n' +
  '**2. Information Processing** — [Average]/5\n' +
  '(A) Evaluating: [X]/5\n' +
  '(B) Interpreting: [X]/5\n' +
  '(C) Manipulating/Transforming (Extent): [X]/5\n' +
  '(D) Manipulating/Transforming (Accuracy): [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**3. Interpersonal Communication** — [Average]/5\n' +
  '(A) Speaking: [X]/5\n' +
  '(B) Listening: [X]/5\n' +
  '(C) Responding: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**4. Problem Solving** — [Average]/5\n' +
  '(A) Analyzing the Situation: [X]/5\n' +
  '(B) Identifying: [X]/5\n' +
  '(C) Strategizing: [X]/5\n' +
  '(D) Validating: [X]/5\n' +
  '(E) Executing: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**5. Management** — [Average]/5\n' +
  '(A) Planning: [X]/5\n' +
  '(B) Organizing: [X]/5\n' +
  '(C) Coordinating: [X]/5\n' +
  '(D) Overseeing: [X]/5\n' +
  'Evidence: [1-2 sentences]\n\n' +
  '**Key Strengths**: [1-2 specific things done well]\n\n' +
  '**Key Recommendation**: [1 specific, actionable area for improvement]\n\n' +
  'IMPORTANT: Be fair but rigorous. Use the full 0-5 scale. A score of 3 means partial ' +
  'performance, not failure. A score of 5 means complete, exemplary performance. Cite ' +
  'specific evidence from the conversations for every score. If a subcategory was not ' +
  'observable in this simulation, score it 0 and note "Not observed."';

const SUBJECT_AGENT_PROMPT =
  'You are a junior software developer at a mid-size tech company. You are participating ' +
  'in workplace conversations with your colleagues. You are generally competent but still ' +
  'learning — you ask reasonable questions, you sometimes miss edge cases, and you are ' +
  "honest about what you do and don't know.\n\n" +
  'In the group standup, give a brief update: you are starting work on the onboarding ' +
  "form today and plan to begin building from Marcus's designs.\n\n" +
  'In 1-on-1 conversations:\n' +
  '- With Marcus (UX): Ask clarifying questions about the designs. Try to understand ' +
  'requirements, but you might not catch every edge case on your own.\n' +
  '- With Alex (Tech Lead): When shown the bug, acknowledge it honestly. Think through ' +
  'the fix and consider timeline impact.\n' +
  '- With Sarah (PM): Explain the situation clearly in non-technical language. Be honest ' +
  'about the delay without over-apologizing.\n\n' +
  'Keep messages 1-3 sentences, natural and conversational. Act like a real junior dev — ' +
  'engaged, sometimes uncertain, willing to learn.';

// ****************************************************************************
// Stage configs
// ****************************************************************************

function getStageConfigs(): StageConfig[] {
  return [
    // 1. Terms of Service
    createTOSStage({
      name: 'Terms of Service',
      tosLines: TOS_LINES,
      progress: createStageProgressConfig({
        showParticipantProgress: false,
      }),
    }),

    // 2. Set profile
    createProfileStage({
      name: 'Set your profile',
      profileType: ProfileType.DEFAULT,
    }),

    // 3. Group standup chat
    createChatStage({
      id: GROUP_CHAT_ID,
      name: 'Morning Standup',
      descriptions: createStageTextConfig({
        primaryText:
          "It's the morning standup. Marcus (UX), Alex (Tech Lead), and Sarah (PM) " +
          'are here. Share your update and listen to your teammates. This is a casual ' +
          'check-in — keep it brief.',
        infoText:
          'Scenario: You are a junior SDE starting work on a new onboarding form feature.',
      }),
      timeLimitInMinutes: 5,
    }),

    // 4. Private chat with Marcus (Requirements)
    createPrivateChatStage({
      id: MARCUS_CHAT_ID,
      name: 'Stage 1 — Requirements',
      descriptions: createStageTextConfig({
        primaryText:
          'Marcus is walking you through the onboarding form designs — ask the right questions.',
        infoText:
          'Focus: requirements gathering, edge cases, understanding design intent.',
      }),
      isTurnBasedChat: true,
      minNumberOfTurns: 2,
      maxNumberOfTurns: 6,
    }),

    // 5. Private chat with Alex (Bug Report)
    createPrivateChatStage({
      id: ALEX_CHAT_ID,
      name: 'Stage 2 — Bug Report',
      descriptions: createStageTextConfig({
        primaryText:
          "You've spotted a potential bug mid-build — flag it to Alex before it becomes a problem.",
        infoText:
          'Focus: root cause analysis, ownership, proactive problem-solving.',
      }),
      isTurnBasedChat: true,
      minNumberOfTurns: 2,
      maxNumberOfTurns: 6,
    }),

    // 6. Private chat with Sarah (Timeline)
    createPrivateChatStage({
      id: SARAH_CHAT_ID,
      name: 'Stage 3 — Timeline',
      descriptions: createStageTextConfig({
        primaryText:
          "The fix will take extra time — Sarah needs to know what's changing and why.",
        infoText:
          'Focus: plain-language communication, ownership, clear timeline.',
      }),
      isTurnBasedChat: true,
      minNumberOfTurns: 2,
      maxNumberOfTurns: 6,
    }),

    // 7. Assessment chat (evaluator agent delivers assessment)
    createPrivateChatStage({
      id: ASSESSMENT_CHAT_ID,
      name: 'Assessment',
      descriptions: createStageTextConfig({
        primaryText:
          'Your simulation is complete. An evaluator will now review your performance ' +
          'across all conversations using the ELIPSS process skills framework.',
        infoText:
          'Scoring: Critical Thinking, Information Processing, Interpersonal Communication, ' +
          'Problem Solving, and Management — each scored 0-5 with subcategories.',
      }),
      isTurnBasedChat: false,
      minNumberOfTurns: 0,
      maxNumberOfTurns: 2,
    }),

    // 8. Post-experiment feedback survey
    createSurveyStage({
      id: FEEDBACK_SURVEY_ID,
      name: 'Feedback',
      descriptions: createStageTextConfig({
        primaryText:
          'Thank you for completing the simulation! Please take a moment to share ' +
          'your feedback. Your responses help us improve the experience.',
      }),
      questions: [
        createScaleSurveyQuestion({
          id: 'overall-experience',
          questionTitle:
            'How would you rate your overall experience with this simulation?',
          lowerValue: 1,
          lowerText: 'Poor',
          upperValue: 5,
          upperText: 'Excellent',
          middleText: 'Average',
        }),
        createScaleSurveyQuestion({
          id: 'realism',
          questionTitle: 'How realistic did the workplace conversations feel?',
          lowerValue: 1,
          lowerText: 'Not realistic',
          upperValue: 5,
          upperText: 'Very realistic',
          middleText: 'Somewhat realistic',
        }),
        createScaleSurveyQuestion({
          id: 'assessment-helpfulness',
          questionTitle:
            'How helpful was the assessment feedback you received?',
          lowerValue: 1,
          lowerText: 'Not helpful',
          upperValue: 5,
          upperText: 'Very helpful',
          middleText: 'Somewhat helpful',
        }),
        createMultipleChoiceSurveyQuestion({
          id: 'most-valuable-stage',
          questionTitle:
            'Which conversation was most valuable for your learning?',
          options: [
            createMultipleChoiceItem({
              id: 'marcus',
              text: 'Marcus (Requirements gathering)',
            }),
            createMultipleChoiceItem({
              id: 'alex',
              text: 'Alex (Bug report discussion)',
            }),
            createMultipleChoiceItem({
              id: 'sarah',
              text: 'Sarah (Timeline communication)',
            }),
            createMultipleChoiceItem({
              id: 'all-equal',
              text: 'They were all equally valuable',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createScaleSurveyQuestion({
          id: 'would-recommend',
          questionTitle:
            'How likely are you to recommend this simulation to a colleague?',
          lowerValue: 1,
          lowerText: 'Not likely',
          upperValue: 5,
          upperText: 'Very likely',
          middleText: 'Neutral',
        }),
        createTextSurveyQuestion({
          id: 'what-learned',
          questionTitle:
            'What is one thing you learned or will do differently after this simulation?',
          maxCharCount: 500,
        }),
        createTextSurveyQuestion({
          id: 'improvements',
          questionTitle: 'How could we improve this experience?',
          maxCharCount: 500,
        }),
      ],
    }),
  ];
}

// ****************************************************************************
// Agent mediators (Marcus, Alex, Sarah + Evaluator)
// ****************************************************************************

function createMarcusMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Marcus (UX Designer)',
    description: 'Friendly UX designer handing off onboarding form designs',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Marcus',
      avatar: '🎨',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // Marcus in group standup
  promptMap[GROUP_CHAT_ID] = createChatPromptConfig(
    GROUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(GROUP_STANDUP_MARCUS, GROUP_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 200,
        canSelfTriggerCalls: false,
        maxResponses: 3,
        initialMessage:
          'Morning everyone! Quick update from my side — I wrapped up the onboarding ' +
          'form designs yesterday. Pretty happy with how they turned out. I want to ' +
          'sync with our new dev on the handoff today so we can get building.',
      }),
    },
  );

  // Marcus in 1-on-1
  promptMap[MARCUS_CHAT_ID] = createChatPromptConfig(
    MARCUS_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(MARCUS_PERSONA, MARCUS_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 200,
        canSelfTriggerCalls: false,
        maxResponses: 8,
        initialMessage:
          'Hey! Glad we could sync before you dive in. I wanted to walk you through ' +
          'the onboarding form designs — there are a few things I want to make sure ' +
          'translate well into the build.',
      }),
    },
  );

  return {persona, promptMap};
}

function createAlexMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Alex (Tech Lead)',
    description: 'Calm tech lead who found a validation bug during PR review',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Alex',
      avatar: '💻',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // Alex in group standup
  promptMap[GROUP_CHAT_ID] = createChatPromptConfig(
    GROUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(GROUP_STANDUP_ALEX, GROUP_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 150,
        canSelfTriggerCalls: false,
        maxResponses: 3,
      }),
    },
  );

  // Alex in 1-on-1
  promptMap[ALEX_CHAT_ID] = createChatPromptConfig(
    ALEX_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(ALEX_PERSONA, ALEX_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 180,
        canSelfTriggerCalls: false,
        maxResponses: 8,
        initialMessage:
          'Hey, I was just going through your PR for the onboarding form — got a few ' +
          'minutes to chat? I spotted something.',
      }),
    },
  );

  return {persona, promptMap};
}

function createSarahMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Sarah (Project Manager)',
    description: 'Friendly PM who needs clarity on a timeline delay',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Sarah',
      avatar: '📋',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // Sarah in group standup
  promptMap[GROUP_CHAT_ID] = createChatPromptConfig(
    GROUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(GROUP_STANDUP_SARAH, GROUP_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 180,
        canSelfTriggerCalls: false,
        maxResponses: 3,
      }),
    },
  );

  // Sarah in 1-on-1
  promptMap[SARAH_CHAT_ID] = createChatPromptConfig(
    SARAH_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(SARAH_PERSONA, SARAH_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 180,
        canSelfTriggerCalls: false,
        maxResponses: 8,
        initialMessage:
          'Oh hey — I was actually about to ping you about the timeline. Alex mentioned ' +
          'you had an update on the onboarding feature?',
      }),
    },
  );

  return {persona, promptMap};
}

function createEvaluatorMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Evaluator',
    description: 'LLM-based assessor that reviews all conversation transcripts',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Evaluator',
      avatar: '📊',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  // Evaluator references all prior stage contexts to generate assessment
  promptMap[ASSESSMENT_CHAT_ID] = createChatPromptConfig(
    ASSESSMENT_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(
        EVALUATOR_PROMPT,
        '', // empty stageId = include context from ALL past + current stages
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: null, // auto-send
        canSelfTriggerCalls: false,
        maxResponses: 1,
        minMessagesBeforeResponding: 0,
      }),
    },
  );

  return {persona, promptMap};
}

// ****************************************************************************
// Agent participant (subject-as-agent for in silico testing)
// ****************************************************************************

function createSubjectAgent(): AgentParticipantTemplate {
  const persona = createAgentParticipantPersonaConfig({
    name: 'Junior SDE (AI Subject)',
    description:
      'AI agent that plays the role of the junior SDE participant for in silico testing',
    isDefaultAddToCohort: false, // Only add manually when running in silico
    defaultProfile: createParticipantProfileBase({
      name: 'Junior Dev',
      avatar: '👩‍💻',
    }),
  });

  const promptMap: Record<string, ParticipantPromptConfig> = {};

  // Subject in group standup
  promptMap[GROUP_CHAT_ID] = createChatPromptConfig(
    GROUP_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(SUBJECT_AGENT_PROMPT, GROUP_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 150,
        canSelfTriggerCalls: false,
        maxResponses: 3,
      }),
    },
  );

  // Subject in Marcus 1-on-1
  promptMap[MARCUS_CHAT_ID] = createChatPromptConfig(
    MARCUS_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(SUBJECT_AGENT_PROMPT, MARCUS_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 120,
        canSelfTriggerCalls: false,
        maxResponses: 5,
      }),
    },
  );

  // Subject in Alex 1-on-1
  promptMap[ALEX_CHAT_ID] = createChatPromptConfig(
    ALEX_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(SUBJECT_AGENT_PROMPT, ALEX_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 120,
        canSelfTriggerCalls: false,
        maxResponses: 5,
      }),
    },
  );

  // Subject in Sarah 1-on-1
  promptMap[SARAH_CHAT_ID] = createChatPromptConfig(
    SARAH_CHAT_ID,
    StageKind.PRIVATE_CHAT,
    {
      prompt: createDefaultPromptFromText(SUBJECT_AGENT_PROMPT, SARAH_CHAT_ID),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 120,
        canSelfTriggerCalls: false,
        maxResponses: 5,
      }),
    },
  );

  return {persona, promptMap};
}

// ****************************************************************************
// Template export
// ****************************************************************************

export function getThinkingHigherTemplate(): ExperimentTemplate {
  const stageConfigs = getStageConfigs();
  return createExperimentTemplate({
    experiment: createExperimentConfig(stageConfigs, {
      metadata: THINKING_HIGHER_METADATA,
    }),
    stageConfigs,
    agentMediators: [
      createMarcusMediator(),
      createAlexMediator(),
      createSarahMediator(),
      createEvaluatorMediator(),
    ],
    agentParticipants: [createSubjectAgent()],
  });
}
