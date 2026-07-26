import socketio
import time

sio = socketio.Client()
roomCode = None
sessionToken = 'test-session-1'

@sio.event
def connect():
    print("Connected!")
    sio.emit('create_room', {'playerName': 'DetectivePlayer', 'sessionToken': sessionToken})

@sio.on('room_created')
def on_room_created(data):
    global roomCode
    roomCode = data['roomCode']
    print("Room created:", roomCode)
    
    # Update settings
    sio.emit('update_settings', {'mafiaCount': 1, 'hasDoctor': False, 'hasDetective': True, 'hasJester': False, 'discussionTime': 10})
    
    # Add bot
    sio.emit('add_bot', {'roomCode': roomCode})
    # Add another bot
    sio.emit('add_bot', {'roomCode': roomCode})
    time.sleep(1)
    sio.emit('start_game', {'roomCode': roomCode})

@sio.on('phase_change')
def on_phase_change(data):
    print("Phase change:", data)
    if data['phase'] == 'night':
        # Submit detective action
        sio.emit('submit_action', {'targetId': 'bot-1'})

@sio.on('investigation_result')
def on_investigation_result(data):
    print("INVESTIGATION RESULT:", data)

@sio.on('night_results')
def on_night_results(data):
    print("Night results:", data)
    sio.disconnect()

sio.connect('http://localhost:3000')
sio.wait()
