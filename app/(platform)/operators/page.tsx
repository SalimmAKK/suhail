import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getOperatorsOverview } from "@/lib/operators";

/* CLAUDE.md section 4: "/operators Admin route. Seeded operators + bookings
 * received. Not linked from public nav." Section 2.4/17 restates the second
 * half as a hard rule and explains it: the route stays out of TopBar and
 * MobileNav because it is a decision about access to booking data, not a
 * style preference. The route itself is still meant to exist and work,
 * which is what this page is — reachable by URL, absent from every nav.
 *
 * robots.ts disallows it from crawlers for the same reason a search result
 * pointing here would be wrong, not because the page is secret.
 */

export const metadata: Metadata = {
  title: "Operators / Suhail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function Operators() {
  const { operators, totalBookings, error } = await getOperatorsOverview();

  return (
    <Shell className="pb-24 pt-[var(--section-top)]">
      <Eyebrow className="mb-4">Admin &middot; not in public navigation</Eyebrow>
      <h1 className="text-h2">Operators &amp; bookings received.</h1>
      <p className="mt-4 max-w-[62ch] text-neutral-700">
        Every operator seeded into the catalogue, what they have listed, and every booking placed
        against it. Contact name and party size only — a guest&rsquo;s email and phone are not
        republished here.
      </p>

      {error ? (
        <p className="mt-10 max-w-[52ch] border-2 border-divider bg-surface p-5 text-neutral-700">
          {error}
        </p>
      ) : (
        <>
          <p className="mt-8 font-display text-label uppercase tracking-label text-accent-700">
            <strong className="text-text">{operators.length}</strong> operators &middot;{" "}
            <strong className="text-text">{totalBookings}</strong> bookings total
          </p>

          <div className="mt-8 flex flex-col gap-8">
            {operators.map((op) => (
              <section key={op.slug} className="border-2 border-divider bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl">{op.name}</h2>
                    <p className="mt-1 font-display text-label uppercase tracking-label text-neutral-600">
                      {op.experiences.length} {op.experiences.length === 1 ? "listing" : "listings"}
                      {!op.approved ? " · not approved" : ""}
                    </p>
                  </div>
                  {op.fictional ? (
                    <span className="shrink-0 font-display text-label uppercase tracking-label text-accent-2-700">
                      Demo inventory, not a sourced operator
                    </span>
                  ) : null}
                </div>

                {op.summary ? <p className="mt-3 text-neutral-700">{op.summary}</p> : null}
                <p className="mt-1 font-display text-label uppercase tracking-label text-neutral-600">
                  {op.contactEmail ?? "No public contact listed"}
                </p>

                {op.experiences.length === 0 ? (
                  <p className="mt-5 text-neutral-700">Nothing listed.</p>
                ) : (
                  <div className="mt-5 flex flex-col gap-5">
                    {op.experiences.map((exp) => (
                      <div key={exp.id} className="border-t border-divider pt-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <h3 className="font-display text-label font-bold uppercase tracking-label text-text">
                            {exp.title}
                            {!exp.active ? (
                              <span className="ml-2 text-neutral-500">(inactive)</span>
                            ) : null}
                          </h3>
                          <span className="font-display text-label uppercase tracking-label text-neutral-600">
                            {exp.priceSar !== null ? `SAR ${exp.priceSar}` : "no price set"}
                          </span>
                        </div>

                        {exp.bookings.length === 0 ? (
                          <p className="mt-2 text-[13px] text-neutral-600">No bookings yet.</p>
                        ) : (
                          <table className="mt-3 w-full border-collapse text-[13px]">
                            <thead>
                              <tr className="border-b-2 border-divider text-left">
                                <th className="py-1.5 pr-4 font-display text-[10px] font-bold uppercase tracking-label text-neutral-600">
                                  Reference
                                </th>
                                <th className="py-1.5 pr-4 font-display text-[10px] font-bold uppercase tracking-label text-neutral-600">
                                  Night
                                </th>
                                <th className="py-1.5 pr-4 font-display text-[10px] font-bold uppercase tracking-label text-neutral-600">
                                  Guest
                                </th>
                                <th className="py-1.5 pr-4 font-display text-[10px] font-bold uppercase tracking-label text-neutral-600">
                                  Party
                                </th>
                                <th className="py-1.5 font-display text-[10px] font-bold uppercase tracking-label text-neutral-600">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {exp.bookings.map((b) => (
                                <tr key={b.reference} className="border-b border-divider">
                                  <td className="py-1.5 pr-4 font-display font-bold tracking-[0.02em] text-text">
                                    {b.reference}
                                  </td>
                                  <td className="py-1.5 pr-4 text-neutral-700">
                                    {DATE.format(new Date(`${b.date}T00:00:00`))}
                                  </td>
                                  <td className="py-1.5 pr-4 text-neutral-700">{b.contactName}</td>
                                  <td className="py-1.5 pr-4 text-neutral-700">{b.guestCount}</td>
                                  <td className="py-1.5 uppercase text-accent-700">{b.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
