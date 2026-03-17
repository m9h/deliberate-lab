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

export const SHIP_OR_FIX_METADATA = createMetadataConfig({
  name: 'Ship or Fix: The 2% Problem',
  publicName: 'Product Decision Simulation',
  description:
    'A deliberation scenario where four stakeholders must reach consensus on whether ' +
    'to ship a feature with a known bug. Each role brings different values and priorities. ' +
    'There is no right answer — the quality of the deliberation is what matters.',
});

// ****************************************************************************
// Stage IDs
// ****************************************************************************

const BRIEFING_SURVEY_ID = 'briefing-survey';
const DELIBERATION_CHAT_ID = 'group-deliberation';
const VOTE_SURVEY_ID = 'vote-survey';
const REFLECTION_SURVEY_ID = 'reflection-survey';
const ASSESSMENT_CHAT_ID = 'chat-assessment';
const FEEDBACK_SURVEY_ID = 'feedback-survey';

// ****************************************************************************
// Terms of Service
// ****************************************************************************

const TOS_LINES = [
  'Welcome to Ship or Fix. This is a group deliberation where you and 3 other ' +
    'participants will debate a real product decision with no clear right answer.',
  '**The situation**: Your company makes PortfolioView, a fintech dashboard used by ' +
    '50,000 people to manage their investment portfolios. The team has spent 3 months ' +
    "building a new portfolio analytics module. It's feature-complete, but testing " +
    'revealed a bug: for users with >100 holdings spanning international markets (~2% ' +
    'of users, ~1,000 people), the annualized return calculations are sometimes wrong ' +
    'by 3-8%. A page refresh fixes it temporarily. The team must decide: ship now or ' +
    'delay to fix?',
  '**The pressure**:\n' +
    '- Greenfield Financial ($2M ARR prospect) demo in 4 days\n' +
    '- Competitor PortfolioPro launched their analytics last week\n' +
    '- Board review in 10 days — product velocity matters\n' +
    '- Support team already stretched from another issue',
  '**The roles** (you will be assigned one):\n' +
    '- **Riley Chen** \uD83D\uDCC8 (Product Manager) — Owns the roadmap and revenue targets. ' +
    'Feels the competitive and revenue pressure acutely.\n' +
    '- **Sam Okafor** \uD83D\uDD27 (Senior Engineer) — Built the module. Understands the ' +
    'technical debt implications and worries about data accuracy in fintech.\n' +
    '- **Taylor Kim** \uD83D\uDCDE (Customer Support Lead) — Hears directly from users. Has ' +
    'data on how the beta group reacted to the bug.\n' +
    '- **Jordan Reeves** \uD83C\uDFA8 (UX/Design Lead) — Cares about user experience integrity. ' +
    'Has ideas for middle-ground approaches.',
  '**What to expect**:\n' +
    "1. Briefing survey — read your role's perspective carefully\n" +
    '2. Group deliberation — a facilitator will help structure the discussion. Share your ' +
    'view, listen to others, and work toward a decision the group can support\n' +
    '3. Individual vote and reflection\n' +
    '4. Assessment',
  '**Key rules**:\n' +
    "- Argue from your role's perspective, but stay open to other views\n" +
    '- There is genuinely no right answer — both shipping and fixing have real costs\n' +
    '- The facilitator will help ensure everyone is heard\n' +
    '- Quality of reasoning matters more than the final decision',
  '**Data usage**',
  'Your conversations and responses will be recorded for research and assessment purposes. ' +
    'All data is stored securely and used solely to evaluate and improve the simulation.',
  '**Voluntary participation**',
  'Your participation is voluntary. You may exit at any time. By checking the box below ' +
    'and proceeding, you acknowledge that you understand the purpose of this simulation ' +
    'and consent to participate.',
];

// ****************************************************************************
// Role briefings
// ****************************************************************************

