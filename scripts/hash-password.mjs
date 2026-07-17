import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const contrasena = await rl.question("Escribí la contraseña que vas a usar para entrar: ");
rl.close();

if (!contrasena) {
  console.error("No ingresaste ninguna contraseña.");
  process.exit(1);
}

const hash = await bcrypt.hash(contrasena, 12);
// Los hashes de bcrypt están llenos de signos "$" (ej: $2b$12$...), y tanto
// el cargador de variables de entorno de Next.js como algunos paneles de
// hosting interpretan "$algo" como si fuera una variable a reemplazar,
// dejando el hash roto sin ningún aviso. Para evitar ese problema por
// completo, lo guardamos codificado en base64 (lib/auth.ts lo decodifica
// solo antes de compararlo).
const hashBase64 = Buffer.from(hash, "utf8").toString("base64");

console.log("\nListo. Pegá esta línea en tu .env.local (y como variable de entorno en Vercel):\n");
console.log(`AUTH_PASSWORD_HASH=${hashBase64}\n`);
