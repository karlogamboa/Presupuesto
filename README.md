# Presupuesto - Interfaz de Solicitud de Presupuesto

Este proyecto es una aplicación web construida con Vite, React y TypeScript para la gestión y Solicitud de Presupuesto.

## Características
- Formulario dinámico para solicitar gastos.
- Listas desplegables alimentadas desde backend.
- Autocompletado de campos clave.
- Listado de resultados con información personal, gasto, presupuesto y estatus de confirmación.

## Scripts principales
- `npm run dev` — Ejecuta la app en modo desarrollo.
- `npm run build` — Compila la app para producción.
- `npm run preview` — Previsualiza la app compilada.

## Estructura sugerida
- `src/components/` — Componentes reutilizables.
- `src/pages/` — Vistas principales.
- `src/services/` — Lógica para consumir el backend.

## Personalización
Adapta los endpoints y la lógica de autocompletado según tu backend.

---

Desarrollado con Vite + React + TypeScript.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
"# Presupuesto" 
