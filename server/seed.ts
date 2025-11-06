// Seed script to populate database with demo data
import { db } from "./db";
import { users, markets } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const [admin] = await db.insert(users).values({
    username: "admin",
    email: "admin@matrizpix.com",
    password: adminPassword,
    balanceBrl: "10000.00",
    balanceUsdc: "10000.000000",
    isAdmin: true,
  }).returning();
  
  console.log("Created admin user:", admin.username);

  // Create demo user
  const demoPassword = await hashPassword("demo123");
  const [demo] = await db.insert(users).values({
    username: "demo",
    email: "demo@matrizpix.com",
    password: demoPassword,
    balanceBrl: "5000.00",
    balanceUsdc: "5000.000000",
  }).returning();
  
  console.log("Created demo user:", demo.username);

  // Create demo markets with Polymarket-style categories and tags
  const demoMarkets = [
    {
      title: "Lula será reeleito em 2026?",
      description: "Este mercado será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições presidenciais de 2026 no Brasil, seja no primeiro ou segundo turno. Será resolvido como NÃO se qualquer outro candidato vencer.",
      category: "elections" as const,
      tags: ["Lula", "Brazil", "2026"],
      resolutionSource: "Resultado oficial do TSE (Tribunal Superior Eleitoral)",
      endDate: new Date("2026-10-30T23:59:59Z"),
      yesPrice: "0.4500",
      noPrice: "0.5500",
    },
    {
      title: "Taxa Selic acima de 12% até final de 2025?",
      description: "Este mercado será resolvido como SIM se a taxa Selic estiver acima de 12% ao ano em qualquer momento até 31 de dezembro de 2025. Será resolvido como NÃO caso contrário.",
      category: "economy" as const,
      tags: ["Selic", "Interest Rates", "Brazil"],
      resolutionSource: "Banco Central do Brasil - Histórico da Taxa Selic",
      endDate: new Date("2025-12-31T23:59:59Z"),
      yesPrice: "0.6200",
      noPrice: "0.3800",
    },
    {
      title: "Brasil vencerá a Copa América 2024?",
      description: "Este mercado será resolvido como SIM se a seleção brasileira vencer a Copa América 2024. Será resolvido como NÃO se qualquer outra seleção vencer ou se o torneio for cancelado.",
      category: "sports" as const,
      tags: ["Copa America", "Brazil", "Soccer"],
      resolutionSource: "CONMEBOL - Resultado oficial da final",
      endDate: new Date("2024-07-15T23:59:59Z"),
      yesPrice: "0.3500",
      noPrice: "0.6500",
    },
    {
      title: "Filme brasileiro ganhará Oscar até 2026?",
      description: "Este mercado será resolvido como SIM se qualquer filme brasileiro ganhar um Oscar (Academy Award) em qualquer categoria até a cerimônia de 2026. Será resolvido como NÃO caso contrário.",
      category: "culture" as const,
      tags: ["Oscars", "Brazil", "Movies"],
      resolutionSource: "Academia de Artes e Ciências Cinematográficas",
      endDate: new Date("2026-03-31T23:59:59Z"),
      yesPrice: "0.2800",
      noPrice: "0.7200",
    },
    {
      title: "Descoberta de vida em Marte até 2030?",
      description: "Este mercado será resolvido como SIM se houver anúncio científico confirmado de descoberta de vida (atual ou passada) em Marte até 31 de dezembro de 2030. Evidências devem ser publicadas em periódico científico revisado por pares.",
      category: "tech" as const,
      tags: ["Mars", "NASA", "Space"],
      resolutionSource: "NASA, ESA ou publicação em Nature/Science",
      endDate: new Date("2030-12-31T23:59:59Z"),
      yesPrice: "0.1500",
      noPrice: "0.8500",
    },
    {
      title: "Dólar ultrapassará R$ 6,00 em 2025?",
      description: "Este mercado será resolvido como SIM se a cotação do dólar americano atingir R$ 6,00 ou mais em qualquer momento durante 2025 (cotação PTAX do Banco Central). Será resolvido como NÃO caso contrário.",
      category: "finance" as const,
      tags: ["USD", "BRL", "Brazil"],
      resolutionSource: "Banco Central do Brasil - Cotação PTAX",
      endDate: new Date("2025-12-31T23:59:59Z"),
      yesPrice: "0.5800",
      noPrice: "0.4200",
    },
    {
      title: "Flamengo será campeão brasileiro 2025?",
      description: "Este mercado será resolvido como SIM se o Flamengo vencer o Campeonato Brasileiro Série A de 2025. Será resolvido como NÃO se qualquer outro time vencer.",
      category: "sports" as const,
      tags: ["Flamengo", "Brazil", "Soccer"],
      resolutionSource: "CBF - Tabela oficial do Brasileirão",
      endDate: new Date("2025-12-15T23:59:59Z"),
      yesPrice: "0.2200",
      noPrice: "0.7800",
    },
    {
      title: "Carnaval 2025 terá mais de 2 milhões no Rio?",
      description: "Este mercado será resolvido como SIM se o público oficial do Carnaval 2025 no Rio de Janeiro ultrapassar 2 milhões de pessoas. Será resolvido como NÃO caso contrário.",
      category: "culture" as const,
      tags: ["Carnival", "Rio", "Brazil"],
      resolutionSource: "Riotur - Dados oficiais de público",
      endDate: new Date("2025-03-10T23:59:59Z"),
      yesPrice: "0.7500",
      noPrice: "0.2500",
    },
  ];

  for (const market of demoMarkets) {
    const [created] = await db.insert(markets).values(market).returning();
    console.log("Created market:", created.title);
  }

  console.log("\nSeed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: username='admin', password='admin123'");
  console.log("Demo: username='demo', password='demo123'");
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
