import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/server/utils/prisma";

async function seedConfig() {
  const existing = await prisma.platformConfig.findFirst();

  if (!existing) {
    await prisma.platformConfig.create({
      data: {
        maxXpPerDay: 200,
        maxPointsPerDay: 300,
        maxSocialTasksPerDay: 2,
        redemptionCooldownHours: 48,
        maxReferralsPerDay: 10,
        referralRewardLevel: 2,
        referralPointsReward: 200,
        referralXpReward: 100,
        spinCooldownHours: 24,
        spinMinLevel: 2,
        spinItems: [
          { id: "tiny", label: "Tiny Boost", points: 5, xp: 2, weight: 35, icon: "Sparkles" },
          { id: "small", label: "Small Win", points: 10, xp: 5, weight: 28, icon: "Coins" },
          { id: "steady", label: "Steady Gain", points: 15, xp: 8, weight: 18, icon: "Star" },
          { id: "solid", label: "Solid Reward", points: 20, xp: 10, weight: 10, icon: "Zap" },
          { id: "rare", label: "Rare Hit", points: 50, xp: 25, weight: 6, icon: "Gem" },
          { id: "jackpot", label: "Jackpot", points: 100, xp: 50, weight: 3, icon: "Crown" }
        ]
      }
    });
    return;
  }

  if (!existing.spinItems) {
    await prisma.platformConfig.update({
      where: { id: existing.id },
      data: {
        spinCooldownHours: existing.spinCooldownHours ?? 24,
        spinMinLevel: existing.spinMinLevel ?? 2,
        spinItems: [
          { id: "tiny", label: "Tiny Boost", points: 5, xp: 2, weight: 35, icon: "Sparkles" },
          { id: "small", label: "Small Win", points: 10, xp: 5, weight: 28, icon: "Coins" },
          { id: "steady", label: "Steady Gain", points: 15, xp: 8, weight: 18, icon: "Star" },
          { id: "solid", label: "Solid Reward", points: 20, xp: 10, weight: 10, icon: "Zap" },
          { id: "rare", label: "Rare Hit", points: 50, xp: 25, weight: 6, icon: "Gem" },
          { id: "jackpot", label: "Jackpot", points: 100, xp: 50, weight: 3, icon: "Crown" }
        ]
      }
    });
  }
}

async function seedUsers() {
  const adminEmail = "7arba0ui@gmail.com";
  const adminUsername = "arcetis_admin";
  const adminPassword = await bcrypt.hash("Kefta123", 10);

  const adminByUsername = await prisma.user.findUnique({
    where: { username: adminUsername }
  });
  const adminByEmail = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (adminByUsername && adminByEmail && adminByUsername.id !== adminByEmail.id) {
    const suffix = Date.now().toString();
    await prisma.user.update({
      where: { id: adminByEmail.id },
      data: {
        email: `archived+${suffix}@arcetis.local`,
        username: `archived_${suffix}`
      }
    });
  }

  const existingAdmin = adminByUsername ?? adminByEmail;

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        username: adminUsername,
        role: UserRole.ADMIN,
        password: adminPassword
      }
    });
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: adminPassword,
        referralCode: "ARCADMIN",
        role: UserRole.ADMIN,
        level: 8,
        xp: 4000,
        points: 5000,
        loginStreak: 5,
        lastLogin: new Date()
      }
    });
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["admin@arcetis.com", "demo@arcetis.com"]
      }
    }
  });
}

async function seedQuests() {
  await prisma.questSubmission.deleteMany();
  await prisma.questCompletion.deleteMany();
  await prisma.sponsorRequest.deleteMany();
  await prisma.quest.deleteMany();

  await prisma.quest.createMany({
    data: [
      {
        title: "Daily Login",
        description: "Log in once per day to keep your streak alive.",
        category: "DAILY",
        platform: "Arcetis",
        link: null,
        xpReward: 20,
        pointsReward: 20,
        maxCompletions: 100000,
        completions: 0,
        minLevel: 1,
        active: true
      },
      {
        title: "Follow Arcetis on Instagram",
        description: "Follow the official Arcetis Instagram account.",
        category: "SOCIAL",
        platform: "Instagram",
        link: "https://instagram.com/arcetis",
        requiresProof: true,
        proofInstructions:
          "Upload two proofs: (1) your profile screenshot and (2) Arcetis page showing Followed.",
        xpReward: 30,
        pointsReward: 20,
        maxCompletions: 100000,
        completions: 0,
        minLevel: 1,
        active: true
      },
      {
        title: "Subscribe to Arcetis YouTube",
        description: "Subscribe to our YouTube channel.",
        category: "SOCIAL",
        platform: "YouTube",
        link: "https://youtube.com",
        requiresProof: false,
        xpReward: 30,
        pointsReward: 20,
        maxCompletions: 100000,
        completions: 0,
        minLevel: 1,
        active: true
      },
      {
        title: "Sponsored: Follow Creator Hub",
        description: "Follow Creator Hub partner page and confirm completion.",
        category: "SPONSORED",
        platform: "Instagram",
        link: "https://instagram.com",
        requiresProof: true,
        xpReward: 30,
        pointsReward: 30,
        maxCompletions: 10000,
        completions: 0,
        minLevel: 1,
        active: true
      }
    ]
  });
}

async function seedRewards() {
  await prisma.redemption.deleteMany();
  await prisma.reward.deleteMany();

  await prisma.reward.createMany({
    data: [
      {
        title: "Canva Education Invite",
        description: "Premium Canva education invite access.",
        pointsCost: 2500,
        minLevel: 5,
        minAccountAge: 30,
        stock: 20
      },
      {
        title: "Netflix Gift",
        description: "Netflix premium voucher.",
        pointsCost: 3000,
        minLevel: 4,
        minAccountAge: 30,
        stock: 10
      },
      {
        title: "ChatGPT Plus",
        description: "One month ChatGPT Plus voucher.",
        pointsCost: 4000,
        minLevel: 8,
        minAccountAge: 30,
        stock: 5
      }
    ]
  });
}

async function main() {
  await seedConfig();
  await seedUsers();
  await seedQuests();
  await seedRewards();

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
