const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Netfive | CTI & Digital Risk Protection";
pptx.subject = "Encerramento da implementação do Projeto TruckPag + Axur";
pptx.title = "Projeto TruckPag + Axur — Encerramento da Implementação";
pptx.company = "Netfive";
pptx.lang = "pt-BR";
pptx.theme = {
  headFontFace: "Inter",
  bodyFontFace: "Inter",
  lang: "pt-BR",
};
pptx.defineSlideMaster({
  title: "MASTER",
  background: { color: "F4F7FA" },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: "18C58F" }, line: { color: "18C58F" } } },
    { text: { text: "TRUCKPAG  ×  AXUR  ×  NETFIVE", options: { x: 0.45, y: 7.12, w: 4.7, h: 0.15, fontFace: "Inter", fontSize: 5.8, color: "6D7B8A", bold: true, charSpacing: 1.2, margin: 0 } } },
    { text: { text: "CONFIDENCIAL • JULHO/2026", options: { x: 10.75, y: 7.12, w: 2.15, h: 0.15, fontFace: "Inter", fontSize: 5.8, color: "6D7B8A", bold: true, align: "right", charSpacing: 0.8, margin: 0 } } },
  ],
  slideNumber: { x: 12.95, y: 7.08, color: "8A96A3", fontFace: "Inter", fontSize: 6 },
});

const C = {
  navy: "071A2B",
  navy2: "0B263B",
  blue: "0F5FFF",
  cyan: "2AB7CA",
  green: "18C58F",
  orange: "FF6B35",
  red: "E44755",
  ink: "132238",
  text: "304257",
  muted: "6D7B8A",
  pale: "EAF0F5",
  white: "FFFFFF",
  bg: "F4F7FA",
  lightGreen: "DDF8EF",
  lightBlue: "E4EDFF",
  lightOrange: "FFF0E9",
};

const W = 13.333, H = 7.5;
const axurLogo = path.join(__dirname, "assets", "axur-logo-white.svg");
const netfiveLogo = path.join(__dirname, "assets", "netfive-logo.svg");

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h, fontFace: "Inter", fontSize: 12, color: C.text,
    margin: 0, breakLine: false, valign: "mid", fit: "shrink",
    ...opts,
  });
}

function rect(slide, x, y, w, h, fill, radius = 0.12, line = fill) {
  slide.addShape(radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x, y, w, h,
    rectRadius: radius,
    fill: { color: fill },
    line: { color: line, transparency: line === fill ? 100 : 0, width: 1 },
  });
}

function line(slide, x, y, w, h, color = C.pale, width = 1, dash = "solid") {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h, line: { color, width, dashType: dash, beginArrowType: "none", endArrowType: "none" },
  });
}

function circle(slide, x, y, d, fill, text = "", opts = {}) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill } });
  if (text) addText(slide, text, x, y, d, d, { align: "center", color: C.white, bold: true, fontSize: 11, ...opts });
}

function pill(slide, text, x, y, w, fill = C.lightBlue, color = C.blue) {
  rect(slide, x, y, w, 0.28, fill, 0.14);
  addText(slide, text.toUpperCase(), x + 0.11, y, w - 0.22, 0.28, { fontSize: 7, color, bold: true, charSpacing: 1 });
}

function titleBlock(slide, section, title, subtitle, time = "") {
  pill(slide, section, 0.48, 0.35, Math.max(1.05, section.length * 0.075 + 0.45), C.lightGreen, "087C5A");
  addText(slide, title, 0.48, 0.76, 11.65, 0.54, { fontSize: 25, bold: true, color: C.ink, valign: "top" });
  if (subtitle) addText(slide, subtitle, 0.5, 1.31, 11.6, 0.34, { fontSize: 10.5, color: C.muted, valign: "top" });
  if (time) {
    rect(slide, 12.22, 0.38, 0.62, 0.28, C.navy, 0.14);
    addText(slide, time, 12.22, 0.38, 0.62, 0.28, { fontSize: 7, color: C.white, bold: true, align: "center" });
  }
}

function keyMessage(slide, text, y = 6.55) {
  rect(slide, 0.48, y, 12.36, 0.38, C.navy, 0.1);
  addText(slide, "MENSAGEM-CHAVE", 0.7, y, 1.35, 0.38, { fontSize: 6.5, color: C.green, bold: true, charSpacing: 1 });
  addText(slide, text, 2.04, y, 10.55, 0.38, { fontSize: 9.2, color: C.white, bold: true });
}

function objective(slide, text) {
  addText(slide, `OBJETIVO  ${text}`, 0.5, 6.27, 11.9, 0.2, { fontSize: 6.5, color: C.muted, bold: true, charSpacing: 0.5 });
}

function card(slide, x, y, w, h, title, body, accent = C.blue, index = "") {
  rect(slide, x, y, w, h, C.white, 0.12, C.pale);
  rect(slide, x, y, 0.07, h, accent, 0);
  if (index) circle(slide, x + 0.23, y + 0.22, 0.34, accent, index, { fontSize: 8 });
  addText(slide, title, x + (index ? 0.7 : 0.28), y + 0.18, w - (index ? 0.9 : 0.5), 0.28, { fontSize: 11.5, bold: true, color: C.ink });
  addText(slide, body, x + 0.28, y + 0.58, w - 0.5, h - 0.76, { fontSize: 8.5, color: C.text, valign: "top", breakLine: true, fit: "shrink" });
}

function metric(slide, x, y, w, label, value, status, accent = C.green) {
  rect(slide, x, y, w, 0.95, C.white, 0.12, C.pale);
  addText(slide, label.toUpperCase(), x + 0.22, y + 0.12, w - 0.44, 0.18, { fontSize: 6.8, color: C.muted, bold: true, charSpacing: 0.7 });
  addText(slide, value, x + 0.22, y + 0.32, w - 0.44, 0.34, { fontSize: 17, color: C.ink, bold: true });
  addText(slide, status, x + 0.22, y + 0.7, w - 0.44, 0.15, { fontSize: 6.5, color: accent, bold: true });
}

function notes(slide, data) {
  const note = [
    `OBJETIVO DO SLIDE: ${data.objective}`,
    `CONTEÚDO RESUMIDO: ${data.summary}`,
    `SUGESTÃO VISUAL: ${data.visual}`,
    `SPEAKER NOTES: ${data.script}`,
    `MENSAGEM-CHAVE: ${data.key}`,
    `TEMPO ESTIMADO: ${data.time}`,
    data.animation ? `ANIMAÇÃO SUGERIDA: ${data.animation}` : "",
  ].filter(Boolean).join("\n\n");
  slide.addNotes(note);
}

function addBrandLockup(slide, x = 8.55, y = 0.45) {
  addText(slide, "TRUCKPAG", x, y, 1.15, 0.28, { color: C.white, bold: true, fontSize: 12, charSpacing: 0.4 });
  addText(slide, "×", x + 1.23, y, 0.2, 0.28, { color: "70879A", fontSize: 10, align: "center" });
  slide.addImage({ path: axurLogo, x: x + 1.52, y: y + 0.05, w: 1.25, h: 0.15 });
  addText(slide, "×", x + 2.88, y, 0.2, 0.28, { color: "70879A", fontSize: 10, align: "center" });
  slide.addImage({ path: netfiveLogo, x: x + 3.2, y: y + 0.02, w: 1.05, h: 0.30 });
}

