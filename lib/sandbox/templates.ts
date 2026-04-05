/**
 * Starter script templates.
 * The executor node uses these as few-shot references when no memory exists.
 */

export const SHOPIFY_FETCH_ORDERS = `
import os, json, requests

token = os.environ.get("SHOPIFY_TOKEN", "")
domain = os.environ.get("SHOPIFY_DOMAIN", "")

try:
    url = f"https://{domain}/admin/api/2024-01/orders.json"
    headers = {"X-Shopify-Access-Token": token, "Content-Type": "application/json"}
    params = {"status": "any", "limit": 50}
    
    r = requests.get(url, headers=headers, params=params)
    r.raise_for_status()
    
    orders = r.json().get("orders", [])
    result = {
        "status": "success",
        "data": orders,
        "summary": f"Fetched {len(orders)} orders from Shopify"
    }
except Exception as e:
    result = {"status": "error", "data": [], "summary": str(e)}

print(json.dumps(result))
`;

export const SLACK_SEND_MESSAGE = `
import os, json, requests

token = os.environ.get("SLACK_TOKEN", "")
channel = "#general"
message = "Hello from VibeFlow!"

try:
    r = requests.post(
        "https://slack.com/api/chat.postMessage",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"channel": channel, "text": message}
    )
    data = r.json()
    result = {
        "status": "success" if data.get("ok") else "error",
        "data": data,
        "summary": f"Message sent to {channel}" if data.get("ok") else data.get("error")
    }
except Exception as e:
    result = {"status": "error", "data": {}, "summary": str(e)}

print(json.dumps(result))
`;

export const HUBSPOT_FETCH_CONTACTS = `
import os, json, requests

token = os.environ.get("HUBSPOT_TOKEN", "")

try:
    r = requests.get(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        headers={"Authorization": f"Bearer {token}"},
        params={"limit": 50, "properties": "firstname,lastname,email,company"}
    )
    r.raise_for_status()
    contacts = r.json().get("results", [])
    result = {
        "status": "success",
        "data": contacts,
        "summary": f"Fetched {len(contacts)} contacts from HubSpot"
    }
except Exception as e:
    result = {"status": "error", "data": [], "summary": str(e)}

print(json.dumps(result))
`;
