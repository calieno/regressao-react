import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';
import { Chart } from 'chart.js/auto';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [model, setModel] = useState(null);
  const [message, setMessage] = useState('Selecione um arquivo CSV.');
  const [input, setInput] = useState({ tamanho: 100, banheiros: 2, quartos: 2 });
  const [prediction, setPrediction] = useState(null);
  const [isTrained, setIsTrained] = useState(false);

  const chartLossRef = useRef(null);
  const chartRealRef = useRef(null);
  const chartResiduoRef = useRef(null);
  const chartM2Ref = useRef(null);

  const chartLoss = useRef(null);
  const chartReal = useRef(null);
  const chartResiduo = useRef(null);
  const chartM2 = useRef(null);

  const MAX_TAMANHO = 250;
  const MAX_PRECO = 2000000;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setModel(null);
    setPrediction(null);
    setIsTrained(false);
    setMessage("📂 Lendo e validando CSV...");

    [chartLoss, chartReal, chartResiduo, chartM2].forEach(ref => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = Papa.parse(event.target.result, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      const registros = [];
      const avisos = [];

      parsed.data.forEach((row, index) => {
        const keys = Object.keys(row).map(k => k.trim().toLowerCase());
        const tamanho = row[keys.find(k => k.includes("tamanho"))];
        const banheiros = row[keys.find(k => k.includes("banheiro"))];
        const quartos = row[keys.find(k => k.includes("quarto"))];
        const preco = row[keys.find(k => k.includes("preco"))];

        if ([tamanho, banheiros, quartos, preco].every(v => typeof v === "number")) {
          registros.push({ x: [tamanho, banheiros, quartos], y: preco });
        } else {
          avisos.push(`❌ Linha ${index + 2} ignorada: ${JSON.stringify(row)}`);
        }
      });

      setData(registros);
      setWarnings(avisos);
      setMessage(`✅ ${registros.length} válidos | ⚠️ ${avisos.length} ignorados`);
    };

    reader.readAsText(file);
  };

  const handleTrainModel = async () => {
    setMessage("🚀 Treinando modelo...");
    const xs = tf.tensor2d(data.map(d => d.x));
    const ys = tf.tensor2d(data.map(d => [d.y]));

    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ inputShape: [3], units: 1 }));
    newModel.compile({ optimizer: tf.train.adam(0.1), loss: 'meanSquaredError' });

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
      epochs: 100,
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
    setMessage("✅ Modelo treinado com sucesso!");

    // Espera o DOM renderizar os canvases
    setTimeout(async () => {
      const previsoes = await newModel.predict(xs).array();
      const reais = data.map(d => d.y);
      const previstos = previsoes.map(p => p[0]);
      const residuos = reais.map((v, i) => v - previstos[i]);

      // Real vs Previsto
      const ctxReal = chartRealRef.current?.getContext('2d');
      if (ctxReal) {
        chartReal.current = new Chart(ctxReal, {
          type: 'line',
          data: {
            labels: reais.map((_, i) => i + 1),
            datasets: [
              { label: 'Valor Real', data: reais, borderColor: '#2196F3', fill: false },
              { label: 'Valor Previsto', data: previstos, borderColor: '#FF9800', fill: false }
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
              backgroundColor: '#FFC107'
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

      // Gráfico Preço por metro quadrado
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
              title: { display: true, text: '📏 Preço por Metro Quadrado' }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handlePredict = () => {
    if (!model) return;
    //const tensor = tf.tensor2d([[input.tamanho, input.banheiros, input.quartos]]);
    const tensor = tf.tensor2d([[
      input.tamanho / MAX_TAMANHO,
      input.banheiros,
      input.quartos
    ]]);

    model.predict(tensor).array().then(res => setPrediction(res[0][0]));
  };

  return (
    <div className="App">
      <h1>🧠 Machine Learning Didático – Avaliação Visual</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <p>{message}</p>

      {warnings.length > 0 && <ul>{warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}</ul>}

      {data.length > 0 && !isTrained && <button onClick={handleTrainModel}>📚 Treinar Modelo</button>}

      {data.length > 0 && (
          <div className="charts-container">
            <div>
              <h3>📉 Erro durante o Treinamento</h3>
              <canvas ref={chartLossRef} className="chart"></canvas>
            </div>
            <div>
              <h3>📊 Comparativo: Real x Previsto</h3>
              <canvas ref={chartRealRef} className="chart"></canvas>
            </div>
            <div>
              <h3>📊 Gráfico de Resíduos</h3>
              <canvas ref={chartResiduoRef} className="chart"></canvas>
            </div>
            <div>
              <h3>📏 Preço por Metro Quadrado</h3>
              <canvas ref={chartM2Ref} className="chart"></canvas>
            </div>
        </div>
      )}

      {isTrained && (
        <div className="prediction-form">
          <h2>📈 Prever Valor do Imóvel</h2>
          <label>
            Tamanho (m²):
            <input type="number" name="tamanho" value={input.tamanho} onChange={handleInputChange} />
          </label>
          <label>
            Banheiros:
            <input type="number" name="banheiros" value={input.banheiros} onChange={handleInputChange} />
          </label>
          <label>
            Quartos:
            <input type="number" name="quartos" value={input.quartos} onChange={handleInputChange} />
          </label>
          <button onClick={handlePredict}>🎯 Prever</button>

          {prediction !== null && (
            <p>
              💰 Preço estimado: <strong>
                {(prediction * MAX_PRECO).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
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
