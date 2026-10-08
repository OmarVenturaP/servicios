import test from "node:test";
import assert from "node:assert/strict";
import { adIndexForSlot, adSlotForIndex, canonicalAdSlot } from "../src/domain/advertisement-carousel.js";

test("el carrusel circular cruza ambos extremos y recoloca sin cambiar el anuncio", () => {
  for (const count of [2, 3, 8]) {
    for (const requested of [-1, count]) {
      const slot = adSlotForIndex(requested, count);
      const expected = requested < 0 ? count - 1 : 0;
      assert.equal(adIndexForSlot(slot, count), expected);
      const canonical = canonicalAdSlot(slot, count);
      assert.ok(canonical >= 1 && canonical <= count);
      assert.equal(adIndexForSlot(canonical, count), expected);
    }
    for (let index = 0; index < count; index++) {
      const slot = adSlotForIndex(index, count);
      assert.equal(adIndexForSlot(slot, count), index);
      assert.equal(canonicalAdSlot(slot, count), slot);
    }
  }
});

test("sin anuncios o con uno no se crean posiciones de copias", () => {
  for (const count of [0, 1]) {
    assert.equal(adSlotForIndex(-1, count), 0);
    assert.equal(adSlotForIndex(1, count), 0);
    assert.equal(adIndexForSlot(0, count), 0);
    assert.equal(canonicalAdSlot(0, count), 0);
  }
});
