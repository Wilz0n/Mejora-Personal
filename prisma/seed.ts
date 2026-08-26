import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@lifetracker.app" },
    update: {},
    create: {
      email: "demo@lifetracker.app",
      name: "Usuario Demo",
      passwordHash,
    },
  });

  // Limpia datos previos del demo
  await prisma.habit.deleteMany({ where: { userId: user.id } });
  await prisma.fixedExpense.deleteMany({ where: { userId: user.id } });
  await prisma.projectGoal.deleteMany({ where: { userId: user.id } });

  const habitsData = [
    { name: "Meditar 10 min", icon: "self_improvement" },
    { name: "Lectura 20 págs", icon: "menu_book" },
    { name: "Entrenamiento", icon: "fitness_center" },
    { name: "Beber 2L de agua", icon: "water_drop" },
  ];

  for (const [i, h] of habitsData.entries()) {
    const habit = await prisma.habit.create({
      data: { userId: user.id, name: h.name, icon: h.icon },
    });
    // Crea logs de los últimos 7 días con distintos niveles de cumplimiento
    for (let offset = -6; offset <= 0; offset++) {
      const completed = (offset + i) % 2 === 0;
      await prisma.habitLog.create({
        data: { habitId: habit.id, date: dayKey(offset), completed },
      });
    }
  }

  await prisma.financialSummary.upsert({
    where: { userId: user.id },
    update: { monthlyIncome: 3000 },
    create: { userId: user.id, monthlyIncome: 3000 },
  });

  await prisma.fixedExpense.createMany({
    data: [
      { userId: user.id, category: "Renta", amount: 800 },
      { userId: user.id, category: "Servicios", amount: 150 },
      { userId: user.id, category: "Suscripciones", amount: 50 },
    ],
  });

  await prisma.projectGoal.createMany({
    data: [
      {
        userId: user.id,
        name: "Nueva laptop",
        targetAmount: 1500,
        allocatedAmount: 500,
        tag: "Tech",
      },
      {
        userId: user.id,
        name: "Fondo de viaje",
        targetAmount: 2000,
        allocatedAmount: 300,
        tag: "Viajes",
      },
    ],
  });

  console.log("Seed completado. Usuario demo: demo@lifetracker.app / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
