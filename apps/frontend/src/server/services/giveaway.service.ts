import type { GiveawayField, Giveaway } from "@/lib/types";
import type { Prisma, GiveawayStatus } from "@prisma/client";
import { ApiError } from "../utils/http";
import { prisma } from "../utils/prisma";
import { createNotification, createNotificationForAdmins } from "./notification.service";
import { getUserOrThrow } from "./user.service";

type GiveawayListQuery = {
  q?: string;
  page: number;
  pageSize: number;
};

type GiveawayFieldInput = GiveawayField;

type CreateGiveawayInput = {
  title: string;
  description: string;
  prizeSummary?: string;
  imageUrl?: string;
  status?: GiveawayStatus;
  promoted?: boolean;
  winnerCount?: number;
  minLevel?: number;
  minAccountAge?: number;
  durationDays?: number;
  allowEntryEdits?: boolean;
  inputFields?: GiveawayFieldInput[];
  requiresJustification?: boolean;
  justificationLabel?: string;
  endsAt?: string;
};

type ApplyGiveawayInput = {
  userId: string;
  giveawayId: string;
  answers?: Record<string, string>;
  justification?: string;
  justificationImageUrls?: string[];
};

type ReviewGiveawayEntryInput = {
  entryId: string;
  adminUserId: string;
  status: "selected" | "rejected";
};

type UpdateGiveawayInput = {
  giveawayId: string;
  status?: GiveawayStatus;
  durationDays?: number;
};

type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function stringContains(value: string) {
  return {
    contains: value,
    mode: "insensitive" as const
  };
}

function getPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    skip: (safePage - 1) * pageSize
  };
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function getAccountAgeDays(createdAt: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / millisecondsPerDay));
}

function getWinnerCount(giveaway: { winnerCount?: number | null }) {
  return Math.max(giveaway.winnerCount ?? 1, 1);
}

function getMinLevel(giveaway: { minLevel?: number | null }) {
  return Math.max(giveaway.minLevel ?? 1, 1);
}

function getMinAccountAge(giveaway: { minAccountAge?: number | null }) {
  return Math.max(giveaway.minAccountAge ?? 0, 0);
}

function allowEntryEdits(giveaway: { allowEntryEdits?: boolean | null }) {
  return !!giveaway.allowEntryEdits;
}

function isPromoted(giveaway: { promoted?: boolean | null }) {
  return !!giveaway.promoted;
}

function buildEndsAtFromDurationDays(durationDays?: number) {
  if (typeof durationDays !== "number") {
    return undefined;
  }

  return new Date(Date.now() + Math.max(durationDays, 1) * DAY_IN_MS);
}

function normalizeInputFields(fields?: GiveawayFieldInput[] | null): GiveawayField[] | undefined {
  if (!fields?.length) {
    return undefined;
  }

  return fields
    .filter((field) => field.label?.trim())
    .slice(0, 8)
    .map((field, index) => ({
      id: field.id?.trim() || `field_${index + 1}`,
      label: field.label.trim(),
      placeholder: field.placeholder?.trim() || undefined,
      required: field.required ?? true,
      type: field.type ?? "TEXT"
    }));
}

function normalizeStoredInputFields(inputFields?: Prisma.JsonValue | null): GiveawayField[] | null {
  return Array.isArray(inputFields) ? (inputFields as GiveawayField[]) : null;
}

function normalizeStoredImageUrls(imageUrls?: Prisma.JsonValue | null) {
  return Array.isArray(imageUrls)
    ? imageUrls.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : null;
}

function normalizeJustificationImageUrls(imageUrls?: string[] | null) {
  if (!imageUrls?.length) {
    return [];
  }

  return [...new Set(imageUrls.map((value) => value.trim()).filter(Boolean))].slice(0, 3);
}

