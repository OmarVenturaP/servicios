export function normalizeCategoryIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

export function validateCategorySelection(categoryIds, categories) {
  const ids = normalizeCategoryIds(categoryIds);
  if (!ids.length) return { valid: false, error: "Selecciona al menos una categoría." };
  const selected = ids.map((id) => categories.find((category) => category.id === id)).filter(Boolean);
  if (selected.length !== ids.length || selected.some((category) => !category.active)) {
    return { valid: false, error: "Una de las categorías no existe o está inactiva." };
  }
  const modes = new Set(selected.map((category) => Boolean(category.requiresUnits)));
  if (modes.size > 1) {
    return { valid: false, error: "No puedes combinar categorías con unidades y categorías de atención general." };
  }
  return { valid: true, ids, selected, requiresUnits: Boolean(selected[0].requiresUnits) };
}

// Presentation defaults provide order and search synonyms, never publication state.
export function buildPublicCategories(records, presentation) {
  const bySlug = new Map(records.map((category) => [category.slug, category]));
  const known = new Set(presentation.map((category) => category.key));
  function resolve(defaults, record) {
    const name = record?.name ?? defaults.name;
    const key = record?.slug ?? defaults.key;
    return {
      key, name, icon: record?.icon || defaults.icon || "ellipsis",
      keywords: [...new Set([...(defaults.keywords ?? []), name, key].map((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX")))],
      active: record?.active === true || record?.active === 1,
    };
  }
  return [
    ...presentation.filter((category) => category.key !== "mas-servicios").map((category) => resolve(category, bySlug.get(category.key))),
    ...records.filter((category) => !known.has(category.slug)).map((category) => resolve({}, category)),
    ...presentation.filter((category) => category.key === "mas-servicios").map((category) => resolve(category)),
  ];
}

export function selectedActiveCategory(categories, selectedKey) {
  return categories.find((category) => category.key === selectedKey && category.active)
    ?? categories.find((category) => category.active)
    ?? null;
}

export function retainedCategoryIds(selectedIds, inactiveIds) {
  return normalizeCategoryIds([...selectedIds, ...inactiveIds]);
}