// 1 — Capa
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };
  s.addShape(pptx.ShapeType.arc, { x: 8.2, y: -1.1, w: 6.6, h: 6.6, adjustPoint: 0.25, rotate: 25, fill: { color: C.navy }, line: { color: C.green, transparency: 55, width: 2 } });
  s.addShape(pptx.ShapeType.arc, { x: 9.2, y: 0.2, w: 4.8, h: 4.8, rotate: 25, fill: { color: C.navy }, line: { color: C.blue, transparency: 65, width: 2 } });
  rect(s, 0.56, 0.54, 1.43, 0.32, C.green, 0.16);
  addText(s, "PROJECT CLOSEOUT", 0.56, 0.54, 1.43, 0.32, { color: C.navy, fontSize: 7, bold: true, align: "center", charSpacing: 1.1 });
  addText(s, "Projeto TruckPag + Axur", 0.62, 1.45, 8.4, 0.86, { color: C.white, fontSize: 34, bold: true });
  addText(s, "Encerramento da Implementação", 0.64, 2.37, 7.2, 0.4, { color: "B8C8D6", fontSize: 17, bold: true });
  addText(s, "PROTEÇÃO DA PRESENÇA DIGITAL  |  RESILIÊNCIA DIGITAL ATIVADA", 0.64, 3.0, 8.1, 0.3, { color: C.green, fontSize: 9, bold: true, charSpacing: 1.2 });
  line(s, 0.64, 3.62, 5.6, 0, "365269", 1);
  addText(s, "Julho/2026", 0.64, 3.86, 2.4, 0.34, { color: C.white, fontSize: 14, bold: true });
  addText(s, "Conclusão da implantação • Transição para sustentação", 0.64, 4.26, 5.8, 0.3, { color: "91A8B9", fontSize: 10 });
  addBrandLockup(s, 8.45, 6.48);
  addText(s, "CONFIDENCIAL", 0.64, 6.65, 1.1, 0.18, { color: "70879A", fontSize: 6, bold: true, charSpacing: 1.3 });
  notes(s, {
    objective: "Abrir a reunião, confirmar a conclusão da implantação e alinhar o propósito da transição para a operação assistida.",
    summary: "Projeto TruckPag + Axur; encerramento da implementação; proteção da presença digital; resiliência digital ativada; julho de 2026.",
    visual: "Capa institucional em fundo azul-marinho, com lockup das três marcas e elemento orbital representando proteção contínua.",
    script: "Boa tarde. Obrigado pela presença da diretoria, gestores e equipes técnicas da TruckPag, Axur e Netfive. Esta reunião formaliza o encerramento da fase de implementação do Projeto TruckPag + Axur. Nosso objetivo hoje é apresentar o valor entregue, registrar o estágio operacional alcançado e alinhar a passagem para sustentação. A tecnologia está ativada, os ativos prioritários foram configurados e os fluxos de detecção e comunicação estão preparados. A partir deste marco, saímos de um projeto de implantação e entramos em um ciclo contínuo de monitoramento, resposta e evolução da postura de risco digital.",
    key: "A implantação foi concluída; a proteção contínua começa agora.",
    time: "1 min",
    animation: "Fade suave no título e, em seguida, no subtítulo. Sem transições chamativas.",
  });
}

// 2 — Cronograma
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "IMPLEMENTAÇÃO", "Do contrato à operação: nove marcos concluídos", "Evolução controlada, validação conjunta e ambiente operacional", "2 min");
  const stages = [
    ["01", "Assinatura"], ["02", "Kickoff"], ["03", "Tenant"], ["04", "Levantamento\nde ativos"],
    ["05", "Configuração"], ["06", "Follow-up"], ["07", "Ajustes"], ["08", "Validação\nfinal"], ["09", "Conclusão"],
  ];
  line(s, 0.85, 3.14, 11.5, 0, "B9C7D2", 2);
  stages.forEach((st, i) => {
    const x = 0.75 + i * 1.42;
    circle(s, x, 2.85, 0.58, i === 8 ? C.green : C.blue, i === 8 ? "✓" : st[0], { fontSize: i === 8 ? 15 : 7.5 });
    addText(s, st[1], x - 0.3, 3.55, 1.18, 0.48, { align: "center", fontSize: 8, bold: true, color: i === 8 ? "087C5A" : C.ink, valign: "top" });
  });
  rect(s, 0.75, 4.43, 11.92, 0.98, C.white, 0.13, C.pale);
  addText(s, "100%", 1.02, 4.63, 1.08, 0.42, { fontSize: 24, bold: true, color: C.green });
  addText(s, "IMPLEMENTAÇÃO CONCLUÍDA", 2.1, 4.59, 2.25, 0.25, { fontSize: 8.5, bold: true, color: C.ink, charSpacing: 0.6 });
  addText(s, "Tenant ativo • ativos prioritários cadastrados • regras configuradas • validação final realizada", 2.1, 4.88, 7.75, 0.23, { fontSize: 8.5, color: C.muted });
  pill(s, "Ambiente operacional", 10.35, 4.72, 1.95, C.lightGreen, "087C5A");
  objective(s, "Evidenciar disciplina de execução e formalizar a conclusão integral do escopo de implantação.");
  keyMessage(s, "Os nove marcos foram percorridos; o ambiente está pronto para operar e evoluir.");
  notes(s, {
    objective: "Demonstrar a evolução do projeto, o fechamento dos marcos e a disponibilidade do ambiente operacional.",
    summary: "Linha do tempo: assinatura, kickoff, tenant, levantamento de ativos, configuração, follow-up, ajustes, validação final e conclusão — 100% concluído.",
    visual: "Linha do tempo horizontal com nove marcos; todos ativos e o marco final em verde.",
    script: "O projeto avançou por nove marcos de controle. Começamos com a formalização e o kickoff, estruturamos o tenant e conduzimos o levantamento dos ativos digitais relevantes para a TruckPag. Em seguida, configuramos os cenários de monitoramento, realizamos sessões de follow-up, refinamos parâmetros e concluímos a validação final. O marco em verde representa o aceite da fase de implantação. Isso significa que o ambiente está operacional, com cobertura inicial estabelecida e pronto para entrar na rotina de sustentação. A conclusão do cronograma não encerra o risco; ela encerra a construção da capacidade de monitorá-lo e responder a ele.",
    key: "A implantação atingiu 100% dos marcos e entregou um ambiente operacional.",
    time: "2 min",
    animation: "Wipe discreto da esquerda para a direita na linha do tempo; conclusão em verde por último.",
  });
}

