import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import requests

# Configuration from .env
CLIENT_ID = "717888717826-vbkkn1l87povs6iiqtpq47l3skavqoic.apps.googleusercontent.com"
CLIENT_SECRET = "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"
SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
]



client_config = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": ["http://localhost"]
    }
}

def main():
    print("🚀 Starting Google Photos API Test...")
    
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            # Use port 3000 which is commonly whitelisted.
            # If this fails, we will need to ask the user which port is whitelisted.
            creds = flow.run_local_server(port=3000)
            
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    print(f"✅ Authenticated. Access Token: {creds.token[:10]}...")

    # Check actual scopes on token
    print("\n🔍 Checking Token Info...")
    token_info = requests.get(f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={creds.token}').json()
    print(json.dumps(token_info, indent=2))

    # Test API Call
    # Test Picker API - Create Session
    print("\n📸 Creating Picker Session...")
    try:
        response = requests.post(
            'https://photospicker.googleapis.com/v1/sessions',
            headers={
                'Authorization': f'Bearer {creds.token}',
                'Content-Type': 'application/json'
            },
            json={}
        )
        
        if response.status_code == 200:
            session = response.json()
            print(f"✅ Success! Picker URL: {session.get('pickerUri')}")
            print("You can verify by opening this URL in your browser.")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
        
        if response.status_code == 200:
            albums = response.json().get('albums', [])
            print(f"✅ Success! Found {len(albums)} albums.")
            for album in albums:
                print(f" - {album.get('title')} (Items: {album.get('mediaItemsCount')})")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Request Failed: {e}")

if __name__ == '__main__':
    main()
