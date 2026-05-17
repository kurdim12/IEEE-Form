import { z } from 'zod';

const JORDANIAN_PHONE = /^(\+962|0)?7[789]\d{7}$/;
const UNIVERSITY_ID = /^\d{9}$/;

export function buildMemberSchema(t) {
  return z.object({
    fullName: z.string().trim().min(3, t.errors.fullNameMin),
    universityId: z
      .string()
      .trim()
      .regex(UNIVERSITY_ID, t.errors.universityIdInvalid),
    major: z.string().trim().min(1, t.errors.majorRequired),
    phone: z
      .string()
      .trim()
      .regex(JORDANIAN_PHONE, t.errors.phoneInvalid),
  });
}

export function buildTeamInfoSchema(t) {
  return z.object({
    teamName: z.string().trim().min(2, t.errors.teamNameMin),
    teamSize: z.enum(['2', '3'], {
      errorMap: () => ({ message: t.errors.teamSizeRequired }),
    }),
  });
}

export function buildFormSchema(t) {
  const member = buildMemberSchema(t);
  return z
    .object({
      teamName: z.string().trim().min(2, t.errors.teamNameMin),
      teamSize: z.enum(['2', '3'], {
        errorMap: () => ({ message: t.errors.teamSizeRequired }),
      }),
      leader: member,
      member2: member,
      // Validated conditionally in superRefine — base type is permissive
      // so leftover empty-string defaults from the form don't trip
      // validation when teamSize is "2".
      member3: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.teamSize === '3') {
        const parsed = member.safeParse(data.member3);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            ctx.addIssue({
              ...issue,
              path: ['member3', ...issue.path],
            });
          }
        }
      }

      const entries = [
        ['leader', data.leader?.universityId],
        ['member2', data.member2?.universityId],
      ];
      if (data.teamSize === '3') {
        entries.push(['member3', data.member3?.universityId]);
      }

      const seen = new Map();
      for (const [key, id] of entries) {
        if (!id || !/^\d{9}$/.test(id)) continue;
        if (seen.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t.errors.universityIdInvalid,
            path: [key, 'universityId'],
          });
        }
        seen.set(id, key);
      }
    });
}
