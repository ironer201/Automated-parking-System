import serial
import json
import time
import os
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PORT = 'COM11'
BAUD = 9600
FILE = "rfid-card.json"
ENTRY_TRACKING_FILE = "entry_tracking.json"
ESP32_PHONE = "01766666"

try:
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(2)
    ser.reset_input_buffer()
    print(f"✅ Connected to {PORT}")
except serial.SerialException as e:
    print(f"⚠️ Could not connect to {PORT}: {e}")
    print("Running in offline mode (no RFID hardware)")
    ser = None

# ================= LOAD JSON =================
def load_users():
    if not os.path.exists(FILE):
        return []
    try:
        with open(FILE, "r") as f:
            return json.load(f)
    except:
        return []

# ================= SAVE JSON =================
def save_users(users):
    with open(FILE, "w") as f:
        json.dump(users, f, indent=4)

# ================= LOAD ENTRY TRACKING =================
def load_entry_tracking():
    if not os.path.exists(ENTRY_TRACKING_FILE):
        return {}
    try:
        with open(ENTRY_TRACKING_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

# ================= SAVE ENTRY TRACKING =================
def save_entry_tracking(tracking_data):
    with open(ENTRY_TRACKING_FILE, "w") as f:
        json.dump(tracking_data, f, indent=4)

# ================= FORMAT TIMESTAMP =================
def format_timestamp_for_supabase(dt):
    return dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3] + '+00'

# ================= UPDATE ALLRECORD TABLE =================
def update_allrecord(phone, status, entry_time=None, outgoing_time=None):
    """
    Update or create row in allRecord table based on status
    """
    try:
        current_time = datetime.now(timezone.utc)
        formatted_time = format_timestamp_for_supabase(current_time)
        
        if status == False and outgoing_time:
            response = supabase.table("allRecord").select("*").eq("phone", phone).eq("status", True).execute()
            
            if response.data and len(response.data) > 0:
                record = response.data[0]
                update_data = {
                    "OutGoing": outgoing_time,
                    "status": False,
                    "updated_at": formatted_time
                }
                result = supabase.table("allRecord").update(update_data).eq("id", record.get('id')).execute()
                
                if result.data:
                    print(f"✅ allRecord updated for phone: {phone}")
                    print(f"   Status: Inactive (Outgoing recorded)")
                    print(f"   OutGoing: {outgoing_time}")
                    return True
                else:
                    print(f"❌ Failed to update allRecord")
                    return False
            else:
                insert_data = {
                    "phone": phone,
                    "status": False,
                    "Entry": None,
                    "OutGoing": outgoing_time,
                    "created_at": formatted_time,
                    "updated_at": formatted_time
                }
                result = supabase.table("allRecord").insert(insert_data).execute()
                
                if result.data:
                    print(f"✅ allRecord created for phone: {phone}")
                    print(f"   Status: Inactive (Outgoing recorded)")
                    print(f"   OutGoing: {outgoing_time}")
                    return True
                else:
                    print(f"❌ Failed to create allRecord")
                    return False
        
        elif status == True and entry_time:
            insert_data = {
                "phone": phone,
                "status": True,
                "Entry": entry_time,
                "OutGoing": None,
                "created_at": formatted_time,
                "updated_at": formatted_time
            }
            result = supabase.table("allRecord").insert(insert_data).execute()
            
            if result.data:
                print(f"✅ allRecord created for phone: {phone}")
                print(f"   Status: Active (Entry recorded)")
                print(f"   Entry: {entry_time}")
                return True
            else:
                print(f"❌ Failed to create allRecord")
                return False
        
        return False
                
    except Exception as e:
        print(f"⚠️ Error updating allRecord: {e}")
        return False

# ================= UPDATE SUPABASE RECORD =================
def update_supabase_record(record_id, update_data):
    try:
        print(f"📤 Attempting to update record ID {record_id} with: {update_data}")
        
        result = supabase.table("record").update(update_data).eq("id", record_id).execute()
        
        if result.data:
            print(f"✅ Update successful!")
            return True
        else:
            print(f"❌ Update failed - No data returned")
            return False
            
    except Exception as e:
        print(f"⚠️ Update error: {e}")
        return False

# ================= SEND LED COMMAND TO ARDUINO =================
def send_led_command(command):
    try:
        if ser:
            ser.write((command + "\n").encode())
            print(f"💡 LED command sent: {command}")
            return True
    except Exception as e:
        print(f"⚠️ Error sending LED command: {e}")
        return False