// 3 — Proteção de Marca
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "BRAND PROTECTION", "A marca passa a ser monitorada além do perímetro", "Detecção de abuso, priorização e resposta para reduzir exposição digital", "2 min");
  card(s, 0.5, 1.84, 3.78, 1.34, "Phishing de pedágio", "Campanhas, páginas e comunicações fraudulentas relacionadas a serviços de pedágio.", C.red, "01");
  card(s, 0.5, 3.35, 3.78, 1.34, "Uso indevido por terceiros", "Referências e associações envolvendo Samsara, Edenred e Controle Fretes requerem validação contextual.", C.orange, "02");
  card(s, 0.5, 4.86, 3.78, 1.18, "Domínios semelhantes", "Monitoramento de typosquatting e domínios similares, como truckpag.com.", C.blue, "03");
  rect(s, 4.65, 1.84, 8.18, 4.2, C.navy, 0.16);
  addText(s, "SUPERFÍCIE EXTERNA MONITORADA", 5.05, 2.14, 3.3, 0.22, { fontSize: 7, color: C.green, bold: true, charSpacing: 1 });
  const rings = [
    [7.03, 2.42, 3.15, "DOMÍNIOS", C.blue],
    [7.53, 2.92, 2.15, "MARCA", C.green],
  ];
  rings.forEach(r => {
    s.addShape(pptx.ShapeType.ellipse, { x: r[0], y: r[1], w: r[2], h: r[2], fill: { color: C.navy, transparency: 100 }, line: { color: r[4], width: 2, transparency: 25 } });
    addText(s, r[3], r[0], r[1] + r[2] / 2 - 0.12, r[2], 0.24, { align: "center", color: r[4], bold: true, fontSize: 7, charSpacing: 0.8 });
  });
  circle(s, 8.1, 3.49, 1.0, C.green, "TP", { fontSize: 17, color: C.navy });
  const benefits = [["VISIBILIDADE", 10.65, 2.65], ["RESPOSTA RÁPIDA", 10.65, 3.48], ["MONITORAMENTO 24×7", 10.65, 4.31], ["MENOR EXPOSIÇÃO", 10.65, 5.14]];
  benefits.forEach((b, i) => {
    circle(s, b[1], b[2], 0.24, i === 3 ? C.green : C.blue, "✓", { fontSize: 6 });
    addText(s, b[0], b[1] + 0.36, b[2], 1.62, 0.24, { color: C.white, fontSize: 7, bold: true, charSpacing: 0.4 });
  });
  objective(s, "Demonstrar como a plataforma reduz risco de fraude, confusão de marca e exposição reputacional.");
  keyMessage(s, "A capacidade entregue amplia visibilidade e encurta o caminho entre abuso de marca e mitigação.");
  notes(s, {
    objective: "Apresentar a cobertura de Brand Protection e os cenários prioritários para a TruckPag.",
    summary: "Phishing relacionado a pedágio; uso indevido da marca por terceiros — Samsara, Edenred e Controle Fretes; domínios semelhantes, como truckpag.com. Benefícios: menor superfície de ataque, monitoramento contínuo, resposta rápida e maior visibilidade.",
    visual: "Três cards de risco à esquerda e um radar de superfície externa à direita.",
    script: "A primeira capacidade entregue é a proteção da marca no ambiente externo. O monitoramento foi orientado para três cenários: phishing relacionado a serviços de pedágio; uso indevido ou associação indevida da marca por terceiros, incluindo referências a Samsara, Edenred e Controle Fretes; e domínios semelhantes, com atenção a variações como truckpag.com. Esses sinais não devem ser tratados de forma automática como incidente confirmado. A validação contextual da TruckPag é essencial para diferenciar parceria legítima, menção autorizada e abuso. O valor está na combinação entre visibilidade contínua, priorização e resposta. Quanto menor o intervalo entre detecção, validação e ação, menor a janela de exposição de clientes e da marca.",
    key: "Brand Protection transforma sinais externos dispersos em casos priorizados e acionáveis.",
    time: "2 min",
    animation: "Entrada por Fade dos três cenários; radar aparece por último.",
  });
}

// 4 — Deep & Dark Web
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "DEEP & DARK WEB", "Ausência de achados é o cenário desejado — não o fim da vigilância", "Monitoramento contínuo de sinais de exposição e comercialização ilícita", "2 min");
  rect(s, 0.5, 1.82, 7.35, 3.93, C.white, 0.16, "D5E0E8");
  rect(s, 0.5, 1.82, 7.35, 0.52, C.navy2, 0.16);
  circle(s, 0.78, 1.99, 0.10, C.red);
  circle(s, 0.96, 1.99, 0.10, "FFBE3D");
  circle(s, 1.14, 1.99, 0.10, C.green);
  addText(s, "Deep & Dark Web  /  Resultados", 1.48, 1.92, 3.2, 0.22, { color: C.white, fontSize: 7.5, bold: true });
  circle(s, 3.73, 2.75, 0.88, C.lightGreen, "✓", { color: C.green, fontSize: 19 });
  addText(s, "Nenhum resultado encontrado", 2.02, 3.82, 4.3, 0.4, { align: "center", fontSize: 18, bold: true, color: C.ink });
  addText(s, "Cenário registrado na validação final", 2.25, 4.29, 3.85, 0.26, { align: "center", fontSize: 8.5, color: C.muted });
  rect(s, 2.56, 4.78, 3.22, 0.33, C.lightGreen, 0.16);
  addText(s, "ESTADO IDEAL • MONITORAMENTO ATIVO", 2.56, 4.78, 3.22, 0.33, { align: "center", fontSize: 7, color: "087C5A", bold: true, charSpacing: 0.8 });
  const watch = [
    ["Credenciais", "Contas e combinações expostas"],
    ["Cartões", "Dados financeiros comprometidos"],
    ["Documentos", "Informações sensíveis publicadas"],
    ["Fóruns", "Menções e planejamento adversário"],
    ["Mercados ilícitos", "Oferta ou venda de dados"],
  ];
  watch.forEach((it, i) => {
    const y = 1.84 + i * 0.82;
    circle(s, 8.22, y + 0.14, 0.32, i < 3 ? C.blue : C.orange, String(i + 1), { fontSize: 7 });
    addText(s, it[0], 8.72, y, 1.7, 0.28, { fontSize: 10, bold: true, color: C.ink });
    addText(s, it[1], 8.72, y + 0.3, 3.8, 0.24, { fontSize: 7.5, color: C.muted });
    if (i < 4) line(s, 8.72, y + 0.69, 3.78, 0, C.pale, 0.8);
  });
  objective(s, "Registrar o cenário atual e reforçar por que a vigilância contínua reduz risco preventivamente.");
  keyMessage(s, "Nenhum achado é uma boa notícia; manter a capacidade de descobrir cedo é a proteção real.");
  notes(s, {
    objective: "Explicar o resultado sem achados e a importância da continuidade do monitoramento.",
    summary: "Nenhum resultado encontrado na validação final. A cobertura monitora credenciais, cartões, documentos, fóruns e mercados ilícitos para prevenir impacto reputacional e proteger clientes e colaboradores.",
    visual: "Reprodução visual de tela com a mensagem “Nenhum resultado encontrado” e lista de fontes monitoradas.",
    script: "Na frente de Deep & Dark Web, o registro da validação final indica nenhum resultado encontrado. Este é o cenário desejado: não há sinal identificado, neste momento, nas categorias monitoradas. É importante separar ausência de achados de ausência de risco. Credenciais, cartões, documentos, fóruns e mercados ilícitos mudam continuamente. Por isso, o benefício está na vigilância recorrente e na capacidade de identificar exposição cedo, antes de fraude, comprometimento de contas ou dano reputacional. Para a diretoria, a leitura correta é: o cenário atual é favorável e existe agora uma capacidade ativa para detectar mudanças nesse cenário.",
    key: "O cenário atual é favorável e permanece sob vigilância contínua.",
    time: "2 min",
    animation: "Fade da moldura da plataforma; lista de fontes por aparecimento sequencial.",
  });
}

