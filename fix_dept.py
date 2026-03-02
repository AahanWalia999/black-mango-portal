with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''                    <select id="department" required>
                        <option value="" disabled selected>Select Department</option>
                        <option value="design">Design & Styling</option>
                        <option value="production">Production & Sourcing</option>
                        <option value="marketing">Marketing & PR</option>
                        <option value="sales">Sales & Retail</option>
                        <option value="finance">Finance</option>
                    </select>'''

new = '''                    <select id="department" required>
                        <option value="" disabled selected>Select Team / Department</option>
                        <option value="Client">Client</option>
                        <option value="Design">Design</option>
                        <option value="Factory">Factory</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Management">Management</option>
                        <option value="Production">Production</option>
                        <option value="Sales">Sales</option>
                    </select>'''

if old in content:
    content = content.replace(old, new)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("ERROR: Not found")
