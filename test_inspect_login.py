"""
Inspect login page structure in detail
"""
from playwright.sync_api import sync_playwright
import sys
import json

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("\n=== LOGIN PAGE DETAILED INSPECTION ===")
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.screenshot(path="/tmp/login_inspect.png", full_page=True)

    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")

    # Get full HTML
    html = page.content()

    # Look for input elements
    print("\n--- ALL INPUT ELEMENTS ---")
    inputs = page.locator("input").all()
    print(f"Total inputs: {len(inputs)}")
    for i, inp in enumerate(inputs):
        type_attr = inp.get_attribute("type")
        id_attr = inp.get_attribute("id")
        name_attr = inp.get_attribute("name")
        placeholder = inp.get_attribute("placeholder")
        class_attr = inp.get_attribute("class")
        print(f"Input {i+1}:")
        print(f"  type: {type_attr}")
        print(f"  id: {id_attr}")
        print(f"  name: {name_attr}")
        print(f"  placeholder: {placeholder}")
        print(f"  class: {class_attr}")

    # Look for form elements
    print("\n--- FORM ELEMENTS ---")
    forms = page.locator("form").all()
    print(f"Total forms: {len(forms)}")

    # Look for buttons
    print("\n--- BUTTONS ---")
    buttons = page.locator("button").all()
    print(f"Total buttons: {len(buttons)}")
    for i, btn in enumerate(buttons[:5]):
        text = btn.text_content()
        type_attr = btn.get_attribute("type")
        print(f"  {i+1}. text='{text}', type={type_attr}")

    # Look for divs with specific classes
    print("\n--- SEARCHING FOR FORM CONTENT ---")
    all_text = page.locator("body").text_content()

    if "email" in all_text.lower():
        print("[FOUND] Page contains 'email'")
    if "password" in all_text.lower():
        print("[FOUND] Page contains 'password'")
    if "log in" in all_text.lower():
        print("[FOUND] Page contains 'log in'")

    # Try different selectors
    print("\n--- TESTING SELECTORS ---")

    # Test 1: querySelector for inputs
    email_count = page.locator('input[placeholder*="email" i]').count()
    print(f"Inputs with 'email' in placeholder: {email_count}")

    # Test 2: Look for input in specific contexts
    container = page.locator("[class*='form' i]").first
    if container.count() > 0:
        print("Found form container")
        container_inputs = container.locator("input").all()
        print(f"Inputs in form container: {len(container_inputs)}")

    # Test 3: Check if inputs exist by looking at the raw HTML
    print("\n--- RAW HTML SNIPPET (first 2000 chars) ---")
    print(html[:2000])

    browser.close()
