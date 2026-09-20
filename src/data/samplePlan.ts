/**
 * ⚠️  PLACEHOLDER SAMPLE OUTPUT — NOT THE VERIFIED CORPUS. ⚠️
 *
 * Every entry below is written from memory to give the interface something
 * realistically shaped to render. The names are real Boston organisations but
 * the DATES, URLS AND CONTACT ROUTES HAVE NOT BEEN VERIFIED and several are
 * certainly wrong.
 *
 * This file is scaffolding for Person C only. It must be deleted and replaced
 * by Person A's verified corpus + Person B's generation layer before any demo.
 * Shipping it as-is would break the one claim the product is built on.
 *
 * The UI reads nothing outside `src/types.ts`, so swapping this out is a
 * one-file change.
 */

import type { IntakeProfile, Plan } from '../types';

export const SUPPORTED_CITY = 'Boston';

/**
 * Entries in data/corpus.boston.json. Stated to the user on the loading
 * screen, so it has to be true — scripts/test-corpus-claims.mjs asserts it
 * against the file and fails the build when the corpus grows.
 */
export const CORPUS_SIZE = 60;

/**
 * Pipeline telemetry for the showcase build, where there is no server to
 * report it. Values are from the real run that produced SAMPLE_PLAN.
 */
export const SAMPLE_META = {
  corpusSize: CORPUS_SIZE,
  shortlisted: 20,
  candidates: 20,
  signals: [
    'b2b', 'boston', 'bootstrapped', 'business', 'chamber', 'community',
    'consumer', 'early-adopters', 'free', 'intro-path', 'network', 'launch',
  ],
  stage: 'building',
  goal: 'pilot-customers',
  liveFound: 0,
  liveUsed: 0,
  rejected: [] as string[],
  draftsMissing: [] as string[],
  model: 'recorded',
};

/** Pre-filled so the intake screen can be demoed without typing six fields. */
export const SAMPLE_PROFILE: IntakeProfile = {
  building: 'Cinch — an app that finds you a pickup basketball or soccer game happening near you in the next two hours.',
  city: 'Boston — Allston & Cambridge',
  stage: 'Launched, few users',
  customer: 'People 22–35 who recently moved to the city and want to play sport without joining a league.',
  goal: 'Users',
  tried: 'Posted twice on Instagram, put flyers up in two gyms. Got about 40 signups, most went cold.',
};

