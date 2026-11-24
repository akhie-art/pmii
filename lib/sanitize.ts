import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes rich HTML content (articles, official letters, templates)
 * to prevent Cross-Site Scripting (XSS) while preserving safe document styling.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== "string") return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "a", "abbr", "b", "blockquote", "br", "caption", "center", "code", "col",
      "colgroup", "dd", "del", "div", "dl", "dt", "em", "figcaption", "figure",
      "font", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins",
      "li", "mark", "ol", "p", "pre", "q", "s", "small", "span", "strong",
      "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
    ],
    ALLOWED_ATTR: [
      "align", "alt", "border", "cellpadding", "cellspacing", "class", "color",
      "colspan", "dir", "face", "height", "href", "id", "rel", "rowspan",
      "size", "src", "style", "target", "title", "valign", "width",
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Escapes plain text for safe interpolation into HTML templates.
 */
export function escapeHtml(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
