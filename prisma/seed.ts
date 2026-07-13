import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12)

  await prisma.adminUser.upsert({
    where: { username: "admin_dirmawa" },
    update: {},
    create: {
      username: "admin_dirmawa",
      password: hashedPassword,
      nama: "Administrator DIRMAWA",
    },
  })

  console.log("✅ Seed berhasil — admin_dirmawa dibuat")
  console.log("   username : admin_dirmawa")
  console.log("   password : admin123")
  console.log("   ⚠️  Ganti password ini setelah pertama login!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
