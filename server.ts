import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/api/ask-why', async (req, res) => {
    const { question, stageContext } = req.body as {
      question?: string;
      stageContext?: string;
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Escribe una pregunta de "¿Por qué?" antes de enviar.' });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'La clave de Gemini no está configurada en el servidor. Revisa Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Contexto actual del estudiante en la app: ${stageContext || 'Ejercicio A2 (ab)a*'}.\n\nPregunta del estudiante: ${question.trim()}`,
        config: {
          systemInstruction:
            'Eres un profesor paciente de la Ciudad de México que explica Teoría de Autómatas (AFN-ε → AFN → AFD) sin tecnicismos pesados, usando siempre la analogía de estaciones, boletos (a, b), torniquetes y pasillos peatonales gratis (ε) del Metro CDMX. El ejercicio base es (ab)a* con estaciones A(Pantitlán) --a--> B(Pino Suárez) --b--> C(Tacubaya), donde C tiene pasillos ε hacia D(Chabacano) y F(Zócalo salida), D --a--> E(Hidalgo), y E tiene pasillos ε hacia D y F. El AFD final tiene [A], [B], [∅] (Vía Muerta), [C,D,F] (EF=1) y [E,D,F] (EF=1). Responde en español claro, directo, en máximo 3 párrafos cortos, explicando SIEMPRE el "por qué" desde la raíz lógica.',
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({ error: 'No se recibió respuesta del tutor. Intenta reformular tu duda.' });
        return;
      }

      res.json({ answer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar el tutor.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/generate-practice', async (req, res) => {
    const { regexPattern } = req.body as { regexPattern?: string };
    const chosenRegex = (regexPattern || 'a(ba)*').trim();

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'La clave de Gemini no está configurada en el servidor. Revisa Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Crea un mini-reto educativo tipo Metro CDMX para la expresión regular "${chosenRegex}" usando el alfabeto {a, b}. Debe explicar por qué necesita transbordos ε o vía muerta [∅], dar ejemplos válidos/inválidos y plantear 1 pregunta lógica de opción múltiple con 4 opciones.`,
        config: {
          systemInstruction:
            'Eres un diseñador de acertijos educativos sobre autómatas usando el Metro CDMX en español sencillo y lógico.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título corto de la ruta del Metro' },
              regex: { type: Type.STRING, description: 'La expresión regular del reto' },
              metroStory: {
                type: Type.STRING,
                description: 'Analogía clara de 2-3 frases explicando cómo funciona la ruta con boletos y transbordos gratis ε',
              },
              epsilonQuestion: {
                type: Type.STRING,
                description: 'Pregunta de razonamiento lógico "¿Por qué...?" o de transbordo sobre esta ruta',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactamente 4 opciones de respuesta',
              },
              correctIndex: {
                type: Type.INTEGER,
                description: 'Índice de la respuesta correcta (0 a 3)',
              },
              explanation: {
                type: Type.STRING,
                description: 'Explicación raíz de por qué esa es la respuesta correcta',
              },
              validSamples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 cadenas aceptadas por la expresión regular',
              },
              invalidSamples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 cadenas rechazadas que caerían a la Vía Muerta [∅]',
              },
            },
            required: [
              'title',
              'regex',
              'metroStory',
              'epsilonQuestion',
              'options',
              'correctIndex',
              'explanation',
              'validSamples',
              'invalidSamples',
            ],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generando nuevo reto.';
      res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Metro Automata server listening on http://localhost:${PORT}`);
  });
}

startServer();
