# 🎬 ASCII Video Studio

> **Renderizador de imagens e vídeos para ASCII Art colorido em tempo real, executado inteiramente no navegador via HTML5 Canvas API, React, TypeScript e Web APIs nativas.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 🔗 Live Demo

👉 **[Acesse a aplicação ao vivo aqui](https://ascii-video-studio.vercel.app/)**

---

## 📌 Sobre o Projeto

O **ASCII Video Studio** é uma aplicação web interativa capaz de transformar arquivos de imagem e vídeo em arte ASCII em tempo real, mantendo as cores RGB originais e o áudio sincronizado.

Diferente de abordagens tradicionais que dependem de renderização no terminal (CLI) ou processamento pesado em servidores via FFmpeg, esta aplicação executa **100% do pipeline de computação gráfica no cliente (Browser-First)**, garantindo privacidade, latência zero e custo de infraestrutura nulo.

---

## 🚀 Funcionalidades

- 📁 **Upload Unificado:** Aceita imagens (`PNG`, `JPEG`, `WebP`) e vídeos (`MP4`, `WebM`).
- 🎨 **Renderização RGB:** Suporte a cores reais mantendo as tonalidades originais do quadro.
- 🎛️ **Controle de Resolução em Tempo Real:** Slider de 40 a 200 colunas ASCII.
- 🔤 **Charsets Preconfigurados:**
  - *Standard* (10 níveis de intensidade)
  - *Detailed* (70 níveis de gradação precisa)
  - *Blocks Retro* (estilo matriz de caracteres)
  - *Minimal* (alto contraste)
- 📸 **Exportação de Imagens:** Download do frame renderizado em alta resolução (`.png`).
- 🎥 **Gravação de Vídeo WebM:** Gravação do canvas renderizado combinando a trilha visual ASCII e a trilha de áudio original (`.webm` via `MediaRecorder API`).
- ⚡ **Monitor de Performance:** Exibição em tempo real do **FPS** e do **Frame Time (ms)**.

---

## 🏗️ Arquitetura do Pipeline de Processamento

A aplicação segue uma arquitetura unidirecional de fluxo de dados de mídia:

```text
┌────────────────────────┐
│  Mídia (Imagem/Vídeo)  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Offscreen Canvas      │  ← Amostragem redimensionada com
│  (drawImage)           │     correção de aspect ratio (0.55)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Uint8ClampedArray     │  ← Acesso a pixels brutos (RGBA)
│  (getImageData)        │     via indexação Row-Major: (y * width + x) * 4
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Pipeline ASCII        │
│  - Luminância BT.601   │  ← L = 0.299R + 0.587G + 0.114B
│  - Mapeamento Charset  │  ← Indexação linear por intervalo de brilho
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Canvas Principal      │  ← Renderização acelerada por GPU
│  (fillText + RGB)      │     utilizando grade monoespaçada
└───────────┬────────────┘
            │
            ├──────────────────────────┐
            ▼                          ▼
 ┌─────────────────────┐    ┌─────────────────────┐
 │ Captura de PNG      │    │ MediaRecorder API   │
 │ (toBlob)            │    │ (Canvas + Audio)    │
 └─────────────────────┘    └─────────────────────┘

```

## ⚡ Decisões Arquiteturais & Otimizações de Performance

### 1. Processamento no Browser vs. Backend (FFmpeg)
* **Decisão:** Processar no cliente via HTML5 Video, Canvas e `requestAnimationFrame`.
* **Justificativa:** Evita o custo de envio de arquivos pesados para servidores, elimina latência de rede e utiliza o elemento `<video>` nativo para garantir a sincronização de áudio sem threads separadas ou gerenciamento manual de buffers.

### 2. Canvas 2D vs. Elementos DOM (`<span>`)
* **Decisão:** Renderização gráfica em `<canvas>` 2D.
* **Justificativa:** Em um vídeo a 30 FPS com 120 colunas e 60 linhas, uma abordagem baseada em DOM exigiria criar/atualizar/destruir cerca de **216.000 tags HTML por segundo**, causando *DOM thrashing*, reflow/paint excessivos e pressão de memória. O Canvas desenha diretamente no buffer gráfico.

### 3. Reciclagem de Offscreen Canvas (Garbage Collection Reduction)
* **Problema:** A alocação repetida de `document.createElement('canvas')` dentro do loop do `requestAnimationFrame` gerava dezenas de objetos por segundo, acionando o Garbage Collector e provocando microtravadas (*jank*).
* **Solução:** O canvas offscreen e seu contexto 2D foram encapsulados em `useRef` e reutilizados em todas as iterações, alterando `width/height` somente quando a resolução muda.

### 4. Frame Skipping por Deduplicação de Tempo
* **Problema:** Em monitores 60Hz/144Hz, o `requestAnimationFrame` pode executar mais rápido do que a taxa de quadros do vídeo (ex.: 30 FPS), reprocessando frames idênticos e desperdiçando CPU.
* **Solução:** Cache do `video.currentTime`. Se o tempo atual for igual ao do ciclo anterior, o cálculo de luminância/renderização é pulado.

### 5. Métricas em Tempo Real
* Exibição de **FPS** e **Frame Time (ms)** durante a reprodução.
* Permite validar empiricamente o impacto da resolução (ex.: 40 vs 200 colunas) sobre o custo de processamento.

---

## 🧪 Estratégia de Testes

A integridade matemática da engine foi validada com **Vitest** + ambiente **jsdom**.

```bash
npm run test:run
```

Cobertura principal:

- **Luminância (ITU-R BT.601):** valida pesos perceptuais (maior peso no verde).
- **pixelToASCII:** mapeamento linear de intensidade para caractere, inversão de brilho e charsets customizados.
- **processImageDataToFrame:** conversão de matriz RGBA em `ASCIIFrame`, preservando RGB por célula.

Resultado da suíte de testes:

```text
Test Files  3 passed (3)
Tests       12 passed (12)
```

---

## 🛠️ Tecnologias Utilizadas

| **Tecnologia** | **Papel no projeto** |
| ------------------------------ | ------------------------------------------------------------ |
| **React + TypeScript**         | UI, estado, composição de hooks e tipagem segura do pipeline |
| **Vite**                       | Tooling moderno de build/dev server                          |
| **HTML5 Canvas API**           | Amostragem de pixels e renderização ASCII/RGB                |
| **HTMLVideoElement**            | Decodificação de vídeo + áudio nativo sincronizado           |
| **MediaRecorder API**           | Exportação de vídeo ASCII (WebM) com áudio                   |
| **Vitest + jsdom**             | Testes unitários da engine                                   |


### O que deliberadamente não foi usado (e por quê)

- **Backend/FFmpeg na v1:** desnecessário para preview e exportação client-side.
- **WebGL/Three.js:** overkill para renderização 2D de texto.
- **WebSocket/DB/Docker:** fora do escopo do produto atual.

---

## 📦 Como Executar Localmente

1. Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/ascii-video-studio.git
cd ascii-video-studio
```

2. Instale as dependências:

```bash
npm install
```

3. Rode em desenvolvimento:

```bash
npm run dev
```

4. Rode os testes:

```bash
npm run test:run
```

5. Build de produção:

```bash
npm run build
npm run preview
```

---

## 📁 Estrutura do Projeto

```text
src/
├── components/     # (evolução futura de UI)
├── engine/         # Núcleo de conversão e renderização
│   ├── luminance.ts
│   ├── asciiConverter.ts
│   ├── processFrame.ts
│   ├── canvasRenderer.ts
│   └── loadImage.ts
├── hooks/          # Orquestração de vídeo e gravação
│   ├── useASCIIVideo.ts
│   └── useASCIIRecorder.ts
├── types/          # Contratos TypeScript do domínio
├── utils/          # Utilitários (ex.: download PNG)
├── App.tsx
└── main.tsx
```

---

## 🧠 Conceitos Técnicos Demonstrados

- Buffer unidimensional de pixels (**`Uint8ClampedArray`**, RGBA)
- Indexação row-major: **`(y * width + x) * 4`**
- Luminância perceptual (BT.601)
- Mapeamento linear de intensidade para charset discreto
- Correção de aspect ratio de fonte monoespaçada (**`~0.55`**)
- Loop de animação com **`requestAnimationFrame`**
- Gestão de memória (**`URL.createObjectURL`** / **`revokeObjectURL`**)
- Exportação client-side (**`canvas.toBlob`**, **`MediaRecorder`**)
- Testes unitários de funções puras

---

## ⚠️ Limitações Conhecidas

- Formatos de vídeo limitados ao suporte do browser (principalmente MP4/H.264 e WebM).
- Performance depende do hardware do cliente (CPU/GPU) e da resolução escolhida.
- Gravação exporta preferencialmente **WebM** (suporte varia por navegador/player).
- No modo imagem, mudança de colunas reprocessa o **`ImageData`** amostrado.

---

## 🗺️ Roadmap Futuro

- Reamostragem real de imagem ao alterar colunas (a partir do **`File`** original)
- Web Workers para isolamento do processamento pesado da UI thread
- Presets de qualidade (Performance / Balanced / Quality)
- Melhorias de UX (drag & drop, timeline, atalhos de teclado)
- Exportação avançada e opções de codec quando disponíveis

---

## 👤 Autor

Desenvolvido por **Ricardo**.

- LinkedIn: [**Ricardo da S. Sousa**](https://linkedin.com/in/ricardo-dev13)

---

## 💡 Inspiração

Este projeto teve como inspiração o trabalho de **Niladri Pal**, especialmente seu projeto **ASCII Art**, que explora a conversão de frames de vídeo em arte ASCII utilizando processamento de vídeo.

A partir dessa inspiração, busquei desenvolver uma abordagem própria, trazendo o conceito para uma aplicação web moderna e interativa, utilizando **React, TypeScript e APIs nativas do navegador**, com processamento e exportação realizados diretamente no client-side.

🔗 **Projeto que serviu de inspiração:** [ASCII Art — Niladri Pal](https://github.com/RipperdocNiladri/ASCII-Art)

👤 **Perfil no GitHub:** [@RipperdocNiladri](https://github.com/RipperdocNiladri)

> Este projeto não é uma cópia do trabalho original. A proposta foi utilizar a ideia como ponto de partida para estudar e explorar uma implementação própria, com uma arquitetura voltada para aplicações web.

---
## 📄 Licença

Este projeto está sob a licença MIT.