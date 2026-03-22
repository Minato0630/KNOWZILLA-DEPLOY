# MongoDB Migration Complete

## Setup
1. `composer install`
2. Install PHP MongoDB ext: `pecl install mongodb`
3. Start MongoDB: `mongod`
4. Init DB: `mongo < init-mongo.js`

## Collections
- users (unique registration_no, email)
- contact, reviews, subscriptions

All PHP files updated to MongoDB.

Test: POST to process.php signup/login, handle_contact.php etc.

