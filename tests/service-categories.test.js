import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicCategories, normalizeCategoryIds, retainedCategoryIds, selectedActiveCategory, validateCategorySelection } from "../src/domain/service-categories.js";

const categories = [
  { id: 1, active: true, requiresUnits: true },
  { id: 2, active: true, requiresUnits: false },
  { id: 3, active: true, requiresUnits: false },
  { id: 4, active: false, requiresUnits: false },
];

test("normaliza categorías sin duplicados", () => {
  assert.deepEqual(normalizeCategoryIds(["2", 3, 2, 0, "x"]), [2, 3]);
});

test("permite varias categorías compatibles", () => {
  const result = validateCategorySelection([2, 3], categories);
  assert.equal(result.valid, true);
  assert.equal(result.requiresUnits, false);
});

test("rechaza selecciones vacías, inactivas o de modos incompatibles", () => {
  assert.equal(validateCategorySelection([], categories).valid, false);
  assert.equal(validateCategorySelection([4], categories).valid, false);
  assert.equal(validateCategorySelection([1, 2], categories).valid, false);
});


const presentation = [
  { key: "mandados", name: "Mandados", icon: "bike", active: true, keywords: ["mandado"] },
  { key: "aire-acondicionado", name: "A/C", icon: "snowflake", active: true },
  { key: "cctv", name: "CCTV", icon: "cctv", active: true },
  { key: "mas-servicios", name: "Más", icon: "ellipsis" },
];

test("el catálogo de MySQL prevalece sobre estados locales y conserva el orden A/C, CCTV", () => {
  const result = buildPublicCategories([
    { slug: "mandados", name: "Mandados", active: false },
    { slug: "cctv", name: "CCTV", active: 1, icon: "cctv" },
    { slug: "aire-acondicionado", name: "Climas", active: 0 },
    { slug: "jardineria", name: "Jardinería", active: true },
  ], presentation);
  assert.deepEqual(result.map(({ key, active }) => [key, active]), [["mandados", false], ["aire-acondicionado", false], ["cctv", true], ["jardineria", true], ["mas-servicios", false]]);
  assert.equal(result[1].name, "Climas");
  assert.equal(result[3].icon, "ellipsis");
  assert.ok(result[3].keywords.includes("jardineria"));
});

test("las categorías ausentes permanecen próximas y una activación se refleja al recargar", () => {
  assert.equal(buildPublicCategories([], presentation).some((category) => category.active), false);
  const disabled = buildPublicCategories([{ slug: "cctv", name: "CCTV", active: false }], presentation);
  const enabled = buildPublicCategories([{ slug: "cctv", name: "CCTV", active: true }], presentation);
  assert.equal(selectedActiveCategory(disabled, "mandados"), null);
  assert.equal(selectedActiveCategory(enabled, "mandados").key, "cctv");
  assert.equal(selectedActiveCategory(enabled, "cctv").key, "cctv");
});

test("editar opciones activas conserva las relaciones inactivas existentes sin duplicarlas", () => {
  assert.deepEqual(retainedCategoryIds([2, 3], [4]), [2, 3, 4]);
  assert.deepEqual(retainedCategoryIds([], [4]), [4]);
  assert.deepEqual(retainedCategoryIds([2], [2, 4]), [2, 4]);
});
