from playwright.sync_api import sync_playwright

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5173")
        page.wait_for_timeout(2000) # Wait for load

        # 2. Check for CAPTCHA
        print("Checking for CAPTCHA...")
        captcha_modal = page.locator("text=Security Check")
        if captcha_modal.is_visible():
            print("CAPTCHA is visible.")
            page.screenshot(path="verification/captcha.png")

            # Solve CAPTCHA
            # Extract numbers from "A + B = ?"
            problem_text = page.locator(".text-3xl").inner_text()
            parts = problem_text.split('+')
            num1 = int(parts[0].strip())
            num2 = int(parts[1].split('=')[0].strip())
            answer = str(num1 + num2)

            print(f"Solving {num1} + {num2} = {answer}")
            page.fill("input[type='number']", answer)
            page.click("button:text('Verify')")
            page.wait_for_timeout(1000)

            if not captcha_modal.is_visible():
                print("CAPTCHA solved and disappeared.")
            else:
                print("CAPTCHA still visible.")
        else:
            print("CAPTCHA not found!")

        # 3. Check for Chat Interface
        print("Checking Chat Interface...")
        page.wait_for_selector("input[placeholder*='Ask a code question']")
        page.screenshot(path="verification/chat_interface.png")

        # 4. Test Rate Limit Logic (Simulate by setting localStorage manually if needed, but let's just check UI first)
        # We can try to send 31 messages but that takes time.
        # Instead, we can inject script to set usage to 29 and then send 2 messages.

        print("Testing Rate Limit...")
        today = page.evaluate("new Date().toISOString().split('T')[0]")
        limit_data = '{"date": "' + today + '", "count": 29}'
        page.evaluate(f"localStorage.setItem('cody_usage', '{limit_data}')")

        # Send 30th message
        page.fill("input[type='text']", "Message 30")
        page.click("button[aria-label='Send message']")
        page.wait_for_timeout(2000) # Wait for response or processing

        # Send 31st message (should fail)
        page.fill("input[type='text']", "Message 31")
        page.click("button[aria-label='Send message']")
        page.wait_for_timeout(1000)

        # Check for error message
        limit_msg = page.locator("text=You have reached your daily limit")
        if limit_msg.is_visible():
            print("Rate limit message visible.")
            page.screenshot(path="verification/rate_limit.png")
        else:
            print("Rate limit message NOT visible.")
            page.screenshot(path="verification/rate_limit_failed.png")

        browser.close()

if __name__ == "__main__":
    verify_features()
