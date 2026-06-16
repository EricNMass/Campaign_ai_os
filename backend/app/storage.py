import os
import shutil
from typing import Optional
from backend.app.config import settings

class StorageService:
    def __init__(self):
        self.blob_service_client = None
        self.container_client = None
        
        if settings.AZURE_STORAGE_CONNECTION_STRING:
            try:
                from azure.storage.blob import BlobServiceClient
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    settings.AZURE_STORAGE_CONNECTION_STRING
                )
                self.container_client = self.blob_service_client.get_container_client(
                    settings.AZURE_STORAGE_CONTAINER
                )
                if not self.container_client.exists():
                    self.container_client.create_container()
                print(f"[Storage] Connected to Azure Blob container: {settings.AZURE_STORAGE_CONTAINER}")
            except Exception as e:
                print(f"[Storage] Error initializing Azure Storage: {e}. Using local storage.")
                self.blob_service_client = None

    def store_file(self, local_source_path: str, destination_subfolder: str, filename: str) -> str:
        """Stores a file in local or cloud storage. Returns the absolute file path or public URL."""
        # Standard local copy first
        local_dest_dir = os.path.join(settings.STORAGE_DIR, destination_subfolder)
        os.makedirs(local_dest_dir, exist_ok=True)
        local_dest_path = os.path.join(local_dest_dir, filename)
        
        # Avoid duplicate copy if file is already there
        if os.path.abspath(local_source_path) != os.path.abspath(local_dest_path):
            shutil.copy2(local_source_path, local_dest_path)
            
        # Upload to Azure Blobs if active
        if self.blob_service_client and self.container_client:
            try:
                blob_name = f"{destination_subfolder}/{filename}"
                blob_client = self.container_client.get_blob_client(blob_name)
                with open(local_dest_path, "rb") as data:
                    blob_client.upload_blob(data, overwrite=True)
                # Return URL to Azure resource
                return blob_client.url
            except Exception as e:
                print(f"[Storage] Azure Upload failed for '{filename}': {e}. Using local path.")
                
        # Return local static path
        # Web path relative to static mount for local dev
        return f"/static/{destination_subfolder}/{filename}"

    def get_file_content(self, relative_path: str) -> bytes:
        """Reads file bytes from storage."""
        # Try local first
        local_path = os.path.join(settings.STORAGE_DIR, relative_path)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
                
        # Fallback to Azure
        if self.blob_service_client and self.container_client:
            try:
                blob_client = self.container_client.get_blob_client(relative_path)
                return blob_client.download_blob().readall()
            except Exception as e:
                print(f"[Storage] Azure download failed for '{relative_path}': {e}")
                
        raise FileNotFoundError(f"File {relative_path} not found in local or Azure storage.")

storage_service = StorageService()
