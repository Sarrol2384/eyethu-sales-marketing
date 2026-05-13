/**
 * SA phone number helpers.
 *
 *   normalizeSAPhone("082 555 0123")      -> "+27825550123"
 *   normalizeSAPhone("+27 82 555 0123")   -> "+27825550123"
 *   normalizeSAPhone("0825550123")        -> "+27825550123"
 *   normalizeSAPhone("garbage")           -> null
 *
 *   formatSAPhoneDisplay("+27825550123")  -> "+27 82 555 0123"
 *   whatsappUrl("+27825550123", "Hi")     -> "https://wa.me/27825550123?text=Hi"
 */

const SA_LOCAL = /^0\d{9}$/;
const SA_INTL = /^(?:\+27|0027)?\d{9}$/;

export function normalizeSAPhone(input: string): string | null {
  if (!input) return null;
  // Strip everything except digits and a leading '+'
  const stripped = input.replace(/[\s\-()._]/g, "");
  if (SA_LOCAL.test(stripped)) {
    return `+27${stripped.slice(1)}`;
  }
  const intlMatch = stripped.match(/^(?:\+27|0027)?(\d{9})$/);
  if (intlMatch) {
    return `+27${intlMatch[1]}`;
  }
  return null;
}

export function isSAPhone(input: string): boolean {
  return normalizeSAPhone(input) !== null;
}

export function formatSAPhoneDisplay(input: string): string {
  const e164 = normalizeSAPhone(input);
  if (!e164) return input;
  const digits = e164.slice(3); // drop +27
  return `+27 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

/** wa.me link — strips the leading "+" because WhatsApp expects no plus. */
export function whatsappUrl(phone: string, message?: string): string {
  const e164 = normalizeSAPhone(phone) ?? phone;
  const num = e164.startsWith("+") ? e164.slice(1) : e164;
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** tel: link */
export function telUrl(phone: string): string {
  const e164 = normalizeSAPhone(phone) ?? phone;
  return `tel:${e164}`;
}
