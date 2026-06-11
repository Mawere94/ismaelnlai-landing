# GEO Audit Report: ismaelnlai.com

**Audit Date:** 2026-06-10
**URL:** https://ismaelnlai.com/
**Business Type:** Agency / Local Services (Automatización N8N para asesorías y pymes, Algeciras, España)
**Pages Analyzed:** 6

---

## Executive Summary

**Overall GEO Score: 42/100 (Poor)**

ismaelnlai.com tiene una infraestructura técnica genuinamente sólida — robots.txt con AI crawlers explícitos, llms.txt presente, sitemap completo, y JSON-LD aplicado en código — pero opera como un brochure de una sola empresa en un entorno donde los motores de IA necesitan corroboración externa para citar una fuente con confianza. El problema central es el aislamiento de entidad: "ismaelnlai" e "Ismael Núñez López" no existen fuera del propio dominio. Sin sameAs, sin presencia en LinkedIn, YouTube, Reddit ni Wikipedia, los modelos de IA no pueden vincular el sitio a ninguna entidad conocida. Los gaps técnicos son solucionables en horas; los de autoridad de marca requieren semanas de construcción deliberada.

La mejora más urgente no es de código — es crear una LinkedIn company page, un Google Business Profile, y publicar el primer artículo con datos reales del caso IVA. Esas tres acciones pasarían el score estimado de 42 a ~60 en 30 días.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 42/100 | 25% | 10.5 |
| Brand Authority | 18/100 | 20% | 3.6 |
| Content E-E-A-T | 41/100 | 20% | 8.2 |
| Technical GEO | 72/100 | 15% | 10.8 |
| Schema & Structured Data | 42/100 | 10% | 4.2 |
| Platform Optimization | 42/100 | 10% | 4.2 |
| **Overall GEO Score** | | | **41.5 → 42/100** |

---

## Critical Issues (Fix Immediately)

### CRIT-1 — sameAs completamente ausente en Organization y Person schema
**Pages:** `/` (homepage), `/sobre-mi.html`
**Impact:** AI citability, entity recognition — todos los modelos

El JSON-LD de Organization y Person está aplicado en código pero el campo `sameAs` es un array vacío o inexistente. Sin `sameAs`, los motores de IA no pueden vincular el sitio a ninguna entidad en plataformas conocidas. Cualquier mención de "Ismael Núñez López" en LinkedIn o GitHub queda desconectada de este dominio en los knowledge graphs de IA.

**Fix:** Añadir a `Organization.sameAs` y a ambos nodos `Person` (homepage + sobre-mi.html):
```json
"sameAs": [
  "https://www.linkedin.com/in/[tu-perfil]",
  "https://github.com/[tu-usuario]"
]
```

---

### CRIT-2 — Cero presencia externa de entidad
**Impact:** Brand Authority (18/100) — el gap más grande del sitio

No existe ningún rastro del dominio o del autor en ninguna fuente externa verificable:
- Wikipedia / Wikidata: Ausente
- Reddit (r/espana, r/autonomos, r/contabilidad): Ausente
- YouTube: Sin canal ni videos
- LinkedIn company page: No verificada (probable ausente)
- Google Business Profile: No verificado
- Plataformas de reviews (Clutch, Trustpilot, Google): Ausente
- Prensa española o publicaciones del sector: Ausente

Un modelo de IA preguntado "¿quién hace automatización N8N para asesorías en España?" no tiene datos de entrenamiento que recuperen ismaelnlai.com — la entidad no existe fuera del propio dominio.

**Fix:** Ver acciones de Semana 2-4 en el plan de 30 días.

---

## High Priority Issues

### HIGH-1 — OAI-SearchBot no listado explícitamente en robots.txt
**Pages:** `/robots.txt`
**Impact:** ChatGPT Web Search

GPTBot y ChatGPT-User están en robots.txt pero `OAI-SearchBot` (el bot específico que alimenta la búsqueda en tiempo real de ChatGPT) no aparece como entrada explícita. Hereda el `Allow: *` genérico pero la entrada explícita es una mejor práctica reconocida.

**Fix (2 minutos):**
```
User-agent: OAI-SearchBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /
```

