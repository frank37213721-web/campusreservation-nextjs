import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Deferred until after dotenv has loaded .env.local — a static top-level
  // import here would be hoisted and run (throwing on missing DATABASE_URL)
  // before the config() call above ever executes.
  const { db } = await import("./index");
  const { schools } = await import("./schema");

  const seedSchools = [
    { name: "高雄市立三民高中", slug: "sanmin" },
    { name: "高雄市立三民高中分部", slug: "sanmin-branch" },
  ];

  for (const school of seedSchools) {
    await db
      .insert(schools)
      .values(school)
      .onConflictDoNothing({ target: schools.slug });
  }

  console.log(`Seeded ${seedSchools.length} schools.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
