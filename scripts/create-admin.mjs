/**
 * Create First Admin User
 * Run this script to create the initial admin account
 * 
 * Usage: node scripts/create-admin.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { adminUsers } from "../drizzle/schema.ts";
import bcrypt from "bcrypt";
import * as readline from "readline";

const SALT_ROUNDS = 10;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n🔐 Criar Primeiro Administrador - Cocos App\n");

  // Get database URL from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não encontrada nas variáveis de ambiente");
    process.exit(1);
  }

  // Connect to database
  const db = drizzle(dbUrl);
  console.log("✅ Conectado ao banco de dados\n");

  // Get admin details
  const email = await question("Email do admin: ");
  const password = await question("Senha (mínimo 8 caracteres): ");
  const name = await question("Nome (opcional): ");

  if (!email || !password) {
    console.error("\n❌ Email e senha são obrigatórios");
    rl.close();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("\n❌ A senha deve ter no mínimo 8 caracteres");
    rl.close();
    process.exit(1);
  }

  // Hash password
  console.log("\n🔄 Criando hash da senha...");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert admin
  try {
    await db.insert(adminUsers).values({
      email,
      passwordHash,
      name: name || null,
      role: "super_admin",
      isActive: 1,
    });

    console.log("\n✅ Admin criado com sucesso!");
    console.log(`\n📧 Email: ${email}`);
    console.log(`👤 Nome: ${name || "Não informado"}`);
    console.log(`🔑 Role: super_admin`);
    console.log(`\n🌐 Acesse: http://localhost:3000/admin/login\n`);
  } catch (error) {
    console.error("\n❌ Erro ao criar admin:", error.message);
    if (error.message.includes("Duplicate entry")) {
      console.error("Este email já está cadastrado.");
    }
  }

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  rl.close();
  process.exit(1);
});
