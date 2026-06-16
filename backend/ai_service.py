import os
import requests
import json
import logging

import config

logger = logging.getLogger("flood-ai")

def _call_ai(system_prompt: str, user_prompt: str) -> str:
    provider = config.AI_PROVIDER.lower()
    
    if provider == "grok":
        url = "https://api.x.ai/v1/chat/completions"
        api_key = config.XAI_API_KEY
        model = "grok-beta"
    else:
        url = "https://api.openai.com/v1/chat/completions"
        api_key = config.OPENAI_API_KEY
        model = "gpt-3.5-turbo"

    if not api_key:
        raise ValueError(f"No API Key for {provider}")
        
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7
    }
    
    response = requests.post(url, headers=headers, json=data, timeout=15)
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"]


def generate_flood_insight(zone_data: dict) -> str:
    """
    Analyzes the current flood metrics and returns a holistic AI action plan.
    """
    system_prompt = "You are an expert Flood Risk AI Assistant for Guwahati city administration. Provide a highly actionable, concise disaster response plan based on the provided sensor data. Use bullet points."
    user_prompt = f"Current Data for {zone_data.get('zone', 'Unknown')}: \nRisk: {zone_data.get('risk', 'Unknown')} (Score: {zone_data.get('score', 0)})\nRainfall: {zone_data.get('rainfall', 0)}mm\nRiver Level: {zone_data.get('river_level', 0)}m\n\nGenerate a brief 3-point action plan."
    
    try:
        if config.XAI_API_KEY or config.OPENAI_API_KEY:
            return _call_ai(system_prompt, user_prompt)
        else:
            return _generate_fallback_insight(zone_data)
    except Exception as e:
        logger.error(f"AI API failed: {e}. Using fallback.")
        return _generate_fallback_insight(zone_data)

def draft_sms_alert(zone_name: str, risk_level: str, metrics: str) -> str:
    """
    Drafts an urgent 150-character SMS alert.
    """
    system_prompt = "You are an emergency broadcast system. Draft a single, urgent SMS warning message (max 150 chars). No hashtags."
    user_prompt = f"Zone: {zone_name}\nRisk Level: {risk_level}\nMetrics: {metrics}\nDraft the SMS:"
    
    try:
        if config.XAI_API_KEY or config.OPENAI_API_KEY:
            return _call_ai(system_prompt, user_prompt)
        else:
            return _generate_fallback_sms(zone_name, risk_level)
    except Exception as e:
        logger.error(f"AI API failed: {e}. Using fallback.")
        return _generate_fallback_sms(zone_name, risk_level)

def _generate_fallback_insight(z: dict) -> str:
    risk = z.get("risk", "Low").lower()
    zone = z.get("zone", "this area")
    
    if risk in ["critical", "high"]:
        return f"""**🚨 AI Fallback Plan for {zone}:**
1. **Immediate Evacuation:** Deploy SDRF units to low-lying sectors immediately.
2. **Infrastructure:** Close local sluice gates and activate all backup pumps.
3. **Communications:** Broadcast SMS alerts warning residents to move to high ground."""
    elif risk == "medium":
        return f"""**⚠️ AI Fallback Plan for {zone}:**
1. **Monitor Closely:** Water levels are rising. Keep rapid response teams on standby.
2. **Infrastructure:** Clear primary drainage choke points in {zone}.
3. **Communications:** Issue advisory to avoid travel in waterlogged streets."""
    else:
        return f"""**✅ AI Fallback Plan for {zone}:**
1. **Normal Operations:** Current metrics are within safe limits.
2. **Routine Checks:** Continue standard municipal drainage cleaning.
3. **Standby:** Maintain regular monitoring."""

def _generate_fallback_sms(zone: str, risk: str) -> str:
    if risk.lower() in ["critical", "high"]:
        return f"URGENT: {risk} flood risk in {zone}. Move to higher ground immediately. Follow SDRF instructions and avoid travelling."
    return f"ALERT: {risk} flood conditions expected in {zone}. Please stay alert and clear clogged drains near your home."