---

### HIGH-2 — llms.txt estructura incorrecta
**Pages:** `/llms.txt`
**Score actual: 50/100**

El archivo existe (valioso — pocas SMEs españolas lo tienen) pero describe el negocio en prosa en lugar de indexar las páginas del sitio con links markdown. El propósito del llms.txt es decirle a los crawlers de IA *qué leer y en qué orden*, no *qué hace la empresa*.

**Fix:** Reemplazar el contenido actual con estructura de links:
```markdown
# ismaelnlai

> Automatización de procesos para pymes y asesorías españolas con N8N.
> Specialist: Ismael Núñez López, Algeciras, España.

## Core Pages

- [Inicio](https://ismaelnlai.com/): Servicio, precios, proceso y FAQ completa.
- [Sobre mí](https://ismaelnlai.com/sobre-mi.html): Perfil del especialista, stack técnico y 3 casos reales con métricas.
- [Calculadora](https://ismaelnlai.com/calculadora.html): Herramienta para calcular horas perdidas en gestión manual.

## Optional

- [Aviso legal](https://ismaelnlai.com/aviso-legal.html)
- [Privacidad](https://ismaelnlai.com/privacidad.html)
```

---

### HIGH-3 — Content E-E-A-T: casos anónimos y credenciales vagas
**Pages:** `/sobre-mi.html`
**Score E-E-A-T: 41/100**

Los 3 casos de uso tienen métricas reales pero son completamente anónimos — no pueden ser verificados por modelos de IA ni por Quality Raters. La frase "llevo años automatizando" es la credencial más débil posible para un servicio de €1,500-€5,000.

**Fixes concretos:**
1. Añadir atribución mínima a los casos: `— M.G., director, asesoría fiscal — Campo de Gibraltar`
2. Reemplazar "llevo años automatizando" por: `"Desde 2022 he implementado más de [N] automatizaciones para despachos profesionales y pymes en Andalucía."`
3. Si existe certificación N8N Certified Expert, añadirla al about.

---

### HIGH-4 — Meta description ausente en calculadora.html
**Pages:** `/calculadora.html`
**Impact:** Snippet control en SERP y AI, plataformas sociales

La calculadora es uno de los activos más diferenciados del sitio (herramienta gratuita, alta relevancia para el ICP exacto). Sin meta description, Google y los AI generan su propio snippet desde el contenido de la página.

**Fix:** Añadir al `<head>` de calculadora.html:
```html
<meta name="description" content="Calcula cuántas horas y euros pierde tu despacho o pyme en gestión manual. Herramienta gratuita — resultado en 30 segundos.">
```

---

### HIGH-5 — Security headers ausentes (Netlify)
**Impact:** Trust signals para compradores B2B, credibility técnica

Netlify no añade headers de seguridad por defecto. CSP, X-Frame-Options, X-Content-Type-Options y Referrer-Policy están probablemente ausentes.

**Fix:** Crear/actualizar `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```
CSP requiere más cuidado para no romper Google Fonts e inline scripts — construir incrementalmente.

---

## Medium Priority Issues

### MED-1 — LocalBusiness schema ausente
**Impact:** Google Maps, local pack, Gemini Knowledge Graph

El sitio usa `Organization` pero no `LocalBusiness`. Para un proveedor de servicios local con dirección física en Algeciras, `LocalBusiness` desbloquea señales de mapa que `Organization` no activa.

**Fix:** Añadir bloque JSON-LD separado en homepage — ver template completo en Appendix A.

---

### MED-2 — Open Graph y Twitter Card no verificados en sobre-mi.html
**Impact:** Previews en redes sociales, AI crawlers que usan OG

OG tags aplicados en homepage pero estado en `/sobre-mi.html` no confirmado. Esta es la página con más contenido de calidad del sitio.

**Fix:** Verificar y añadir si falta:
```html
<meta property="og:title" content="Sobre mí — Ismael Núñez López | ismaelnlai">
<meta property="og:description" content="Especialista en automatización N8N para asesorías y pymes. 3 casos reales con métricas, stack técnico y metodología.">
<meta property="og:url" content="https://ismaelnlai.com/sobre-mi.html">
<meta property="og:type" content="profile">
```

