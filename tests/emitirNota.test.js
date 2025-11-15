process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../index");

describe("Teste da emissão de nota", () => {
  it("Deve emitir nota com sucesso", async () => {
    const resp = await request(app)
      .post("/api/emitir-nfse")
      .send({
        cnpj_prestador: "11111111111111",
        cnpj_tomador: "22222222222222",
        descricao: "Serviço de teste",
        valor: 150,
      });

    expect(resp.statusCode).toBe(200);
    expect(resp.body.mensagem).toBe("Nota gerada com sucesso!");
    expect(resp.body.dados).toHaveProperty("caminho_pdf");
  });
});