// 5 — Próximos Passos
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "PRÓXIMOS PASSOS", "Duas ações destravam o valor pleno da operação", "A implantação terminou; a eficácia depende de validação e telemetria", "2 min");
  card(s, 0.5, 1.88, 5.55, 2.38, "1. Validar alertas com agilidade", "Confirmar ou descartar phishing, perfis falsos e uso indevido da marca. A validação da TruckPag autoriza o fluxo de takedown e reduz falsos positivos.", C.blue, "01");
  card(s, 6.28, 1.88, 5.55, 2.38, "2. Implementar o One Pixel", "Adicionar telemetria para ampliar a detecção automática de cópias e páginas fraudulentas, acelerando a descoberta de campanhas.", C.green, "02");
  line(s, 1.1, 5.05, 10.8, 0, "B7C6D2", 2);
  const flow = [["ALERTA", C.blue], ["VALIDAÇÃO", C.orange], ["TAKEDOWN", C.red], ["APRENDIZADO", C.green]];
  flow.forEach((f, i) => {
    const x = 1.05 + i * 3.02;
    circle(s, x, 4.79, 0.52, f[1], String(i + 1), { fontSize: 8 });
    addText(s, f[0], x + 0.63, 4.9, 1.8, 0.25, { fontSize: 8, bold: true, color: C.ink });
  });
  pill(s, "Resiliência digital ativada", 4.92, 5.63, 3.15, C.lightGreen, "087C5A");
  objective(s, "Converter a capacidade implantada em resposta efetiva e aumento contínuo da cobertura.");
  keyMessage(s, "Validação rápida e One Pixel são os próximos habilitadores de eficácia.");
  notes(s, {
    objective: "Alinhar as responsabilidades imediatas da TruckPag após o encerramento da implantação.",
    summary: "Validar alertas de phishing, perfis falsos e uso indevido para permitir takedowns; implementar o One Pixel para ampliar a detecção automática.",
    visual: "Dois cards de ação e um ciclo operacional alerta–validação–takedown–aprendizado.",
    script: "A implantação está concluída, mas duas ações são essenciais para capturar o valor pleno. Primeiro, a TruckPag precisa validar rapidamente os alertas de phishing, perfis falsos e uso indevido da marca. A plataforma e a operação identificam o sinal; a TruckPag confirma o contexto de negócio e viabiliza o takedown quando aplicável. Segundo, recomendamos implementar o One Pixel. Essa telemetria amplia a capacidade de detectar automaticamente páginas que copiem elementos da presença digital legítima. Em conjunto, essas ações aceleram a resposta e melhoram a qualidade das detecções ao longo do tempo. É assim que a resiliência digital deixa de ser apenas uma configuração e passa a ser um processo vivo.",
    key: "O valor operacional depende de uma decisão rápida da TruckPag e da ampliação de telemetria.",
    time: "2 min",
    animation: "Cards com Fade; ciclo em quatro etapas com Aparecer.",
  });
}

// 6 — Integrações
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "INTEGRAÇÕES", "Detecção conectada à equipe reduz o tempo de exposição", "WhatsApp, API e e-mail suportam comunicação multicanal", "2 min");
  const nodes = [
    ["AXUR", "Fonte de inteligência", C.navy2],
    ["DETECÇÃO", "Sinal priorizado", C.blue],
    ["API", "Orquestração", C.cyan],
    ["WHATSAPP", "Alerta imediato", "25D366"],
    ["EQUIPE", "Validação humana", C.orange],
    ["MITIGAÇÃO", "Takedown / ação", C.green],
  ];
  nodes.forEach((n, i) => {
    const x = 0.45 + i * 2.12;
    circle(s, x + 0.48, 2.24, 0.92, n[2], i === 0 ? "A" : i === 1 ? "!" : i === 2 ? "{}" : i === 3 ? "W" : i === 4 ? "TP" : "✓", { fontSize: i === 2 ? 11 : 14 });
    addText(s, n[0], x, 3.35, 1.88, 0.28, { align: "center", bold: true, fontSize: 9, color: C.ink });
    addText(s, n[1], x, 3.67, 1.88, 0.24, { align: "center", fontSize: 7, color: C.muted });
    if (i < nodes.length - 1) {
      s.addShape(pptx.ShapeType.chevron, { x: x + 1.71, y: 2.57, w: 0.42, h: 0.28, fill: { color: "B9C8D3" }, line: { color: "B9C8D3" } });
    }
  });
  rect(s, 1.1, 4.55, 11.1, 1.14, C.white, 0.14, C.pale);
  const channels = [
    ["WHATSAPP", "Urgência e mobilização", "25D366"],
    ["API", "Automação e rastreabilidade", C.blue],
    ["E-MAIL", "Registro e comunicação formal", C.orange],
  ];
  channels.forEach((c, i) => {
    const x = 1.42 + i * 3.56;
    circle(s, x, 4.83, 0.45, c[2], i === 0 ? "W" : i === 1 ? "{}" : "@", { fontSize: 8 });
    addText(s, c[0], x + 0.62, 4.72, 1.55, 0.22, { fontSize: 8.5, bold: true, color: C.ink });
    addText(s, c[1], x + 0.62, 5.0, 2.45, 0.23, { fontSize: 7.2, color: C.muted });
  });
  objective(s, "Demonstrar o fluxo integrado de comunicação e o ganho potencial em velocidade de resposta.");
  keyMessage(s, "A integração leva a inteligência ao canal de decisão — sem depender de consulta manual.");
  notes(s, {
    objective: "Explicar como WhatsApp, API e e-mail conectam detecção, equipe e mitigação.",
    summary: "Fluxo: Axur → Detecção → API → WhatsApp → Equipe → Mitigação. E-mail mantém registro formal e a API permite automação.",
    visual: "Fluxo horizontal com seis nós e bloco inferior de canais.",
    script: "A integração foi desenhada para diminuir o tempo entre a descoberta e a ação. A Axur identifica e prioriza o sinal; a API permite encaminhar e orquestrar o evento; o WhatsApp acelera a mobilização; a equipe da TruckPag valida o contexto; e a mitigação é iniciada. O e-mail complementa o fluxo com registro formal e rastreabilidade. O ponto central não é apenas ter três canais, mas usar cada um para a finalidade correta: urgência no WhatsApp, automação na API e registro no e-mail. Essa arquitetura reduz dependência de consulta manual à plataforma e apoia um processo mais previsível.",
    key: "A informação chega à equipe certa, no canal certo, para acelerar a mitigação.",
    time: "2 min",
    animation: "Wipe da esquerda para a direita no fluxo; canais aparecem em conjunto.",
  });
}

// 7 — Governança
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "GOVERNANÇA", "Operação assistida conecta rotina, decisão e evolução", "Cadência semanal e indicadores tornam o risco gerenciável", "2 min");
  rect(s, 0.5, 1.84, 4.1, 3.92, C.navy, 0.16);
  addText(s, "OPERAÇÃO ASSISTIDA", 0.9, 2.17, 2.7, 0.24, { color: C.green, fontSize: 8, bold: true, charSpacing: 1 });
  addText(s, "Monitorar.\nValidar.\nResponder.\nEvoluir.", 0.9, 2.64, 3.0, 1.65, { color: C.white, fontSize: 23, bold: true, valign: "top", breakLine: true });
  addText(s, "Um ciclo de melhoria contínua, com visibilidade executiva e disciplina operacional.", 0.9, 4.78, 3.05, 0.62, { color: "B8C8D6", fontSize: 9, valign: "top", breakLine: true });
  const gov = [
    ["Sustentação", "Tratamento de dúvidas, ajustes e chamados"],
    ["Monitoramento contínuo", "Acompanhamento dos riscos externos"],
    ["Reuniões semanais", "Priorização e desbloqueio de decisões"],
    ["Indicadores", "MTTD, MTTR, volume e efetividade"],
    ["Evolução dos riscos", "Tendências, cobertura e recomendações"],
  ];
  gov.forEach((g, i) => {
    const y = 1.84 + i * 0.77;
    circle(s, 5.03, y + 0.08, 0.34, i === 4 ? C.green : C.blue, "✓", { fontSize: 7 });
    addText(s, g[0], 5.55, y, 2.22, 0.25, { fontSize: 9.5, bold: true, color: C.ink });
    addText(s, g[1], 7.72, y, 4.7, 0.25, { fontSize: 7.8, color: C.muted });
    if (i < 4) line(s, 5.55, y + 0.57, 6.88, 0, C.pale, 0.8);
  });
  rect(s, 5.03, 5.12, 7.4, 0.64, C.lightGreen, 0.12);
  addText(s, "SUPORTE", 5.3, 5.21, 0.72, 0.18, { fontSize: 6.5, bold: true, color: "087C5A", charSpacing: 0.9 });
  addText(s, "cti@netfive.com.br", 6.2, 5.16, 2.22, 0.28, { fontSize: 9.2, bold: true, color: C.ink });
  addText(s, "WhatsApp  (51) 99661-5601", 9.1, 5.16, 2.78, 0.28, { fontSize: 9.2, bold: true, color: C.ink });
  objective(s, "Formalizar a entrada em sustentação, a cadência de governança e os canais de suporte.");
  keyMessage(s, "A governança sustenta a capacidade técnica e transforma eventos em decisões.");
  notes(s, {
    objective: "Apresentar o início da operação assistida, as rotinas de governança e os canais de suporte.",
    summary: "Sustentação, monitoramento contínuo, reuniões semanais, indicadores e evolução de riscos. Suporte: cti@netfive.com.br e WhatsApp (51) 99661-5601.",
    visual: "Manifesto operacional à esquerda e cinco componentes de governança à direita.",
    script: "Com o encerramento da implantação, iniciamos a operação assistida. A governança será organizada em cinco frentes: sustentação para dúvidas e ajustes; monitoramento contínuo dos riscos; reuniões semanais para priorização; indicadores para dar visibilidade a tempo, volume e efetividade; e acompanhamento da evolução dos riscos. A Netfive atua como ponto de coordenação operacional, em parceria com Axur e TruckPag. Para suporte, ficam formalizados o e-mail cti@netfive.com.br e o WhatsApp (51) 99661-5601. O objetivo da cadência semanal não é apenas revisar alertas, mas transformar dados em decisões e melhorias de cobertura.",
    key: "Operação assistida inicia com canais, cadência e responsabilidades claras.",
    time: "2 min",
    animation: "Fade do manifesto; itens de governança em sequência curta.",
  });
}