---

### MED-3 — Sin Bing Webmaster Tools / msvalidate.01
**Impact:** Bing Copilot index visibility

No detectado `msvalidate.01` meta tag. Sin verificación en Bing Webmaster Tools, el sitio no puede enviar el sitemap directamente ni activar IndexNow.

**Fix:** Crear cuenta en Bing Webmaster Tools → copiar clave → añadir al `<head>`:
```html
<meta name="msvalidate.01" content="[CLAVE]">
```

---

### MED-4 — speakable property ausente
**Impact:** AI assistants (Google Assistant, Alexa), voice search

`speakable` es un marcador explícito para extractores de IA. FAQ y párrafo problema/solución de homepage son candidatos ideales.

**Fix:** Añadir a WebPage schema:
```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": ["#faq", ".section-title", "h1"]
}
```

---

### MED-5 — datePublished / dateModified ausentes en todas las páginas
**Impact:** ChatGPT (recency weighting), Perplexity (freshness score)

**Fix:** Añadir a WebPage en el @graph:
```json
"datePublished": "2026-06-05",
"dateModified": "2026-06-10"
```

---

## Low Priority Issues

- **LOW-1** — URLs con extensión `.html` visible — modernizar con redirects Netlify
- **LOW-2** — Todos los `lastmod` en sitemap.xml idénticos (2026-06-05) — automatizar con fechas reales
- **LOW-3** — Google Fonts sin preconnect hints — añadir `<link rel="preconnect" href="https://fonts.googleapis.com">`
- **LOW-4** — `Person.url` apunta a homepage en lugar de `/sobre-mi.html` en ambos nodos
- **LOW-5** — Sin Wikidata entity para Ismael Núñez López — Q-item gratuito, crea primer registro cross-platform

---

## Category Deep Dives

### AI Citability (42/100)

**Páginas más citables:**
| Bloque | Score | Motivo |
|---|---|---|
| Tabla de precios (homepage) | 73/100 | Estructurada, específica, auto-contenida |
| FAQ "¿Cuánto tarda?" | 65/100 | Q&A directo con rangos concretos |
| Caso asesoría fiscal (sobre-mi) | 59/100 | Métricas reales pero formato lista, no Q&A |

**Páginas menos citables:**
| Bloque | Score | Motivo |
|---|---|---|
| Homepage hero/value prop | 31/100 | Copy marketing genérico, cero datos |
| Calculadora body | 22/100 | Solo 280 palabras, sin contenido editorial |

**Rewrite prioritario** — Caso gestoría (actual 52/100 → target 80+):
> Actual: "Proceso de 40 minutos reducido a cero intervención manual."
>
> Target: "Una gestoría administrativa de Cádiz automatizó su onboarding con firma digital en N8N. El proceso manual previo: ~40 minutos de entrada de datos por cliente en tres sistemas. Tras una semana de implementación, transferencia de datos entre sistemas cero-manual y sin errores. Estimado: 8 horas/mes liberadas para el equipo administrativo. — M.G., responsable de operaciones, gestoría — Cádiz."

---

### Brand Authority (18/100)

| Plataforma | Estado | Impacto AI |
|---|---|---|
| Wikipedia | Ausente | Alto |
| Wikidata | Ausente | Medio |
| Reddit | Ausente | Alto (Perplexity lo pondera mucho) |
| YouTube | Ausente | Muy alto (Gemini) |
| LinkedIn company page | No verificada | Alto (Copilot + ChatGPT) |
| Google Business Profile | No verificado | Alto (Gemini + local pack) |
| Clutch / Trustpilot | Ausente | Medio |

**El camino de 18 → 45:** LinkedIn company page (semana 1) + Google Business Profile + primeras reseñas (semana 2) + 2 respuestas Reddit (semana 3) + primer vídeo YouTube (semana 4).

---

### Content E-E-A-T (41/100)

| Dimensión | Score | Gap principal |
|---|---|---|
| Experience | 14/25 | Casos anónimos no verificables |
| Expertise | 10/25 | Sin certificaciones, años vagos |
| Authoritativeness | 6/25 | Cero menciones externas |
| Trustworthiness | 11/25 | Email Outlook en docs legales, sin teléfono visible |

