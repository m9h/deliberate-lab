---
title: "Thinking Higher: Workplace Simulation"
layout: default
---

## Overview

**Thinking Higher: I Thought It Worked** is a multi-stage workplace simulation
that assesses higher-order thinking and communication skills in software
engineers. Participants navigate realistic workplace scenarios — gathering
requirements, discovering bugs, and managing timeline changes — while
interacting with AI-powered colleagues.

The simulation has **7 stages**:

| # | Stage | Type | Description |
|---|-------|------|-------------|
| 1 | Terms of Service | TOS | Consent and simulation overview |
| 2 | Set Your Profile | Profile | Participant sets name and avatar |
| 3 | Morning Standup | Group chat | Team standup with Marcus, Alex, and Sarah |
| 4 | Stage 1 -- Requirements | Private chat | 1-on-1 with Marcus (UX Designer) about onboarding form designs |
| 5 | Stage 2 -- Bug Report | Private chat | 1-on-1 with Alex (Tech Lead) about a validation bug in a PR |
| 6 | Stage 3 -- Timeline | Private chat | 1-on-1 with Sarah (PM) about a timeline delay |
| 7 | Assessment | Private chat | AI evaluator scores the participant's performance |

### AI Personas

- **Marcus (UX Designer)** -- Friendly designer handing off onboarding form designs. Cares about inclusivity and international name support.
- **Alex (Tech Lead)** -- Calm mentor who found a regex validation bug during PR review. Shares the buggy code and guides discussion.
- **Sarah (Project Manager)** -- Professional PM who needs plain-language clarity on a timeline delay. Marketing is waiting on this feature.
- **Evaluator** -- Assesses the participant across four dimensions after all conversations are complete.

### Assessment Dimensions

The evaluator scores participants from 0-100 on:

- **Analytical Thinking** -- Clarifying questions, edge case identification, root cause understanding
- **Communication** -- Audience-appropriate language, adapting style across conversations
- **Ownership** -- Taking responsibility, proposing solutions proactively
- **Adaptability** -- Handling unexpected issues, adjusting approach when needed

---

## Setting Up the Experiment

### Step 1: Create the experiment from template

1. From the home page, click the **"Thinking Higher workplace sim"** quick-start card, or
2. Click **"Create new experiment"**, then select **"Thinking Higher: I Thought It Worked"** from the template gallery

This loads all 7 stages and 4 AI mediator personas pre-configured.

### Step 2: Configure your API key

The AI personas require a Gemini API key:

1. Go to **Settings** (gear icon)
2. Under **API Keys**, enter your Gemini API key
3. Save

### Step 3: Create a cohort

1. Navigate to the experiment dashboard
2. Click **"Create new cohort"**
3. The 4 AI mediators (Marcus, Alex, Sarah, Evaluator) are automatically enrolled

### Step 4: Share the participant link

Use one of these methods to invite participants:

- **Join link**: Copy the "join cohort" link and share it with participants. They can join dynamically.
- **Direct add**: Add participants directly and share their individual experiment links.

Each participant gets their own private chat threads with the AI personas.

---

## What Participants Experience

### Morning Standup (Group Chat)
The participant joins a 5-minute team standup. Marcus, Alex, and Sarah each
share a brief update. The participant gives their own update (starting work
on the onboarding form). This is a casual warm-up that sets the scene.

### Stage 1 -- Requirements (1-on-1 with Marcus)
Marcus walks the participant through the onboarding form designs. The key
detail: the form must support international names (accented characters,
non-Latin scripts). Good participants will ask clarifying questions about
edge cases and validation requirements.

### Stage 2 -- Bug Report (1-on-1 with Alex)
Alex shares a code snippet with a regex validation bug:

```javascript
function validateName(name) {
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: "Name contains invalid characters." };
  }
  return { valid: true };
}
```

The regex only allows ASCII characters, failing for names like Jose, Muller,
or non-Latin names. The participant should identify the problem, propose a
fix, and consider timeline implications.

### Stage 3 -- Timeline (1-on-1 with Sarah)
The participant must communicate the bug-induced delay to Sarah in
plain, non-technical language. Sarah pushes for clarity -- how long, what
happened, and can anything be done to minimize the delay?

### Assessment
The Evaluator reviews all prior conversations and delivers a structured
assessment with scores and specific evidence from the conversations.

