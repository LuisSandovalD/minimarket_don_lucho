import { describe, expect, it } from "vitest";
import { sanitizeAuditValue } from "./utils";
describe("sanitizeAuditValue",()=>{it("removes secrets recursively",()=>expect(sanitizeAuditValue({name:"Luis",password:"secret",nested:{apiKey:"x",safe:true}})).toEqual({name:"Luis",nested:{safe:true}}))});
