// index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('./db'); // importa a conexão com o PostgreSQL

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 📂 Torna a pasta /pdfs pública
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// 🧠 Rota de teste (verifica se o servidor está ativo)
app.get('/', (req, res) => {
  res.send('✅ Servidor backend rodando!');
});

// 🧾 Rota para emitir nota fiscal e gerar PDF
app.post('/api/notas', async (req, res) => {
  try {
    const { emissor, destinatario, valor } = req.body;

    // Salva no banco
    await db.query(
      'INSERT INTO notas (emissor_cnpj, destinatario_cnpj, valor) VALUES ($1, $2, $3)',
      [emissor, destinatario, valor]
    );

    // Garante que a pasta /pdfs exista
    const dir = path.join(__dirname, 'pdfs');
    fs.mkdirSync(dir, { recursive: true });

    // Gera PDF
    const fileName = `nota-${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('NOTA FISCAL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Emissor: ${emissor}`);
    doc.text(`Destinatário: ${destinatario}`);
    doc.text(`Valor: R$ ${valor}`);
    doc.end();

    stream.on('finish', () => {
      res.json({
        message: '✅ Nota fiscal emitida com sucesso!',
        pdf: `/pdfs/${fileName}`
      });
    });
  } catch (err) {
    console.error('❌ Erro ao gerar nota:', err);
    res.status(500).json({ error: 'Erro ao gerar nota fiscal.' });
  }
});

// 🚀 Inicializa o servidor
app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
// rota para emitir nota fiscal real via NFE.io
app.post('/api/emitir-nfe', async (req, res) => {
  const { emissor, destinatario, valor } = req.body;

  try {
    const response = await fetch('https://api.nfe.io/v1/companies/{SEU_ID_EMPRESA}/serviceinvoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic SUA_CHAVE_API_AQUI' // use sua API Key da NFE.io
      },
      body: JSON.stringify({
        cityServiceCode: "2690", // código de serviço (ex: transporte)
        description: "Serviço de transporte de carga",
        servicesAmount: valor,
        borrower: {
          federalTaxNumber: destinatario.replace(/[^\d]/g, ""), // CNPJ do cliente
          name: "Cliente Oliveira Transportes"
        },
        borrowerEmail: "cliente@email.com"
      })
    });

    const data = await response.json();
    console.log("✅ Retorno da NFE.io:", data);

    res.json({
      message: "✅ Nota fiscal MEI emitida com sucesso!",
      nf_number: data.number,
      pdf: data.pdf.url
    });
  } catch (err) {
    console.error("Erro ao emitir nota fiscal real:", err);
    res.status(500).json({ error: "Falha na emissão da NF-e MEI." });
  }
});