---

## Sample Transcript

Below is an example from an automated test run showing how conversations flow.

### Morning Standup

> **Alex**: Morning everyone! I'll be focusing on some infra tasks today and clearing out the PR queue, so I'll be taking a look at that onboarding form code later this afternoon.
>
> **Sarah**: Morning! Marketing is checking in on the onboarding form timeline, so I'm hoping we're still on track for end-of-sprint delivery. Are there any blockers the team should know about?
>
> **Marcus**: Morning everyone! Quick update from my side -- I wrapped up the onboarding form designs yesterday. Pretty happy with how they turned out. I want to sync with our new dev on the handoff today so we can get building.
>
> **Participant**: Morning! I'm starting on the onboarding form today and looking forward to syncing with Marcus on those designs. No blockers on my end yet!

### Stage 1 -- Requirements (with Marcus)

> **Marcus**: Hey! Glad we could sync before you dive in. I wanted to walk you through the onboarding form designs -- there are a few things I want to make sure translate well into the build.
>
> **Participant**: Hey Marcus! Thanks for walking me through this. Are there any specific interactions or tricky parts of the design you're most concerned about for the build?
>
> **Marcus**: Great question! I'm mostly focused on the name field validation -- we need to ensure it supports accented characters and non-Latin scripts so users like Jose or Muller feel welcome. I've included some notes in the Figma file about not using overly restrictive regex!
>
> **Participant**: That makes a lot of sense, inclusivity is super important! I'll definitely check those Figma notes -- are there any other fields with specific validation rules I should watch out for?

### Stage 2 -- Bug Report (with Alex)

> **Alex**: Hey, I was just going through your PR for the onboarding form -- got a few minutes to chat? I spotted something.
>
> **Participant**: Hey Alex, yeah I've got a few minutes! What did you find in the PR?
>
> **Alex**: I noticed a potential issue in the `validateName` function. The regex only allows ASCII letters, spaces, hyphens, and apostrophes... Can you see where the problem is for international names, and what do you think the fix might look like?
>
> **Participant**: Oh, you're right! It would totally fail for names with accents or non-Latin characters like Jose or Muller. I should probably use a Unicode-aware regex like \p{L} to make sure we're being inclusive.

### Stage 3 -- Timeline (with Sarah)

> **Sarah**: Oh hey -- I was actually about to ping you about the timeline. Alex mentioned you had an update on the onboarding feature?
>
> **Participant**: Hey Sarah! Yeah, Alex and I found a little snag in the existing system that we need to fix before I can finish the onboarding feature.
>
> **Sarah**: Can you explain what the 'snag' is in plain language, and how much longer you think it will take to finish?
>
> **Participant**: Basically, the way the old system saves user data doesn't quite work with the new fields I'm adding, so I need to update that backend part first. I think this will add about two or three days to the original timeline.

### Assessment

> **Evaluator**: Overall: You demonstrated strong technical comprehension and professional communication skills, effectively balancing implementation details with stakeholder management.
>
> - Analytical Thinking: **90/100** -- You correctly identified the Unicode validation issue and proposed the specific regex solution during the technical discussion with Alex.
> - Communication: **85/100** -- You adapted your style well, discussing specific libraries with Marcus and Alex while translating technical issues into plain language for Sarah.
> - Ownership: **95/100** -- You took immediate responsibility for the validation oversight and committed to a rigorous testing plan without unnecessary deflection.
> - Adaptability: **82/100** -- You handled the unexpected bug discovery smoothly, though your explanation to Sarah slightly deviated from the specific issue discussed earlier.
>
> Key recommendation: Ensure consistent messaging when translating technical bugs to non-technical stakeholders.

---

## In-Silico Testing

To test the experiment end-to-end without a real participant, use the
in-silico runner script. This creates an AI agent that plays the role of
the participant (junior SDE).

### Prerequisites

- Firebase emulators running (`./run_locally.sh`)
- Gemini API key saved in experimenter settings via the frontend

### Run

```bash
npx tsx scripts/run_in_silico.ts
```

The script will:
1. Create the experiment from template
2. Create a cohort with all mediators
3. Add an AI participant agent
4. Orchestrate all 7 stages automatically
5. Export transcripts to `scripts/transcripts_<timestamp>.json`

Typical runtime is 5-10 minutes.