function normalizeDate(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeGiveaway<T extends {
  inputFields?: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  endsAt: Date | null;
  promoted?: boolean | null;
  winnerCount?: number | null;
  minLevel?: number | null;
  minAccountAge?: number | null;
  allowEntryEdits?: boolean | null;
}>(giveaway: T) {
  return {
    ...giveaway,
    promoted: isPromoted(giveaway),
    winnerCount: getWinnerCount(giveaway),
    minLevel: getMinLevel(giveaway),
    minAccountAge: getMinAccountAge(giveaway),
    allowEntryEdits: allowEntryEdits(giveaway),
    inputFields: normalizeStoredInputFields(giveaway.inputFields),
    createdAt: giveaway.createdAt.toISOString(),
    updatedAt: giveaway.updatedAt.toISOString(),
    endsAt: normalizeDate(giveaway.endsAt)
  };
}

function normalizeGiveawaySummary<T extends {
  id: string;
  title: string;
  prizeSummary?: string | null;
  endsAt: Date | null;
  status: GiveawayStatus;
}>(giveaway: T) {
  return {
    ...giveaway,
    endsAt: normalizeDate(giveaway.endsAt)
  };
}

function normalizeGiveawayEntry<T extends {
  answers?: Prisma.JsonValue | null;
  justificationImageUrls?: Prisma.JsonValue | null;
  createdAt: Date;
  reviewedAt: Date | null;
}>(entry: T) {
  return {
    ...entry,
    answers: (entry.answers as Record<string, string> | null) ?? null,
    justificationImageUrls: normalizeStoredImageUrls(entry.justificationImageUrls),
    createdAt: entry.createdAt.toISOString(),
    reviewedAt: normalizeDate(entry.reviewedAt)
  };
}

function getFieldMap(giveaway: { inputFields?: Prisma.JsonValue | null }) {
  const fields = normalizeStoredInputFields(giveaway.inputFields) ?? [];
  return new Map(fields.map((field) => [field.id, field]));
}

function isGiveawayClosed(giveaway: { status: GiveawayStatus; endsAt: Date | null }) {
  return giveaway.status === "CLOSED" || (giveaway.endsAt ? giveaway.endsAt.getTime() < Date.now() : false);
}

async function syncExpiredGiveaways() {
  await prisma.giveaway.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: {
        lt: new Date()
      }
    },
    data: {
      status: "CLOSED"
    }
  });
}

function normalizeAnswers(giveaway: { inputFields?: Prisma.JsonValue | null }, answers?: Record<string, string>) {
  const fieldMap = getFieldMap(giveaway);
  const normalizedAnswers = Object.fromEntries(
    Object.entries(answers ?? {})
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );

  for (const [fieldId] of Object.entries(normalizedAnswers)) {
    if (!fieldMap.has(fieldId)) {
      throw new ApiError(400, "One or more giveaway fields are invalid");
    }
  }

  for (const field of fieldMap.values()) {
    if ((field.required ?? true) && !normalizedAnswers[field.id]) {
      throw new ApiError(400, `${field.label} is required`);
    }
  }

  return normalizedAnswers;
}

async function assertGiveawayApplicantEligibility(
  giveaway: { minLevel?: number | null; minAccountAge?: number | null },
  userId: string
) {
  const user = await getUserOrThrow(userId);

  if (user.level < getMinLevel(giveaway)) {
    throw new ApiError(403, `This giveaway requires level ${getMinLevel(giveaway)}.`);
  }

  const accountAgeDays = getAccountAgeDays(user.createdAt);
  if (accountAgeDays < getMinAccountAge(giveaway)) {
    throw new ApiError(403, `This giveaway requires account age of ${getMinAccountAge(giveaway)} days.`);
  }

  return user;
}

async function getEntryCounts(giveawayIds: string[], status?: "pending" | "selected" | "rejected") {
  if (!giveawayIds.length) {
    return new Map<string, number>();
  }

  const entries = await Promise.all(
    giveawayIds.map(
      async (giveawayId) =>
        [
          giveawayId,
          await prisma.giveawayEntry.count({
            where: {
              giveawayId,
              ...(status ? { status } : {})
            }
          })
        ] as const
    )
  );

  return new Map(entries);
}

export async function createGiveaway(input: CreateGiveawayInput) {
  const inputFields = normalizeInputFields(input.inputFields);
  const status = input.status ?? "ACTIVE";
  const endsAt = input.endsAt ? new Date(input.endsAt) : buildEndsAtFromDurationDays(input.durationDays ?? 7);

  return prisma.$transaction(async (tx) => {
    if (status === "ACTIVE") {
      await tx.giveaway.updateMany({
        where: {
          status: "ACTIVE"
        },
        data: {
          status: "CLOSED"
        }
      });
    }

    return tx.giveaway.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        prizeSummary: input.prizeSummary?.trim() || undefined,
        imageUrl: input.imageUrl?.trim() || undefined,
        status,
        promoted: input.promoted ?? false,
        winnerCount: input.winnerCount ?? 1,
        minLevel: input.minLevel ?? 1,
        minAccountAge: input.minAccountAge ?? 0,
        allowEntryEdits: input.allowEntryEdits ?? false,
        inputFields: inputFields ? (inputFields as Prisma.InputJsonValue) : undefined,
        requiresJustification: input.requiresJustification ?? false,
        justificationLabel: input.justificationLabel?.trim() || undefined,
        endsAt
      }
    });
  });
}

