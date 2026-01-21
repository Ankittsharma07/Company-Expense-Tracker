import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllExpenses() {
  try {
    console.log("🗑️  Deleting all approvals...");
    const deletedApprovals = await prisma.approval.deleteMany({});
    console.log(`✅ Deleted ${deletedApprovals.count} approvals`);

    console.log("🗑️  Deleting all expenses...");
    const deletedExpenses = await prisma.expense.deleteMany({});
    console.log(`✅ Deleted ${deletedExpenses.count} expenses`);

    console.log("\n✨ All expenses and approvals have been deleted!");
  } catch (error) {
    console.error("❌ Error deleting expenses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllExpenses();