const RILEY_BRIEFING =
  '**Riley Chen (Product Manager) \uD83D\uDCC8**\n\n' +
  "You own the product roadmap and are accountable for quarterly metrics. Here's your view:\n\n" +
  '(1) PortfolioPro launched competing analytics last week — every day of delay is market ' +
  'share risk.\n' +
  "(2) Greenfield Financial's $2M demo is in 4 days. They specifically asked to see the " +
  'new analytics. Rescheduling would be a very bad signal.\n' +
  '(3) The board review in 10 days will scrutinize product velocity — a delay looks bad.\n' +
  '(4) The bug affects 2% of users. 98% would get a perfect experience.\n' +
  "(5) You'd accept shipping with a known-issues note and fast-follow fix.\n\n" +
  "You're not reckless — you care about quality. But you've seen too many teams lose " +
  'market windows by chasing perfection.';

const SAM_BRIEFING =
  '**Sam Okafor (Senior Engineer) \uD83D\uDD27**\n\n' +
  "You built the analytics module and understand the code deeply. Here's your view:\n\n" +
  '(1) The bug is in the currency normalization pipeline — when international holdings ' +
  'span certain timezone boundaries during market transitions, the calculations use ' +
  'stale exchange rates. The 3-8% error margin is significant for financial data.\n' +
  '(2) This is fintech. Users make real financial decisions based on these numbers. ' +
  'Showing someone a loss when they actually have a gain could cause them to sell at the ' +
  'wrong time.\n' +
  '(3) The fix requires refactoring the exchange rate caching layer — 3-5 days of focused ' +
  'work, plus testing.\n' +
  '(4) If you ship now, the quick-fix pressure will lead to a patch that creates more ' +
  'technical debt.\n' +
  "(5) You've seen what happens when financial software ships with known data accuracy " +
  'bugs — it erodes trust permanently.\n' +
  '(6) You estimate: fix properly now = 5 days; fix after shipping = 8-10 days (because ' +
  "you'll also be handling support escalations).";

const TAYLOR_BRIEFING =
  '**Taylor Kim (Customer Support Lead) \uD83D\uDCDE**\n\n' +
  "You run the support team and hear directly from users. Here's your view:\n\n" +
  '(1) During the beta, 12 users hit this bug. 3 submitted angry tickets ("your ' +
  'calculations are wrong, I don\'t trust this product"). 2 quietly stopped using ' +
  "analytics entirely. 7 didn't notice or didn't report it.\n" +
  '(2) Your support team is already handling elevated ticket volume from a separate ' +
  'billing integration issue — adding another known bug would stretch them thin.\n' +
  '(3) You\'ve drafted a workaround guide ("refresh the page if your numbers look off") ' +
  "but it's a terrible user experience.\n" +
  "(4) However: you've also seen users in the beta who LOVE the new analytics. The " +
  'positive feedback has been strong.\n' +
  "(5) You're genuinely torn. Delaying means the 98% who'd be happy have to wait. " +
  'Shipping means the 2% will have a bad experience and your team bears the cost.\n' +
  '(6) You think the real question is: what message does the team send to users about ' +
  'their priorities?';

const JORDAN_BRIEFING =
  '**Jordan Reeves (UX/Design Lead) \uD83C\uDFA8**\n\n' +
  "You lead design and care deeply about user experience coherence. Here's your view:\n\n" +
  '(1) Showing wrong financial numbers is not an acceptable user experience, even for ' +
  '2% of users. In fintech, "wrong" isn\'t a minor UX issue — it\'s a trust violation.\n' +
  '(2) However, you have a middle-ground proposal: ship a "degraded mode" for affected ' +
  'users. Instead of showing incorrect calculations, show a loading/calculating ' +
  'indicator with a message: "Detailed analytics for complex international portfolios ' +
  'are being computed — check back shortly." This masks the bug without showing wrong data.\n' +
  '(3) Implementing the degraded mode would take 1-2 days, not the full 3-5 day fix. ' +
  'The demo could happen on time with a note that international analytics are "rolling ' +
  'out in phases."\n' +
  "(4) You think the real risk isn't the delay or the bug — it's shipping something " +
  'that makes the product feel unreliable.\n' +
  '(5) You want the team to consider what matters more: speed to market or product ' +
  'integrity? Both are legitimate values.';

