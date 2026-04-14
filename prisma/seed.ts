import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12)

  await prisma.adminUser.upsert({
    where: { adminId: "admin_dirmawa" },
    update: {},
    create: {
      adminId: "admin_dirmawa",
      password: hashedPassword,
      nama: "Administrator DIRMAWA",
    },
  })

  console.log("✅ Seed berhasil — admin_dirmawa dibuat")
  console.log("   adminId  : admin_dirmawa")
  console.log("   password : admin123")
  console.log("   ⚠️  Ganti password ini setelah pertama login!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
