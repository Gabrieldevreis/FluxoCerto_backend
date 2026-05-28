import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? 'admin@fluxocerto.local',
  name: process.env.SEED_ADMIN_NAME ?? 'Administrador',
  password: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
};

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN.email },
  });

  if (existing) {
    console.log(`[seed] Admin já existe: ${existing.email} (id=${existing.id})`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

  const admin = await prisma.user.create({
    data: {
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log('[seed] Admin criado com sucesso:');
  console.log(`  email:    ${admin.email}`);
  console.log(`  senha:    ${DEFAULT_ADMIN.password}`);
  console.log(`  role:     ${admin.role}`);
  console.log(`  id:       ${admin.id}`);
  console.log('\nALTERE A SENHA APÓS O PRIMEIRO LOGIN.');
}

main()
  .catch((err) => {
    console.error('[seed] Falhou:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
