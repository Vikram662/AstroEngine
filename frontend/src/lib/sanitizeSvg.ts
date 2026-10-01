// Sanitises backend-generated SVG before it is injected into the DOM.
// Allow-list based: only known drawing elements and presentation attributes
// survive; scripts, foreignObject, event handlers and javascript: URLs do not.
// Browser-only (DOMParser); returns "" when run on the server.

const ALLOWED_TAGS = new Set([
  "svg", "g", "defs", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect",
  "text", "tspan", "title", "desc", "lineargradient", "radialgradient", "stop", "clippath", "mask", "use", "style",
]);

const ALLOWED_ATTRS = new Set([
  "id", "class", "style", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height",
  "d", "points", "transform", "viewbox", "preserveaspectratio", "xmlns", "fill", "fill-opacity", "fill-rule",
  "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
  "opacity", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline", "dx", "dy",
  "offset", "stop-color", "stop-opacity", "gradientunits", "gradienttransform", "clip-path", "mask",
  "href", "xlink:href", "version", "role", "aria-label", "letter-spacing", "alignment-baseline",
]);

export function sanitizeSvg(input: string | null | undefined): string {
  if (!input || typeof DOMParser === "undefined") return "";

  const doc = new DOMParser().parseFromString(input, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return "";

  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!ALLOWED_TAGS.has(child.localName.toLowerCase())) {
        child.remove();
        continue;
      }
      walk(child);
    }
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      const isRef = name === "href" || name === "xlink:href";
      const unsafeUrl = /^\s*(javascript|data|vbscript):/i.test(value) || (isRef && !value.startsWith("#"));
      const unsafeStyle = name === "style" && /(expression\(|javascript:|url\(\s*['"]?\s*(https?:|data:|\/\/))/i.test(value);
      if (!ALLOWED_ATTRS.has(name) || name.startsWith("on") || unsafeUrl || unsafeStyle) {
        el.removeAttribute(attr.name);
      }
    }
  };

  // <style> blocks may not pull remote resources or run expressions.
  root.querySelectorAll("style").forEach((st) => {
    if (/@import|expression\(|javascript:|url\(\s*['"]?\s*(https?:|data:|\/\/)/i.test(st.textContent || "")) st.remove();
  });
  walk(root);
  return new XMLSerializer().serializeToString(root);
}
