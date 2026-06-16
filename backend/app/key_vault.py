import os
from typing import Optional
from backend.app.config import settings

class KeyVaultService:
    def __init__(self):
        self.client = None
        if settings.AZURE_KEYVAULT_URL:
            try:
                from azure.identity import DefaultAzureCredential
                from azure.keyvault.secrets import SecretClient
                
                credential = DefaultAzureCredential()
                self.client = SecretClient(vault_url=settings.AZURE_KEYVAULT_URL, credential=credential)
                print(f"[KeyVault] Connected to Azure Key Vault at: {settings.AZURE_KEYVAULT_URL}")
            except Exception as e:
                print(f"[KeyVault] Error initializing Azure Key Vault: {e}. Falling back to env variables.")
                self.client = None

    def get_secret(self, secret_name: str, default_value: Optional[str] = None) -> Optional[str]:
        """Retrieves a secret value. Checks Key Vault first, then env variables, then default value."""
        if self.client:
            try:
                secret = self.client.get_secret(secret_name)
                return secret.value
            except Exception as e:
                print(f"[KeyVault] Failed to fetch secret '{secret_name}' from Azure: {e}")
        
        # Fallback to local env variables
        env_val = os.getenv(secret_name)
        if env_val is not None:
            return env_val
            
        return default_value

key_vault = KeyVaultService()
