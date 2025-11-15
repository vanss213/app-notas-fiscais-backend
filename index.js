const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const db = require("./db");

const app = express();

// LIBERA O FRONT VITE (5173)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

// Pasta pública para PDFs
const pdfDir = path.join(__dirname, "pdfs");
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

app.use("/pdfs", express.static(pdfDir));

// ===============================
// FUNÇÃO GERAR DATA
// ===============================
function dt(d) {
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

// ===============================
// ROTA PRINCIPAL – EMITIR NFSe
// ===============================
app.post("/api/emitir-nfse", async (req, res) => {
  try {
    const { cnpj_prestador, cnpj_tomador, descricao, valor } = req.body;

    if (!cnpj_prestador || !cnpj_tomador || !descricao || !valor) {
      return res.status(400).json({ erro: "Dados incompletos." });
    }

    // Salvar no banco
    const result = await db.query(
      `INSERT INTO notas_focus (cnpj_prestador, cnpj_tomador, descricao, valor, status)
       VALUES ($1, $2, $3, $4, 'emitida') RETURNING id`,
      [cnpj_prestador, cnpj_tomador, descricao, valor]
    );

    const notaId = result.rows[0].id;

    // Criar nome do PDF
    const pdfName = `nfse_${notaId}.pdf`;
    const pdfPath = path.join(pdfDir, pdfName);

    // GERAR PDF
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // --- Cabeçalho ---
    doc.fontSize(22).text("NOTA FISCAL DE SERVIÇO", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Data: ${dt(new Date())}`);
    doc.moveDown();

    // --- Dados Prestador ---
    doc.fontSize(14).text("PRESTADOR", { underline: true });
    doc.text(`CNPJ: ${cnpj_prestador}`);
    doc.moveDown();

    // --- Dados Tomador ---
    doc.fontSize(14).text("TOMADOR", { underline: true });
    doc.text(`CNPJ: ${cnpj_tomador}`);
    doc.moveDown();

    // --- Serviço ---
    doc.fontSize(14).text("DESCRIÇÃO DO SERVIÇO", { underline: true });
    doc.fontSize(12).text(descricao);
    doc.moveDown();

    // --- Valor ---
    doc.fontSize(16).fillColor("#0057ff").text(`VALOR: R$ ${valor}`);
    doc.fillColor("black");

    doc.end();

    stream.on("finish", () => {
      return res.json({
        ok: true,
        dados: {
          id: notaId,
          caminho_pdf: `/pdfs/${pdfName}`
        }
      });
    });

  } catch (erro) {
    console.error("❌ ERRO AO EMITIR:", erro);
    res.status(500).json({ erro: "Erro ao emitir nota." });
  }
});

// ===============================
// INICIAR SERVIDOR
// ===============================
app.listen(3000, () => {
  console.log("✔ Backend rodando em http://localhost:3000");
});