const ALL_BRIEFINGS =
  "Read your assigned role's briefing carefully. You will argue from this perspective " +
  'during the group deliberation.\n\n' +
  '---\n\n' +
  RILEY_BRIEFING +
  '\n\n---\n\n' +
  SAM_BRIEFING +
  '\n\n---\n\n' +
  TAYLOR_BRIEFING +
  '\n\n---\n\n' +
  JORDAN_BRIEFING;

// ****************************************************************************
// Persona prompts
// ****************************************************************************

const FACILITATOR_SYSTEM_BASE =
  'You are a group discussion facilitator for a product decision deliberation at a ' +
  'fictional fintech company. Your role is inspired by the Habermas Machine approach: ' +
  'you help the group surface different perspectives, find common ground, and work ' +
  "toward a decision everyone can support — even if they don't fully agree. The group " +
  'has 4 human participants: Riley (Product Manager), Sam (Senior Engineer), Taylor ' +
  '(Customer Support), and Jordan (UX/Design). They are debating whether to ship a ' +
  'product feature with a known bug affecting 2% of users.';

const FACILITATOR_DELIBERATION_PROMPT =
  FACILITATOR_SYSTEM_BASE +
  '\n\n' +
  'Your facilitation protocol:\n\n' +
  '(1) Open by framing the decision clearly: "We\'re here to decide whether to ship ' +
  'the new analytics module now, delay for a full fix, or find a middle ground. Each of ' +
  "you brings a different perspective and different information. I'll make sure everyone " +
  'is heard."\n\n' +
  '(2) In the first round, ask each person to state their initial position and their ' +
  'PRIMARY concern — the thing they most want to protect.\n\n' +
  '(3) After initial positions, identify areas of agreement and disagreement. Reflect ' +
  'them back: "It sounds like everyone agrees that X, but you disagree about Y."\n\n' +
  '(4) Ask probing questions that help the group explore tradeoffs: "Riley, Sam says the ' +
  'fix would take 3-5 days. What would a 5-day delay actually cost in concrete terms?" ' +
  '"Sam, Riley mentioned the competitor launch — does that change your risk calculus at ' +
  'all?"\n\n' +
  "(5) When someone proposes a compromise (especially Jordan's degraded mode idea), help " +
  'the group evaluate it seriously. Ask each person: "Could you live with this approach? ' +
  'What would make it better?"\n\n' +
  '(6) Push toward a concrete decision. After 15-20 minutes, ask: "Can someone propose a ' +
  'specific plan that this group could get behind?"\n\n' +
  '(7) Close with a summary of the decision and any conditions or commitments.\n\n' +
  'Keep messages 2-3 sentences. Be warm, fair, and genuinely curious. Never take sides. ' +
  'Use phrases like "Help me understand", "What I\'m hearing is", "Let me push back ' +
  'gently". If someone dominates, redirect: "I want to make sure we hear from everyone ' +
  '— Taylor, what\'s your reaction?"';

