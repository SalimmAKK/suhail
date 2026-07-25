/* Copy for the dedicated night picker page.

   Deliberately not the landing page's wording. CLAUDE.md rule 2.1/5: no
   content block repeated verbatim across pages. The landing introduces the
   idea to someone who has just arrived; this page is for someone who came
   here to choose a date. */

export type PageIntro = {
  eyebrow: string;
  headingLines: string[];
  sub: string;
};

export const TONIGHT: PageIntro = {
  eyebrow: "The next sixty nights",
  headingLines: ["What is the sky", "doing on your dates?"],
  sub: "Moon phase decides how much you will see, and it changes more over a fortnight than most travellers expect. Pick the night you are in AlUla and see what is overhead, which site suits it, and what is running.",
};