// 8 — Benefícios
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "VALOR ENTREGUE", "Dez benefícios consolidam a nova capacidade de DRP", "Tecnologia, processo e governança combinados para reduzir risco digital", "2 min");
  const benefits = [
    ["Proteção da marca", "Abuso e impersonação"], ["Redução de phishing", "Sinais priorizados"],
    ["Deep & Dark Web", "Exposição monitorada"], ["Threat Intelligence", "Contexto para decisão"],
    ["Automação", "Integrações e escala"], ["Proteção reputacional", "Menor janela de dano"],
    ["Visibilidade de ativos", "Superfície conhecida"], ["Resposta rápida", "Fluxos acionáveis"],
    ["Governança", "Cadência e indicadores"], ["Resiliência digital", "Evolução contínua"],
  ];
  benefits.forEach((b, i) => {
    const col = i % 5, row = Math.floor(i / 5);
    const x = 0.52 + col * 2.49, y = 1.86 + row * 1.87;
    rect(s, x, y, 2.24, 1.55, C.white, 0.13, C.pale);
    circle(s, x + 0.18, y + 0.18, 0.36, i === 9 ? C.green : i % 3 === 0 ? C.orange : C.blue, String(i + 1).padStart(2, "0"), { fontSize: 6.5 });
    addText(s, b[0], x + 0.18, y + 0.69, 1.85, 0.35, { fontSize: 10, bold: true, color: C.ink, valign: "top" });
    addText(s, b[1], x + 0.18, y + 1.12, 1.8, 0.22, { fontSize: 7, color: C.muted });
  });
  rect(s, 0.52, 5.45, 12.2, 0.53, C.lightGreen, 0.13);
  addText(s, "CAPACIDADE ATIVADA", 0.82, 5.45, 1.72, 0.53, { fontSize: 7, bold: true, color: "087C5A", charSpacing: 0.8 });
  addText(s, "Detectar antes  →  decidir com contexto  →  responder com velocidade  →  aprender continuamente", 2.53, 5.45, 9.7, 0.53, { fontSize: 10, bold: true, color: C.ink });
  objective(s, "Consolidar os benefícios de negócio e operação entregues pelo projeto.");
  keyMessage(s, "O projeto entrega uma capacidade integrada — não apenas uma ferramenta.");
  notes(s, {
    objective: "Sintetizar os benefícios entregues em linguagem de negócio e segurança.",
    summary: "Proteção da marca, redução de phishing, Deep/Dark Web, inteligência de ameaças, automação, proteção reputacional, visibilidade de ativos, resposta rápida, governança e resiliência digital.",
    visual: "Dez cards numerados, agrupados em duas linhas, com uma cadeia de valor na base.",
    script: "O valor entregue pode ser resumido em dez benefícios. A TruckPag passa a ter proteção estruturada da marca e maior capacidade de identificar phishing; monitoramento de Deep e Dark Web; inteligência para contextualizar ameaças; automação e integrações; proteção reputacional; maior visibilidade dos ativos; resposta mais rápida; governança recorrente; e, como resultado agregado, resiliência digital. O ponto mais importante é que esses benefícios não funcionam isoladamente. A visibilidade alimenta a inteligência, a inteligência orienta a decisão, a decisão acelera a resposta e a governança garante evolução. Portanto, o projeto entrega uma capacidade operacional integrada, e não apenas acesso a uma plataforma.",
    key: "A soma de tecnologia, processo e governança cria valor sustentável.",
    time: "2 min",
    animation: "Cards com Fade por linha; cadeia de valor por último.",
  });
}

// 9 — Encerramento
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };
  rect(s, 0.65, 0.58, 1.75, 0.32, C.green, 0.16);
  addText(s, "MARCO DE TRANSIÇÃO", 0.65, 0.58, 1.75, 0.32, { align: "center", color: C.navy, fontSize: 7, bold: true, charSpacing: 0.9 });
  addText(s, "Implementação concluída.\nResiliência digital ativada.", 0.68, 1.58, 8.8, 1.6, { fontSize: 31, bold: true, color: C.white, valign: "top", breakLine: true });
  addText(s, "Agradecemos à TruckPag, Axur e Netfive pela parceria, confiança e colaboração ao longo da implementação.", 0.72, 3.52, 7.15, 0.72, { fontSize: 13, color: "B8C8D6", valign: "top", breakLine: true });
  const phases = [["MONITORAMENTO", C.blue], ["EVOLUÇÃO", C.orange], ["MELHORIA CONTÍNUA", C.green]];
  phases.forEach((p, i) => {
    const x = 0.72 + i * 2.77;
    rect(s, x, 4.77, 2.42, 0.65, i === 2 ? "0F493F" : "102E45", 0.12);
    circle(s, x + 0.18, 4.95, 0.28, p[1], "✓", { fontSize: 6 });
    addText(s, p[0], x + 0.57, 4.91, 1.6, 0.24, { fontSize: 7.2, bold: true, color: C.white, charSpacing: 0.5 });
  });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.35, y: 1.05, w: 2.9, h: 2.9, fill: { color: C.navy, transparency: 100 }, line: { color: C.green, width: 2, transparency: 25 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.87, y: 1.57, w: 1.86, h: 1.86, fill: { color: C.green, transparency: 92 }, line: { color: C.blue, width: 2, transparency: 35 } });
  circle(s, 10.42, 2.12, 0.76, C.green, "✓", { color: C.navy, fontSize: 18 });
  addBrandLockup(s, 8.46, 6.5);
  addText(s, "Obrigado.", 0.72, 6.52, 2.0, 0.35, { color: C.white, fontSize: 16, bold: true });
  notes(s, {
    objective: "Formalizar o encerramento, agradecer as equipes e marcar o início da jornada contínua.",
    summary: "A implantação foi concluída e inicia-se a fase contínua de monitoramento, evolução e melhoria.",
    visual: "Slide institucional em fundo escuro, com mensagem de transição e três pilares da nova fase.",
    script: "Encerramos formalmente a fase de implementação do Projeto TruckPag + Axur. Agradecemos à TruckPag pela confiança e participação nas validações, à Axur pela plataforma e apoio especializado, e à Netfive pela coordenação e integração da operação. O resultado deste projeto é uma capacidade ativada para proteger a presença digital da TruckPag. A partir de agora, o foco muda para monitoramento contínuo, evolução e melhoria. Nosso compromisso é manter o ambiente visível, os riscos priorizados e a resposta cada vez mais eficiente. Obrigado.",
    key: "O projeto termina; a jornada contínua de resiliência digital começa.",
    time: "1 min",
    animation: "Fade suave do título; três pilares aparecem juntos. Encerrar sem transição automática.",
  });
}

