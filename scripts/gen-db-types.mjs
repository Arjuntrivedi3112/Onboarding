/**
 * Generates src/integrations/supabase/types.ts from the migrations, using an
 * in-process Postgres (PGlite) — no Docker or Supabase login needed. Output
 * matches the shape of `supabase gen types typescript` closely enough that
 * either can be used; prefer the official generator when it is available.
 *
 *   node scripts/gen-db-types.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const ROOT = join(import.meta.dirname, "..");
const harness = readFileSync(join(ROOT, "src/test/db/harness.ts"), "utf8");
const stub = harness.match(/const SUPABASE_STUB = `([\s\S]*?)`;/)[1];

const db = new PGlite();
await db.exec(stub);
for (const f of readdirSync(join(ROOT, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(join(ROOT, "supabase/migrations", f), "utf8"));
}

const enums = (
  await db.query(`select t.typname, array_agg(e.enumlabel order by e.enumsortorder) labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' group by t.typname order by t.typname`)
).rows;
const enumNames = new Set(enums.map((e) => e.typname));

function tsType(udt) {
  if (udt.startsWith("_")) return `${tsType(udt.slice(1))}[]`;
  if (enumNames.has(udt)) return `Database["public"]["Enums"]["${udt}"]`;
  if (["int2", "int4", "int8", "float4", "float8", "numeric"].includes(udt)) return "number";
  if (udt === "bool") return "boolean";
  if (["json", "jsonb"].includes(udt)) return "Json";
  if (udt === "void") return "undefined";
  return "string";
}

const cols = (
  await db.query(`select c.table_name, c.column_name, c.udt_name, c.is_nullable = 'YES' nullable,
      (c.column_default is not null or c.is_identity = 'YES') has_default
    from information_schema.columns c join information_schema.tables t
      on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.column_name`)
).rows;

const tables = {};
for (const c of cols) (tables[c.table_name] ??= []).push(c);

let out = `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
`;
for (const [name, columns] of Object.entries(tables)) {
  const t = (c) => `${tsType(c.udt_name)}${c.nullable ? " | null" : ""}`;
  out += `      ${name}: {\n        Row: {\n`;
  for (const c of columns) out += `          ${c.column_name}: ${t(c)}\n`;
  out += `        }\n        Insert: {\n`;
  for (const c of columns) out += `          ${c.column_name}${c.nullable || c.has_default ? "?" : ""}: ${t(c)}\n`;
  out += `        }\n        Update: {\n`;
  for (const c of columns) out += `          ${c.column_name}?: ${t(c)}\n`;
  out += `        }\n        Relationships: []\n      }\n`;
}
out += `    }
    Views: {
      [_ in never]: never
    }
    Functions: {
`;

const fns = (
  await db.query(`select p.proname, p.proretset, pg_get_function_identity_arguments(p.oid) args,
      p.proargnames, p.proargmodes, p.pronargdefaults,
      array(select format_type(unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])), null)) all_types,
      array(select t.typname from unnest(coalesce(p.proallargtypes, p.proargtypes::oid[])) with ordinality a(oid, i)
            join pg_type t on t.oid = a.oid order by a.i) all_udts,
      rt.typname rettype
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type rt on rt.oid = p.prorettype
    where n.nspname = 'public' and rt.typname <> 'trigger'
    order by p.proname`)
).rows;

for (const f of fns) {
  const names = f.proargnames ?? [];
  const modes = f.proargmodes ?? names.map(() => "i");
  const inputs = [];
  const outputs = [];
  names.forEach((n, i) => (modes[i] === "t" || modes[i] === "o" ? outputs : inputs).push({ n, udt: f.all_udts[i] }));
  const firstDefault = inputs.length - (f.pronargdefaults ?? 0);
  const args = inputs.length
    ? `{\n${inputs.map((a, i) => `          ${a.n}${i >= firstDefault ? "?" : ""}: ${tsType(a.udt)}`).join("\n")}\n        }`
    : "never";
  let ret;
  if (outputs.length) {
    ret = `{\n${outputs.map((o) => `          ${o.n}: ${tsType(o.udt)}`).join("\n")}\n        }[]`;
  } else {
    ret = tsType(f.rettype) + (f.proretset ? "[]" : "");
  }
  out += `      ${f.proname}: {\n        Args: ${args}\n        Returns: ${ret}\n      }\n`;
}

out += `    }
    Enums: {
${enums.map((e) => `      ${e.typname}: ${e.labels.map((l) => `"${l}"`).join(" | ")}`).join("\n")}
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`;

const existing = readFileSync(join(ROOT, "src/integrations/supabase/types.ts"), "utf8");
const helpers = existing.slice(existing.indexOf("type DatabaseWithoutInternals"));
const constants = `export const Constants = {
  public: {
    Enums: {
${enums.map((e) => `      ${e.typname}: [${e.labels.map((l) => `"${l}"`).join(", ")}],`).join("\n")}
    },
  },
} as const
`;
writeFileSync(
  join(ROOT, "src/integrations/supabase/types.ts"),
  out + "\n" + helpers.slice(0, helpers.indexOf("export const Constants")) + constants
);
console.log(`Wrote types for ${Object.keys(tables).length} tables, ${fns.length} functions.`);
