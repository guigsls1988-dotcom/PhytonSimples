# Relatório Netfive — Servidor C2 Exposto

Gerador em Node.js do briefing interno de Threat Intelligence baseado no relatório
“Inside an Exposed C2 Server” (CyberCyber Labs, CCL-2026-07-EXC2).

## Gerar a apresentação

```bash
npm install
npm run build
```

O arquivo `servidor-c2-exposto-netfive.pptx` será criado na raiz do projeto.
Também é possível informar outro caminho:

```bash
node gerar-relatorio-c2.js ./saida/briefing.pptx
```
