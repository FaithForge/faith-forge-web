/**
 * Classroom age progression rankings and sorting helpers for the Kids Ministry.
 * Enables consistent ordering of classrooms from youngest to oldest throughout
 * the application (attendance reports, dashboard selectors, PDF generation).
 */

/**
 * Known age progression order for church classrooms (from youngest to oldest).
 * 1: Bebés / Cuna (0 - 1 año)
 * 2: Caminadores (1 - 2 años)
 * 3: Zaqueos / Párvulos (2 - 4 años)
 * 4: Jeremías (4 - 6 años)
 * 5: Timoteos (7 - 9 años)
 * 6: Titos (10 - 12 años)
 * 7: Yo Soy Iglekids / Especial (Servidores / Multiedad)
 */
export const KNOWN_CLASSROOM_ORDER: Array<{ match: string; rank: number }> = [
  { match: 'bebe', rank: 1 },
  { match: 'bebé', rank: 1 },
  { match: 'cuna', rank: 1 },
  { match: 'lactante', rank: 1 },
  { match: 'nursery', rank: 1 },
  { match: 'caminador', rank: 2 },
  { match: 'walker', rank: 2 },
  { match: 'toddler', rank: 2 },
  { match: 'zaqueo', rank: 3 },
  { match: 'maternal', rank: 3 },
  { match: 'parvulo', rank: 3 },
  { match: 'párvulo', rank: 3 },
  { match: 'preescolar', rank: 3 },
  { match: 'preschool', rank: 3 },
  { match: 'jeremia', rank: 4 },
  { match: 'jeremía', rank: 4 },
  { match: 'infantil', rank: 4 },
  { match: 'explorador', rank: 4 },
  { match: 'timoteo', rank: 5 },
  { match: 'valiente', rank: 5 },
  { match: 'primaria', rank: 5 },
  { match: 'tito', rank: 6 },
  { match: 'prejuvenil', rank: 6 },
  { match: 'preadolescente', rank: 6 },
  { match: 'conquistador', rank: 6 },
  { match: 'yo soy', rank: 7 },
  { match: 'servidor', rank: 7 },
  { match: 'especial', rank: 7 },
];

/**
 * Computes an age-sorting rank for a classroom group from youngest to oldest.
 * Matches known standard church classroom progressions, and falls back to attendee
 * average age when available for custom or unknown classrooms.
 *
 * @param {string} [groupName] - The classroom name.
 * @param {Array<{ kid?: { age?: number }; group?: { id?: string; name?: string } }>} [attendees] - Optional attendees for age fallback.
 * @returns {number} Numeric rank (lower number = younger age).
 */
export const getGroupAgeRank = (
  groupName?: string,
  attendees?: Array<{ kid?: { age?: number }; group?: { id?: string; name?: string } }>
): number => {
  if (!groupName) return 999;
  const norm = groupName.toLowerCase().trim();

  // 1. Check known classroom names first
  const known = KNOWN_CLASSROOM_ORDER.find((item) => norm.includes(item.match));
  if (known) {
    return known.rank * 10;
  }

  // 2. If unknown group name, calculate average age of attendees in this group if available
  if (attendees && attendees.length > 0) {
    const matchingKids = attendees.filter((a) => {
      const gName = a.group?.name?.toLowerCase().trim();
      return gName && (gName === norm || gName.includes(norm) || norm.includes(gName));
    });

    if (matchingKids.length > 0) {
      const validAges = matchingKids
        .map((a) => a.kid?.age)
        .filter((age): age is number => typeof age === 'number' && age >= 0);

      if (validAges.length > 0) {
        const sum = validAges.reduce((acc, age) => acc + age, 0);
        return 100 + sum / validAges.length;
      }
    }
  }

  return 200;
};

/**
 * Sorts an array of kid groups / classrooms from youngest to oldest age.
 *
 * @template T
 * @param {T[]} groups - Array of groups to sort.
 * @param {Array<{ kid?: { age?: number }; group?: { id?: string; name?: string } }>} [attendees] - Optional attendees list.
 * @param {(group: T) => string} [getName] - Custom name extractor function.
 * @returns {T[]} Sorted array (shallow copy).
 */
export const sortKidGroupsByAge = <T>(
  groups: T[],
  attendees?: Array<{ kid?: { age?: number }; group?: { id?: string; name?: string } }>,
  getName?: (group: T) => string
): T[] => {
  if (!Array.isArray(groups)) return [];
  return [...groups].sort((a, b) => {
    const nameA = getName ? getName(a) : (a as any)?.groupName || (a as any)?.name || '';
    const nameB = getName ? getName(b) : (b as any)?.groupName || (b as any)?.name || '';
    return getGroupAgeRank(nameA, attendees) - getGroupAgeRank(nameB, attendees);
  });
};
