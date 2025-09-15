/** This script serves to replace all manual ids with UUIDs in the initial family tree csv data */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const { v7: uuidv7 } = require("uuid");

const args = process.argv.slice(2);

const options = {};
args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
        options[key.slice(2)] = value;
    }
});

// Config
const inputDir = options["path"] ?? "../data";
const outputDir = options["path"] ?? "../data";
const entityFile = "people.csv";
const relationFiles = ["marriage-relations.csv", "parent-relations.csv"];
const idColumn = "id";

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Map to store old IDs to new UUIDs
const idMap = new Map();

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function writeCSV(filePath, data) {
  const headers = Object.keys(data[0]).map((h) => ({ id: h, title: h }));
  const writer = createObjectCsvWriter({ path: filePath, header: headers });
  await writer.writeRecords(data);
}

async function processEntities() {
  const entitiesPath = path.join(inputDir, entityFile);
  const entities = await readCSV(entitiesPath);

  // Replace IDs with UUIDs
  for (const row of entities) {
    const oldId = row[idColumn];
    if (!idMap.has(oldId)) {
      idMap.set(oldId, uuidv7());
    }
    row[idColumn] = idMap.get(oldId);
  }

  await writeCSV(path.join(outputDir, entityFile), entities);
  console.log(`Processed entities: ${entityFile}`);
}

async function processRelations() {
  for (const file of relationFiles) {
    const filePath = path.join(inputDir, file);
    const data = await readCSV(filePath);

    for (const row of data) {
      for (const key in row) {
        if (idMap.has(row[key])) {
          row[key] = idMap.get(row[key]);
        }
      }
    }

    await writeCSV(path.join(outputDir, file), data);
    console.log(`Processed relations: ${file}`);
  }
}

(async () => {
  try {
    await processEntities();
    await processRelations();
    console.log("All CSVs processed successfully!");
  } catch (err) {
    console.error("Error processing CSVs:", err);
  }
})();