**Prioridad 1:** Un testimonial atribuido con nombre + empresa vale más que los 3 casos anónimos juntos.
**Prioridad 2:** Cambiar email de ismael24394@outlook.es a ismael@ismaelnlai.com (credibilidad B2B).
**Prioridad 3:** Años concretos + número de implementaciones en bio.

---

### Technical GEO (72/100)

**Fortalezas notables:**
- Static HTML en Netlify — visibilidad AI máxima, cero dependencia JS
- robots.txt AI crawlers — configuración ejemplar en el sector
- llms.txt presente — raro en SMEs españolas de este tamaño

**Gaps:**
- Security headers probablemente ausentes → netlify.toml needed
- Meta description calculadora.html — confirmado ausente
- Google Fonts sin preconnect hints
- Bing Webmaster Tools — no verificado

---

### Schema & Structured Data (42/100)

**Tipos presentes:** Organization · Person · WebPage · Service + OfferCatalog · FAQPage (homepage) · Person + ProfilePage (sobre-mi)

**Tipos ausentes críticos:**
| Schema | Impacto | Prioridad |
|---|---|---|
| sameAs en todos los nodos | Entity recognition en todos los AI | CRITICAL |
| LocalBusiness | Google Maps, local pack, Gemini | HIGH |
| WebSite + SearchAction | Sitelinks search box | MEDIUM |
| speakable | AI assistant extraction | MEDIUM |
| BreadcrumbList | Navigation signals | LOW |

---

### Platform Optimization (42/100)

| Plataforma | Score | Gap principal |
|---|---|---|
| Google AI Overviews | 52/100 | Sin cluster de contenido, sin comparativas |
| ChatGPT Web Search | 38/100 | OAI-SearchBot no explícito, sin entity cross-refs |
| Perplexity | 44/100 | Sin Reddit, sin datos primarios propios |
| Google Gemini | 34/100 | Sin YouTube, sin Google Business Profile |
| Bing Copilot | 42/100 | Sin msvalidate.01, sin LinkedIn company, sin IndexNow |

**Acciones cross-platform con mayor palanca:**
1. LinkedIn company page → impacta ChatGPT + Gemini + Bing Copilot
2. Google Business Profile → impacta Gemini + Perplexity + AIO
3. datePublished en schema → impacta ChatGPT + Perplexity + AIO
4. Primer artículo blog → impacta todos los 5 platforms

---

## Quick Wins (Esta Semana)

| # | Acción | Tiempo | Plataformas |
|---|---|---|---|
| QW-1 | sameAs en Organization + Person (LinkedIn/GitHub) | 30 min | Todos |
| QW-2 | OAI-SearchBot + Bytespider + CCBot en robots.txt | 5 min | ChatGPT |
| QW-3 | Fix llms.txt estructura → links markdown | 20 min | Todos |
| QW-4 | Meta description calculadora.html | 5 min | Todos |
| QW-5 | OG tags sobre-mi.html | 10 min | Social + AI |
| QW-6 | netlify.toml security headers | 45 min | Trust |
| QW-7 | datePublished / dateModified en schema | 20 min | ChatGPT + Perplexity |
| QW-8 | Google Fonts preconnect hints | 10 min | LCP / CWV |

**Score estimado tras quick wins: ~52/100**

---

## 30-Day Action Plan

### Semana 1: On-site technical wins
- [ ] QW-1 a QW-8 (ver tabla arriba)
- [ ] LocalBusiness schema block en homepage (ver Appendix A)
- [ ] Person.url → /sobre-mi.html en ambos nodos
- [ ] Fix sameAs: añadir LinkedIn + GitHub cuando estén creadas/confirmadas

### Semana 2: Crear presencia de entidad externa
- [ ] Crear LinkedIn company page ismaelnlai → añadir URL a sameAs
- [ ] Crear Google Business Profile en Algeciras → añadir URL a sameAs + LocalBusiness schema
- [ ] Verificar Bing Webmaster Tools → añadir msvalidate.01
- [ ] Pedir 3-5 reseñas Google a clientes actuales
- [ ] Wikidata: crear Q-item para Ismael Núñez López (ocupación + ubicación)