const EVALUATOR_PROMPT =
  'You are an expert evaluator using the ELIPSS (Enhancing Learning by Improving Process ' +
  'Skills in STEM) rubric framework. You have observed a participant complete a group ' +
  'deliberation about a normative product decision — whether to ship a fintech feature ' +
  'with a known bug affecting 2% of users.\n\n' +
  'The deliberation involved four stakeholders: Riley (Product Manager), Sam (Senior ' +
  'Engineer), Taylor (Customer Support), and Jordan (UX/Design). There is no factually ' +
  'correct answer — this is about values, tradeoffs, and building consensus.\n\n' +
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
  'Where to look: Quality of arguments for their position, ability to engage with ' +
  'counterarguments, whether they revised their position when presented with new evidence, ' +
  'how they weighed competing values (speed vs. accuracy, revenue vs. trust).\n\n' +
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
  'Where to look: How they used concrete data (2% affected, $2M deal, 3-8% error, beta ' +
  "feedback numbers) to support arguments, whether they reframed others' points accurately, " +
  'ability to translate technical or business concerns for the group.\n\n' +
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
  "Where to look: Did they acknowledge others' points before disagreeing? Did they ask " +
  "clarifying questions? Did they build on others' ideas? Did they stay constructive under " +
  'disagreement? Did they help quieter participants contribute?\n\n' +
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
  'Where to look: Did they propose concrete solutions (not just positions)? Did they ' +
  'evaluate proposed compromises seriously? Did they identify conditions or contingencies? ' +
  'Did they help the group converge on an actionable plan?\n\n' +
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
  'Where to look: Did they help structure the deliberation? Did they track what had been ' +
  'agreed vs. what was still open? Did they propose next steps or ownership for the ' +
  'decision? Did they help keep the group on track?\n\n' +
  '---\n\n' +
  'FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:\n\n' +
  '**Overall Assessment**\n' +
  "[2-3 sentence summary of the participant's performance in the deliberation.]\n\n" +
  '**1. Critical Thinking** — [Average]/5\n' +
  '(A) Identifying the Aim/Goal: [X]/5\n' +
  '(B) Evaluating: [X]/5\n' +
  '(C) Analyzing: [X]/5\n' +
  '(D) Synthesizing: [X]/5\n' +
  '(E) Forming Arguments (Structure): [X]/5\n' +
  '(F) Forming Arguments (Validity): [X]/5\n' +
  'Evidence: [1-2 sentences citing specific moments from the deliberation]\n\n' +
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
  '**Key Strengths**: [1-2 specific things done well in the deliberation]\n\n' +
  '**Key Recommendation**: [1 specific, actionable area for improvement]\n\n' +
  'IMPORTANT: Be fair but rigorous. Use the full 0-5 scale. A score of 3 means partial ' +
  'performance, not failure. A score of 5 means complete, exemplary performance. Cite ' +
  'specific evidence from the deliberation for every score. If a subcategory was not ' +
  'observable, score it 0 and note "Not observed." Pay special attention to perspective-taking, ' +
  'willingness to revise positions, and ability to propose and evaluate compromises.';