// 10 — Executive Summary
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "APÊNDICE EXECUTIVO", "Executive Summary | 1 página", "Decisão, valor, risco residual e prioridade dos próximos 30 dias", "3 min");
  metric(s, 0.5, 1.78, 2.72, "Status", "100%", "IMPLEMENTAÇÃO CONCLUÍDA", C.green);
  metric(s, 3.4, 1.78, 2.72, "Cobertura", "3 frentes", "MARCA • D&DW • CTI", C.blue);
  metric(s, 6.3, 1.78, 2.72, "Integração", "3 canais", "API • WHATSAPP • E-MAIL", C.blue);
  metric(s, 9.2, 1.78, 3.13, "Deep & Dark Web", "0 achados", "NA VALIDAÇÃO FINAL", C.green);
  card(s, 0.5, 3.02, 3.78, 2.42, "O que foi entregue", "Tenant e ativos configurados\nCenários de marca monitorados\nFluxos de comunicação definidos\nGovernança de sustentação ativada", C.blue);
  card(s, 4.53, 3.02, 3.78, 2.42, "Risco residual", "Validação humana continua necessária\nTakedown depende de autorização\nCobertura cresce com telemetria\nAmeaças externas seguem dinâmicas", C.orange);
  card(s, 8.56, 3.02, 3.78, 2.42, "Prioridade D+30", "Acordar SLA de validação\nImplantar One Pixel\nEstabelecer baseline dos KPIs\nRodar cadência semanal", C.green);
  objective(s, "Dar à diretoria uma visão única do status, valor, riscos e decisões imediatas.");
  keyMessage(s, "A capacidade está ativa; o foco executivo agora é velocidade de validação e disciplina operacional.");
  notes(s, {
    objective: "Consolidar em uma página o status do projeto e as prioridades de gestão.",
    summary: "100% da implantação concluída; três frentes de cobertura; três canais de integração; nenhum achado Deep/Dark Web na validação final; riscos residuais e prioridades D+30.",
    visual: "Quatro métricas no topo e três cards de síntese na base.",
    script: "Para a visão executiva: a implantação está 100% concluída. A capacidade cobre proteção de marca, Deep e Dark Web e inteligência de ameaças, com comunicação por API, WhatsApp e e-mail. Na validação final, não foram registrados achados de Deep e Dark Web, o que representa um cenário favorável. O risco residual está principalmente na necessidade de validação humana, na autorização para takedown e na ampliação da telemetria. Nos próximos 30 dias, as prioridades são acordar o SLA de validação, implementar o One Pixel, estabelecer o baseline dos indicadores e consolidar a cadência semanal.",
    key: "Status verde, com ações operacionais claras para converter capacidade em resultado recorrente.",
    time: "3 min",
    animation: "Métricas em conjunto; cards por Aparecer.",
  });
}

// 11 — Principais resultados
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "RESULTADOS", "Principais resultados do projeto", "Entregas verificáveis organizadas por tecnologia, processo e governança", "2 min");
  const cols = [
    ["TECNOLOGIA", C.blue, ["Tenant operacional", "Ativos prioritários cadastrados", "Cenários de monitoramento configurados", "Integrações multicanal previstas"]],
    ["PROCESSO", C.orange, ["Fluxo de triagem definido", "Validação TruckPag requerida", "Takedown condicionado ao aceite", "Rotina de acompanhamento estruturada"]],
    ["GOVERNANÇA", C.green, ["Operação assistida iniciada", "Reuniões semanais", "Canais de suporte formalizados", "KPIs definidos para baseline"]],
  ];
  cols.forEach((col, i) => {
    const x = 0.52 + i * 4.12;
    rect(s, x, 1.88, 3.72, 3.93, C.white, 0.14, C.pale);
    rect(s, x, 1.88, 3.72, 0.62, col[1], 0.14);
    addText(s, col[0], x + 0.28, 2.03, 2.7, 0.28, { fontSize: 9, color: C.white, bold: true, charSpacing: 1 });
    col[2].forEach((item, j) => {
      circle(s, x + 0.28, 2.81 + j * 0.66, 0.27, col[1], "✓", { fontSize: 5.5 });
      addText(s, item, x + 0.7, 2.74 + j * 0.66, 2.72, 0.38, { fontSize: 8.6, color: C.ink, bold: j === 0 });
    });
    rect(s, x + 0.28, 5.28, 3.16, 0.27, i === 2 ? C.lightGreen : C.bg, 0.13);
    addText(s, i === 0 ? "CAPACIDADE ATIVA" : i === 1 ? "FLUXO DEFINIDO" : "CADÊNCIA ATIVA", x + 0.28, 5.28, 3.16, 0.27, { align: "center", fontSize: 6.5, bold: true, color: col[1], charSpacing: 0.8 });
  });
  objective(s, "Distinguir fatos entregues de métricas ainda em processo de baseline.");
  keyMessage(s, "O projeto entrega tecnologia configurada, processo definido e governança ativada.");
  notes(s, {
    objective: "Apresentar os resultados verificáveis sem atribuir números não apurados.",
    summary: "Resultados em três pilares: tecnologia operacional, processo de triagem e takedown definido, e governança de sustentação ativada.",
    visual: "Três colunas com listas de entregas e status.",
    script: "Os resultados do projeto estão organizados em três pilares. Em tecnologia, temos tenant operacional, ativos prioritários cadastrados, cenários configurados e integrações previstas. Em processo, definimos triagem, validação pela TruckPag, condicionantes de takedown e acompanhamento. Em governança, iniciamos a operação assistida, formalizamos reuniões semanais e canais de suporte, e definimos o conjunto de KPIs. Não apresentamos números de incidentes ou tempos médios como resultado porque o baseline começa com a operação. Essa distinção preserva a integridade executiva do reporte.",
    key: "As entregas são concretas; as métricas de desempenho serão estabelecidas no primeiro ciclo operacional.",
    time: "2 min",
    animation: "Colunas por Fade, da esquerda para a direita.",
  });
}

