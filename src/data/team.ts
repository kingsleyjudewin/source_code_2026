/* ============================================================================
   ⚠️  EDIT ME — organising committee.

   Photos: drop files in /public/team/ and reference them as '/team/name.jpg'.
   Square images crop best (the card uses a 1:1 frame). Members without an
   image fall back to a monogram, so the roster looks complete either way.
   ========================================================================= */

export type TeamCategory = 'faculty' | 'event';

export type TeamMember = {
  name: string;
  designation: string;
  category: TeamCategory;
  phone?: string;
  /** Path under /public, e.g. '/team/rahul.jpg'. Omit for a monogram fallback. */
  image?: string;
  linkedin?: string;
  /** Sorts within a category; lower is earlier. */
  order?: number;
};

export const TEAM_GROUPS: { id: TeamCategory; title: string }[] = [
  { id: 'faculty', title: 'Faculty Coordinators' },
  { id: 'event', title: 'Event Coordinators' },
];

export const TEAM: TeamMember[] = [
  {
    name: 'Dr. Jesuwanth Sugesh RG',
    designation: 'Faculty Coordinator',
    category: 'faculty',
    phone: '7010067796',
    order: 1,
  },
  {
    name: 'Prof. Jerin Geo Jacob',
    designation: 'Faculty Coordinator',
    category: 'faculty',
    phone: '9447797379',
    order: 2,
  },
  {
    name: 'Rahul',
    designation: 'Event Coordinator',
    category: 'event',
    phone: '9843095353',
    order: 1,
  },
  {
    name: 'Kingsley Judewin',
    designation: 'Event Coordinator',
    category: 'event',
    phone: '8754182808',
    order: 2,
  },
  {
    name: 'Prarthana',
    designation: 'Event Coordinator',
    category: 'event',
    phone: '9964697363',
    order: 3,
  },
];

/** How many placeholder slots to show for a category with no members yet. */
export const PLACEHOLDER_SLOTS = 4;
