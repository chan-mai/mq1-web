import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { Permission } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding admin users...");

  // chan-maiユーザーを作成または更新
  const adminUser = await prisma.adminUser.upsert({
    where: {
      githubUsername: "chan-mai",
    },
    update: {
      isActive: true,
    },
    create: {
      githubUsername: "chan-mai",
      githubUserId: BigInt(0), // 初回ログイン時に更新される
      isActive: true,
    },
  });

  console.log(`Admin user created/updated: ${adminUser.githubUsername}`);

  // 全権限を付与
  const allPermissions = Object.values(Permission);

  for (const permission of allPermissions) {
    await prisma.adminPermission.upsert({
      where: {
        adminId_permission: {
          adminId: adminUser.id,
          permission,
        },
      },
      update: {},
      create: {
        adminId: adminUser.id,
        permission,
      },
    });
  }

  console.log(`Granted all permissions to ${adminUser.githubUsername}:`);
  console.log(allPermissions.join(", "));

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