# ================= CHECK AND PROCESS USER =================
def check_and_process_user(phone):
    print("\n⏳ Please wait... Checking database...")
    
    try:
        phone = phone.strip()
        print(f"📱 Processing phone: '{phone}'")
        
        response = supabase.table("record").select("*").eq("phone", phone).execute()
        
        if not response.data or len(response.data) == 0:
            print("\n" + "="*50)
            print("❌ PHONE NOT FOUND")
            print("="*50)
            print(f"📱 Scanned Phone: '{phone}'")
            print("ℹ️ This phone number is not registered in the system")
            print("="*50)
            send_led_command("INVALID")
            return False
        
        user = response.data[0]
        current_time = datetime.now(timezone.utc)
        formatted_time = format_timestamp_for_supabase(current_time)
        
        print("\n" + "="*50)
        print(f"📱 User Phone: {phone}")
        print(f"🆔 User ID: {user.get('id')}")
        print(f"Current Status: {'Active' if user.get('active') else 'Inactive'}")
        print("="*50)
        
        tracking_data = load_entry_tracking()
        active = user.get('active')
        
        if active is None:
            active = False
            print("ℹ️ First time user - Setting as inactive")
        
        if not active:
            print("🚪 ENTRY DETECTED - User is entering...")
            
            tracking_data[phone] = {
                "entry_time": current_time.isoformat(),
                "status": "inside"
            }
            save_entry_tracking(tracking_data)
            
            current_total_entry = user.get('Total_Entry') or 0
            current_total_entry_today = user.get('Total_Entry_Today') or 0
            
            last_update_time = user.get('updated_at')
            last_update_date = None
            
            if last_update_time:
                try:
                    if 'T' in last_update_time:
                        last_update_dt = datetime.fromisoformat(last_update_time.replace('Z', '+00:00'))
                    else:
                        last_update_dt = datetime.strptime(last_update_time[:19], '%Y-%m-%d %H:%M:%S')
                        last_update_dt = last_update_dt.replace(tzinfo=timezone.utc)
                    last_update_date = last_update_dt.date()
                except:
                    last_update_date = None
            
            today = current_time.date()
            new_total_entry = current_total_entry + 1
            
            if last_update_date is None or last_update_date != today:
                new_total_entry_today = 1
                print(f"📅 New day detected for ENTRY - Today's Entry set to 1")
            else:
                new_total_entry_today = current_total_entry_today + 1
                print(f"📅 Same day - Today's Entry incremented to {new_total_entry_today}")
            
            update_data = {
                "active": True,
                "Total_Entry": new_total_entry,
                "Total_Entry_Today": new_total_entry_today,
                "updated_at": formatted_time
            }
            
            success = update_supabase_record(user.get('id'), update_data)
            
            if success:
                print(f"✅ ENTRY recorded at: {current_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
                print(f"📊 Total Entry (All Time): {new_total_entry}")
                print(f"📊 Today's Entry: {new_total_entry_today}")
                print(f"📝 Status: INSIDE (Active)")
                print("="*50)
                
                send_led_command("VALID")
                
                allrecord_success = update_allrecord(
                    phone=phone,
                    status=True,
                    entry_time=formatted_time
                )
                
                if allrecord_success:
                    print("✅ allRecord row created with ENTRY")
                else:
                    print("⚠️ allRecord creation failed, but record table was updated")
                
                update_owner_record("ENTRY", current_time)
                return True
            else:
                print("❌ Failed to record entry")
                send_led_command("INVALID")
                return False
                
        else:
            print("🚗 OUTGOING DETECTED - User is exiting...")
            
            entry_info = tracking_data.get(phone, {})
            entry_time_str = entry_info.get('entry_time')
            
            entry_time = None
            if entry_time_str:
                try:
                    entry_time = datetime.fromisoformat(entry_time_str.replace('Z', '+00:00'))
                except:
                    try:
                        entry_time = datetime.strptime(entry_time_str[:19], '%Y-%m-%d %H:%M:%S')
                        entry_time = entry_time.replace(tzinfo=timezone.utc)
                    except:
                        entry_time = None
            
            current_total_entry = user.get('Total_Entry') or 0
            current_total_entry_today = user.get('Total_Entry_Today') or 0
            
            new_total_entry = current_total_entry
            new_total_entry_today = current_total_entry_today
            
            update_data = {
                "active": False,
                "Total_Entry": new_total_entry,
                "Total_Entry_Today": new_total_entry_today,
                "updated_at": formatted_time
            }
            
            success = update_supabase_record(user.get('id'), update_data)
            
            if success:
                print(f"✅ OUTGOING recorded at: {current_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
                print(f"📊 Total Entry (All Time): {new_total_entry}")
                print(f"📊 Today's Entry (Entries only): {new_total_entry_today}")
                
                send_led_command("VALID")
                
                allrecord_success = update_allrecord(
                    phone=phone,
                    status=False,
                    outgoing_time=formatted_time
                )
                
                if allrecord_success:
                    print("✅ allRecord updated with OUTGOING")
                else:
                    print("⚠️ allRecord update failed, but record table was updated")
                
                if entry_time:
                    time_difference = current_time - entry_time
                    total_seconds = abs(time_difference.total_seconds())
                    hours = int(total_seconds // 3600)
                    minutes = int((total_seconds % 3600) // 60)
                    seconds = int(total_seconds % 60)
                    
                    print("\n" + "="*50)
                    print("📊 TIME DIFFERENCE SUMMARY")
                    print("="*50)
                    print(f"Entry Time:   {entry_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
                    print(f"Outgoing Time: {current_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
                    print(f"Duration:     {hours}h {minutes}m {seconds}s")
                    total_minutes = total_seconds / 60
                    print(f"Total Time:   {total_minutes:.2f} minutes")
                    print("="*50)
                else:
                    print("\n⚠️ No entry time recorded for this session")
                
                if phone in tracking_data:
                    del tracking_data[phone]
                    save_entry_tracking(tracking_data)
                
                update_owner_record("OUTGOING", current_time)
                return True
            else:
                print("❌ Failed to record outgoing")
                send_led_command("INVALID")
                return False
        
    except Exception as e:
        print(f"\n⚠️ Error: {e}")
        import traceback
        traceback.print_exc()
        send_led_command("INVALID")
        return False

# ================= UPDATE OWNER_RECORD =================
def update_owner_record(action, current_time):
    try:
        print("\n" + "="*50)
        print("📊 UPDATING OWNER RECORD")
        print("="*50)
        
        formatted_time = format_timestamp_for_supabase(current_time)
        
        response = supabase.table("owner_record").select("*").eq("phone", ESP32_PHONE).execute()
        
        if not response.data or len(response.data) == 0:
            print("ℹ️ Creating new owner record for ESP32...")
            new_record = {
                "phone": ESP32_PHONE,
                "total_entry": 0,
                "total_entry_today": 0,
                "total_entry_month": 0,
                "total_slot_active": 0,
                "updated_at": formatted_time
            }
            insert_response = supabase.table("owner_record").insert(new_record).execute()
            
            if insert_response.data:
                print("✅ Owner record created successfully")
                response = supabase.table("owner_record").select("*").eq("phone", ESP32_PHONE).execute()
                if not response.data:
                    print("❌ Failed to fetch created record")
                    return
            else:
                print("❌ Failed to create owner record")
                return
        
        owner = response.data[0]
        
        total_entry = owner.get('total_entry') or 0
        total_entry_today = owner.get('total_entry_today') or 0
        total_entry_month = owner.get('total_entry_month') or 0
        total_slot_active = owner.get('total_slot_active') or 0
        last_update = owner.get('updated_at')
        
        if last_update:
            try:
                last_update_time = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            except:
                try:
                    last_update_time = datetime.strptime(last_update[:19], '%Y-%m-%d %H:%M:%S')
                    last_update_time = last_update_time.replace(tzinfo=timezone.utc)
                except:
                    last_update_time = current_time
        else:
            last_update_time = current_time
        
        if action == "ENTRY":
            total_entry += 1
            print(f"✅ Total Entry incremented: {total_entry}")
            
            if last_update_time.date() == current_time.date():
                total_entry_today += 1
                print(f"✅ Today's Entry incremented: {total_entry_today}")
            else:
                total_entry_today = 1
                print(f"✅ Reset Today's Entry to: {total_entry_today}")
            
            if last_update_time.year == current_time.year and last_update_time.month == current_time.month:
                total_entry_month += 1
                print(f"✅ Month's Entry incremented: {total_entry_month}")
            else:
                total_entry_month = 1
                print(f"✅ Reset Month's Entry to: {total_entry_month}")
            
            active_response = supabase.table("record").select("*").eq("active", True).execute()
            total_slot_active = len(active_response.data) if active_response.data else 0
            print(f"✅ Active Slots: {total_slot_active}")
        
        elif action == "OUTGOING":
            print(f"✅ Total Entry (unchanged on exit): {total_entry}")
            print(f"✅ Today's Entry (unchanged on exit): {total_entry_today}")
            print(f"✅ Month's Entry (unchanged on exit): {total_entry_month}")
            
            active_response = supabase.table("record").select("*").eq("active", True).execute()
            total_slot_active = len(active_response.data) if active_response.data else 0
            print(f"✅ Active Slots: {total_slot_active}")
        
        update_data = {
            "total_entry": total_entry,
            "total_entry_today": total_entry_today,
            "total_entry_month": total_entry_month,
            "total_slot_active": total_slot_active,
            "updated_at": formatted_time
        }
        
        update_response = supabase.table("owner_record").update(update_data).eq("phone", ESP32_PHONE).execute()
        
        if update_response.data:
            print("\n" + "="*50)
            print("📊 OWNER RECORD SUMMARY")
            print("="*50)
            print(f"Phone/Device: {ESP32_PHONE}")
            print(f"Total Entry (All Time): {total_entry}")
            print(f"Today's Entry: {total_entry_today}")
            print(f"Month's Entry: {total_entry_month}")
            print(f"Active Slots: {total_slot_active}")
            print(f"Last Updated: {current_time.strftime('%Y-%m-%d %H:%M:%S')} UTC")
            print("="*50)
        else:
            print("❌ Failed to update owner record")
            
    except Exception as e:
        print(f"⚠️ Error updating owner_record: {e}")

# ================= READ LOOP =================
def read_loop():
    if not ser:
        print("❌ No RFID hardware connected. Cannot read cards.")
        return
        
    print("\n📖 Waiting for card... (Press CTRL+C to stop)")
    print("🔄 First scan = ENTRY | Second scan = OUTGOING\n")
    
    try:
        while True:
            if ser.in_waiting:
                raw = ser.readline()
                line = raw.decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                print(f"RAW: '{line}'")
                print(f"RAW Length: {len(line)}")
                print(f"RAW Bytes: {line.encode('utf-8')}")
                
                if line.startswith("DATA:"):
                    phone = line.replace("DATA:", "").strip()
                    print(f"\n📲 Card Phone: '{phone}'")
                    print(f"Phone Length: {len(phone)}")
                    print(f"Phone Bytes: {phone.encode('utf-8')}")
                    
                    check_and_process_user(phone)
                    
                    print("\n📖 Ready for next card... (Press CTRL+C to stop)\n")
    
    except KeyboardInterrupt:
        print("\n🛑 Stopped reading.")

# ================= FIX NULL VALUES =================
def fix_null_values():
    try:
        response1 = supabase.table("record").update({"active": False}).is_("active", "null").execute()
        if response1.data:
            print(f"✅ Fixed {len(response1.data)} records with NULL active values")
        else:
            print("No NULL active values found")
        
        response2 = supabase.table("record").update({"Total_Entry": 0}).is_("Total_Entry", "null").execute()
        if response2.data:
            print(f"✅ Fixed {len(response2.data)} records with NULL Total_Entry values")
        else:
            print("No NULL Total_Entry values found")
        
        response3 = supabase.table("record").update({"Total_Entry_Today": 0}).is_("Total_Entry_Today", "null").execute()
        if response3.data:
            print(f"✅ Fixed {len(response3.data)} records with NULL Total_Entry_Today values")
        else:
            print("No NULL Total_Entry_Today values found")
            
        response4 = supabase.table("owner_record").update({"total_entry": 0}).is_("total_entry", "null").execute()
        if response4.data:
            print(f"✅ Fixed {len(response4.data)} owner records with NULL total_entry values")
        
        response5 = supabase.table("owner_record").update({"total_entry_today": 0}).is_("total_entry_today", "null").execute()
        if response5.data:
            print(f"✅ Fixed {len(response5.data)} owner records with NULL total_entry_today values")
        
        response6 = supabase.table("owner_record").update({"total_entry_month": 0}).is_("total_entry_month", "null").execute()
        if response6.data:
            print(f"✅ Fixed {len(response6.data)} owner records with NULL total_entry_month values")
        
        response7 = supabase.table("owner_record").update({"total_slot_active": 0}).is_("total_slot_active", "null").execute()
        if response7.data:
            print(f"✅ Fixed {len(response7.data)} owner records with NULL total_slot_active values")
            
        print("✅ All NULL values fixed successfully!")
            
    except Exception as e:
        print(f"⚠️ Error fixing NULL values: {e}")

# ================= MAIN =================
def main():
    print("\n🔧 Checking and fixing NULL values...")
    fix_null_values()
    
    print("\n" + "="*50)
    print("        RFID SYSTEM")
    print("="*50)
    print("📖 Starting RFID Reader...")
    print("Place your card on the reader")
    print("Press CTRL+C to stop")
    print("="*50 + "\n")
    
    # Start reading cards immediately
    read_loop()

if __name__ == "__main__":
    main()
