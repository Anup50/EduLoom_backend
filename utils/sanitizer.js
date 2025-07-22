const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Configure DOMPurify with safe HTML tags and attributes
const sanitizeConfig = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "u",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "div",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "img",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "rel",
    "class",
    "id",
    "style",
    "src",
    "alt",
    "title",
    "width",
    "height",
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "textarea",
    "select",
    "option",
    "button",
    "label",
    "fieldset",
    "legend",
  ],
  FORBID_ATTR: [
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "onreset",
    "onselect",
    "onunload",
    "onresize",
    "onabort",
    "onbeforeunload",
    "onerror",
    "onhashchange",
    "onmessage",
    "onoffline",
    "ononline",
    "onpagehide",
    "onpageshow",
    "onpopstate",
    "onstorage",
    "oncontextmenu",
    "oninput",
    "oninvalid",
    "onsearch",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onmousedown",
    "onmousemove",
    "onmouseup",
    "onwheel",
    "oncopy",
    "oncut",
    "onpaste",
    "onbeforecopy",
    "onbeforecut",
    "onbeforepaste",
    "onselectstart",
    "onstart",
    "onfinish",
    "onbounce",
    "onfinish",
    "onstart",
    "onreverse",
    "onbeforeprint",
    "onafterprint",
    "onbeforeinstallprompt",
    "onappinstalled",
    "onbeforeinstallprompt",
    "onappinstalled",
    "onbeforeunload",
    "onhashchange",
    "onlanguagechange",
    "onmessage",
    "onmessageerror",
    "onoffline",
    "ononline",
    "onpagehide",
    "onpageshow",
    "onpopstate",
    "onrejectionhandled",
    "onstorage",
    "onunhandledrejection",
    "onunload",
    "onvisibilitychange",
  ],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} htmlContent - The HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
const sanitizeHTML = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== "string") {
    return "";
  }

  try {
    // First, decode HTML entities to handle double-encoded content
    const decodedContent = htmlContent
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean the HTML using DOMPurify
    const sanitized = DOMPurify.sanitize(decodedContent, sanitizeConfig);

    // Additional safety check - remove any remaining dangerous content
    const scriptPattern = /<script[^>]*>.*?<\/script>/gi;
    const iframePattern = /<iframe[^>]*>.*?<\/iframe>/gi;
    const objectPattern = /<object[^>]*>.*?<\/object>/gi;
    const embedPattern = /<embed[^>]*>/gi;
    const stylePattern = /<style[^>]*>.*?<\/style>/gi;
    const videoPattern = /<video[^>]*>.*?<\/video>/gi;
    const audioPattern = /<audio[^>]*>.*?<\/audio>/gi;
    const canvasPattern = /<canvas[^>]*>.*?<\/canvas>/gi;
    const svgPattern = /<svg[^>]*>.*?<\/svg>/gi;

    let finalContent = sanitized
      .replace(scriptPattern, "")
      .replace(iframePattern, "")
      .replace(objectPattern, "")
      .replace(embedPattern, "")
      .replace(stylePattern, "")
      .replace(videoPattern, "")
      .replace(audioPattern, "")
      .replace(canvasPattern, "")
      .replace(svgPattern, "");

    // Remove any event handlers that might have slipped through
    const eventHandlerPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
    finalContent = finalContent.replace(eventHandlerPattern, "");

    // Remove javascript: URLs
    const javascriptUrlPattern = /javascript:[^"'\s]*/gi;
    finalContent = finalContent.replace(javascriptUrlPattern, "");

    // Remove data: URLs (potential for XSS)
    const dataUrlPattern = /data:[^"'\s]*/gi;
    finalContent = finalContent.replace(dataUrlPattern, "");

    // Trim whitespace and ensure it's not empty
    finalContent = finalContent.trim();

    return finalContent;
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    // Return empty string if sanitization fails
    return "";
  }
};

/**
 * Validate if content contains only safe HTML
 * @param {string} htmlContent - The HTML content to validate
 * @returns {boolean} - True if content is safe
 */
const isSafeHTML = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== "string") {
    return false;
  }

  try {
    const sanitized = DOMPurify.sanitize(htmlContent, sanitizeConfig);
    // If sanitized content is significantly different, it might contain unsafe content
    return sanitized.length > 0 && sanitized.length >= htmlContent.length * 0.8;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sanitizeHTML,
  isSafeHTML,
  sanitizeConfig,
};
