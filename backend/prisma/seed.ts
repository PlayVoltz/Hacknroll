import bcrypt from "bcrypt";
import prisma from "../src/db";
import { config } from "../src/config";
import { generateInviteCode } from "../src/utils/invite";

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const [alex, sam] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alex@example.com" },
      update: {},
      create: {
        email: "alex@example.com",
        username: "Alex",
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "sam@example.com" },
      update: {},
      create: {
        email: "sam@example.com",
        username: "Sam",
        passwordHash,
      },
    }),
  ]);

  const group = await prisma.group.create({
    data: {
      name: "Friday Night",
      durationDays: 0,
      durationHours: 0,
      durationMinutes: 0,
      isUnlimited: true,
      inviteCode: generateInviteCode(),
      endsAt: null,
    },
  });

  await Promise.all([
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: alex.id } },
      update: {},
      create: { groupId: group.id, userId: alex.id },
    }),
    prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: sam.id } },
      update: {},
      create: { groupId: group.id, userId: sam.id },
    }),
  ]);

  await Promise.all([
    prisma.wallet.upsert({
      where: { groupId_userId: { groupId: group.id, userId: alex.id } },
      update: {},
      create: {
        groupId: group.id,
        userId: alex.id,
        creditsMinor: config.creditsStartMinor,
      },
    }),
    prisma.wallet.upsert({
      where: { groupId_userId: { groupId: group.id, userId: sam.id } },
      update: {},
      create: {
        groupId: group.id,
        userId: sam.id,
        creditsMinor: config.creditsStartMinor,
      },
    }),
  ]);

  console.log("Seeded users and group");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
