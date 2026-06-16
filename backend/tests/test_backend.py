import os
import sys
import pytest
from fastapi.testclient import TestClient

# Adjust path to import backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.main import app
from backend.app.db import SessionLocal, Campaign
from backend.app.agents.campaign_agent import CampaignAgent
from backend.app.agents.url_agent import URLAgent

campaign_agent = CampaignAgent()
url_agent = URLAgent()


client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_root_endpoint():
    """Verify backend root status is online."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_campaign_agent_mock():
    """Test campaign requirements parsing outputs required keys."""
    brief = "Campaign Name: Winter Sale. Audience: retail customers. CTA: Shop Now. Landing Page: https://example.com/winter."
    res = campaign_agent.analyze_requirements(brief)
    assert "name" in res or "campaign_name" in res
    assert "landing_pages" in res

def test_url_agent_utm_parser():
    """Test URL crawler parses UTM query metrics correctly."""
    url = "https://example.com/page?utm_source=email&utm_medium=newsletter&utm_campaign=winter"
    expected = {
        "utm_source": "email",
        "utm_medium": "newsletter",
        "utm_campaign": "winter"
    }
    findings = url_agent.validate_urls([url], expected)
    assert isinstance(findings, list)

def test_create_campaign_api(db_session):
    """Test FastAPI endpoint for campaign creation with mock credentials."""
    # Obtain auth token
    login_res = client.post("/api/auth/token", data={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "E2E Test Campaign",
        "audience": "Developers",
        "cta": "Sign Up",
        "landing_pages": ["https://example.com"],
        "tracking_links": [],
        "utm_parameters": {"utm_source": "google"},
        "email_assets": ["Click here: https://example.com?utm_source=google"]
    }
    
    response = client.post("/api/campaigns", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "E2E Test Campaign"
    assert data["id"] is not None
    
    # Delete campaign to keep db clean
    del_res = client.delete(f"/api/campaigns/{data['id']}", headers=headers)
    assert del_res.status_code == 204
