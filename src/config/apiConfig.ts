const loadApiConfig = async () => {
  const response = await fetch('/apiConfig.json'); // Asegúrate de que el archivo esté en el directorio `dist` o `public`
  const config = await response.json();
  return config;
};

export default loadApiConfig;