### Semana 3: Contenido citabable
- [ ] Publicar artículo `/automatizar-iva-trimestral-asesoria` (2,000+ palabras con datos reales)
- [ ] Añadir Article schema con datePublished + author al artículo
- [ ] Actualizar sitemap.xml con nueva URL
- [ ] Reescribir 2 casos de sobre-mi.html con atribución mínima
- [ ] Cambiar "llevo años automatizando" → años + número concreto
- [ ] Cambiar email visible a ismael@ismaelnlai.com

### Semana 4: Platform-specific + Distribución
- [ ] Publicar primer vídeo YouTube screencast (5-8 min: automatización IVA con N8N)
- [ ] Responder 2 preguntas reales en Reddit (r/autonomos, r/contabilidad)
- [ ] Añadir speakable property a homepage schema
- [ ] Añadir WebSite + SearchAction schema
- [ ] IndexNow: static key file en root

---

## Appendix A — LocalBusiness JSON-LD Template

Añadir como segundo `<script type="application/ld+json">` en el `<head>` de index.html:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://ismaelnlai.com/#localbusiness",
  "name": "ismaelnlai — Automatización con IA",
  "url": "https://ismaelnlai.com",
  "description": "Servicio de automatización de procesos con N8N e IA para asesorías fiscales, gestorías y pymes españolas. Diagnóstico gratuito. Implementación en menos de 2 semanas.",
  "email": "ismael@ismaelnlai.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Algeciras",
    "addressRegion": "Cádiz",
    "postalCode": "11205",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 36.1408,
    "longitude": -5.4531
  },
  "areaServed": [
    { "@type": "Country", "name": "Spain" },
    { "@type": "City", "name": "Algeciras" },
    { "@type": "AdministrativeArea", "name": "Campo de Gibraltar" }
  ],
  "priceRange": "€€",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00",
    "closes": "18:00"
  },
  "sameAs": [
    "REPLACE_WITH_LINKEDIN_COMPANY_URL",
    "REPLACE_WITH_GOOGLE_BUSINESS_PROFILE_URL"
  ]
}
```

---

## Appendix B — Pages Analyzed

| URL | Title | Status | GEO Issues |
|---|---|---|---|
| https://ismaelnlai.com/ | Automatización inteligente para pymes | 200 | sameAs ausente, sin datePublished, Brand Authority crítica |
| https://ismaelnlai.com/sobre-mi.html | Sobre mí — Ismael Núñez López | 200 | Person.url incorrecto, OG no verificado, casos anónimos |
| https://ismaelnlai.com/calculadora.html | Calculadora de horas perdidas | 200 | Sin meta description, sin schema, thin content (280 words) |
| https://ismaelnlai.com/aviso-legal.html | Aviso legal | 200 | Sin OG tags (low priority) |
| https://ismaelnlai.com/privacidad.html | Privacidad | 200 | Sin OG tags (low priority) |
| https://ismaelnlai.com/cookies.html | Cookies | 200 | Sin OG tags (low priority) |

---

## Appendix C — Score Delta vs Audit Anterior (2026-06-05)

| Category | Score Anterior (estimado) | Score Actual | Delta |
|---|---|---|---|
| AI Citability | ~35 | 42 | +7 |
| Brand Authority | ~10 | 18 | +8 |
| Content E-E-A-T | ~28 | 41 | +13 |
| Technical GEO | ~55 | 72 | +17 |
| Schema | ~20 | 42 | +22 |
| Platform | ~25 | 42 | +17 |
| **GEO Score** | **~24** | **42** | **+18** |

Los quick wins de la sesión anterior (schema, OG, robots.txt, llms.txt, sitemap) tuvieron el impacto esperado. El score se duplicó de ~24 a 42. El techo actual es Brand Authority — hasta que haya presencia externa verificable, el score no puede superar ~55-58 independientemente de las mejoras on-site.

---

*Report generated: 2026-06-10 | ismaelnlai.com GEO Audit v2 | 5 subagents paralelos*