// 12 — KPIs
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "PERFORMANCE", "KPIs para medir risco, velocidade e efetividade", "Baseline no primeiro ciclo; metas aprovadas após dados reais", "3 min");
  const kpis = [
    ["MTTD", "Tempo entre primeira evidência e detecção", "Apurar D+30", C.blue],
    ["MTTR", "Tempo entre validação e mitigação", "Apurar D+30", C.green],
    ["Incidentes detectados", "Volume por severidade e origem", "Baseline mensal", C.orange],
    ["Phishing identificado", "Casos confirmados / sinais avaliados", "Taxa de confirmação", C.red],
    ["Takedowns", "Solicitados, concluídos e tempo por canal", "Efetividade", C.green],
    ["Credenciais expostas", "Novas, recorrentes e criticidade", "Tendência", C.orange],
    ["Superfície de ataque", "Ativos novos, removidos e monitorados", "Evolução líquida", C.blue],
    ["SLA de validação", "Alertas respondidos dentro do acordo", "Definir meta", C.green],
  ];
  kpis.forEach((k, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.5 + col * 3.11, y = 1.83 + row * 1.74;
    rect(s, x, y, 2.83, 1.43, C.white, 0.13, C.pale);
    rect(s, x, y, 0.07, 1.43, k[3], 0);
    addText(s, k[0], x + 0.24, y + 0.16, 2.31, 0.28, { fontSize: 11, bold: true, color: C.ink });
    addText(s, k[1], x + 0.24, y + 0.51, 2.31, 0.42, { fontSize: 7.3, color: C.muted, valign: "top" });
    pill(s, k[2], x + 0.24, y + 1.03, 1.47, k[3] === C.green ? C.lightGreen : C.bg, k[3]);
  });
  rect(s, 0.5, 5.45, 12.15, 0.57, C.navy, 0.12);
  addText(s, "REGRA DE GESTÃO", 0.78, 5.45, 1.45, 0.57, { color: C.green, bold: true, fontSize: 6.8, charSpacing: 0.8 });
  addText(s, "Medir  →  estabelecer baseline  →  pactuar meta  →  acompanhar tendência  →  corrigir desvio", 2.35, 5.45, 9.8, 0.57, { color: C.white, bold: true, fontSize: 10 });
  objective(s, "Definir o painel de gestão sem criar metas arbitrárias antes do baseline.");
  keyMessage(s, "No primeiro mês, qualidade do baseline é mais importante que uma meta sem evidência.");
  notes(s, {
    objective: "Apresentar os KPIs e a abordagem responsável para baseline e metas.",
    summary: "MTTD, MTTR, incidentes detectados, phishing identificado, takedowns, credenciais expostas, evolução da superfície de ataque e SLA de validação.",
    visual: "Oito cards de KPI com definição e status de medição; regra de gestão na base.",
    script: "Propomos um painel com oito indicadores. MTTD mede o tempo até a detecção; MTTR, o tempo entre validação e mitigação. Volume de incidentes e phishing mostra demanda e qualidade de detecção. Takedowns mede execução e efetividade. Credenciais expostas e superfície de ataque mostram a evolução do risco. O SLA de validação mede a participação operacional da TruckPag. Como a operação está começando, o primeiro ciclo deve estabelecer o baseline. Depois de dados reais, pactuamos metas com a diretoria e acompanhamos tendência. Isso evita metas arbitrárias e permite compromissos realistas por criticidade e canal.",
    key: "KPIs tornam a operação gerenciável; baseline confiável precede metas.",
    time: "3 min",
    animation: "Cards por linha; regra de gestão em Wipe.",
  });
}

// 13 — Operating model / RACI
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "TRANSIÇÃO", "Modelo operacional e responsabilidades", "Clareza de papéis reduz latência e evita alertas sem decisão", "2 min");
  const rows = [
    ["Monitorar fontes e detectar sinais", "I", "R/A", "C"],
    ["Enriquecer e priorizar alertas", "C", "R", "A"],
    ["Validar contexto de negócio", "R/A", "C", "C"],
    ["Autorizar takedown", "R/A", "C", "C"],
    ["Executar e acompanhar mitigação", "I", "R", "A"],
    ["Reportar KPIs e recomendações", "C", "C", "R/A"],
  ];
  const x0 = 0.58, y0 = 1.9;
  rect(s, x0, y0, 12.1, 0.55, C.navy, 0.08);
  addText(s, "ATIVIDADE", x0 + 0.25, y0, 5.25, 0.55, { color: C.white, bold: true, fontSize: 8 });
  addText(s, "TRUCKPAG", x0 + 6.0, y0, 1.55, 0.55, { color: C.white, bold: true, fontSize: 7.5, align: "center" });
  addText(s, "AXUR", x0 + 8.0, y0, 1.3, 0.55, { color: C.white, bold: true, fontSize: 7.5, align: "center" });
  addText(s, "NETFIVE", x0 + 10.0, y0, 1.5, 0.55, { color: C.white, bold: true, fontSize: 7.5, align: "center" });
  rows.forEach((r, i) => {
    const y = y0 + 0.55 + i * 0.52;
    rect(s, x0, y, 12.1, 0.5, i % 2 === 0 ? C.white : "EEF3F7", 0);
    addText(s, r[0], x0 + 0.25, y, 5.35, 0.5, { fontSize: 8.3, color: C.ink, bold: i === 2 || i === 3 });
    [r[1], r[2], r[3]].forEach((v, j) => {
      const xx = x0 + 6.0 + j * 2.0;
      const color = v.includes("R") ? C.green : v === "A" ? C.blue : C.muted;
      addText(s, v, xx, y, 1.55, 0.5, { align: "center", fontSize: 9, bold: true, color });
    });
  });
  addText(s, "R = Responsável   •   A = Accountable / aprovador   •   C = Consultado   •   I = Informado", 0.62, 5.72, 7.5, 0.22, { fontSize: 7, color: C.muted });
  pill(s, "Validar RACI na 1ª reunião semanal", 9.6, 5.65, 3.0, C.lightOrange, C.orange);
  objective(s, "Alinhar a proposta de papéis para que cada alerta tenha responsável e aprovador.");
  keyMessage(s, "A TruckPag decide o contexto e autoriza; Axur detecta; Netfive coordena e reporta.");
  notes(s, {
    objective: "Propor uma matriz RACI para a operação assistida e eliminar ambiguidades.",
    summary: "TruckPag valida contexto e autoriza takedown; Axur monitora e executa capacidades da plataforma; Netfive prioriza, coordena, acompanha e reporta.",
    visual: "Matriz RACI com seis atividades e três organizações.",
    script: "A transição exige clareza de papéis. A Axur é responsável pela capacidade de monitoramento, detecção e execução técnica suportada pela plataforma. A TruckPag é responsável por validar o contexto de negócio e aprovar takedowns, pois detém a autoridade sobre marca, parceiros e exceções. A Netfive coordena a operação, apoia a priorização, acompanha a mitigação e reporta indicadores e recomendações. Esta matriz é uma proposta para validação na primeira reunião semanal. O objetivo é simples: nenhum alerta deve ficar sem responsável, prazo ou decisão.",
    key: "Responsabilidades explícitas reduzem a latência operacional.",
    time: "2 min",
    animation: "Tabela sem animação; destaque por Fade nas linhas de validação e autorização.",
  });
}

// 14 — FAQ
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "FAQ DIRETORIA", "Perguntas que orientam a decisão executiva", "Respostas objetivas sobre status, risco, responsabilidade e valor", "4 min");
  const faq = [
    ["A implantação terminou?", "Sim. Os nove marcos foram concluídos e o ambiente está operacional."],
    ["Estamos livres de risco digital?", "Não. A capacidade reduz tempo de descoberta e resposta; o risco externo permanece dinâmico."],
    ["“Nenhum resultado” significa ausência de risco?", "Significa ausência de achado no momento da validação, sob o escopo monitorado."],
    ["O que depende da TruckPag?", "Validar alertas, autorizar takedowns, apoiar o One Pixel e cumprir a cadência."],
    ["Como mediremos retorno?", "Por tendência de MTTD/MTTR, volume confirmado, takedowns e redução da exposição."],
    ["Quando haverá metas numéricas?", "Após o baseline do primeiro ciclo operacional e validação da governança."],
  ];
  faq.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.52 + col * 6.19, y = 1.82 + row * 1.37;
    rect(s, x, y, 5.9, 1.14, C.white, 0.12, C.pale);
    circle(s, x + 0.22, y + 0.18, 0.32, i === 3 ? C.orange : C.blue, "?", { fontSize: 9 });
    addText(s, f[0], x + 0.7, y + 0.12, 4.9, 0.28, { fontSize: 9.2, bold: true, color: C.ink });
    addText(s, f[1], x + 0.7, y + 0.48, 4.92, 0.46, { fontSize: 7.7, color: C.muted, valign: "top", breakLine: true });
  });
  objective(s, "Antecipar dúvidas executivas e reforçar uma leitura realista de risco e resultado.");
  keyMessage(s, "O projeto reduz incerteza e tempo de exposição; não elimina a necessidade de gestão contínua.");
  notes(s, {
    objective: "Responder às principais perguntas da diretoria sobre conclusão, risco, responsabilidades, retorno e metas.",
    summary: "Seis perguntas e respostas executivas sobre implantação, risco residual, ausência de achados, dependências da TruckPag, medição de retorno e metas.",
    visual: "Grade de seis cards de pergunta e resposta.",
    script: "Este FAQ antecipa as principais dúvidas. A implantação terminou e o ambiente está operacional. Isso não significa risco zero: ameaças externas mudam e exigem monitoramento. Nenhum resultado encontrado é um registro favorável do momento e do escopo, não uma garantia permanente. A TruckPag tem papel ativo na validação e autorização, além da implementação do One Pixel. O retorno será medido pela evolução de tempos, volume confirmado, efetividade de takedowns e tendência de exposição. Metas numéricas serão propostas depois do baseline, para que sejam baseadas em evidência.",
    key: "A expectativa correta é redução de exposição e aumento de capacidade, não risco zero.",
    time: "4 min",
    animation: "Sem animação ou Fade único da grade completa.",
  });
}

