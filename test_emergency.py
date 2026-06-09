import requests
import json

def trigger_test_emergency():
    url = "http://localhost:8000/trigger_alert"
    payload = {
        "zone": "Anil Nagar",
        "risk_level": "CRITICAL",
        "message": "Extreme water levels detected. Immediate evacuation of lower floors advised for Anil Nagar residents."
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print("🚀 Emergency Alert broadcasted successfully!")
            print(f"Server Response: {response.json()}")
        else:
            print(f"❌ Failed to trigger alert. Status: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")

if __name__ == "__main__":
    trigger_test_emergency()
