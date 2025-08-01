import React, { useState } from 'react';
import Papa from 'papaparse';

function ValidadorCSV() {
  const [arquivo, setArquivo] = useState(null);
  const [dados, setDados] = useState([]);
  const [log, setLog] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setArquivo(file);
  };

  const validarCSV = (texto) => {
    const resultado = Papa.parse(texto, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const registros = [];
    const avisos = [];

    resultado.data.forEach((linha, index) => {
      const keys = Object.keys(linha).map(k => k.trim());
      const tamanho = linha[keys.find(k => k.toLowerCase().includes("tamanho"))];
      const banheiros = linha[keys.find(k => k.toLowerCase().includes("banheiro"))];
      const quartos = linha[keys.find(k => k.toLowerCase().includes("quarto"))];
      const preco = linha[keys.find(k => k.toLowerCase().includes("preco"))];

      const valido = [tamanho, banheiros, quartos, preco].every(
        val => typeof val === 'number' && !isNaN(val)
      );

      if (valido) {
        registros.push({ tamanho, banheiros, quartos, preco });
      } else {
        avisos.push(`❌ Linha ${index + 2} ignorada: ${JSON.stringify(linha)}`);
      }
    });

    setDados(registros);
    setLog(avisos);
  };

  const processarArquivo = () => {
    const reader = new FileReader();
    reader.onload = (e) => validarCSV(e.target.result);
    reader.readAsText(arquivo);
  };

  return (
    <div className="validador">
      <h2>🧪 Validador de CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={processarArquivo} disabled={!arquivo}>Validar</button>

      <h3>✅ Registros Válidos: {dados.length}</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Tamanho</th>
            <th>Banheiros</th>
            <th>Quartos</th>
            <th>Preço</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((row, i) => (
            <tr key={i}>
              <td>{row.tamanho}</td>
              <td>{row.banheiros}</td>
              <td>{row.quartos}</td>
              <td>{row.preco}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>⚠️ Avisos:</h3>
      <ul>
        {log.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  );
}

export default ValidadorCSV;