// 15 — Roteiro
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "ROTEIRO DO APRESENTADOR", "Condução sugerida | 18–22 minutos", "Sequência de fala para manter foco em valor, decisão e transição", "2 min");
  const agenda = [
    ["00–01", "ABERTURA", "Confirmar o encerramento e o objetivo da reunião."],
    ["01–03", "EXECUÇÃO", "Percorrer os nove marcos e registrar o status 100%."],
    ["03–07", "CAPACIDADES", "Brand Protection e Deep/Dark Web: cobertura e cenário atual."],
    ["07–11", "OPERAÇÃO", "Próximos passos, integrações e governança assistida."],
    ["11–15", "VALOR", "Benefícios, resultados e síntese executiva."],
    ["15–18", "GESTÃO", "KPIs, responsabilidades e decisões D+30."],
    ["18–22", "FAQ + FECHO", "Responder dúvidas e reforçar a nova fase contínua."],
  ];
  line(s, 1.37, 2.03, 0, 3.72, "B9C7D2", 2);
  agenda.forEach((a, i) => {
    const y = 1.79 + i * 0.58;
    circle(s, 1.16, y, 0.42, i === agenda.length - 1 ? C.green : C.blue, String(i + 1), { fontSize: 7 });
    addText(s, a[0], 0.52, y, 0.52, 0.42, { fontSize: 7.2, color: C.muted, bold: true, align: "right" });
    addText(s, a[1], 1.82, y, 1.58, 0.42, { fontSize: 8.2, bold: true, color: C.ink });
    addText(s, a[2], 3.53, y, 8.55, 0.42, { fontSize: 8.4, color: C.text });
  });
  rect(s, 0.52, 5.96, 12.08, 0.34, C.lightOrange, 0.1);
  addText(s, "DICA", 0.78, 5.96, 0.52, 0.34, { fontSize: 6.5, color: C.orange, bold: true, charSpacing: 0.7 });
  addText(s, "Use os slides 10–16 como apêndice: aprofunde apenas conforme o interesse da audiência.", 1.42, 5.96, 10.68, 0.34, { fontSize: 8.2, color: C.ink, bold: true });
  objective(s, "Dar ao apresentador um roteiro completo, com ritmo e mensagens por bloco.");
  keyMessage(s, "Conduza a reunião do status para o valor e encerre com decisões práticas.");
  notes(s, {
    objective: "Orientar o apresentador sobre sequência, tempo e intenção de cada bloco.",
    summary: "Roteiro de 18–22 minutos: abertura, execução, capacidades, operação, valor, gestão, FAQ e encerramento.",
    visual: "Timeline vertical com tempos, blocos e instruções de fala.",
    script: "Conduza a apresentação em sete blocos. Abra confirmando o marco de encerramento. Depois, demonstre a disciplina da execução. Em seguida, explique as capacidades de proteção de marca e Deep/Dark Web. Passe para a operação, destacando dependências, integrações e governança. Consolide o valor e os resultados. Use o apêndice para detalhar KPIs, RACI e decisões dos próximos 30 dias. Finalize com o FAQ e a mensagem de transição. Mantenha os slides 10 a 16 como material de apoio; aprofunde apenas quando houver pergunta ou interesse específico.",
    key: "Ritmo executivo: status → capacidade → valor → decisão → transição.",
    time: "2 min",
    animation: "Wipe vertical discreto na timeline; sem animação nos textos.",
  });
}

// 16 — Design e animações
{
  const s = pptx.addSlide("MASTER");
  titleBlock(s, "GUIA DE USO", "Design, hierarquia e animações discretas", "Padrões para manter consistência em futuras atualizações", "2 min");
  card(s, 0.52, 1.85, 3.74, 1.6, "Cores", "Navy  #071A2B\nGreen  #18C58F\nBlue  #0F5FFF\nBackground  #F4F7FA", C.blue);
  card(s, 0.52, 3.65, 3.74, 1.6, "Tipografia", "Inter Bold — títulos\nInter SemiBold — chamadas\nInter Regular — corpo\nMínimo recomendado: 18 pt em tela", C.green);
  card(s, 4.53, 1.85, 3.74, 1.6, "Hierarquia visual", "1 mensagem principal por slide\n3–5 elementos prioritários\nContraste alto e espaço negativo\nDados antes de decoração", C.orange);
  card(s, 4.53, 3.65, 3.74, 1.6, "Acessibilidade", "Não depender apenas de cor\nContraste consistente\nLeitura da esquerda para a direita\nTextos curtos em tela", C.blue);
  card(s, 8.54, 1.85, 3.74, 3.4, "Animações sugeridas", "Transição: Fade, 0,3–0,5 s\nLinha do tempo: Wipe horizontal\nCards: Aparecer por grupo\nFluxos: sequência da esquerda para a direita\n\nEvitar: zoom, bounce, som, rotação, transição automática.", C.green);
  rect(s, 0.52, 5.58, 11.99, 0.48, C.navy, 0.12);
  addText(s, "REGRA DE OURO", 0.78, 5.58, 1.22, 0.48, { fontSize: 6.8, color: C.green, bold: true, charSpacing: 0.8 });
  addText(s, "Animação deve revelar a lógica da mensagem — nunca competir com ela.", 2.12, 5.58, 9.6, 0.48, { fontSize: 9.5, color: C.white, bold: true });
  objective(s, "Preservar a qualidade visual e orientar atualizações no PowerPoint.");
  keyMessage(s, "Consistência e simplicidade reforçam credibilidade executiva.");
  notes(s, {
    objective: "Documentar as recomendações de design, tipografia, hierarquia e animação.",
    summary: "Paleta institucional, uso de Inter, regras de hierarquia e acessibilidade e sugestões de animações discretas.",
    visual: "Cinco cards de referência e uma regra de ouro.",
    script: "Para atualizações futuras, mantenha a paleta em azul-marinho, verde e azul, com fundo claro. Use Inter em toda a apresentação e preserve a hierarquia entre título, chamada e corpo. Limite cada slide a uma mensagem principal e priorize informação sobre decoração. Em animações, use Fade, Wipe e Aparecer, sempre em durações curtas. Evite efeitos que tirem a atenção da mensagem. A regra é simples: a animação deve explicar a sequência, e não disputar atenção com o conteúdo.",
    key: "Design executivo é clareza, consistência e foco.",
    time: "2 min",
    animation: "Slide de referência; não aplicar animação.",
  });
}

async function writePresentation() {
  const fileName = "Projeto_TruckPag_Axur_Encerramento_Jul2026.pptx";
  await pptx.writeFile({ fileName: path.join(__dirname, "output", fileName) });
  await pptx.writeFile({ fileName: path.join("/opt/cursor/artifacts", fileName) });
}

writePresentation().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
