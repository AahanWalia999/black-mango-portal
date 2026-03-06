from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import time
from datetime import datetime

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)  # Allow frontend to communicate with backend

# Server-side deduplication: remember recent requestIds for 10 seconds
_seen_request_ids = {}
def is_duplicate_request(req_id):
    now = time.time()
    # Clean up old IDs
    expired = [k for k, v in _seen_request_ids.items() if now - v > 10]
    for k in expired:
        del _seen_request_ids[k]
    if req_id and req_id in _seen_request_ids:
        return True
    if req_id:
        _seen_request_ids[req_id] = now
    return False

@app.route('/')
def index_page():
    return app.send_static_file('index.html')

@app.route('/login')
def login_page():
    return app.send_static_file('login.html')

@app.route('/log_error', methods=['POST'])
def log_error():
    data = request.json
    print(f"!!! FRONTEND JS ERROR !!!\nMessage: {data.get('message')}\nFile: {data.get('filename')}\nLine: {data.get('lineno')}:{data.get('colno')}\n---------------------------")
    return jsonify({"status": "logged"})

DATABASE = 'database.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        db = get_db()
        # Create Deliveries Table
        db.execute('''
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                season TEXT NOT NULL,
                createdDate TEXT NOT NULL,
                items INTEGER DEFAULT 0
            )
        ''')
        
        # Create Tracking Templates Table
        db.execute('''
            CREATE TABLE IF NOT EXISTS tracking_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                steps TEXT NOT NULL -- JSON array of steps: {name, duration, dependency, team}
            )
        ''')
        
        # Insert Default Tracking Template safely if it doesn't exist
        cursor = db.execute('SELECT COUNT(*) FROM tracking_templates')
        if cursor.fetchone()[0] == 0:
            default_steps = json.dumps([
                {"name": "Order Received", "duration": 0, "dependency": None, "team": "Sales"},
                {"name": "Passed to Design Team", "duration": 2, "dependency": "Order Received", "team": "Design"},
                {"name": "Design Approved", "duration": 5, "dependency": "Passed to Design Team", "team": "Client"},
                {"name": "Given to Factory", "duration": 2, "dependency": "Design Approved", "team": "Production"},
                {"name": "Manufacturing Started", "duration": 14, "dependency": "Given to Factory", "team": "Factory"},
                {"name": "Shipped", "duration": 3, "dependency": "Manufacturing Started", "team": "Logistics"},
                {"name": "Received by Buyer", "duration": 5, "dependency": "Shipped", "team": "Sales"}
            ])
            db.execute('INSERT INTO tracking_templates (name, steps) VALUES (?, ?)', ('Standard Production', default_steps))

        # Create Styles Table (Note: SQLite lacks ALTER TABLE ADD COLUMN IF NOT EXISTS easily, so we recreate schema if needed, or rely on flexible JSON parsing on the frontend. Since this is an MVP, we are recreating the table structure gracefully if we assume it's a fresh DB. If it exists, we will migrate it.)
        try:
            # Attempt to add new columns to an existing schema
            db.execute('ALTER TABLE styles ADD COLUMN dueDate TEXT')
            db.execute('ALTER TABLE styles ADD COLUMN trackingTemplateId INTEGER DEFAULT 1')
            db.execute('ALTER TABLE styles ADD COLUMN actualCompletionDates TEXT DEFAULT "{}"')
        except sqlite3.OperationalError:
            pass # Columns already exist or table doesn't exist yet
            
        db.execute('''
            CREATE TABLE IF NOT EXISTS styles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deliveryId INTEGER NOT NULL,
                no TEXT NOT NULL,
                desc TEXT NOT NULL,
                color TEXT NOT NULL,
                category TEXT NOT NULL,
                sizes TEXT NOT NULL, -- Stored as JSON string
                qty INTEGER NOT NULL,
                status TEXT NOT NULL,
                orderDate TEXT NOT NULL,
                dueDate TEXT,
                trackingTemplateId INTEGER DEFAULT 1,
                trackerStep INTEGER DEFAULT 0,
                actualCompletionDates TEXT DEFAULT "{}",
                deliveryDate TEXT,
                image TEXT,
                lastEditedBy TEXT,
                lastEditedAt TEXT,
                createdDate TEXT NOT NULL,
                designRejections INTEGER DEFAULT 0,
                bomData TEXT DEFAULT "[]",
                FOREIGN KEY (deliveryId) REFERENCES deliveries (id) ON DELETE CASCADE,
                FOREIGN KEY (trackingTemplateId) REFERENCES tracking_templates (id)
            )
        ''')


        try:
            db.execute("ALTER TABLE styles ADD COLUMN bomData TEXT DEFAULT '[]'")
        except sqlite3.OperationalError:
            pass 

        try:
            db.execute("ALTER TABLE styles ADD COLUMN trackingSteps TEXT")
        except sqlite3.OperationalError:
            pass 

        try:
            db.execute("ALTER TABLE styles ADD COLUMN lastEditedBy TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            db.execute("ALTER TABLE styles ADD COLUMN lastEditedAt TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            db.execute("ALTER TABLE deliveries ADD COLUMN isDeleted INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            db.execute("ALTER TABLE deliveries ADD COLUMN deletedAt TEXT")
        except sqlite3.OperationalError:
            pass
            
        try:
            db.execute("ALTER TABLE styles ADD COLUMN isDeleted INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            db.execute("ALTER TABLE styles ADD COLUMN deletedAt TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            db.execute("ALTER TABLE tracking_templates ADD COLUMN isDeleted INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            db.execute("ALTER TABLE tracking_templates ADD COLUMN deletedAt TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            db.execute("ALTER TABLE materials ADD COLUMN isDeleted INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            db.execute("ALTER TABLE materials ADD COLUMN deletedAt TEXT")
        except sqlite3.OperationalError:
            pass

        db.commit()

        # Create Materials Table
        db.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                supplier TEXT,
                color TEXT,
                notes TEXT,
                createdDate TEXT NOT NULL
            )
        ''')

        # Create Style Materials Junction Table (BOM)
        db.execute('''
            CREATE TABLE IF NOT EXISTS style_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                styleId INTEGER NOT NULL,
                materialId INTEGER NOT NULL,
                usage TEXT,
                quantity TEXT,
                FOREIGN KEY (styleId) REFERENCES styles (id) ON DELETE CASCADE,
                FOREIGN KEY (materialId) REFERENCES materials (id) ON DELETE CASCADE
            )
        ''')
        db.commit()

init_db()

# --- Tracking Templates Endpoints ---

@app.route('/api/templates', methods=['GET'])
def get_templates():
    db = get_db()
    cursor = db.execute('SELECT * FROM tracking_templates WHERE isDeleted = 0')
    templates = [dict(row) for row in cursor.fetchall()]
    return jsonify(templates)

@app.route('/api/templates', methods=['POST'])
def add_template():
    data = request.json
    db = get_db()
    steps_json = json.dumps(data.get('steps', []))
    cursor = db.execute('''
        INSERT INTO tracking_templates (name, steps)
        VALUES (?, ?)
    ''', (data['name'], steps_json))
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201

@app.route('/api/templates/<int:id>', methods=['DELETE'])
def delete_template(id):
    db = get_db()
    
    # Don't delete the fallback template (id=1)
    if id == 1:
        return jsonify({"success": False, "error": "Cannot delete default template"}), 403
        
    db.execute('UPDATE tracking_templates SET isDeleted = 1, deletedAt = ? WHERE id = ?', (datetime.now().isoformat(), id))
    db.commit()
    return jsonify({"success": True})

@app.route('/api/templates/<int:id>', methods=['PUT'])
def update_template(id):
    data = request.json
    db = get_db()
    steps_json = json.dumps(data.get('steps', []))
    db.execute('''
        UPDATE tracking_templates 
        SET name = ?, steps = ?
        WHERE id = ?
    ''', (data['name'], steps_json, id))
    db.commit()
    return jsonify({"success": True})

# --- Deliveries Endpoints ---

@app.route('/api/deliveries', methods=['GET'])
def get_deliveries():
    db = get_db()
    cursor = db.execute('SELECT * FROM deliveries WHERE isDeleted = 0')
    deliveries = [dict(row) for row in cursor.fetchall()]
    return jsonify(deliveries)

@app.route('/api/deliveries', methods=['POST'])
def add_delivery():
    data = request.json
    req_id = data.get('requestId')
    if is_duplicate_request(req_id):
        return jsonify({"error": "duplicate"}), 409
    db = get_db()
    cursor = db.execute('''
        INSERT INTO deliveries (name, season, createdDate, items)
        VALUES (?, ?, ?, ?)
    ''', (data['name'], data['season'], data['createdDate'], data.get('items', 0)))
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201

@app.route('/api/deliveries/<int:id>', methods=['DELETE'])
def delete_delivery(id):
    db = get_db()
    
    # Soft delete the delivery
    db.execute('UPDATE deliveries SET isDeleted = 1, deletedAt = ? WHERE id = ?', (datetime.now().isoformat(), id))
    
    # Cascading soft delete for styles within this delivery
    db.execute('UPDATE styles SET isDeleted = 1, deletedAt = ? WHERE deliveryId = ?', (datetime.now().isoformat(), id))
    
    db.commit()
    return jsonify({"success": True})

@app.route('/api/deliveries/<int:id>', methods=['PUT'])
def update_delivery(id):
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE deliveries 
        SET name = ?
        WHERE id = ?
    ''', (data['name'], id))
    db.commit()
    return jsonify({"success": True})

# --- Styles Endpoints ---

@app.route('/api/styles', methods=['GET'])
def get_styles():
    deliveryId = request.args.get('deliveryId')
    db = get_db()
    
    if deliveryId:
        cursor = db.execute('''
            SELECT s.*, 
                   (SELECT COUNT(*) FROM style_materials WHERE styleId = s.id) as materialCount
            FROM styles s 
            WHERE s.deliveryId = ? AND s.isDeleted = 0
        ''', (deliveryId,))
    else:
        cursor = db.execute('''
            SELECT s.*, 
                   (SELECT COUNT(*) FROM style_materials WHERE styleId = s.id) as materialCount
            FROM styles s
            WHERE s.isDeleted = 0
        ''')
        
    styles = []
    for row in cursor.fetchall():
        style_dict = dict(row)
        style_dict['sizes'] = json.loads(style_dict['sizes'])
        try:
            style_dict['bomData'] = json.loads(style_dict.get('bomData', '[]'))
        except:
            style_dict['bomData'] = []
        try:
            style_dict['trackingSteps'] = json.loads(style_dict.get('trackingSteps', 'null'))
        except:
            style_dict['trackingSteps'] = None
            
        style_dict['hasMaterials'] = style_dict['materialCount'] > 0
        styles.append(style_dict)
        
    return jsonify(styles)

@app.route('/api/styles', methods=['POST'])
def add_style():
    data = request.json
    db = get_db()
    
    sizes_json = json.dumps(data['sizes'])
    
    cursor = db.execute('''
        INSERT INTO styles (deliveryId, no, desc, color, category, sizes, qty, status, orderDate, dueDate, trackingTemplateId, trackerStep, actualCompletionDates, deliveryDate, image, createdDate, designRejections, bomData, trackingSteps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['deliveryId'], data['no'], data['desc'], data['color'], 
        data['category'], sizes_json, data['qty'], data['status'], 
        data['orderDate'], data.get('dueDate'), data.get('trackingTemplateId', 1),
        data.get('trackerStep', 0), data.get('actualCompletionDates', '{}'),
        data.get('deliveryDate'), data.get('image', ''), data.get('createdDate', datetime.now().isoformat()), data.get('designRejections', 0),
        json.dumps(data.get('bomData', [])), data.get('trackingSteps')
    ))
    
    # Update delivery item count
    db.execute('UPDATE deliveries SET items = items + 1 WHERE id = ?', (data['deliveryId'],))
    
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201

@app.route('/api/styles/<int:id>', methods=['GET'])
def get_style(id):
    db = get_db()
    row = db.execute('SELECT * FROM styles WHERE id = ? AND isDeleted = 0', (id,)).fetchone()
    if not row:
        return jsonify({"error": "Style not found"}), 404
    
    style_dict = dict(row)
    style_dict['sizes'] = json.loads(style_dict['sizes'])
    try:
        style_dict['bomData'] = json.loads(style_dict.get('bomData', '[]'))
    except:
        style_dict['bomData'] = []
    try:
        style_dict['trackingSteps'] = json.loads(style_dict.get('trackingSteps', 'null'))
    except:
        style_dict['trackingSteps'] = None
    
    return jsonify(style_dict)

@app.route('/api/styles/<int:id>', methods=['PUT'])
def update_style(id):
    data = request.json
    db = get_db()
    
    # Check if this is a trackerStep update only or a full update
    if 'trackerStep' in data and len(data) <= 4: # allow for id, trackerStep, deliveryDate, actualCompletionDates
        db.execute('''
            UPDATE styles 
            SET trackerStep = ?, deliveryDate = ?, actualCompletionDates = ?
            WHERE id = ?
        ''', (data['trackerStep'], data.get('deliveryDate'), data.get('actualCompletionDates', '{}'), id))
    elif 'designRejections' in data and len(data) <= 2:
        db.execute('''
            UPDATE styles 
            SET designRejections = ? 
            WHERE id = ?
        ''', (data['designRejections'], id))
    else:
        # Get existing style for partial updates
        existing = db.execute('SELECT * FROM styles WHERE id = ?', (id,)).fetchone()
        if not existing:
            return jsonify({"error": "Style not found"}), 404
        style = dict(existing)
        
        merged = {
            "no": data.get('no', style['no']),
            "desc": data.get('desc', style['desc']),
            "color": data.get('color', style['color']),
            "category": data.get('category', style['category']),
            "sizes": json.dumps(data.get('sizes', json.loads(style['sizes']))),
            "qty": data.get('qty', style['qty']),
            "status": data.get('status', style['status']),
            "orderDate": data.get('orderDate', style['orderDate']),
            "dueDate": data.get('dueDate', style['dueDate']),
            "trackingTemplateId": data.get('trackingTemplateId', style['trackingTemplateId']),
            "image": data.get('image', style['image']),
            "lastEditedBy": data.get('lastEditedBy', style.get('lastEditedBy')),
            "lastEditedAt": data.get('lastEditedAt', style.get('lastEditedAt')),
            "bomData": json.dumps(data.get('bomData', json.loads(style.get('bomData', '[]')))),
            "trackingSteps": data.get('trackingSteps', style.get('trackingSteps'))
        }

        db.execute('''
            UPDATE styles 
            SET no = ?, desc = ?, color = ?, category = ?, sizes = ?, qty = ?, status = ?,
                orderDate = ?, dueDate = ?, trackingTemplateId = ?, image = ?,
                lastEditedBy = ?, lastEditedAt = ?, bomData = ?, trackingSteps = ?
            WHERE id = ?
        ''', (
            merged['no'], merged['desc'], merged['color'], merged['category'],
            merged['sizes'], merged['qty'], merged['status'], merged['orderDate'],
            merged['dueDate'], merged['trackingTemplateId'], merged['image'],
            merged['lastEditedBy'], merged['lastEditedAt'], merged['bomData'],
            merged['trackingSteps'],
            id
        ))
        
    db.commit()
    return jsonify({"success": True})

@app.route('/api/styles/<int:id>', methods=['DELETE'])
def delete_style(id):
    db = get_db()
    
    # Find deliveryId for this style before deleting to decrement the count
    cursor = db.execute('SELECT deliveryId FROM styles WHERE id = ?', (id,))
    row = cursor.fetchone()
    
    if row:
        deliveryId = row['deliveryId']
        db.execute('UPDATE styles SET isDeleted = 1, deletedAt = ? WHERE id = ?', (datetime.now().isoformat(), id))
        # Update delivery item count
        db.execute('UPDATE deliveries SET items = MAX(0, items - 1) WHERE id = ?', (deliveryId,))
        db.commit()
        
    return jsonify({"success": True})

# --- Materials Endpoints ---

@app.route('/api/materials', methods=['GET'])
def get_materials():
    db = get_db()
    # Fetch materials with usage count from style_materials
    materials = db.execute('''
        SELECT m.*, (SELECT COUNT(*) FROM style_materials WHERE materialId = m.id) as usageCount
        FROM materials m
        WHERE m.isDeleted = 0
    ''').fetchall()
    return jsonify([dict(row) for row in materials])

@app.route('/api/materials/<int:id>/styles', methods=['GET'])
def get_material_styles(id):
    db = get_db()
    # Fetch styles associated with this material, including their tracker step and basic info
    styles = db.execute('''
        SELECT s.id, s.no, s.desc, s.trackerStep, s.status, sm.usage, sm.quantity
        FROM style_materials sm
        JOIN styles s ON sm.styleId = s.id
        WHERE sm.materialId = ?
    ''', (id,)).fetchall()
    return jsonify([dict(row) for row in styles])

@app.route('/api/materials', methods=['POST'])
def add_material():
    data = request.json
    db = get_db()
    cursor = db.execute('''
        INSERT INTO materials (name, type, supplier, color, notes, createdDate)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['name'], data['type'], data.get('supplier', ''), 
        data.get('color', ''), data.get('notes', ''), data['createdDate']
    ))
    db.commit()
    return jsonify({"id": cursor.lastrowid}), 201

@app.route('/api/materials/<int:id>', methods=['PUT'])
def update_material(id):
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE materials 
        SET name = ?, type = ?, supplier = ?, color = ?, notes = ?
        WHERE id = ?
    ''', (
        data['name'], data['type'], data.get('supplier', ''), 
        data.get('color', ''), data.get('notes', ''), id
    ))
    db.commit()
    return jsonify({"success": True})

@app.route('/api/materials/<int:id>', methods=['DELETE'])
def delete_material(id):
    db = get_db()
    db.execute('UPDATE materials SET isDeleted = 1, deletedAt = ? WHERE id = ?', (datetime.now().isoformat(), id))
    db.commit()
    return jsonify({"success": True})

# --- Style Materials (BOM) Endpoints ---

@app.route('/api/styles/<int:style_id>/materials', methods=['GET'])
def get_style_materials(style_id):
    db = get_db()
    # Join with materials table to get name, type, and color
    materials = db.execute('''
        SELECT sm.*, m.name, m.type, m.color, m.supplier
        FROM style_materials sm
        JOIN materials m ON sm.materialId = m.id
        WHERE sm.styleId = ?
    ''', (style_id,)).fetchall()
    return jsonify([dict(row) for row in materials])

@app.route('/api/styles/<int:style_id>/materials', methods=['POST'])
def add_style_material(style_id):
    data = request.json
    db = get_db()
    db.execute('''
        INSERT INTO style_materials (styleId, materialId, usage, quantity)
        VALUES (?, ?, ?, ?)
    ''', (style_id, data['materialId'], data.get('usage', ''), data.get('quantity', '')))
    db.commit()
    return jsonify({"success": True})

@app.route('/api/style-materials/<int:assignment_id>', methods=['DELETE'])
def delete_style_material(assignment_id):
    db = get_db()
    db.execute('DELETE FROM style_materials WHERE id = ?', (assignment_id,))
    db.commit()
    return jsonify({"success": True})

# --- Recycle Bin Endpoints ---

@app.route('/api/recycle-bin', methods=['GET'])
def get_recycle_bin():
    db = get_db()
    items = []
    
    # Fetch Folders
    folders = db.execute('SELECT id, name, createdDate, deletedAt FROM deliveries WHERE isDeleted = 1').fetchall()
    for f in folders:
        items.append({"id": f['id'], "type": "folder", "name": f['name'], "deletedAt": f['deletedAt'], "createdDate": f['createdDate']})
        
    # Fetch Styles
    styles = db.execute('SELECT id, no, desc, createdDate, deletedAt FROM styles WHERE isDeleted = 1').fetchall()
    for s in styles:
        items.append({"id": s['id'], "type": "style", "name": f"Style {s['no']} - {s['desc']}", "deletedAt": s['deletedAt'], "createdDate": s['createdDate']})
        
    # Fetch Materials
    materials = db.execute('SELECT id, name, type, createdDate, deletedAt FROM materials WHERE isDeleted = 1').fetchall()
    for m in materials:
        items.append({"id": m['id'], "type": "material", "name": f"{m['name']} ({m['type']})", "deletedAt": m['deletedAt'], "createdDate": m['createdDate']})
        
    # Fetch Templates
    templates = db.execute('SELECT id, name, deletedAt FROM tracking_templates WHERE isDeleted = 1').fetchall()
    for t in templates:
        items.append({"id": t['id'], "type": "template", "name": t['name'], "deletedAt": t['deletedAt'], "createdDate": t['deletedAt']}) # fall back to deletedAt if createdDate doesn't exist

    # Sort items by deletedAt descending
    items.sort(key=lambda x: x.get('deletedAt') or '', reverse=True)
    return jsonify(items)

@app.route('/api/recycle-bin/restore', methods=['POST'])
def restore_item():
    data = request.json
    item_type = data.get('type')
    item_id = data.get('id')
    db = get_db()
    
    if item_type == 'folder':
        db.execute('UPDATE deliveries SET isDeleted = 0, deletedAt = NULL WHERE id = ?', (item_id,))
        # Cascade restore styles
        db.execute('UPDATE styles SET isDeleted = 0, deletedAt = NULL WHERE deliveryId = ?', (item_id,))
    elif item_type == 'style':
        db.execute('UPDATE styles SET isDeleted = 0, deletedAt = NULL WHERE id = ?', (item_id,))
        # Re-increment folder count
        cursor = db.execute('SELECT deliveryId FROM styles WHERE id = ?', (item_id,))
        row = cursor.fetchone()
        if row:
            db.execute('UPDATE deliveries SET items = items + 1 WHERE id = ?', (row['deliveryId'],))
    elif item_type == 'material':
        db.execute('UPDATE materials SET isDeleted = 0, deletedAt = NULL WHERE id = ?', (item_id,))
    elif item_type == 'template':
        db.execute('UPDATE tracking_templates SET isDeleted = 0, deletedAt = NULL WHERE id = ?', (item_id,))
    else:
        return jsonify({"success": False, "error": "Unknown item type"}), 400
        
    db.commit()
    return jsonify({"success": True})

@app.route('/api/recycle-bin/empty', methods=['DELETE'])
def empty_recycle_bin():
    data = request.json
    item_type = data.get('type')
    item_id = data.get('id')
    db = get_db()
    
    if item_type and item_id:
        # Permanent delete single item
        if item_type == 'folder':
            db.execute('DELETE FROM deliveries WHERE id = ? AND isDeleted = 1', (item_id,))
            db.execute('DELETE FROM styles WHERE deliveryId = ? AND isDeleted = 1', (item_id,)) 
        elif item_type == 'style':
            db.execute('DELETE FROM styles WHERE id = ? AND isDeleted = 1', (item_id,))
        elif item_type == 'material':
            db.execute('DELETE FROM materials WHERE id = ? AND isDeleted = 1', (item_id,))
        elif item_type == 'template':
            db.execute('DELETE FROM tracking_templates WHERE id = ? AND isDeleted = 1', (item_id,))
    else:
        # Empty ALL
        # Get all soft deleted folders' IDs before deleting to delete their styles
        deleted_folders = db.execute('SELECT id FROM deliveries WHERE isDeleted = 1').fetchall()
        for folder in deleted_folders:
            db.execute('DELETE FROM styles WHERE deliveryId = ?', (folder['id'],))
            
        db.execute('DELETE FROM styles WHERE isDeleted = 1')
        db.execute('DELETE FROM deliveries WHERE isDeleted = 1')
        db.execute('DELETE FROM materials WHERE isDeleted = 1')
        db.execute('DELETE FROM tracking_templates WHERE isDeleted = 1')
        
    db.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    import os
  port = int(os.environ.get('PORT', 5000))
    is_prod = os.environ.get('PORT') is not None  # Render always sets PORT
    app.run(host='0.0.0.0', debug=not is_prod, port=port, use_reloader=False)




