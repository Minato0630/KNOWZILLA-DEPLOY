db = db.getSiblingDB('user_management');

db.users.createIndex({"registration_no": 1}, {unique: true});
db.users.createIndex({"email": 1}, {unique: true});
db.subscriptions.createIndex({"email": 1}, {unique: true});

print("Knowzilla MongoDB setup complete!");

