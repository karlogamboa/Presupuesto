// Tipos para la configuración de Okta obtenida desde el backend
export interface OktaConfig {
  issuer: string;
  clientId: string;
}

// Tipo para la respuesta del endpoint de configuración
export interface OktaConfigResponse extends OktaConfig {
  // Puedes agregar campos adicionales si el backend los provee
  error?: string;
}
