require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.upsert({
    where: { websiteUrl: 'https://example-dental-clinic.com' },
    update: {},
    create: {
      name: 'Example Dental Clinic',
      websiteUrl: 'https://example-dental-clinic.com',
      businessType: 'Dental clinic',
      city: 'Pune',
      state: 'Maharashtra',
      whatsapp: '+919999999999',
      email: 'owner@example-dental-clinic.com',
    },
  });
  console.log('Seeded client:', client.id, client.name);
}
main().finally(() => prisma.$disconnect()); 