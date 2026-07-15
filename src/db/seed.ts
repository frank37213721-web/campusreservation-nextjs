import "dotenv/config";
import { db } from "./index";
import { schools } from "./schema";

async function main() {
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
