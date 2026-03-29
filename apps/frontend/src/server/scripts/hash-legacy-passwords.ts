import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      password: {
        not: {
          startsWith: "$2"
        }
      }
    },
    select: {
      id: true,
      password: true
    }
  });

  if (users.length === 0) {
    console.log("No legacy plain-text passwords found.");
    return;
  }

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
  }

  console.log(`Hashed ${users.length} legacy password(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
