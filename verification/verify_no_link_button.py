from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            print("Waiting for any known text...")
            try:
                page.wait_for_selector("h1", timeout=15000)
            except:
                print("Timeout waiting for h1. Content:")
                print(page.content())
                raise

            content = page.content()
            if "Forge Authorization" in content:
                print("Gatekeeper is ACTIVE.")
            elif "ARCANE FORGE" in content:
                print("Gatekeeper BYPASSED (Good).")
            else:
                print("Unknown state.")
                print(content[:500])

            print("Checking for Link button...")
            link_buttons = page.locator("button", has_text="Link")

            count = link_buttons.count()
            print(f"Found {count} buttons with text 'Link'.")

            if count > 0:
                for i in range(count):
                    if link_buttons.nth(i).is_visible():
                        print(f"Button {i} visibility: {link_buttons.nth(i).is_visible()}")
                        # raise Exception("Link button is still visible!")

            print("Taking screenshot...")
            page.screenshot(path="verification.png")
            print("Done.")
        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