export async function listAdminGiveaways(query: GiveawayListQuery): Promise<PaginatedResult<Giveaway>> {
  await syncExpiredGiveaways();
  const trimmedQuery = query.q?.trim();
  const where: Prisma.GiveawayWhereInput | undefined = trimmedQuery
    ? {
        OR: [
          { title: stringContains(trimmedQuery) },
          { description: stringContains(trimmedQuery) },
          { prizeSummary: stringContains(trimmedQuery) }
        ]
      }
    : undefined;

  const total = await prisma.giveaway.count({ where });
  const pagination = getPagination(total, query.page, query.pageSize);
  const giveaways = await prisma.giveaway.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize
  });
  const counts = await getEntryCounts(giveaways.map((giveaway) => giveaway.id));
  const selectedCounts = await getEntryCounts(giveaways.map((giveaway) => giveaway.id), "selected");

  return {
    items: giveaways.map((giveaway) => ({
      ...normalizeGiveaway(giveaway),
      entryCount: counts.get(giveaway.id) ?? 0,
      selectedCount: selectedCounts.get(giveaway.id) ?? 0
    })),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    totalPages: pagination.totalPages
  };
}

export async function getAdminGiveawayById(giveawayId: string) {
  await syncExpiredGiveaways();
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });

  if (!giveaway) {
    throw new ApiError(404, "Giveaway not found");
  }

  const entries = await prisma.giveawayEntry.findMany({
    where: { giveawayId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          level: true
        }
      },
      reviewedBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const selectedCount = entries.filter((entry) => entry.status === "selected").length;

  return {
    ...normalizeGiveaway(giveaway),
    entryCount: entries.length,
    selectedCount,
    entries: entries.map((entry) => normalizeGiveawayEntry(entry))
  };
}