export const SAMPLE_PLAN: Plan = {
  city: SUPPORTED_CITY,
  generatedAt: 'Sat 19 Sep 2026',
  headline:
    'Your people are already standing in groups outdoors every week. Stop advertising and go stand with them.',
  items: [
    {
      id: 'e1',
      type: 'event',
      rank: 1,
      name: 'November Project Boston — Wednesday workout',
      url: 'https://november-project.com/boston-ma/',
      date_or_cadence: 'Every Wednesday, 6:30am — Harvard Stadium',
      who_it_serves: 'Free-to-join fitness community, heavily 22–35, most of them new-ish to Boston.',
      tags: ['fitness', 'community', 'free', 'recurring'],
      why_it_matters:
        'One of the few Boston communities where hundreds of your exact demographic gather in person on a fixed weekly cadence.',
      cost: 'Free',
      contact_route: 'Public co-leader contact listed on the Boston tribe page',
      why_you_why_now:
        'This is your customer, standing in one place, already choosing to show up to an unstructured athletic thing with strangers — the exact behaviour Cinch depends on. Your 40 cold signups went cold because a flyer asks for belief; this asks for nothing. Go three weeks running so you are a face, not a pitch.',
      opener:
        '"First time here? Same — I moved here and couldn\'t find anyone to play with, so I ended up building an app for it. What do you play?"',
    },
    {
      id: 'e2',
      type: 'event',
      rank: 3,
      name: 'Venture Café Cambridge — Thursday Gathering',
      url: 'https://venturecafecambridge.org/',
      date_or_cadence: 'Every Thursday, 3–8pm — CIC, 1 Broadway, Cambridge',
      who_it_serves: 'Founders, operators, students and local press. Open door, no ticket needed.',
      tags: ['startup', 'networking', 'free', 'recurring', 'press-present'],
      why_it_matters:
        'The single highest-density room of Boston startup people that a stranger can walk into for free.',
      cost: 'Free',
      contact_route: 'General enquiries form on the Venture Café site',
      why_you_why_now:
        'Not your customer — your distribution. Two of the people on this list are in that room most weeks, and an introduction there costs you nothing and skips a cold email entirely. Go the same week you send the emails below so the name is already familiar.',
      opener:
        '"I\'m building the thing that finds you a pickup game in the next two hours — who here actually plays sport, and who do you know that runs a rec league?"',
    },
    {
      id: 'e3',
      type: 'event',
      rank: 6,
      name: 'Boston New Technology Startup Showcase',
      url: 'https://www.bostonnewtechnology.com/',
      date_or_cadence: 'Monthly, usually a weekday evening',
      who_it_serves: 'Early-stage founders demoing to a local tech audience of 100+.',
      tags: ['startup', 'demo', 'consumer', 'monthly'],
      why_it_matters:
        'One of the few Boston stages that will give a pre-seed consumer app five minutes in front of a real audience.',
      cost: 'Free to attend, free to apply to present',
      contact_route: 'Presenter application form on the site',
      why_you_why_now:
        'You are launched with real users, which is the bar for presenting — most applicants are not. A demo slot gets you a recorded pitch, a room of 100, and a reason to email everyone afterwards. Apply this week even if the next slot is two months out.',
    },
    {
      id: 'p1',
      type: 'person_org',
      rank: 2,
      name: 'Boston Ski & Sports Club',
      url: 'https://www.bssc.com/',
      date_or_cadence: 'Year-round, seasonal league sign-ups',
      who_it_serves: 'Thousands of Boston adults who pay to play recreational sport socially.',
      tags: ['sports', 'partnership', 'distribution', 'warm-audience'],
      why_it_matters:
        'The largest existing aggregation of exactly the person Cinch serves, and their weak spot is the gap between league nights.',
      cost: 'Free to contact',
      contact_route: 'General contact form on the BSSC website',
      why_you_why_now:
        'Their members already pay for organised sport, which means the intent is proven — but a league is one fixed night a week and Cinch fills the other six. That makes you complementary, not competitive, which is the only version of this email they will answer.',
      draft: {
        channel: 'email',
        subject: 'Filling the six nights your members are not playing',
        body:
          'Hi — I run Cinch, a Boston app that finds people a pickup basketball or soccer game starting in the next two hours. Your members have already told you they want to play; they just get one league night a week. We are small and local, about 40 players in Allston and Cambridge so far. Would you be open to a short call about pointing members at pickup games on their off-nights? Happy to run it as a free pilot for one season.',
      },
    },
    {
      id: 'p2',
      type: 'person_org',
      rank: 4,
      name: 'Boston Parks & Recreation — permits & programmes',
      url: 'https://www.boston.gov/departments/parks-and-recreation',
      date_or_cadence: 'Year-round',
      who_it_serves: 'Anyone using a city court, pitch or field in Boston.',
      tags: ['city', 'civic', 'courts', 'credibility'],
      why_it_matters:
        'Controls the physical courts your product sends people to, and publishes programming that reaches residents you cannot.',
      cost: 'Free',
      contact_route: 'Department contact listed on boston.gov',
      why_you_why_now:
        'You are routing traffic to city courts whether you talk to them or not — better to be the app they know about than the one they discover. A city relationship is also the cheapest credibility a consumer app can get, and it is the thing that makes the BSSC conversation easier.',
      draft: {
        channel: 'email',
        subject: 'Small Boston app sending players to city courts',
        body:
          'Hello — I built Cinch, an app that helps Boston residents find a pickup basketball or soccer game near them the same day. We currently send a small number of players to public courts in Allston and Cambridge. Two questions: is there anything we should know about how you would like apps to handle court usage, and is there any interest in us surfacing your programming inside the app? Happy to share what we see about which courts get used and when.',
      },
    },
    {
      id: 'p3',
      type: 'person_org',
      rank: 5,
      name: 'BostInno — Boston Business Journal',
      url: 'https://www.bizjournals.com/boston/inno',
      date_or_cadence: 'Daily coverage, weekly newsletter',
      who_it_serves: 'Boston startup and tech readership, including most local investors.',
      tags: ['press', 'local-media', 'startup'],
      why_it_matters:
        'The default place a Boston consumer app gets its first written coverage.',
      cost: 'Free',
      contact_route: 'Published newsroom tip line',
      why_you_why_now:
        'A launched consumer app with a specific Boston story is genuinely their beat — but "we exist" is not a story. Wait until you have run three weeks at November Project and can say which courts fill up and when. Send this the week you have that number, not before.',
      draft: {
        channel: 'email',
        subject: 'Tip: which Boston courts actually fill up, and when',
        body:
          'Hi — I run Cinch, a small Boston app for finding a pickup game the same day. Because of it I have data most people do not: which public courts in Allston and Cambridge fill up, at what hour, and which sit empty. It is a small but specific picture of how the city actually plays. Happy to share the numbers whether or not it becomes a story, and to connect you with players using it.',
      },
    },
    {
      id: 'p4',
      type: 'person_org',
      rank: 8,
      name: 'Northeastern IDEA — student venture accelerator',
      url: 'https://www.northeastern.edu/idea/',
      date_or_cadence: 'Rolling, semester cohorts',
      who_it_serves: 'Student and recent-alum founders in Boston.',
      tags: ['accelerator', 'students', 'free', 'campus-access'],
      why_it_matters:
        'Free support plus a direct line into a dense campus population of exactly your user.',
      cost: 'Free',
      contact_route: 'Programme contact form on the IDEA site',
      why_you_why_now:
        'The value here is not the accelerator, it is the campus. Northeastern is a few thousand 20-somethings who play sport casually and are concentrated in the neighbourhoods you already serve. Even if you are not eligible, the programme staff can introduce you to club-sport leads.',
      draft: {
        channel: 'email',
        subject: 'Boston pickup-sports app — eligibility, and a question about club sports',
        body:
          'Hi — I run Cinch, an app that finds people a pickup basketball or soccer game near them within two hours. We are launched with a small group of players around Allston and Cambridge. Two things: I would like to check whether we are eligible for IDEA, and separately, would you be able to point me to whoever runs club or intramural sports? A lot of our users are students who could not get a league spot.',
      },
    },
    {
      id: 'c1',
      type: 'channel',
      rank: 7,
      name: 'r/boston',
      url: 'https://www.reddit.com/r/boston/',
      date_or_cadence: 'Always on — check subreddit rules before posting',
      who_it_serves: 'General Boston residents, very active, heavily moderated for self-promotion.',
      tags: ['reddit', 'community', 'free', 'rules-strict'],
      why_it_matters:
        'Large and genuinely local, but will remove anything that reads as a product launch.',
      cost: 'Free',
      contact_route: 'Modmail, for permission before posting',
      why_you_why_now:
        'Do not post about Cinch. Post the thing you actually know — a short honest write-up of which courts fill up and when, no link. This subreddit punishes promotion and rewards usefulness, and the comments will ask what you built. Message the mods first; it takes five minutes and saves a ban.',
      draft: {
        channel: 'post',
        subject: 'Which Boston courts actually have a game going, by hour',
        body:
          'Spent the last few months tracking which public basketball and soccer spots around Allston, Brighton and Cambridge actually have a game going, and when. Short version: weekday evenings before 7 are far better than weekends, and two of the busiest courts are not the ones you would guess. Posting the breakdown here rather than a link. Happy to answer questions about specific neighbourhoods if people want to know where to turn up.',
      },
    },
    {
      id: 'c2',
      type: 'channel',
      rank: 9,
      name: 'Startup Boston — community & newsletter',
      url: 'https://www.startupbos.org/',
      date_or_cadence: 'Year-round, with an annual week-long event',
      who_it_serves: 'Boston startup operators and founders.',
      tags: ['newsletter', 'community', 'startup', 'free'],
      why_it_matters:
        'A cheap standing line into the Boston startup community without needing press.',
      cost: 'Free',
      contact_route: 'Community contact form on the site',
      why_you_why_now:
        'This is a slow-burn channel, not a spike — worth ten minutes now precisely because it costs nothing later. Get on the list, then submit to speak or demo when the annual programming opens. Rank nine because it will not move your numbers this week.',
    },
    {
      id: 'c3',
      type: 'channel',
      rank: 10,
      name: 'MassVentures START programme',
      url: 'https://www.mass-ventures.com/',
      date_or_cadence: 'Application windows — check current deadlines',
      who_it_serves: 'Massachusetts-based early-stage companies.',
      tags: ['grant', 'non-dilutive', 'massachusetts', 'deadline-driven'],
      why_it_matters:
        'Non-dilutive state money for Massachusetts companies, which is rare and worth knowing the deadline for.',
      cost: 'Free to apply',
      contact_route: 'Programme enquiries via the MassVentures contact page',
      why_you_why_now:
        'Honest read: most of these state programmes lean toward deep tech and federal SBIR follow-on, so a consumer sports app is a stretch. It is on the list because the deadline is worth knowing and the application costs nothing but an afternoon. Check eligibility before you spend that afternoon.',
    },
  ],
  week_one: {
    total_time: '2 hrs 15 min',
    actions: [
      {
        id: 'a1',
        day: 'Monday',
        duration: '30 min',
        title: 'Send the two emails that matter',
        detail:
          'Boston Ski & Sports Club and Boston Parks & Rec. Both drafts are written below — change the player count to whatever is true today and send. Do not send the BostInno one yet.',
        itemIds: ['p1', 'p2'],
      },
      {
        id: 'a2',
        day: 'Tuesday',
        duration: '15 min',
        title: 'Modmail r/boston, then apply to Boston New Technology',
        detail:
          'Ask the mods whether the courts write-up is allowed before you write it. While you wait, submit the BNT presenter application — it is a short form and the next slot may be months out.',
        itemIds: ['c1', 'e3'],
      },
      {
        id: 'a3',
        day: 'Wednesday',
        time: '6:30am',
        duration: '1 hr',
        title: 'November Project at Harvard Stadium',
        detail:
          'Show up, do the workout, talk to nobody about the app unless asked. Use the opener only if someone asks what you do. This is week one of three — the point is being recognised, not converting.',
        itemIds: ['e1'],
      },
      {
        id: 'a4',
        day: 'Thursday',
        time: '4pm',
        duration: '20 min',
        title: 'Venture Café, and leave after two conversations',
        detail:
          'Go with one question, not a pitch: who do you know that runs a rec league or a club sport. Twenty minutes is deliberate — you are there for introductions, not the programming.',
        itemIds: ['e2'],
      },
      {
        id: 'a5',
        day: 'Friday',
        duration: '10 min',
        title: 'Write down the court numbers',
        detail:
          'Which courts filled, which hours, which were empty. This is the asset behind both the r/boston post and the BostInno email — neither one works without it, and it takes ten minutes while it is fresh.',
        itemIds: ['c1', 'p3'],
      },
    ],
  },
};
