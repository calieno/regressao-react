# 🧠 Machine Learning

Este projeto tem como objetivo **demonstrar de forma didática o treinamento de um modelo de regressão linear** usando dados reais de imóveis, apresentando **visualizações gráficas interativas** do processo e dos resultados.

Desenvolvido com foco em aprendizado, clareza e interatividade.

---
## 🚀 Funcionalidades

- 📂 Leitura de arquivos CSV com dados de imóveis
- 🧠 Treinamento de modelo de regressão com TensorFlow.js
- 📉 Visualização do erro durante o treinamento
- 📊 Comparação entre valores reais e previstos
- 📐 Gráfico de resíduos (real - previsto)
- 💰 Cálculo do preço por metro quadrado
- 🎯 Previsão de valor a partir de campos personalizados

---
## 🛠 Tecnologias Utilizadas

| Tecnologia       | Finalidade                        |
|------------------|-----------------------------------|
| React            | Interface e gerenciamento de estado |
| TensorFlow.js    | Treinamento e previsão de modelo    |
| PapaParse        | Leitura e parse de arquivos CSV     |
| Chart.js         | Geração de gráficos interativos     |

---
## 📁 Estrutura do Projeto

regressao-react/
├── public/
├── src/
│   ├── App.jsx          # Lógica principal do app
│   ├── App.css          # Estilos visuais
├── GerarCSV.py          # Script para gerar dados sintéticos
├── package.json         # Definição de dependências

---
## 📦 Instalação e Execução

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

# Instale as dependências
npm install

# Inicie o projeto
npm start
```
---
## 📦 Arquivo CSV

 O CSV devará ter o seguinte formato:

    tamanho,banheiros,quartos,preco
    120,2,3,450000
    85,1,2,320000
    200,4,4,890000


* Para gerar um arquivo CSV de exemplo, pode ser executado o script python GerarCSV.py na raiz do diretório.
```bash 
python GerarCSV.py
```
---
## 📷 Visualizações Geradas
Erro durante o treinamento: evolução da métrica loss por época

Real x Previsto: comparação gráfica entre os valores reais e previstos

Gráfico de Resíduos: diferenças entre real e previsto

Preço por metro quadrado: estimativa detalhada por imóvel

Todos os gráficos são renderizados com Chart.js e atualizados dinamicamente durante o uso.

---
## 🎓 Propósito Educacional
Este projeto é voltado para fins acadêmicos e demonstra:

Como integrar aprendizado de máquina no frontend com JavaScript

Como visualizar métricas e validação de modelo em tempo real

Como lidar com arquivos de dados reais dentro de aplicações React

---
## 🧾 Nota Institucional
Esse script é parte integrante de um artigo sobre Inteligência Artificial, entregue no [UNIFOA](http://unifoa.edu.br), como conclusão da disciplina Projeto Integrado à Sociedade II.

👨‍🎓 Alunos participantes:
* Luciano Ribeiro de Abreu
* Luis Fernando de Oliveira Maia  
* Willyan Fernandes Sotero 
