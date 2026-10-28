// Dev adapter: prints emails to the server log. Swap for a real provider (for example Resend) in production.
export async function sendEmail(msg: { to: string; subject: string; text: string }): Promise<void> {
  console.log(`\n----- EMAIL to ${msg.to} -----\n${msg.subject}\n\n${msg.text}\n------------------------------\n`)
}
