import requests
import sys
import json
from datetime import datetime

class ChromaBizAPITester:
    def __init__(self, base_url="https://palette-maker-15.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = f"test_session_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Array/Other'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_rate_limit_status(self):
        """Test rate limit status endpoint"""
        return self.run_test("Rate Limit Status", "GET", "rate-limit", 200)

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        status_data = {"client_name": "test_client"}
        success, response = self.run_test("Create Status Check", "POST", "status", 200, data=status_data)
        
        if success:
            # Test GET status
            self.run_test("Get Status Checks", "GET", "status", 200)
        
        return success

    def test_generate_palettes(self):
        """Test palette generation with valid data"""
        palette_data = {
            "business_name": "Test Coffee Shop",
            "business_category": "Food & Beverage",
            "target_country": "United States",
            "age_groups": ["25-35", "36-45"],
            "target_gender": "All Genders",
            "brand_values": "cozy, artisanal, sustainable",
            "competitors": "Starbucks, Blue Bottle"
        }
        
        success, response = self.run_test("Generate Palettes", "POST", "generate-palettes", 200, data=palette_data)
        
        if success and response:
            # Validate response structure
            if "palettes" in response and "remaining_generations" in response:
                palettes = response["palettes"]
                if len(palettes) > 0:
                    palette = palettes[0]
                    required_fields = ["id", "name", "description", "colors", "psychology"]
                    if all(field in palette for field in required_fields):
                        print(f"   ✅ Palette structure valid - {len(palettes)} palettes generated")
                        
                        # Check color structure
                        if len(palette["colors"]) > 0:
                            color = palette["colors"][0]
                            color_fields = ["hex", "name", "usage"]
                            if all(field in color for field in color_fields):
                                print(f"   ✅ Color structure valid - {len(palette['colors'])} colors per palette")
                            else:
                                print(f"   ⚠️  Color missing fields: {color}")
                        return True, response
                    else:
                        print(f"   ⚠️  Palette missing fields: {palette.keys()}")
                else:
                    print(f"   ⚠️  No palettes in response")
            else:
                print(f"   ⚠️  Response missing required fields: {response.keys()}")
        
        return success, response

    def test_generate_palettes_validation(self):
        """Test palette generation with invalid data"""
        # Test missing required fields
        invalid_data = {
            "business_name": "",  # Empty required field
            "business_category": "",  # Empty required field
            "target_country": "United States",
            "age_groups": [],  # Empty required field
            "target_gender": "All Genders"
        }
        
        # This should still return 200 but might have fallback behavior
        return self.run_test("Generate Palettes (Invalid)", "POST", "generate-palettes", 200, data=invalid_data)

    def test_chat_functionality(self, palettes_data=None):
        """Test chat functionality"""
        if not palettes_data:
            # Use sample palette data
            palettes_data = [{
                "name": "Test Palette",
                "colors": [
                    {"hex": "#FF5733", "name": "Orange Red", "usage": "Primary"},
                    {"hex": "#33FF57", "name": "Green", "usage": "Secondary"}
                ]
            }]
        
        chat_data = {
            "message": "Can you explain the psychology behind the first palette?",
            "context": {
                "palettes": palettes_data,
                "business_info": {
                    "business_name": "Test Coffee Shop",
                    "business_category": "Food & Beverage",
                    "target_country": "United States",
                    "age_groups": ["25-35"],
                    "target_gender": "All Genders"
                }
            },
            "session_id": self.session_id
        }
        
        success, response = self.run_test("Chat with AI", "POST", "chat", 200, data=chat_data)
        
        if success and response:
            if "response" in response and "remaining_revisions" in response:
                print(f"   ✅ Chat response received: {len(response['response'])} characters")
                print(f"   ✅ Remaining revisions: {response['remaining_revisions']}")
                return True, response
            else:
                print(f"   ⚠️  Chat response missing fields: {response.keys()}")
        
        return success, response

    def test_rate_limiting(self):
        """Test rate limiting by making multiple requests"""
        print(f"\n🔍 Testing Rate Limiting...")
        
        # Make multiple palette generation requests to test rate limiting
        palette_data = {
            "business_name": "Rate Limit Test",
            "business_category": "Technology",
            "target_country": "United States",
            "age_groups": ["25-35"],
            "target_gender": "All Genders"
        }
        
        # First request should succeed
        success1, response1 = self.run_test("Rate Limit Test 1", "POST", "generate-palettes", 200, data=palette_data)
        
        if success1:
            remaining = response1.get("remaining_generations", 0)
            print(f"   Remaining generations after first request: {remaining}")
            
            # If we have remaining generations, try another request
            if remaining > 0:
                success2, response2 = self.run_test("Rate Limit Test 2", "POST", "generate-palettes", 200, data=palette_data)
                if success2:
                    remaining2 = response2.get("remaining_generations", 0)
                    print(f"   Remaining generations after second request: {remaining2}")
            else:
                # Try one more request - should hit rate limit
                success3, response3 = self.run_test("Rate Limit Test (Should Fail)", "POST", "generate-palettes", 429, data=palette_data)
                if success3:
                    print(f"   ✅ Rate limiting working correctly - got 429 status")
                else:
                    print(f"   ⚠️  Rate limiting may not be working as expected")
        
        return success1

def main():
    print("🚀 Starting ChromaBiz API Testing...")
    print("=" * 50)
    
    tester = ChromaBizAPITester()
    
    # Test basic endpoints
    tester.test_root_endpoint()
    tester.test_rate_limit_status()
    tester.test_status_endpoints()
    
    # Test main functionality
    palette_success, palette_response = tester.test_generate_palettes()
    tester.test_generate_palettes_validation()
    
    # Test chat with generated palettes if available
    if palette_success and palette_response and "palettes" in palette_response:
        tester.test_chat_functionality(palette_response["palettes"])
    else:
        tester.test_chat_functionality()  # Use sample data
    
    # Test rate limiting
    tester.test_rate_limiting()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())