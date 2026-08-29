import posters from './posters.generated.json';

/* ============================================================================
   ⚠️  EDIT ME — single source of truth for all event copy.
   Nothing else in the codebase hardcodes event text.

   Fields still marked TBA were not supplied and have NOT been invented; they
   render as "To be announced" rather than blank.

   Outstanding: The Brand New Circuit (no content supplied yet).
   ========================================================================= */

export const TBA = 'TBA' as const;

/** Single registration form for every event and the finale CTA. */
export const REGISTER_URL = 'https://forms.gle/9TeCbr36KNeFdVBZ8';

export type Poster = (typeof posters)[keyof typeof posters];

export type Coordinator = {
  name: string;
  phone?: string;
};

/** One stage of an event — timeline round, story step or challenge card. */
export type EventRound = {
  label: string;
  title: string;
  detail?: string;
};

export type EventUniverse =
  | 'stark-lab'
  | 'newsroom'
  | 'knowledge'
  | 'infinity'
  | 'cyber';

export type SourceEvent = {
  id: keyof typeof posters;
  name: string;
  tagline: string;
  /** 80–100 words maximum. */
  description: string;
  /** Short beats revealed one-by-one as the section scrolls. */
  beats: string[];
  /** Expanded stage breakdown shown under the information card. */
  rounds: EventRound[];
  /** Optional closing line for the section. */
  closingLine?: string;
  /** Optional supporting line beneath the closing line. */
  closingSub?: string;
  /** Optional participant instruction, shown as a row on the information card. */
  instructions?: string;
  /**
   * Marks the event as concluded. The card renders its poster grayscale with a
   * "Completed" stamp, strikes through the title, and disables registration.
   */
  completed?: boolean;
  date: string;
  venue: string;
  /** Secondary venue note, e.g. a starting point. */
  venueNote?: string;
  category: string;
  teamSize: string;
  coordinators: Coordinator[];
  registerUrl: string;
  universe: EventUniverse;
  accent: string;
  accentDeep: string;
  poster: Poster;
};

