# Metro Autómata CDMX — Motor Universal AFN-ε → AFD (Método de 4 Láminas)

Simulador 3D y cuaderno de estudio interactivo inspirado en la red del **Metro CDMX**, potencializado como **motor universal paso a paso** para dominar la conversión completa de **Expresión Regular / AFN-ε → AFD** siguiendo el método exacto de clase en 4 láminas.

## Método de las 4 Láminas Implementado

1. **Lámina 1 · Expresión Regular → Diagrama AFN-ε (`Stage1Roots`, `MetroMapNFA`)**
   - Compila cualquier Expresión Regular (operadores `|`, `*`, `+`, `?`, `()`, `ε` y cualquier alfabeto) a un diagrama AFN-ε compacto usando pasillos gratis `ε` (como en el Ejercicio A2 `(ab)a*`).
   - Incluye editor gráfico manual para definir estados propios, alfabeto, `Inicio`, `EF` y transiciones `ε` o por símbolo.
   - Simulador 2D y 3D del **Pasajero Fantasma** para visualizar clones simultáneos.

2. **Lámina 2 · Cerradura Épsilon y Regla de los 3 Pasos (`Stage2Closure`)**
   - Tabla completa `1. ε-C(x) → 2. δ(x, σ) → 3. ε-C(...) → AFN(σ)` con columnas dinámicas para cada símbolo del alfabeto `Σ`.
   - Muestra **EF original** vs **EF nuevo** (`1` si `ε-C(x) ∩ Finales ≠ ∅`) y la **Tabla Resumen AFN** junto a los conjuntos candidatos del AFD.
   - Incluye Modo Guiado (tubería animada de 4 cajas + resaltado en mapa), Mini-Reto `ε-C(x)` y Modo Práctica interactivo.

3. **Lámina 3 · Construcción de Subconjuntos en Orden BFS (`Stage3Subset`)**
   - Descubre los Súper-Estados AFD fila por fila en orden exacto BFS comenzando desde `[ε-C(Inicio)]`.
   - Explica dinámicamente la **Regla de Oro de la Unión**, cuándo se expande el inicio por `ε`, y cuándo nace el estado trampa/pozo **`[∅]`**.
   - Vista lado a lado: Tabla AFN izquierda (con miembros resaltados) + Tabla AFD interactiva derecha.

4. **Lámina 4 · De Tabla a Diagrama Gráfico, Pizarra y Minimización (`Stage4Simulator`, `MetroMapDFA`)**
   - Diagrama AFD completo con doble círculo verde para `EF = 1` y lazos al estado pozo `[∅]`.
   - **Pizarra de Pruebas en Lote** para validar múltiples cadenas simultáneamente y animar cualquier caso en el mapa.
   - **Paso Bonus (Minimización de Hopcroft)** mostrando las particiones sucesivas y la tabla del AFD mínimo equivalente.
   - **Mini-Quiz automático** por ejercicio.

## Capacidades Extra Incluidas

- **Banco de 7 Ejercicios Pre-cargados**: incluye **Ejercicio A2 · `(ab)a*`** (con la nomenclatura original Pantitlán → Chabacano/Tacubaya → Universidad), `(a|b)*abb`, `a(b|c)*`, `(a|b)+`, `a*b*`, `(0|1)*1` y `a?b+`.
- **Motor Híbrido de Tutoría (`GeminiMetroLab`)**: usa `@google/genai` cuando `GEMINI_API_KEY` está configurada en el servidor, con respaldo determinístico local calculado sobre el ejercicio activo cuando se ejecuta sin API Key.
- **Exportación de Estudio (`MethodWorkbench`)**: descarga la guía completa de las 4 láminas en **Markdown (`.md`)** o especificación **JSON**, o imprime en PDF directamente desde el navegador.

## Ejecución Local y Verificación

```bash
# Instalar dependencias
npm install   # o bun install

# Servidor de desarrollo (Frontend + API Express / Vite)
npm run dev

# Verificación de tipos TypeScript
npm run lint

# Compilación de producción
npm run build
```
