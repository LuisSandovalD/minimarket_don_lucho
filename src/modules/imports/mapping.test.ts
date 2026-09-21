import { describe, expect, it } from "vitest";
import { normalizeHeader, parseDecimal, suggestMapping } from "./mapping";
describe("import mapping",()=>{
  it("recognizes common Spanish headers",()=>expect(suggestMapping(["Código","Producto","PVP","Cantidad"])).toEqual({Código:"sku",Producto:"name",PVP:"salePrice",Cantidad:"stock"}));
  it("normalizes accents and spacing",()=>expect(normalizeHeader("  Descripción_Producto ")).toBe("descripcion producto"));
  it.each([["3.50","3.50"],["3,50","3.50"],["S/ 3.50","3.50"],["abc",null]])("parses %s",(input,expected)=>expect(parseDecimal(input)).toBe(expected));
});
