// NETFIVE v3 — Relatório de Threat Intel: Servidor C2 Exposto
// Baseado em: "Inside an Exposed C2 Server" — CyberCyber Labs (CCL-2026-07-EXC2)
"use strict";

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const RED = "D20000", REDD = "A50000", INK = "151515", SLATE = "2D4650", GRAY = "8A8A8A";
const LIGHT = "F5F6F7", LINE = "E6E8EA", WHITE = "FFFFFF";
const T2 = "444444", T3 = "555555";
const CHIPBG = "FFF5F5", CHIPLINE = "F3CACA";
const F = "Calibri";
const W = 13.33, H = 7.5;
const ASSETS = path.join(__dirname, "assets");
const LOGO_RED_PATH = path.join(ASSETS, "logo_red.svg");
const LOGO_AR = 144 / 41;

function svgToDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const logoRedSvg = fs.readFileSync(LOGO_RED_PATH, "utf8");
const LOGO_RED = svgToDataUri(logoRedSvg);
const LOGO_WHITE = svgToDataUri(logoRedSvg.replaceAll("#D20000", "#FFFFFF"));

function backgroundSvg(accentSide) {
  const accentX = accentSide === "right" ? 1040 : 0;
  const circles = accentSide === "right"
    ? '<circle cx="1180" cy="120" r="270" fill="#D20000" opacity=".11"/><circle cx="1100" cy="560" r="390" fill="#D20000" opacity=".05"/>'
    : '<circle cx="40" cy="600" r="330" fill="#D20000" opacity=".08"/><circle cx="1220" cy="80" r="250" fill="#D20000" opacity=".06"/>';
  return svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1333" height="750" viewBox="0 0 1333 750">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#151515"/><stop offset="1" stop-color="#050505"/></linearGradient></defs>
    <rect width="1333" height="750" fill="url(#g)"/><rect x="${accentX}" width="293" height="750" fill="#D20000" opacity=".035"/>
    ${circles}<path d="M0 620L1333 280" stroke="#FFFFFF" opacity=".035" stroke-width="2"/>
    <path d="M0 690L1333 350" stroke="#D20000" opacity=".18" stroke-width="1"/>
  </svg>`);
}

const COVER_BG = backgroundSvg("right");
const CTA_BG = backgroundSvg("left");

const DECK = {
  file: "servidor-c2-exposto-netfive",
  rodape: "Confidencial · Netfive",
  capa: {
    kicker: "THREAT INTELLIGENCE · BRIEFING INTERNO",
    tituloRuns: [
      { text: "Dentro de um servidor C2 ", options: { color: WHITE } },
      { text: "exposto", options: { color: RED } },
    ],
    sub: "Comprometimento de órgãos públicos brasileiros, roubo de credenciais, exploração em massa, criptomineração e malware de SEO.",
    meta: [["PREPARADO PARA", "Time de Segurança"], ["BASE", "CyberCyber Labs · 28/07/2026"], ["AUTOR", "Gustavo Barbato"], ["DATA", "Agosto de 2026"]],
  },
};

const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "Gustavo Barbato · Netfive";
p.company = "Netfive";
p.subject = "Threat Intelligence — Servidor C2 Exposto";
p.title = "Dentro de um servidor C2 exposto";
p.lang = "pt-BR";
p.theme = {
  headFontFace: F,
  bodyFontFace: F,
  lang: "pt-BR",
};
let pg = 0;

function addSvg(s, data, x, y, w, h) {
  s.addImage({ data, x, y, w, h });
}

function content(s, kicker, title) {
  pg++;
  s.background = { color: WHITE };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.09, h: H, line: { color: RED, transparency: 100 }, fill: { color: RED } });
  const lh = 0.23, lw = lh * LOGO_AR;
  addSvg(s, LOGO_RED, W - 0.62 - lw, 0.40, lw, lh);
  s.addText(kicker.toUpperCase(), { x: 0.72, y: 0.46, w: 10.5, h: 0.3, fontSize: 12, color: RED, bold: true, charSpacing: 2.5, fontFace: F, margin: 0 });
  s.addText(title, { x: 0.72, y: 0.78, w: 11.9, h: 0.72, fontSize: 27, color: INK, bold: true, fontFace: F, margin: 0 });
  s.addText(String(pg).padStart(2, "0"), { x: W - 1.15, y: H - 0.52, w: 0.55, h: 0.3, fontSize: 11, color: GRAY, bold: true, align: "right", fontFace: F, margin: 0 });
  s.addText(DECK.rodape, { x: 0.72, y: H - 0.52, w: 6, h: 0.3, fontSize: 9.5, color: GRAY, fontFace: F, margin: 0 });
}

function tile(s, x, y, w, h) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: LIGHT }, line: { color: LIGHT }, radius: 0.1 });
}

function cardW(s, x, y, w, h, leftColor) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: WHITE }, line: { color: LINE, width: 1 }, radius: 0.1 });
  if (leftColor) s.addShape(p.ShapeType.rect, { x: x + 0.02, y: y + 0.14, w: 0.045, h: h - 0.28, line: { color: leftColor }, fill: { color: leftColor } });
}

function chipQuote(s, x, y, w, h, text, src) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, fill: { color: CHIPBG }, line: { color: CHIPLINE, width: 1 }, radius: 0.12 });
  s.addText(text, { x: x + 0.28, y: y + 0.18, w: w - 0.56, h: h - 0.62, fontSize: 13.5, italic: true, color: REDD, fontFace: F, valign: "top", margin: 0 });
  s.addText(src, { x: x + 0.28, y: y + h - 0.44, w: w - 0.56, h: 0.3, fontSize: 10, color: GRAY, fontFace: F, margin: 0 });
}

function badge(s, x, y, w, text, bg) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.28, fill: { color: bg }, line: { color: bg }, radius: 0.06 });
  s.addText(text, { x, y, w, h: 0.28, fontSize: 9, bold: true, color: WHITE, align: "center", charSpacing: 1, fontFace: F, margin: 0 });
}

function rich(items) {
  const runs = [];
  items.forEach((it, i) => {
    runs.push({ text: it[0], options: { bold: true, color: INK, bullet: { code: "2022" } } });
    runs.push({ text: it[1], options: { color: T2, breakLine: i < items.length - 1, bullet: false } });
  });
  return runs;
}

function plain(items, color) {
  return items.map((text, i) => ({ text, options: { bullet: { code: "2022" }, color: color || T2, breakLine: i < items.length - 1 } }));
}

function table(s, x, y, w, colW, header, rows, fontSize = 10.5) {
  const data = [];
  data.push(header.map((text) => ({ text, options: { bold: true, color: WHITE, fill: { color: INK }, fontFace: F, fontSize: fontSize + 0.5, align: "left", valign: "middle", margin: [3, 6, 3, 6] } })));
  rows.forEach((row, i) => {
    const fill = i % 2 === 0 ? WHITE : LIGHT;
    data.push(row.map((text) => ({ text, options: { color: T2, fill: { color: fill }, fontFace: F, fontSize, valign: "middle", margin: [3, 6, 3, 6] } })));
  });
  s.addTable(data, { x, y, w, colW, border: { type: "solid", color: LINE, pt: 0.75 }, autoPage: false });
}

// 1 · CAPA
let s = p.addSlide();
addSvg(s, COVER_BG, 0, 0, W, H);
addSvg(s, LOGO_WHITE, 0.85, 0.72, 0.48 * LOGO_AR, 0.48);
s.addText(DECK.capa.kicker, { x: 0.85, y: 2.20, w: 11.3, h: 0.4, fontSize: 14, color: RED, bold: true, charSpacing: 3, fontFace: F, margin: 0 });
s.addText(DECK.capa.tituloRuns, { x: 0.85, y: 2.68, w: 11.5, h: 1.5, fontSize: 44, bold: true, fontFace: F, margin: 0, lineSpacingMultiple: 1 });
s.addText(DECK.capa.sub, { x: 0.85, y: 4.30, w: 9.6, h: 1.0, fontSize: 16, color: "C4C4C4", fontFace: F, margin: 0 });
DECK.capa.meta.forEach((m, i) => {
  const x = 0.85 + i * 2.85;
  s.addText(m[0], { x, y: 5.85, w: 2.7, h: 0.28, fontSize: 10.5, color: "888888", bold: true, charSpacing: 1.2, fontFace: F, margin: 0 });
  s.addText(m[1], { x, y: 6.14, w: 2.7, h: 0.5, fontSize: 15, color: WHITE, bold: true, fontFace: F, margin: 0 });
});
s.addText(DECK.rodape.toUpperCase(), { x: 0.85, y: 6.85, w: 6, h: 0.3, fontSize: 10, color: "888888", bold: true, charSpacing: 2, fontFace: F, margin: 0 });
pg++;

// 2 · KPI TILES
s = p.addSlide(); content(s, "Visão geral", "Escala do comprometimento em números");
const kpis = [
  ["1.175", "contas de domínio comprometidas (Active Directory)", RED],
  ["697", "endpoints com execução de comando confirmada", RED],
  ["15.884", "registros extraídos de bancos de dados", RED],
  ["42.812", "arquivos recuperados do servidor C2 (≈3,59 GB)", INK],
  ["254,7 MB", "de arquivos e configurações em staging", INK],
  ["31", "pagamentos de mineração Monero confirmados", SLATE],
];
kpis.forEach((k, i) => {
  const x = 0.72 + (i % 3) * 4.10, y = 1.95 + Math.floor(i / 3) * 2.45;
  tile(s, x, y, 3.85, 2.15);
  s.addText(k[0], { x: x + 0.3, y: y + 0.25, w: 3.3, h: 0.95, fontSize: 44, bold: true, color: k[2], fontFace: F, margin: 0 });
  s.addText(k[1], { x: x + 0.3, y: y + 1.20, w: 3.3, h: 0.85, fontSize: 12, color: T3, fontFace: F, valign: "top", margin: 0 });
});

// 3 · MODELO OPERACIONAL
s = p.addSlide(); content(s, "Como a operação funciona", "Três camadas dentro do mesmo servidor C2");
const camadas = [
  { t: "Descoberta e varredura", c: SLATE, b: [["Ferramentas: ", "FOFA, nuclei, httpx e Nmap"], ["Objetivo: ", "sondas específicas por produto e geração de grandes corpora de alvos"]] },
  { t: "Exploração em massa determinística", c: RED, b: [["Fluxo: ", "waterfall ordenado de exploits, implantação (miner, webshell, chave SSH, cron)"], ["Verificação: ", "releitura de processos/cron/arquivos para confirmar sucesso e reexecutar em ondas"]] },
  { t: "Sessões paralelas adaptativas", c: RED, b: [["Estrutura: ", "hierarquia ssh_mcp_jobs com 33 sessões hexadecimais concorrentes"], ["Sinal notável: ", "referências cruzadas “teammate”; 1 alvo SaaS com 18 sessões e 110 jobs"]] },
];
camadas.forEach((c, i) => {
  const x = 0.72 + i * 4.17, y = 1.95, w = 3.95, h = 4.15;
  cardW(s, x, y, w, h, c.c);
  s.addText(String(i + 1), { x: x + 0.28, y: y + 0.22, w: 0.6, h: 0.5, fontSize: 22, bold: true, color: c.c, fontFace: F, margin: 0 });
  s.addText(c.t, { x: x + 0.28, y: y + 0.75, w: w - 0.56, h: 0.7, fontSize: 15, bold: true, color: INK, fontFace: F, valign: "top", margin: 0 });
  s.addText(rich(c.b), { x: x + 0.28, y: y + 1.55, w: w - 0.56, h: h - 1.8, fontSize: 11.5, fontFace: F, paraSpaceAfterPt: 10, valign: "top", margin: 0 });
});
s.addText("A evidência comprova automação paralela e centralizada; não comprova o uso direto de um modelo de IA específico ou o número exato de operadores envolvidos.", { x: 0.72, y: 6.25, w: 11.9, h: 0.5, fontSize: 10.5, italic: true, color: GRAY, fontFace: F, margin: 0 });

// 4 · CASOS CRÍTICOS
s = p.addSlide(); content(s, "Alvos governamentais brasileiros", "Casos de maior impacto identificados");
const casos = [
  ["Ideflor Bio — extração de credenciais AD", "CRÍTICO", RED, "GLPI comprometido evoluiu para dump completo do Active Directory: 1.175 principals (inclui krbtgt e contas administrativas) e 1.057 hashes NT extraídos e decifrados."],
  ["Aplicação federal — implante de SEO (PiGate)", "CRÍTICO", RED, "Deserialização JBoss no Protocolo Integrado entregou o implante Java PiGate; checagens de saúde confirmam resposta ativa do implante (token urljcha / resposta jchaok)."],
  ["Ambientes GIS governamentais", "CRÍTICO", RED, "Exploração de GeoServer/PostGIS resultou em execução de comando, credenciais administrativas, três pares de chaves SSH de vítimas e material de keystore JCEKS."],
  ["Hospedagem compartilhada e municipal", "ESTRUTURAL", SLATE, "Upload de payload via chat de suporte gerou shell como tenant ISPConfig; operador enumerou mais de 30 tenants municipais/institucionais e uma caixa com 359 mensagens."],
];
casos.forEach((c, i) => {
  const x = 0.72 + (i % 2) * 6.20, y = 1.95 + Math.floor(i / 2) * 2.35;
  cardW(s, x, y, 5.95, 2.15, c[2]);
  badge(s, x + 0.30, y + 0.26, 1.35, c[1], c[2]);
  s.addText(c[0], { x: x + 1.80, y: y + 0.20, w: 3.95, h: 0.55, fontSize: 13, bold: true, color: INK, fontFace: F, valign: "top", margin: 0 });
  s.addText(c[3], { x: x + 0.32, y: y + 0.85, w: 5.3, h: 1.20, fontSize: 11, color: T3, fontFace: F, valign: "top", margin: 0 });
});

// 5 · INSA/RNP
s = p.addSlide(); content(s, "Caso detalhado", "INSA/RNP: kit de pós-exploração e pivô de domínio");
s.addText("Um alvo em ambiente de pesquisa e educação brasileiro (RNP) teve recuperado, a partir do C2, um kit cronológico completo de ferramentas de intrusão:", { x: 0.72, y: 1.85, w: 11.9, h: 0.55, fontSize: 13, color: T2, fontFace: F, valign: "top", margin: 0 });
cardW(s, 0.72, 2.45, 11.9, 4.15, RED);
s.addText(rich([
  ["Acesso local: ", "payloads de escalonamento de privilégio local recuperados do C2."],
  ["Credenciais GLPI: ", "decryptors específicos para extrair segredos da aplicação GLPI comprometida."],
  ["Movimentação lateral: ", "componentes Impacket e ntlmrelayx, além de ferramentas de spraying contra LDAP/Active Directory."],
  ["Pivô de domínio: ", "fluxo de trabalho RBCD (Resource-Based Constrained Delegation) preparado para escalonamento."],
  ["Persistência: ", "script de persistência silenciosa incluído no kit."],
]), { x: 1.05, y: 2.75, w: 11.25, h: 3.65, fontSize: 13.5, fontFace: F, paraSpaceAfterPt: 14, valign: "top", margin: 0 });
s.addText("Entrega e retirada do kit são diretamente evidenciadas; escalonamento de privilégio bem-sucedido, modificação RBCD e persistência final não estão confirmados no material retido.", { x: 0.72, y: 6.72, w: 11.9, h: 0.4, fontSize: 10.5, italic: true, color: GRAY, fontFace: F, margin: 0 });

// 6 · CREDENCIAIS, DADOS E ACESSOS
s = p.addSlide(); content(s, "Impacto", "Credenciais, dados e acessos obtidos");
table(s, 0.72, 1.95, 11.9, [3.1, 8.8], ["Categoria", "Evidência retida e significado"], [
  ["Credenciais de domínio", "Dump AD do Ideflor com 1.175 principals (inclui krbtgt); hashes Kerberos e credenciais de serviço quebradas à parte."],
  ["Bancos de dados e dados pessoais", "4 datasets SQL em staging + exports via SQL-injection municipal somam 15.884 registros (identidade, contato, RH, autenticação)."],
  ["SSH, GIS e keystores", "Pares de chaves SSH completos, material administrativo do GeoServer, credenciais PostGIS e evidência de keystore JCEKS."],
  ["Correio e hospedagem", "Caixa de correio com 359 mensagens enumeradas, credenciais de e-mail governamental e visibilidade sobre 30+ tenants."],
  ["Arquivos e código-fonte", "6 arquivos compactados (254,7 MB); 4 ZIPs legíveis com ao menos 16.725 arquivos — código, configuração, docs e segredos de BD."],
  ["Nuvem e APIs", "Chave privada OCI válida; credenciais aparentemente completas de OpenAI, SendGrid e Infobip — validade atual não confirmada."],
], 10.5);

// 7 · EXPLORAÇÃO EM MASSA
s = p.addSlide(); content(s, "Industrialização do ataque", "697 endpoints com execução confirmada");
s.addChart(p.ChartType.bar, [{ name: "Endpoints com execução confirmada", labels: ["Redis", "WordPress", "Odoo", "Outros documentados"], values: [497, 122, 73, 5] }], {
  x: 0.9, y: 2.0, w: 8.4, h: 4.5, barDir: "col", barGrouping: "standard", chartColors: [RED], valAxisMinVal: 0,
  catAxisLabelFontFace: F, valAxisLabelFontFace: F, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10,
  gridLine: { color: LINE, width: 0.5 }, showLegend: false, showValue: true, dataLabelPosition: "outEnd",
  dataLabelColor: T3, dataLabelFontSize: 11, dataLabelBold: true,
});
const stats = [["274", "processos de minerador\nverificados"], ["114", "IPs com persistência\ndurável confirmada"], ["74", "webshells\nimplantados"]];
stats.forEach((st, i) => {
  const x = 9.55, y = 2.05 + i * 1.55;
  tile(s, x, y, 2.9, 1.35);
  s.addText(st[0], { x: x + 0.22, y: y + 0.12, w: 2.4, h: 0.6, fontSize: 26, bold: true, color: INK, fontFace: F, margin: 0 });
  s.addText(st[1], { x: x + 0.22, y: y + 0.72, w: 2.55, h: 0.55, fontSize: 10, color: T3, fontFace: F, valign: "top", margin: 0 });
});

// 8 · CRIPTOMINERAÇÃO
s = p.addSlide(); content(s, "Monetização", "Uma carteira Monero conecta múltiplas campanhas");
chipQuote(s, 0.72, 1.9, 11.9, 1.55, "A mesma carteira Monero foi embutida em frameworks de implantação distintos, escritos pelo operador, para Redis, PostgreSQL, Odoo e WordPress — ligando diretamente campanhas voltadas a produtos diferentes a um único cluster operacional.", "Achado principal · CyberCyber Labs, seção 6.1");
const cry = [
  ["274", "processos de minerador (XMRig) verificados", SLATE],
  ["31", "pagamentos registrados no pool HashVault", INK],
  ["3,1886 XMR", "total pago nos 31 registros", INK],
  ["≈ US$ 979", "valor mínimo, a US$ 307,14/XMR em 28/07/2026", RED],
];
cry.forEach((k, i) => {
  const x = 0.72 + i * 2.98, y = 3.75, w = 2.78, h = 2.35;
  tile(s, x, y, w, h);
  s.addText(k[0], { x: x + 0.22, y: y + 0.28, w: w - 0.4, h: 0.85, fontSize: 28, bold: true, color: k[2], fontFace: F, margin: 0 });
  s.addText(k[1], { x: x + 0.22, y: y + 1.15, w: w - 0.4, h: 1.05, fontSize: 11, color: T3, fontFace: F, valign: "top", margin: 0 });
});
s.addText("Valor de mineração exposto na captura do pool; exclui saldos não pagos, mineração via outras carteiras/pools e receita adicional de fraude de SEO.", { x: 0.72, y: 6.3, w: 11.9, h: 0.4, fontSize: 10, italic: true, color: GRAY, fontFace: F, margin: 0 });

// 9 · PIGATE / SEONET
s = p.addSlide(); content(s, "Fraude de SEO", "PiGate e SeoNet: capacidade privada cross-platform");
cardW(s, 0.72, 1.95, 5.95, 4.45, RED);
s.addText("PiGate (Java)", { x: 1.05, y: 2.2, w: 5.3, h: 0.35, fontSize: 14, bold: true, color: RED, fontFace: F, margin: 0 });
s.addText(rich([
  ["O que é: ", "filtro Servlet / handler 404 que transforma uma aplicação comprometida em nó de cloaking de SEO."],
  ["Como decide: ", "classifica crawlers (Google, Bing, Yahoo, Baidu), dispositivo e caminho; consulta API remota; injeta, substitui, redireciona ou libera a página legítima."],
  ["Marcadores: ", "token urljcha, resposta jchaok, comunicação com api.ss.edu.pl, conteúdo de apostas em português."],
  ["Confirmado em: ", "Protocolo Integrado (federal) — entrega e resposta ativa do implante."],
]), { x: 1.05, y: 2.65, w: 5.3, h: 3.6, fontSize: 11.5, fontFace: F, paraSpaceAfterPt: 9, valign: "top", margin: 0 });
cardW(s, 6.92, 1.95, 5.95, 4.45, SLATE);
s.addText("SeoNet (.NET / IIS)", { x: 7.25, y: 2.2, w: 5.3, h: 0.35, fontSize: 14, bold: true, color: SLATE, fontFace: F, margin: 0 });
s.addText(rich([
  ["O que é: ", "componente .NET gerenciado para Microsoft IIS, irmão do PiGate."],
  ["Em comum: ", "mesma API remota, classificações de crawler/dispositivo, lógica de decisão e vocabulário de origem chinesa."],
  ["Status: ", "preparado no servidor de ataque; implantação bem-sucedida em vítima não confirmada na telemetria retida."],
  ["Contexto: ", "sobreposição com ecossistemas de fraude de SEO de língua chinesa documentados por Talos, ESET e Elastic — similar, mas não atribuível a um cluster nomeado específico."],
]), { x: 7.25, y: 2.65, w: 5.3, h: 3.6, fontSize: 11.5, fontFace: F, paraSpaceAfterPt: 9, valign: "top", margin: 0 });

// 10 · ATRIBUIÇÃO
s = p.addSlide(); content(s, "Atribuição", "O que a evidência sustenta — e o que não");
cardW(s, 0.72, 2.0, 5.95, 4.6, SLATE);
s.addText("SUSTENTADO PELA EVIDÊNCIA", { x: 1.05, y: 2.3, w: 5.3, h: 0.32, fontSize: 12.5, bold: true, color: SLATE, charSpacing: 1.5, fontFace: F, margin: 0 });
s.addText(plain([
  "Textos de interface em chinês na automação do operador",
  "Termos e abreviações de origem chinesa no malware customizado",
  "Distribuição de atividade compatível com fuso horário UTC+8",
  "Motivação predominantemente financeira: mineração, fraude de SEO, roubo de credenciais e dados",
  "Confiança média-alta para “operação de língua chinesa”",
]), { x: 1.05, y: 2.75, w: 5.35, h: 3.7, fontSize: 12.5, fontFace: F, paraSpaceAfterPt: 11, valign: "top", margin: 0 });
cardW(s, 6.92, 2.0, 5.95, 4.6, RED);
s.addText("NÃO ESTABELECIDO", { x: 7.25, y: 2.3, w: 5.3, h: 0.32, fontSize: 12.5, bold: true, color: RED, charSpacing: 1.5, fontFace: F, margin: 0 });
s.addText(plain([
  "Nacionalidade, localização física ou vínculo organizacional dos operadores",
  "Patrocínio estatal ou requisitos de inteligência direcionada",
  "Uso direto de um modelo de IA específico (sessões paralelas são compatíveis, não prova)",
  "Nenhuma evidência de ransomware, wiping destrutivo, DDoS ou venda de acessos",
]), { x: 7.25, y: 2.75, w: 5.35, h: 3.7, fontSize: 12.5, fontFace: F, paraSpaceAfterPt: 11, valign: "top", margin: 0 });

// 11 · IOCS
s = p.addSlide(); content(s, "Caça e detecção", "Indicadores públicos de comprometimento");
table(s, 0.72, 1.95, 11.9, [3.5, 2.0, 6.4], ["Indicador", "Tipo", "Uso / papel"], [
  ["111.90.139.202", "IPv4", "Servidor de ataque central (Malásia). Investigar conexões históricas antes de qualquer decisão de atribuição atual."],
  ["api.ss.edu.pl", "Domínio", "API remota de conteúdo usada pelo PiGate e SeoNet; revisar DNS e egresso HTTP."],
  ["urljcha / jchaok", "Token / resposta HTTP", "Verificação de saúde e controle do implante PiGate."],
  ["server199762", "Hostname interno", "Apelido do servidor retido em material do operador."],
  ["Carteira Monero (ver Apêndice A do relatório)", "Endereço XMR", "Carteira única embutida em frameworks de Redis, PostgreSQL, Odoo e WordPress."],
  ["Hashes SHA-256 — JARs PiGate, módulo SeoNet, Redis exp.so/ldpwn.so", "Artefato de malware", "Ver Apêndice A do relatório original para os valores completos."],
], 10);

// 12 · MITRE ATT&CK
s = p.addSlide(); content(s, "Mapeamento técnico", "Técnicas MITRE ATT&CK evidenciadas");
table(s, 0.72, 1.95, 5.85, [2.9, 2.95], ["Técnica (ID)", "Evidência"], [
  ["Active Scanning: Vulnerability Scanning (T1595.002)", "FOFA, nuclei, httpx e Nmap"],
  ["Exploit Public-Facing Application (T1190)", "GLPI, Redis, PostgreSQL, Odoo, WordPress, GeoServer, JBoss"],
  ["Command and Scripting Interpreter (T1059)", "Shell, Python, PowerShell, deserialização Java"],
  ["Exploitation for Privilege Escalation (T1068)", "Ferramentas de escalonamento Linux/Windows; sucesso varia por caso"],
  ["Valid Accounts (T1078)", "Uso de credenciais de aplicação, hospedagem, BD, e-mail e domínio"],
], 9.5);
table(s, 6.77, 1.95, 5.85, [2.9, 2.95], ["Técnica (ID)", "Evidência"], [
  ["Account Manipulation (T1098)", "Usuários locais, chaves SSH, tentativa de RBCD"],
  ["Scheduled Task/Job: Cron (T1053.003)", "Persistência via cron em Redis/Linux"],
  ["Server Software Component: Web Shell (T1505.003)", "Webshells PHP em campanhas de aplicação e massa"],
  ["Server Software Component: IIS Components (T1505.004)", "Implante SeoNet (.NET/IIS) preparado no C2"],
  ["Resource Hijacking: Compute Hijacking (T1496.001)", "XMRig e mineração Monero confirmada"],
], 9.5);

// 13 · PRIORIDADES
s = p.addSlide(); content(s, "Plano de ação", "Prioridades de resposta imediata");
cardW(s, 0.72, 1.95, 11.9, 4.55, RED);
s.addText(rich([
  ["1. Preservar evidências: ", "logs, snapshots, auditoria de nuvem, telemetria de identidade, logs de BD e e-mail antes de rotação ou reimagem."],
  ["2. Isolar e caçar: ", "sistemas expostos; buscar conexões históricas com o C2, API de SEO, portas de callback e caminhos de payload listados."],
  ["3. Rotacionar credenciais: ", "domínio, serviços, banco de dados, e-mail, hospedagem, API e SSH — incluindo rotação de krbtgt após contenção do AD."],
  ["4. Remover persistência: ", "webshells, cron jobs, chaves SSH não autorizadas, contas suspeitas, JARs/módulos IIS maliciosos, túneis reversos e XMRig."],
  ["5. Avaliar exposição: ", "movimentação lateral e dados entre domínios internos, tenants de hospedagem, infraestrutura GIS e sistemas de e-mail."],
  ["6. Corrigir e monitorar: ", "aplicar patches nos produtos explorados e monitorar reentrada por contas alternativas ou persistência remanescente."],
]), { x: 1.05, y: 2.25, w: 11.25, h: 4.05, fontSize: 13, fontFace: F, paraSpaceAfterPt: 11, valign: "top", margin: 0 });

// 14 · FECHAMENTO
s = p.addSlide(); pg++;
addSvg(s, CTA_BG, 0, 0, W, H);
addSvg(s, LOGO_WHITE, 0.85, 0.72, 0.34 * LOGO_AR, 0.34);
s.addText("Próximos passos", { x: 0.85, y: 2.15, w: 11.5, h: 0.7, fontSize: 34, bold: true, color: WHITE, fontFace: F, margin: 0 });
s.addText([
  { text: "Não testar credenciais ou chaves retidas contra sistemas em produção — coordenar a resposta com ", options: { color: "C4C4C4" } },
  { text: "segurança, jurídico e áreas operacionais", options: { color: RED, bold: true } },
  { text: ", preservando evidências antes de qualquer remediação destrutiva.", options: { color: "C4C4C4" } },
], { x: 0.85, y: 3.05, w: 11.5, h: 1.15, fontSize: 19, italic: true, fontFace: F, margin: 0 });
s.addText(plain([
  "Preservar evidências e logs antes de rotacionar ou reimaginar sistemas",
  "Rotacionar credenciais expostas e remover toda persistência identificada",
  "Validar, com telemetria própria, se os indicadores publicados tocam nosso ambiente",
], "C4C4C4"), { x: 0.85, y: 4.55, w: 11.2, h: 1.9, fontSize: 14.5, fontFace: F, paraSpaceAfterPt: 12, valign: "top", margin: 0 });
s.addText("Fonte: “Inside an Exposed C2 Server” · CyberCyber Labs (Noam Rotem) · CCL-2026-07-EXC2 · 28/07/2026 — Material preparado por Gustavo Barbato · Netfive", { x: 0.85, y: 6.95, w: 11.6, h: 0.3, fontSize: 9.5, color: "888888", fontFace: F, margin: 0 });

const outputFile = path.resolve(process.argv[2] || `${DECK.file}.pptx`);
p.writeFile({ fileName: outputFile })
  .then(() => console.log(`OK: ${outputFile}`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
