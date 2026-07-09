import { generateText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { beneficiary, hint, existing } = (await req.json()) as {
      beneficiary?: string
      hint?: string
      existing?: string
    }

    if (!beneficiary && !hint && !existing) {
      return Response.json({ error: "Nothing to work with." }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system:
        "You write the 'Short description' line for a corporate treasury payment email at Najm (a Saudi insurance company). " +
        "Given the beneficiary/vendor and any hint, produce a concise, professional description of what the payment is for. " +
        "Rules: 5 to 12 words, Title Case, no trailing period, no quotes, no invoice numbers unless given, plain business English. " +
        "Examples: 'Direct Internet Access', 'Relocation Allowance', 'Monthly Creative Services On Social Media', 'IT Maintenance And Services'. " +
        "Return ONLY the description text.",
      prompt:
        `Beneficiary: ${beneficiary || "(unknown)"}\n` +
        `Current draft / hint: ${existing || hint || "(none)"}\n\n` +
        `Write the best short description.`,
    })

    return Response.json({ description: text.trim().replace(/^["']|["']$/g, "") })
  } catch (err) {
    console.log("[v0] suggest-description error:", (err as Error).message)
    return Response.json({ error: "Could not generate a suggestion right now." }, { status: 500 })
  }
}