export const EVENTS: SourceEvent[] = [
  {
    id: 'brand-new-circuit',
    name: 'Brand New Circuit',
    tagline: 'Think Fast. Build Smart. Communicate Better.',
    description:
      'Ready to prove your engineering skills under pressure? Brand New Circuit is a three-round technical showdown where engineering knowledge, practical skills, teamwork, and communication are pushed to the limit. Teams must solve challenges, build real circuits, and collaborate efficiently to emerge victorious.',
    beats: ['Solve', 'Wire', 'Relay', 'Conquer'],
    rounds: [
      {
        label: 'Round 1',
        title: 'Tech Brainstorm',
        detail:
          'Crack technical questions, electronics riddles, logic puzzles, and engineering challenges to secure your spot in the next round.',
      },
      {
        label: 'Round 2',
        title: 'Build It',
        detail:
          'Interpret a circuit diagram and race against the clock to build a fully functional hardware circuit using the provided components.',
      },
      {
        label: 'Round 3',
        title: 'Tinker Relay',
        detail:
          'Design and program a complete system in Tinkercad. Only one teammate can work at a time — communicate fast, relay well, engineer your way to victory.',
      },
    ],
    closingLine: 'Are You Ready To Relay Your Way To Glory?',
    closingSub: 'Think Faster. Build Better. Engineer Together.',
    date: '28 August 2026',
    venue: 'Room 241, 2nd Floor, 2nd Block',
    category: 'Technical Event',
    completed: true,
    instructions: 'Bring laptops with WiFi configured, or a strong hotspot.',
    teamSize: '2–4 Members',
    coordinators: [
      { name: 'Lourdes Xavier', phone: '8095765526' },
      { name: 'Jayani', phone: '8148311354' },
    ],
    registerUrl: REGISTER_URL,
    universe: 'stark-lab',
    accent: '#4cc9ff',
    accentDeep: '#0a5ec9',
    poster: posters['brand-new-circuit'],
  },
  {
    id: 'daily-bugle',
    name: 'Daily Bugle',
    tagline: "Every Frame Has A Story. What's Yours?",
    description:
      'A mobile photography challenge designed to test creativity, storytelling, observation, and perspective through three unique rounds that push participants to see the world differently.',
    beats: ['Shoot', 'Frame', 'Reveal'],
    rounds: [
      { label: 'Round 1', title: 'Creative Theme Challenge' },
      { label: 'Round 2', title: 'Visual Storytelling Challenge' },
      { label: 'Round 3', title: 'Mystery Live Challenge' },
    ],
    closingLine: 'See Differently. Frame Boldly. Tell The Story.',
    date: '31 August 2026 · 4:00 PM',
    venue: 'Online',
    category: 'Photography · Visual Storytelling',
    teamSize: 'Individual Event',
    coordinators: [
      { name: 'Surasmita', phone: '8078156512' },
      { name: 'George Sebastian', phone: '8075843271' },
    ],
    registerUrl: REGISTER_URL,
    universe: 'newsroom',
    accent: '#ff4d4d',
    accentDeep: '#8f1414',
    poster: posters['daily-bugle'],
  },
  {
    id: 'brainverse',
    name: 'Brainverse',
    tagline: 'Where Knowledge Meets The Mind',
    description:
      'A strategic multi-round quiz battle where teams compete through Kahoot qualifiers, thematic challenges, and an intense buzzer showdown. Only the sharpest minds survive every round and fight for ultimate glory.',
    beats: ['Qualify', 'Compete', 'Buzz', 'Conquer'],
    rounds: [
      {
        label: 'Round 1',
        title: 'Kahoot Qualifier',
        detail: 'Top 10 teams compete. Top 6 advance.',
      },
      {
        label: 'Round 2',
        title: 'Thematic Quiz',
        detail: 'Five knowledge domains. Strategic topic selection.',
      },
      {
        label: 'Round 3',
        title: 'Lockout Buzzer Round',
        detail: 'Fast-paced battle of knowledge, reflexes, and confidence.',
      },
      {
        label: 'Final',
        title: 'Bonus Challenge',
        detail: 'Challenge other teams and fight for victory.',
      },
    ],
    date: '31 August 2026',
    venue: 'Block 2, Floor 2, Room 230',
    category: 'Quiz · General & Technical',
    teamSize: '1–3 Members',
    coordinators: [
      { name: 'Tanusarvesh', phone: '9443745725' },
      { name: 'Nysa', phone: '7259597421' },
    ],
    registerUrl: REGISTER_URL,
    universe: 'knowledge',
    accent: '#4cc9ff',
    accentDeep: '#0a5ec9',
    poster: posters['brainverse'],
  },
  {
    id: 'the-gauntlet',
    name: 'The Gauntlet',
    tagline: 'Six Stones. One Gauntlet. One Winner.',
    description:
      'A Marvel-inspired treasure hunt where teams race to recover all six Infinity Stones by solving clues, overcoming challenges, and working together to reach the final Infinity Gauntlet.',
    beats: ['Space', 'Mind', 'Reality', 'Power', 'Time', 'Soul'],
    rounds: [
      { label: '💎', title: 'Gather the Stones' },
      { label: '🗺️', title: 'Follow the Clues' },
      { label: '🫰', title: 'Claim the Gauntlet' },
      { label: '🏆', title: 'Become the Champion' },
    ],
    date: '1 September 2026',
    venue: 'Block 2, Floor 2, Room 229',
    venueNote: 'Start here to receive the first clue',
    category: 'Flagship · Treasure Hunt',
    teamSize: '2–4 Members',
    coordinators: [
      { name: 'Melvin', phone: '9380257221' },
      { name: 'Vishruth', phone: '6362929392' },
    ],
    registerUrl: REGISTER_URL,
    universe: 'infinity',
    accent: '#a06bff',
    accentDeep: '#4b1fa8',
    poster: posters['the-gauntlet'],
  },
  {
    id: 'stark-forge',
    name: 'Stark Forge',
    tagline: 'Built For Minds That Refuse To Stop Thinking.',
    description:
      'An engineering puzzle challenge combining cryptography, logic, number systems, code-breaking, and strategic problem solving. Every puzzle has a unique answer and every decision matters.',
    beats: ['Decode', 'Calculate', 'Analyse', 'Forge'],
    rounds: [
      {
        label: 'Round 1',
        title: 'The Ignition',
        detail: 'Decode. Calculate. Analyse.',
      },
      {
        label: 'Round 2',
        title: 'The Forge',
        detail: 'Advanced logic. Complex patterns. Team strategy.',
      },
    ],
    closingLine: 'System Core Access Granted',
    date: '2 September 2026',
    venue: 'Electronics Lab 241, Block 2, Floor 2',
    category: 'Cryptography · Puzzle Challenge',
    teamSize: '2–4 Members',
    coordinators: [
      { name: 'Sravan', phone: '6385781722' },
      { name: 'Pranavi', phone: '7397735899' },
    ],
    registerUrl: REGISTER_URL,
    universe: 'cyber',
    accent: '#35f0d4',
    accentDeep: '#0b7f8f',
    poster: posters['stark-forge'],
  },
];

export const HEADER_LOCKUP = posters['header-lockup'];

export const FEST = {
  name: 'Source Code 2026',
  year: '2026',
  university: 'CHRIST University',
  department: 'Department of Electronics & Communication Engineering',
  association: 'CUESTIC',
  tagline: ['Innovate.', 'Compete.', 'Conquer.'],
  finaleTagline: 'Where Innovation Meets Imagination',
  registerUrl: REGISTER_URL,
  contactEmail: TBA,
  instagram: TBA,
} as const;

export const isTBA = (v: string) => v === TBA;
