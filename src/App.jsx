  import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';        // Biblioteca de Machine Learning
import Papa from 'papaparse';                  // Leitor de arquivos CSV
import { Chart } from 'chart.js/auto';         // Biblioteca de gráficos
import './App.css';                            // Estilo visual da aplicação

function App() {
  //  Estados principais da aplicação
  const [data, setData] = useState([]);                   // Dados processados do CSV
  const [warnings, setWarnings] = useState([]);           // Linhas ignoradas com erro
  const [model, setModel] = useState(null);               // Modelo treinado (TensorFlow)
  const [message, setMessage] = useState('Selecione um arquivo CSV.');
  const [input, setInput] = useState({ tamanho: 100, banheiros: 2, quartos: 2 }); // Entrada para previsão
  const [prediction, setPrediction] = useState(null);     // Resultado da previsão
  const [isTrained, setIsTrained] = useState(false);      // Estado se o modelo já foi treinado

  //  Referências para os elementos canvas de cada gráfico
  const chartLossRef = useRef(null);
  const chartRealRef = useRef(null);
  const chartResiduoRef = useRef(null);
  const chartM2Ref = useRef(null);

  //  Referências para os objetos Chart.js, para destruir e recriar quando necessário
  const chartLoss = useRef(null);
  const chartReal = useRef(null);
  const chartResiduo = useRef(null);
  const chartM2 = useRef(null);

  const MAX_TAMANHO = 250;
  const MAX_PRECO = 2000000;

  //  Carrega e processa o arquivo CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Resetando estados e gráficos
    setModel(null);
    setPrediction(null);
    setIsTrained(false);
    setMessage("Lendo e validando CSV...");

    [chartLoss, chartReal, chartResiduo, chartM2].forEach(ref => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      // Usando PapaParse para extrair os dados
      const parsed = Papa.parse(event.target.result, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      const registros = [];
      const avisos = [];

      // Validação linha por linha
      parsed.data.forEach((row, index) => {
        const keys = Object.keys(row).map(k => k.trim().toLowerCase());
        const tamanho = row[keys.find(k => k.includes("tamanho"))];
        const banheiros = row[keys.find(k => k.includes("banheiro"))];
        const quartos = row[keys.find(k => k.includes("quarto"))];
        const preco = row[keys.find(k => k.includes("preco"))];

        if ([tamanho, banheiros, quartos, preco].every(v => typeof v === "number")) {
          registros.push({ x: [tamanho, banheiros, quartos], y: preco });
        } else {
          avisos.push(`Linha ${index + 2} ignorada: ${JSON.stringify(row)}`);
        }
      });

      setData(registros);
      setWarnings(avisos);
      setMessage(`${registros.length} válidos |  ${avisos.length} ignorados`);
    };

    reader.readAsText(file);
  };

  // Treinamento do modelo de Regressão
  const handleTrainModel = async () => {
    setMessage("Treinando modelo...");

    const xs = tf.tensor2d(data.map(d => d.x));     // Entradas: tamanho, banheiros, quartos
    const ys = tf.tensor2d(data.map(d => [d.y]));   // Saída: preço

    //  Definindo o modelo
    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ inputShape: [3], units: 1 }));
    newModel.compile({ optimizer: tf.train.adam(0.1), loss: 'meanSquaredError' });

    //  Gráfico do erro durante o treinamento
    const ctxLoss = chartLossRef.current.getContext('2d');
    chartLoss.current = new Chart(ctxLoss, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Erro (Loss)', data: [], borderColor: '#f00', tension: 0.3 }] },
      options: {
        animation: false,
        scales: {
          x: { title: { text: 'Época', display: true } },
          y: { title: { text: 'Loss', display: true } }
        }
      }
    });

    await newModel.fit(xs, ys, {
      epochs: 50, //Número de épocas de treinamento
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          chartLoss.current.data.labels.push(epoch + 1);
          chartLoss.current.data.datasets[0].data.push(logs.loss);
          chartLoss.current.update();
        }
      }
    });

    setModel(newModel);
    setIsTrained(true);
    setMessage("Modelo treinado com sucesso!");

    //  Após treinamento, renderiza os gráficos complementares
    setTimeout(async () => {
      const previsoes = await newModel.predict(xs).array();
      const reais = data.map(d => d.y);
      const previstos = previsoes.map(p => p[0]);
      const residuos = reais.map((v, i) => v - previstos[i]);

      //  Comparativo Real x Previsto
      const ctxReal = chartRealRef.current?.getContext('2d');
      if (ctxReal) {
        chartReal.current = new Chart(ctxReal, {
          type: 'line',
          data: {
            labels: reais.map((_, i) => i + 1),
            datasets: [
              { label: 'Valor Real', data: reais, borderColor: '#72bdfaff', fill: false },
              { label: 'Valor Previsto', data: previstos, borderColor: '#ff0000ff', fill: false }
            ]
          },
          options: {
            responsive: true,
            scales: {
              x: { title: { text: 'Índice', display: true } },
              y: { title: { text: 'Preço', display: true } }
            }
          }
        });
      }

      // Gráfico de Resíduos
      const ctxResiduo = chartResiduoRef.current?.getContext("2d");
      if (ctxResiduo) {
        chartResiduo.current = new Chart(ctxResiduo, {
          type: 'bar',
          data: {
            labels: residuos.map((_, i) => i + 1),
            datasets: [{
              label: 'Resíduo (Real - Previsto)',
              data: residuos,
              backgroundColor: '#a87f02ff'
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: { title: { text: 'Índice', display: true } },
              y: { title: { text: 'Diferença (R$)', display: true } }
            }
          }
        });
      }

      // Gráfico de Preço por Metro Quadrado
      const desnorm = data.map((d, i) => {
        const tamanho_m2 = d.x[0] * MAX_TAMANHO;
        const preco_real = previstos[i] * MAX_PRECO;
        const preco_m2 = preco_real / tamanho_m2;
        return { id: i + 1, preco_m2: preco_m2.toFixed(2) };
      });

      const ctxM2 = chartM2Ref.current?.getContext("2d");
      if (ctxM2) {
        chartM2.current = new Chart(ctxM2, {
          type: 'bar',
          data: {
            labels: desnorm.map(d => `#${d.id}`),
            datasets: [{
              label: 'Preço por m² (R$)',
              data: desnorm.map(d => parseFloat(d.preco_m2)),
              backgroundColor: "rgba(75, 192, 192, 0.6)"
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Preço por Metro Quadrado' }
            },
            scales: {
              x: { title: { display: true, text: 'Imóvel' } },
              y: { title: { display: true, text: 'R$/m²' } }
            }
          }
        });
      }
    }, 0);
  };

  // Atualiza campos do formulário de previsão
  const handleInputChange = (e) => {
    const nome = e.target.name;
    const valor = e.target.value;

    // Atualiza o estado com o novo valor
    setInput((prevInput) => ({
      ...prevInput,
      [nome]: Number(valor)
    }));
  };

  // Realiza a previsão com os dados inseridos
  const handlePredict = () => {
    if (!model) return;

    const tensor = tf.tensor2d([[
      input.tamanho / MAX_TAMANHO,
      input.banheiros,
      input.quartos
    ]]);

    model.predict(tensor).array().then((res) => {
      setPrediction(res[0][0]);
    });
  };

  // Renderização do App.jsx
  return (
    <div className="App">
      <h1>Machine Learning – Avaliação Visual</h1>

      {/* Upload do CSV */}
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <p>{message}</p>

      {/* Avisos de dados ignorados */}
      {warnings.length > 0 && (
        <ul>
          {warnings.slice(0, 5).map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {/* Botão de treinamento do modelo */}
      {data.length > 0 && !isTrained && (
        <button onClick={handleTrainModel}>Treinar Modelo</button>
      )}

      {/* Gráficos após carregamento e treinamento */}
      {data.length > 0 && (
        <div className="charts-container">
          <div>
            <h3>Erro durante o Treinamento</h3>
            <canvas ref={chartLossRef} className="chart"></canvas>
          </div>
          <div>
            <h3>Comparativo: Real x Previsto</h3>
            <canvas ref={chartRealRef} className="chart"></canvas>
          </div>
          <div>
            <h3>Gráfico de Resíduos</h3>
            <canvas ref={chartResiduoRef} className="chart"></canvas>
          </div>
          <div>
            <h3>Preço por Metro Quadrado</h3>
            <canvas ref={chartM2Ref} className="chart"></canvas>
          </div>
        </div>
      )}

      {/* Formulário para prever com entrada manual */}
      {isTrained && (
        <div className="prediction-form">
          <h2>Prever Valor do Imóvel</h2>

          <label>
            Tamanho (m²):
            <input
              type="number"
              name="tamanho"
              value={input.tamanho}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Banheiros:
            <input
              type="number"
              name="banheiros"
              value={input.banheiros}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Quartos:
            <input
              type="number"
              name="quartos"
              value={input.quartos}
              onChange={handleInputChange}
            />
          </label>

          <button onClick={handlePredict}> Prever</button>

          {/* Mostra o resultado final da previsão */}
          {prediction !== null && (
            <p>
              Preço estimado:{' '}
              <strong>
                {(prediction * MAX_PRECO).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
