import serial
import time
import os
from dotenv import load_dotenv

load_dotenv()

PORT = 'COM11'  # Change this to your port
BAUD = 9600

def write_rfid_card(phone_number):
    """Write phone number to RFID card (erase then write)"""
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        time.sleep(2)
        ser.reset_input_buffer()
        print(f"✅ Connected to {PORT}")
    except serial.SerialException as e:
        print(f"❌ Could not connect to {PORT}: {e}")
        return False
    
    print(f"\n📝 Writing phone '{phone_number}' to card...")
    print("📌 Place card on reader NOW")
    
    try:
        # Send write command to ESP32
        ser.write((phone_number + "\n").encode())
        
        # Wait for response
        timeout = 15
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if ser.in_waiting:
                response = ser.readline().decode('utf-8', errors='ignore').strip()
                print(f"📨 ESP32: {response}")
                
                if response == "NO_CARD":
                    print("❌ No card detected")
                    return False
                elif response == "READ_FAIL":
                    print("❌ Failed to read card")
                    return False
                elif response == "ERASE_FAIL":
                    print("❌ Failed to erase card data")
                    return False
                elif response == "AUTH_FAIL":
                    print("❌ Authentication failed")
                    return False
                elif response == "WRITE_FAIL":
                    print("❌ Failed to write data")
                    return False
                elif response == "WRITE_OK":
                    print("✅ Card written successfully!")
                    return True
                elif response == "ERASE_OK":
                    print("✅ Card erased, writing new data...")
                    continue
            
            time.sleep(0.1)
        
        print("❌ Timeout waiting for ESP32 response")
        return False
        
    except Exception as e:
        print(f"⚠️ Error: {e}")
        return False
    finally:
        ser.close()

def main():
    print("\n" + "="*50)
    print("     RFID CARD WRITER")
    print("="*50)
    
    phone = input("\n📱 Enter phone number to write: ").strip()
    
    if not phone:
        print("❌ Invalid phone number")
        return
    
    if len(phone) > 15:
        print("❌ Phone number too long (max 15 characters)")
        return
    
    print("\n" + "="*50)
    success = write_rfid_card(phone)
    
    if success:
        print("\n✅ Card writing completed successfully!")
        print(f"📱 Written data: {phone}")
    else:
        print("\n❌ Card writing failed!")
    
    print("="*50)

if __name__ == "__main__":
    main()
