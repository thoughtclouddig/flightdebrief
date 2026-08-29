import { describe, expect, it } from "vitest";
import { toSecondPerson } from "./narration";

describe("toSecondPerson", () => {
  it("fixes the sentence that prompted this: a narrator speaking as the student", () => {
    expect(
      toSecondPerson("Nina had me work on getting configured earlier on downwind, so I'm not rushed on base"),
    ).toBe("Nina had you work on getting configured earlier on downwind, so you're not rushed on base");
  });

  it("handles the contractions before the bare pronoun, so 'I'm' doesn't become 'you'm'", () => {
    expect(toSecondPerson("I'm high on final")).toBe("You're high on final");
    expect(toSecondPerson("I've been flaring late")).toBe("You've been flaring late");
    expect(toSecondPerson("I'll try it again")).toBe("You'll try it again");
  });

  it("converts possessives", () => {
    expect(toSecondPerson("My airspeed control needs work")).toBe("Your airspeed control needs work");
    expect(toSecondPerson("That landing was mine")).toBe("That landing was yours");
  });

  it("keeps verb agreement after the swap", () => {
    expect(toSecondPerson("I was behind the airplane")).toBe("You were behind the airplane");
  });

  it("leaves second-person text alone, so guidance written properly is untouched", () => {
    const already = "Configure earlier on downwind so you're not rushed on base";
    expect(toSecondPerson(already)).toBe(already);
  });

  it("keeps the opening case, so a fragment dropped mid-sentence isn't capitalised", () => {
    expect(toSecondPerson("my flare timing")).toBe("your flare timing");
    expect(toSecondPerson("My flare timing")).toBe("Your flare timing");
    // Text with no pronouns at all comes back exactly as given.
    expect(toSecondPerson("held the centerline")).toBe("held the centerline");
  });

  it("doesn't touch an I inside a word", () => {
    expect(toSecondPerson("ILS approach into KMRY")).toBe("ILS approach into KMRY");
  });
});
