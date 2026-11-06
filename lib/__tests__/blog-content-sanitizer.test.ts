import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeAndFormatBlogContent } from "../blog-content-formatter";

test("Blog Content Sanitizer — Mitigação de Stored e DOM XSS", () => {
  // Teste 1: Remoção de tags de script ativas
  const xssScript = '<p>Artigo de tecnologia</p><script>alert("xss")</script>';
  const sanitized1 = sanitizeAndFormatBlogContent(xssScript);
  assert.equal(sanitized1.includes("<script>"), false);
  assert.equal(sanitized1.includes('alert("xss")'), false);

  // Teste 2: Remoção de event handlers on* (com e sem aspas, com espaços)
  const xssEvent = '<img src="https://example.com/logo.png" onload=alert(document.cookie) onerror = "alert(1)">';
  const sanitized2 = sanitizeAndFormatBlogContent(xssEvent);
  assert.equal(sanitized2.includes("onload"), false);
  assert.equal(sanitized2.includes("onerror"), false);
  assert.equal(sanitized2.includes("alert("), false);

  // Teste 3: Neutralização de pseudoprotocolos javascript:
  const xssLink = '<a href="javascript:alert(1)">Clique aqui</a>';
  const sanitized3 = sanitizeAndFormatBlogContent(xssLink);
  assert.equal(sanitized3.includes("javascript:"), false);
  assert.equal(sanitized3.includes('href="#"'), true);

  // Teste 4: Remoção de iframes e objetos embutidos
  const xssIframe = '<iframe src="https://malicious.example.com"></iframe>';
  const sanitized4 = sanitizeAndFormatBlogContent(xssIframe);
  assert.equal(sanitized4.includes("<iframe"), false);
});
