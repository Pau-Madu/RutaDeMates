// Pruebas de las reglas de Firestore. Ejecuta: npm run test:rules
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");

let env;
const PROJECT = "demo-ruta-de-mates";
before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 } });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const as = uid => env.authenticatedContext(uid, { email: uid + "@example.com" }).firestore();
const claim = (db, r) => db.doc("roles/" + r).set({ uid: dbUid(db), at: "x" });
const dbUid = db => db._uid;
function ctx(uid) { const db = as(uid); db._uid = uid; return db; }
async function setupRoles() {
  const pau = ctx("pau"), manyl = ctx("manyl1"), lamine = ctx("lamine1");
  await assertSucceeds(claim(pau, "profe"));
  await assertSucceeds(claim(manyl, "manyl"));
  await assertSucceeds(claim(lamine, "lamine"));
  return { pau, manyl, lamine, stranger: ctx("intruso") };
}

test("el profe tiene que entrar primero", async () => {
  const manyl = ctx("manyl1");
  await assertFails(claim(manyl, "manyl"));
  await assertSucceeds(claim(ctx("pau"), "profe"));
  await assertSucceeds(claim(manyl, "manyl"));
});

test("un perfil ya cogido no se puede robar y una cuenta no puede tener dos perfiles", async () => {
  const { manyl, stranger } = await setupRoles();
  await assertFails(stranger.doc("roles/manyl").set({ uid: "intruso", at: "x" }));
  await assertFails(claim(manyl, "lamine"));
  await assertFails(stranger.doc("roles/profe").set({ uid: "intruso", at: "x" }));
});

test("un desconocido no puede leer nada de la ruta", async () => {
  const { pau, stranger } = await setupRoles();
  await pau.doc("exam/current").set({ id: "e1", exercises: [] });
  await assertFails(stranger.doc("exam/current").get());
  await assertFails(stranger.collection("photos").get());
  await assertFails(env.unauthenticatedContext().firestore().doc("roles/profe").get());
});

test("solo el profe cambia el examen, las notas y las marcas", async () => {
  const { pau, manyl } = await setupRoles();
  await assertSucceeds(pau.doc("exam/current").set({ id: "e1" }));
  await assertFails(manyl.doc("exam/current").set({ id: "hack" }));
  await assertFails(manyl.doc("grades/e1__manyl").set({ rid: "e1", st: "manyl", final: 10, published: true }));
  await assertFails(manyl.doc("marks/e1__manyl__1__0").set({ rid: "e1", st: "manyl", marks: [] }));
  await assertSucceeds(pau.doc("marks/e1__manyl__1__0").set({ rid: "e1", st: "manyl", marks: [{ t: "tick", x: 1, y: 2 }] }));
  await assertFails(manyl.doc("files/f1").set({ chunks: 1 }));
});

test("cada alumno solo escribe lo suyo", async () => {
  const { manyl, lamine, pau } = await setupRoles();
  await assertSucceeds(manyl.doc("subs/e1__manyl").set({ rid: "e1", st: "manyl", ex: {} }));
  await assertFails(lamine.doc("subs/e1__manyl").set({ rid: "e1", st: "manyl", ex: {} }));
  await assertFails(lamine.doc("subs/e1__lamine").set({ rid: "e1", st: "manyl", ex: {} }));
  await assertSucceeds(manyl.doc("photos/e1__manyl__1__0").set({ rid: "e1", st: "manyl", n: 1, k: 0 }));
  await assertSucceeds(manyl.doc("photofull/e1__manyl__1__0").set({ rid: "e1", st: "manyl", data: "x" }));
  await assertFails(lamine.doc("photos/e1__manyl__1__0").delete());
  await assertSucceeds(manyl.doc("photos/e1__manyl__1__0").delete());
  await assertSucceeds(manyl.doc("avatars/manyl").set({ hair: "rizos" }));
  await assertFails(manyl.doc("avatars/lamine").set({ hair: "rizos" }));
  await assertFails(lamine.doc("rewards/manyl").set({ bonus: 999 }));
  await assertSucceeds(pau.doc("subs/e1__lamine").set({ rid: "e1", st: "lamine", ex: {} }));
});

test("la nota solo la ve su alumno y cuando el profe la ha enviado", async () => {
  const { pau, manyl, lamine } = await setupRoles();
  await pau.doc("grades/e1__manyl").set({ rid: "e1", st: "manyl", final: 7.5, published: false });
  await pau.doc("grades/e1__lamine").set({ rid: "e1", st: "lamine", final: 8, published: true });
  const q = (db, st) => db.collection("grades").where("rid", "==", "e1").where("st", "==", st).where("published", "==", true).get();
  await assertSucceeds(q(manyl, "manyl"));
  assert.strictEqual((await q(manyl, "manyl")).size, 0);
  await assertFails(manyl.doc("grades/e1__manyl").get());
  await assertFails(q(manyl, "lamine"));
  await assertSucceeds(q(lamine, "lamine"));
  assert.strictEqual((await q(lamine, "lamine")).size, 1);
  await pau.doc("grades/e1__manyl").update({ published: true });
  assert.strictEqual((await q(manyl, "manyl")).size, 1);
});

test("solo el profe ve los correos y puede desvincular", async () => {
  const { pau, manyl, lamine } = await setupRoles();
  await assertSucceeds(manyl.doc("rolesInfo/manyl").set({ uid: "manyl1", email: "m@example.com" }));
  await assertFails(lamine.doc("rolesInfo/manyl").get());
  await assertSucceeds(pau.collection("rolesInfo").get());
  await assertFails(manyl.doc("roles/lamine").delete());
  await assertSucceeds(pau.doc("roles/lamine").delete());
  await assertFails(pau.doc("roles/profe").delete());
});