const SUBJECT_AGENT_PROMPT =
  'You are a team member participating in a product decision deliberation. State your ' +
  "position based on your role's perspective, but genuinely engage with other viewpoints. " +
  'You can change your mind if persuaded. Keep messages 1-3 sentences.';

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

    // 3. Role Briefing survey
    createSurveyStage({
      id: BRIEFING_SURVEY_ID,
      name: 'Role Briefing',
      descriptions: createStageTextConfig({
        primaryText: ALL_BRIEFINGS,
      }),
      questions: [
        createMultipleChoiceSurveyQuestion({
          id: 'assigned-role',
          questionTitle: 'Which role have you been assigned?',
          options: [
            createMultipleChoiceItem({
              id: 'riley',
              text: 'Riley Chen (Product Manager)',
            }),
            createMultipleChoiceItem({
              id: 'sam',
              text: 'Sam Okafor (Senior Engineer)',
            }),
            createMultipleChoiceItem({
              id: 'taylor',
              text: 'Taylor Kim (Customer Support Lead)',
            }),
            createMultipleChoiceItem({
              id: 'jordan',
              text: 'Jordan Reeves (UX/Design Lead)',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createScaleSurveyQuestion({
          id: 'initial-position',
          questionTitle:
            'Before the discussion, how strongly do you feel the team should ship now vs. delay?',
          lowerValue: 1,
          lowerText: 'Definitely delay',
          upperValue: 5,
          upperText: 'Definitely ship now',
          middleText: 'Unsure',
        }),
        createTextSurveyQuestion({
          id: 'role-concern',
          questionTitle:
            "In 1-2 sentences, what is your role's biggest concern?",
          maxCharCount: 300,
        }),
      ],
    }),

    // 4. Group deliberation chat
    createChatStage({
      id: DELIBERATION_CHAT_ID,
      name: 'The Deliberation',
      descriptions: createStageTextConfig({
        primaryText:
          'This is a facilitator-led group discussion about whether to ship the new ' +
          'analytics module now, delay for a full fix, or find a middle ground. Share ' +
          'your perspective from your assigned role and work toward a decision the group ' +
          'can support.',
        infoText:
          "The facilitator will help structure the conversation. Argue your role's " +
          'perspective, but stay open to persuasion. Quality of reasoning matters more ' +
          'than the final decision.',
      }),
      timeLimitInMinutes: 25,
    }),

    // 5. Decision & Vote survey
    createSurveyStage({
      id: VOTE_SURVEY_ID,
      name: 'Decision & Vote',
      descriptions: createStageTextConfig({
        primaryText:
          "The deliberation is over. Record the group's decision and your individual " +
          'assessment of the outcome.',
      }),
      questions: [
        createMultipleChoiceSurveyQuestion({
          id: 'group-decision',
          questionTitle: 'What decision does the group support?',
          options: [
            createMultipleChoiceItem({
              id: 'ship-now',
              text: 'Ship now',
            }),
            createMultipleChoiceItem({
              id: 'delay-full-fix',
              text: 'Delay for full fix',
            }),
            createMultipleChoiceItem({
              id: 'degraded-mode',
              text: 'Ship with degraded mode',
            }),
            createMultipleChoiceItem({
              id: 'other',
              text: 'Other',
            }),
          ],
          displayType: MultipleChoiceDisplayType.RADIO,
        }),
        createScaleSurveyQuestion({
          id: 'decision-satisfaction',
          questionTitle: "How satisfied are you with the group's decision?",
          lowerValue: 1,
          lowerText: 'Very unsatisfied',
          upperValue: 5,
          upperText: 'Very satisfied',
          middleText: 'Neutral',
        }),
        createScaleSurveyQuestion({
          id: 'decision-confidence',
          questionTitle:
            'How confident are you that this is the right decision?',
          lowerValue: 1,
          lowerText: 'Not confident',
          upperValue: 5,
          upperText: 'Very confident',
          middleText: 'Somewhat confident',
        }),
        createTextSurveyQuestion({
          id: 'strongest-argument',
          questionTitle:
            'What was the strongest argument you heard from someone with a different view?',
          maxCharCount: 300,
        }),
      ],
    }),

    // 6. Reflection survey
    createSurveyStage({
      id: REFLECTION_SURVEY_ID,
      name: 'Reflection',
      descriptions: createStageTextConfig({
        primaryText:
          'Take a moment to reflect on the deliberation process itself — not just ' +
          'the outcome, but how you and the group engaged with the decision.',
      }),
      questions: [
        createScaleSurveyQuestion({
          id: 'position-change',
          questionTitle: 'Did your position change during the deliberation?',
          lowerValue: 1,
          lowerText: 'Not at all',
          upperValue: 5,
          upperText: 'Completely changed',
          middleText: 'Somewhat',
        }),
        createScaleSurveyQuestion({
          id: 'group-listening',
          questionTitle: 'How well did the group listen to each other?',
          lowerValue: 1,
          lowerText: 'Poorly',
          upperValue: 5,
          upperText: 'Very well',
          middleText: 'Adequately',
        }),
        createTextSurveyQuestion({
          id: 'difficult-tradeoff',
          questionTitle:
            'What was the most difficult tradeoff in this decision?',
          maxCharCount: 500,
        }),
        createTextSurveyQuestion({
          id: 'redo-differently',
          questionTitle:
            'If you could redo the deliberation, what would you say differently?',
          maxCharCount: 500,
        }),
      ],
    }),

    // 7. Assessment chat (evaluator agent delivers assessment)
    createPrivateChatStage({
      id: ASSESSMENT_CHAT_ID,
      name: 'Assessment',
      descriptions: createStageTextConfig({
        primaryText:
          'Your deliberation is complete. An evaluator will now review your performance ' +
          'using the ELIPSS process skills framework.',
        infoText:
          'Scoring: Critical Thinking, Information Processing, Interpersonal Communication, ' +
          'Problem Solving, and Management — each scored 0-5 with subcategories.',
      }),
      isTurnBasedChat: false,
      minNumberOfTurns: 0,
      maxNumberOfTurns: 2,
    }),

    // 8. Feedback survey
    createSurveyStage({
      id: FEEDBACK_SURVEY_ID,
      name: 'Feedback',
      descriptions: createStageTextConfig({
        primaryText:
          'Thank you for completing the deliberation! Please take a moment to share ' +
          'your feedback. Your responses help us improve the experience.',
      }),
      questions: [
        createScaleSurveyQuestion({
          id: 'overall-experience',
          questionTitle:
            'How would you rate your overall experience with this deliberation?',
          lowerValue: 1,
          lowerText: 'Poor',
          upperValue: 5,
          upperText: 'Excellent',
          middleText: 'Average',
        }),
        createScaleSurveyQuestion({
          id: 'realism',
          questionTitle: 'How realistic did the scenario and roles feel?',
          lowerValue: 1,
          lowerText: 'Not realistic',
          upperValue: 5,
          upperText: 'Very realistic',
          middleText: 'Somewhat realistic',
        }),
        createScaleSurveyQuestion({
          id: 'facilitator-helpfulness',
          questionTitle:
            'How helpful was the facilitator in guiding the discussion?',
          lowerValue: 1,
          lowerText: 'Not helpful',
          upperValue: 5,
          upperText: 'Very helpful',
          middleText: 'Somewhat helpful',
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
            'What is one thing you learned or will do differently after this deliberation?',
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
// Agent mediators (Facilitator + Evaluator)
// ****************************************************************************

function createFacilitatorMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Facilitator',
    description:
      'Habermas Machine-inspired discussion facilitator for group deliberation',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Facilitator',
      avatar: '\uD83E\uDD1D',
    }),
  });

  const promptMap: Record<string, MediatorPromptConfig> = {};

  promptMap[DELIBERATION_CHAT_ID] = createChatPromptConfig(
    DELIBERATION_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(
        FACILITATOR_DELIBERATION_PROMPT,
        DELIBERATION_CHAT_ID,
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: null, // auto
        canSelfTriggerCalls: true,
        maxResponses: 25,
        initialMessage:
          "Welcome, everyone. We're here to decide whether to ship the new analytics " +
          'module now, delay for a full fix, or find a middle ground. Each of you brings ' +
          "a different perspective and different information. I'll make sure everyone is " +
          "heard.\n\nLet's start with a round of initial positions. Each of you, please " +
          "share: what's your stance, and what's the one thing you most want to protect " +
          'in this decision? Riley, would you like to start?',
      }),
    },
  );

  return {persona, promptMap};
}

function createEvaluatorMediator(): AgentMediatorTemplate {
  const persona = createAgentMediatorPersonaConfig({
    name: 'Evaluator',
    description: 'LLM-based assessor that reviews deliberation transcripts',
    isDefaultAddToCohort: true,
    defaultProfile: createParticipantProfileBase({
      name: 'Evaluator',
      avatar: '\uD83D\uDCCA',
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
    name: 'Stakeholder (AI Subject)',
    description:
      'AI agent that plays the role of a deliberation participant for in silico testing',
    isDefaultAddToCohort: false, // Only add manually when running in silico
    defaultProfile: createParticipantProfileBase({
      name: 'Stakeholder',
      avatar: '\uD83E\uDDD1\u200D\uD83D\uDCBC',
    }),
  });

  const promptMap: Record<string, ParticipantPromptConfig> = {};

  promptMap[DELIBERATION_CHAT_ID] = createChatPromptConfig(
    DELIBERATION_CHAT_ID,
    StageKind.CHAT,
    {
      prompt: createDefaultPromptFromText(
        SUBJECT_AGENT_PROMPT,
        DELIBERATION_CHAT_ID,
      ),
      chatSettings: createAgentChatSettings({
        wordsPerMinute: 150,
        canSelfTriggerCalls: false,
        maxResponses: 15,
      }),
    },
  );

  return {persona, promptMap};
}

// ****************************************************************************
// Template export
// ****************************************************************************

export function getShipOrFixTemplate(): ExperimentTemplate {
  const stageConfigs = getStageConfigs();
  return createExperimentTemplate({
    experiment: createExperimentConfig(stageConfigs, {
      metadata: SHIP_OR_FIX_METADATA,
    }),
    stageConfigs,
    agentMediators: [createFacilitatorMediator(), createEvaluatorMediator()],
    agentParticipants: [createSubjectAgent()],
  });
}