export async function listGiveaways(userId?: string) {
  await syncExpiredGiveaways();
  const giveaways = await prisma.giveaway.findMany({
    orderBy: [{ createdAt: "desc" }]
  });

  const counts = await getEntryCounts(giveaways.map((giveaway) => giveaway.id));
  const selectedCounts = await getEntryCounts(giveaways.map((giveaway) => giveaway.id), "selected");
  const viewerEntries = userId
    ? await prisma.giveawayEntry.findMany({
        where: {
          userId,
          giveawayId: { in: giveaways.map((giveaway) => giveaway.id) }
        }
      })
    : [];
  const entryMap = new Map(viewerEntries.map((entry) => [entry.giveawayId, entry]));

  const sortedGiveaways = giveaways.sort((left, right) => {
    const leftCurrent = left.status === "ACTIVE" ? 1 : 0;
    const rightCurrent = right.status === "ACTIVE" ? 1 : 0;

    if (leftCurrent !== rightCurrent) {
      return rightCurrent - leftCurrent;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  return sortedGiveaways.map((giveaway) => ({
    ...normalizeGiveaway(giveaway),
    entryCount: counts.get(giveaway.id) ?? 0,
    selectedCount: selectedCounts.get(giveaway.id) ?? 0,
    viewerEntry: entryMap.has(giveaway.id) ? normalizeGiveawayEntry(entryMap.get(giveaway.id)!) : null
  }));
}

export async function listMyGiveawayEntries(userId: string) {
  await syncExpiredGiveaways();
  const entries = await prisma.giveawayEntry.findMany({
    where: { userId },
    include: {
      giveaway: true,
      reviewedBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return entries.map((entry) => ({
    ...normalizeGiveawayEntry(entry),
    giveaway: entry.giveaway ? normalizeGiveaway(entry.giveaway) : null
  }));
}

export async function getGiveawayById(giveawayId: string, userId?: string) {
  await syncExpiredGiveaways();
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });

  if (!giveaway) {
    throw new ApiError(404, "Giveaway not found");
  }

  const [entryCount, selectedCount, viewerEntry] = await Promise.all([
    prisma.giveawayEntry.count({ where: { giveawayId } }),
    prisma.giveawayEntry.count({ where: { giveawayId, status: "selected" } }),
    userId
      ? prisma.giveawayEntry.findUnique({
          where: {
            giveawayId_userId: {
              giveawayId,
              userId
            }
          },
          include: {
            reviewedBy: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        })
      : Promise.resolve(null)
  ]);

  return {
    ...normalizeGiveaway(giveaway),
    entryCount,
    selectedCount,
    viewerEntry: viewerEntry ? normalizeGiveawayEntry(viewerEntry) : null
  };
}

export async function applyToGiveaway(input: ApplyGiveawayInput) {
  await syncExpiredGiveaways();
  const giveaway = await prisma.giveaway.findUnique({ where: { id: input.giveawayId } });

  if (!giveaway) {
    throw new ApiError(404, "Giveaway not found");
  }

  if (isGiveawayClosed(giveaway)) {
    throw new ApiError(400, "This giveaway is closed");
  }

  await assertGiveawayApplicantEligibility(giveaway, input.userId);

  const existing = await prisma.giveawayEntry.findUnique({
    where: {
      giveawayId_userId: {
        giveawayId: input.giveawayId,
        userId: input.userId
      }
    }
  });

  if (existing) {
    throw new ApiError(400, "You already applied to this giveaway");
  }

  const normalizedAnswers = normalizeAnswers(giveaway, input.answers);
  const justification = input.justification?.trim();
  const justificationImageUrls = normalizeJustificationImageUrls(input.justificationImageUrls);
  if (giveaway.requiresJustification && !justificationImageUrls.length) {
    throw new ApiError(400, giveaway.justificationLabel?.trim() || "At least one proof image is required");
  }

  const entry = await prisma.giveawayEntry.create({
    data: {
      giveawayId: input.giveawayId,
      userId: input.userId,
      answers: Object.keys(normalizedAnswers).length ? (normalizedAnswers as Prisma.InputJsonValue) : undefined,
      justification: justification || undefined,
      justificationImageUrls: justificationImageUrls.length
        ? (justificationImageUrls as Prisma.InputJsonValue)
        : undefined
    },
    include: {
      giveaway: {
        select: {
          id: true,
          title: true,
          prizeSummary: true,
          endsAt: true,
          status: true
        }
      }
    }
  });

  await Promise.all([
    createNotificationForAdmins({
      type: "ADMIN_REVIEW_REQUIRED",
      title: "Giveaway entry received",
      message: `${giveaway.title} received a new application and is ready for review.`,
      link: `/backoffice/dashboard/giveaways/${giveaway.id}`,
      metadata: {
        giveawayId: giveaway.id,
        entryId: entry.id,
        userId: input.userId
      }
    }),
    createNotification({
      userId: input.userId,
      type: "SYSTEM",
      title: "Giveaway entry sent",
      message: `Your application for ${giveaway.title} was received successfully.`,
      link: `/giveaways/${giveaway.id}`,
      metadata: {
        giveawayId: giveaway.id,
        entryId: entry.id
      }
    })
  ]);

  return {
    ...normalizeGiveawayEntry(entry),
    giveaway: entry.giveaway ? normalizeGiveawaySummary(entry.giveaway) : null
  };
}

export async function updateGiveawayEntry(input: ApplyGiveawayInput) {
  await syncExpiredGiveaways();
  const giveaway = await prisma.giveaway.findUnique({ where: { id: input.giveawayId } });

  if (!giveaway) {
    throw new ApiError(404, "Giveaway not found");
  }

  if (isGiveawayClosed(giveaway)) {
    throw new ApiError(400, "This giveaway is closed");
  }

  if (!allowEntryEdits(giveaway)) {
    throw new ApiError(403, "This giveaway does not allow entry edits.");
  }

  await assertGiveawayApplicantEligibility(giveaway, input.userId);

  const existing = await prisma.giveawayEntry.findUnique({
    where: {
      giveawayId_userId: {
        giveawayId: input.giveawayId,
        userId: input.userId
      }
    },
    include: {
      giveaway: {
        select: {
          id: true,
          title: true,
          prizeSummary: true,
          endsAt: true,
          status: true
        }
      }
    }
  });

  if (!existing) {
    throw new ApiError(404, "Giveaway entry not found");
  }

  if (existing.status !== "pending") {
    throw new ApiError(400, "Only pending entries can be edited.");
  }

  const normalizedAnswers = normalizeAnswers(giveaway, input.answers);
  const justification = input.justification?.trim();
  const justificationImageUrls = normalizeJustificationImageUrls(input.justificationImageUrls);
  if (giveaway.requiresJustification && !justificationImageUrls.length) {
    throw new ApiError(400, giveaway.justificationLabel?.trim() || "At least one proof image is required");
  }

  const updated = await prisma.giveawayEntry.update({
    where: { id: existing.id },
    data: {
      answers: Object.keys(normalizedAnswers).length ? (normalizedAnswers as Prisma.InputJsonValue) : undefined,
      justification: justification || undefined,
      justificationImageUrls: justificationImageUrls.length
        ? (justificationImageUrls as Prisma.InputJsonValue)
        : undefined
    },
    include: {
      giveaway: {
        select: {
          id: true,
          title: true,
          prizeSummary: true,
          endsAt: true,
          status: true
        }
      }
    }
  });

  await createNotification({
    userId: input.userId,
    type: "SYSTEM",
    title: "Giveaway entry updated",
    message: `Your application for ${giveaway.title} was updated successfully.`,
    link: `/giveaways/${giveaway.id}`,
    metadata: {
      giveawayId: giveaway.id,
      entryId: updated.id
    }
  });

  return {
    ...normalizeGiveawayEntry(updated),
    giveaway: updated.giveaway ? normalizeGiveawaySummary(updated.giveaway) : null
  };
}

export async function updateGiveaway(input: UpdateGiveawayInput) {
  await syncExpiredGiveaways();
  const existing = await prisma.giveaway.findUnique({ where: { id: input.giveawayId } });

  if (!existing) {
    throw new ApiError(404, "Giveaway not found");
  }

  return prisma.$transaction(async (tx) => {
    if (input.status === "ACTIVE") {
      await tx.giveaway.updateMany({
        where: {
          status: "ACTIVE",
          id: {
            not: input.giveawayId
          }
        },
        data: {
          status: "CLOSED"
        }
      });
    }

    const giveaway = await tx.giveaway.update({
      where: { id: input.giveawayId },
      data: {
        ...(typeof input.status !== "undefined" ? { status: input.status } : {}),
        ...(typeof input.durationDays !== "undefined"
          ? {
              endsAt: buildEndsAtFromDurationDays(input.durationDays)
            }
          : {})
      }
    });

    return normalizeGiveaway(giveaway);
  });
}

export async function reviewGiveawayEntry(input: ReviewGiveawayEntryInput) {
  const existing = await prisma.giveawayEntry.findUnique({
    where: { id: input.entryId },
    include: {
      giveaway: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          level: true
        }
      },
      reviewedBy: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  if (!existing) {
    throw new ApiError(404, "Giveaway entry not found");
  }

  if (existing.status !== "pending") {
    throw new ApiError(400, "Only pending entries can be reviewed.");
  }

  const winnerCount = getWinnerCount(existing.giveaway);
  const selectedCount = await prisma.giveawayEntry.count({
    where: {
      giveawayId: existing.giveawayId,
      status: "selected"
    }
  });

  if (input.status === "selected" && selectedCount >= winnerCount) {
    throw new ApiError(400, "All winner slots are already filled for this giveaway.");
  }

  const reviewedAt = new Date();
  let autoClosed = false;
  let autoRejectedEntries: Array<{ id: string; userId: string }> = [];

  const updated = await prisma.$transaction(async (tx) => {
    const nextEntry = await tx.giveawayEntry.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        reviewedAt,
        reviewedById: input.adminUserId
      },
      include: {
        giveaway: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (input.status === "selected" && selectedCount + 1 >= winnerCount) {
      autoClosed = true;
      autoRejectedEntries = await tx.giveawayEntry.findMany({
        where: {
          giveawayId: existing.giveawayId,
          status: "pending"
        },
        select: {
          id: true,
          userId: true
        }
      });

      if (autoRejectedEntries.length) {
        await tx.giveawayEntry.updateMany({
          where: {
            id: {
              in: autoRejectedEntries.map((entry) => entry.id)
            }
          },
          data: {
            status: "rejected",
            reviewedAt,
            reviewedById: input.adminUserId
          }
        });
      }

      await tx.giveaway.update({
        where: { id: existing.giveawayId },
        data: { status: "CLOSED" }
      });
    }

    return nextEntry;
  });

  await createNotification({
    userId: updated.userId,
    type: "SYSTEM",
    title: input.status === "selected" ? "You were selected" : "Giveaway update",
    message:
      input.status === "selected"
        ? `You were selected for ${updated.giveaway.title}.`
        : `Your application for ${updated.giveaway.title} was not selected.`,
    link: `/giveaways/${updated.giveawayId}`,
    metadata: {
      giveawayId: updated.giveawayId,
      entryId: updated.id,
      status: input.status
    }
  });

  if (autoClosed && autoRejectedEntries.length) {
    await Promise.all(
      autoRejectedEntries.map((entry) =>
        createNotification({
          userId: entry.userId,
          type: "SYSTEM",
          title: "Giveaway closed",
          message: `Winners were chosen for ${updated.giveaway.title}. This time your application was not selected.`,
          link: `/giveaways/${updated.giveawayId}`,
          metadata: {
            giveawayId: updated.giveawayId,
            entryId: entry.id,
            status: "rejected"
          }
        })
      )
    );
  }

  return {
    ...normalizeGiveawayEntry(updated),
    giveaway: normalizeGiveaway(updated.giveaway),
    autoClosed
  };
}
