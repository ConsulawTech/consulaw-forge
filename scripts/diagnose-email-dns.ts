#!/usr/bin/env tsx
/**
 * Email deliverability DNS diagnostic tool
 * Run with: npx tsx scripts/diagnose-email-dns.ts
 */

const DOMAIN = "consulawtech.com";
const RESEND_DKIM_SELECTOR = "resend";

async function queryDNS(type: string, name: string): Promise<string[]> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { Accept: "application/dns-json" },
    });
    const data = await res.json();
    if (!data.Answer) return [];
    return data.Answer.map((a: any) => a.data.replace(/"/g, ""));
  } catch {
    return [];
  }
}

function checkSPF(records: string[]): string[] {
  const issues: string[] = [];
  const spf = records.find((r) => r.includes("v=spf1"));
  if (!spf) {
    issues.push("❌ NO SPF record found. This is critical for deliverability.");
    return issues;
  }
  issues.push(`✅ SPF found: ${spf}`);

  if (!spf.includes("_spf.resend.com") && !spf.includes("include:spf.resend.com")) {
    issues.push("⚠️  SPF does not include Resend. Add 'include:_spf.resend.com' or similar.");
  }
  if (!spf.includes("~all") && !spf.includes("-all")) {
    issues.push("⚠️  SPF missing strict 'all' mechanism. End with '~all' or '-all'.");
  }
  if (spf.split("v=spf1").length > 2) {
    issues.push("❌ Multiple SPF records detected. Only one SPF record is allowed per domain.");
  }
  return issues;
}

function checkDMARC(records: string[]): string[] {
  const issues: string[] = [];
  const dmarc = records.find((r) => r.includes("v=DMARC1"));
  if (!dmarc) {
    issues.push("❌ NO DMARC record found. Gmail/Yahoo now require DMARC for bulk senders.");
    issues.push("   Add: _dmarc.consulawtech.com TXT \"v=DMARC1; p=quarantine; rua=mailto:dmarc@consulawtech.com\"");
    return issues;
  }
  issues.push(`✅ DMARC found: ${dmarc}`);
  if (dmarc.includes("p=none")) {
    issues.push("⚠️  DMARC policy is 'none' (monitoring only). Consider upgrading to 'quarantine' once verified.");
  }
  if (!dmarc.includes("rua=")) {
    issues.push("⚠️  DMARC missing rua (reporting) address. Add rua=mailto:dmarc@consulawtech.com");
  }
  return issues;
}

function checkDKIM(records: string[]): string[] {
  const issues: string[] = [];
  if (records.length === 0) {
    issues.push(`❌ NO DKIM record found for selector '${RESEND_DKIM_SELECTOR}._domainkey.consulawtech.com'.`);
    issues.push("   Verify your domain in Resend dashboard and add the provided DKIM CNAME/TEXT record.");
    return issues;
  }
  issues.push(`✅ DKIM found (${records.length} record${records.length > 1 ? "s" : ""})`);
  return issues;
}

function checkMX(records: string[]): string[] {
  const issues: string[] = [];
  if (records.length === 0) {
    issues.push("⚠️  NO MX record found for consulawtech.com.");
    issues.push("   You need an MX record to receive replies/bounces. If you only send via Resend, you can use a catch-all.");
    return issues;
  }
  issues.push(`✅ MX found: ${records.join(", ")}`);
  return issues;
}

async function main() {
  console.log(`\n📧 Email Deliverability DNS Diagnostic for ${DOMAIN}\n`);
  console.log("=" .repeat(60));

  // SPF
  console.log("\n🛡️  SPF (Sender Policy Framework)");
  const txtRecords = await queryDNS("TXT", DOMAIN);
  const spfIssues = checkSPF(txtRecords);
  spfIssues.forEach((i) => console.log(i));

  // DMARC
  console.log("\n🔒 DMARC");
  const dmarcRecords = await queryDNS("TXT", `_dmarc.${DOMAIN}`);
  const dmarcIssues = checkDMARC(dmarcRecords);
  dmarcIssues.forEach((i) => console.log(i));

  // DKIM
  console.log("\n🔑 DKIM (DomainKeys Identified Mail)");
  const dkimRecords = await queryDNS("TXT", `${RESEND_DKIM_SELECTOR}._domainkey.${DOMAIN}`);
  const dkimIssues = checkDKIM(dkimRecords);
  dkimIssues.forEach((i) => console.log(i));

  // MX
  console.log("\n📬 MX (Mail Exchange)");
  const mxRecords = await queryDNS("MX", DOMAIN);
  const mxIssues = checkMX(mxRecords);
  mxIssues.forEach((i) => console.log(i));

  // Recommendations
  console.log("\n" + "=".repeat(60));
  console.log("\n💡 Recommended DNS Configuration:\n");
  console.log(`1. SPF (TXT record on ${DOMAIN}):`);
  console.log(`   "v=spf1 include:_spf.resend.com ~all"`);
  console.log(`\n2. DKIM (add the CNAME from Resend dashboard, usually):`);
  console.log(`   ${RESEND_DKIM_SELECTOR}._domainkey.${DOMAIN} → [resend-provided-domain]`);
  console.log(`\n3. DMARC (TXT record on _dmarc.${DOMAIN}):`);
  console.log(`   "v=DMARC1; p=quarantine; rua=mailto:dmarc@${DOMAIN}; pct=100"`);
  console.log(`\n4. MX (if you want to receive email on ${DOMAIN}):`);
  console.log(`   10 inbound-smtp.us-east-1.amazonaws.com  (or your mail provider)`);
  console.log(`\n5. Custom MAIL FROM (optional but helps reputation):`);
  console.log(`   Configure in Resend dashboard and add the SPF record they specify.`);

  console.log("\n" + "=".repeat(60));
  console.log("\n🔧 Code-level recommendations (applied in lib/email.ts):");
  console.log("   - Use a friendly 'From' name instead of 'no-reply'");
  console.log("   - Add List-Unsubscribe and Reply-To headers");
  console.log("   - Add explicit Date header");
  console.log("   - Add Precedence header");
  console.log("   - Include both HTML and plain-text versions");
  console.log("   - Use a consistent sending domain that matches your FROM domain\n");
}

main();
