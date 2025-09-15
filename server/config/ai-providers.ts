// Configuración de proveedores de IA
export interface AIProvider {
  name: string;
  type: 'openai' | 'ollama' | 'groq' | 'together' | 'huggingface';
  enabled: boolean;
  config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    name: 'OpenAI',
    type: 'openai',
    enabled: false,
    config: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o'
    }
  },
  ollama: {
    name: 'Ollama (Local)',
    type: 'ollama',
    enabled: true,
    config: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: 'llama3.2:latest'
    }
  },
  groq: {
    name: 'Groq',
    type: 'groq',
    enabled: false,
    config: {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-70b-versatile'
    }
  },
  together: {
    name: 'Together AI',
    type: 'together',
    enabled: false,
    config: {
      apiKey: process.env.TOGETHER_API_KEY,
      baseUrl: 'https://api.together.xyz/v1',
      model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo'
    }
  },
  huggingface: {
    name: 'Hugging Face',
    type: 'huggingface',
    enabled: false,
    config: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co/models',
      model: 'microsoft/DialoGPT-medium'
    }
  }
};

// Función para obtener el proveedor activo
export function getActiveProvider(): AIProvider | null {
  const activeProvider = Object.values(AI_PROVIDERS).find(provider => provider.enabled);
  return activeProvider || null;
}

// Función para cambiar el proveedor activo
export function setActiveProvider(providerName: string): boolean {
  // Desactivar todos
  Object.values(AI_PROVIDERS).forEach(provider => {
    provider.enabled = false;
  });
  
  // Activar el seleccionado
  if (AI_PROVIDERS[providerName]) {
    AI_PROVIDERS[providerName].enabled = true;
    return true;
  }
  
  return false;
}
