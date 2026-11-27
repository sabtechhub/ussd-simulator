/*
 * Ready-made menus for the Menu builder (File → Load a sample).
 * From a single screen up to payments with fees, conditions and maths.
 * Powered by SAB-TECH HUB
 */
(function () {
  // small helpers to keep each sample short
  const M = (id, text, opts, x = {}) => ({ id, type: 'menu', text, options: opts.map(([key, label, next]) => ({ key, label, next })), ...x });
  const Q = (id, text, saveAs, validate, next, rules = [], x = {}) => ({ id, type: 'input', text, saveAs, validate, next, rules: rules.map(([v, op, value, n]) => ({ var: v, op, value, next: n })), ...x });
  const E = (id, text, x = {}) => ({ id, type: 'end', text, ...x });
  const set = (...pairs) => ({ sets: pairs.map(([name, value]) => ({ name, value })) });
  const flow = (name, screens) => ({ name, start: screens[0].id, screens });

  window.SAMPLES = [
    /* ---------------- Beginner ---------------- */
    { level: 'Beginner', title: 'Hello world', about: 'One screen that shows a message and ends.',
      flow: flow('Hello', [E('hello', 'Hello! Welcome to our USSD service.')]) },

    { level: 'Beginner', title: 'Simple main menu', about: 'Three options, each with its own answer.',
      flow: flow('Main menu', [
        M('main', 'Welcome', [['1', 'About us', 'about'], ['2', 'Our services', 'services'], ['3', 'Contact', 'contact']]),
        E('about', 'We help small businesses grow.'),
        E('services', 'We offer design, printing and web services.'),
        E('contact', 'Call 0302 000 000 or visit our office in Accra.')]) },

    { level: 'Beginner', title: 'Menu with Back', about: 'A sub-menu with a "0. Back" option.',
      flow: flow('Back button', [
        M('main', 'Main menu', [['1', 'Products', 'products'], ['2', 'Help', 'help']]),
        M('products', 'Products', [['1', 'Phones', 'phones'], ['2', 'Laptops', 'laptops'], ['0', 'Back', 'main']]),
        E('phones', 'Phones from GHS 800.'), E('laptops', 'Laptops from GHS 3,500.'),
        E('help', 'Call 0302 000 000 for help.')]) },

    { level: 'Beginner', title: 'Business information line', about: 'Opening hours, location and phone number.',
      flow: flow('Info line', [
        M('main', 'Info line', [['1', 'Opening hours', 'hours'], ['2', 'Location', 'location'], ['3', 'Phone', 'phone']]),
        E('hours', 'Mon–Fri 8am–5pm\nSat 9am–1pm'),
        E('location', 'Ring Road Central, Accra (opposite the bank).'),
        E('phone', 'Call or WhatsApp 024 000 0000.')]) },

    { level: 'Beginner', title: 'Show the caller\'s number', about: 'Uses {{phone}} and {{network}}, which are always there.',
      flow: flow('My number', [
        M('main', 'Account', [['1', 'My number', 'mine'], ['2', 'My network', 'net']]),
        E('mine', 'Your number is {{phone}}.'), E('net', 'You are on {{network}}.')]) },

    { level: 'Beginner', title: 'Ask a name', about: 'One question; the answer is shown back with {{name}}.',
      flow: flow('Greeting', [
        Q('ask', 'What is your name?', 'name', 'text', 'hi'),
        E('hi', 'Nice to meet you, {{name}}!')]) },

    { level: 'Beginner', title: 'Choose a language', about: 'The chosen option is remembered and used later.',
      flow: flow('Language', [
        M('lang', 'Choose language', [['1', 'English', 'en'], ['2', 'Twi', 'tw']], { saveAs: 'language' }),
        E('en', 'Welcome! You chose {{language}}.'),
        E('tw', 'Akwaaba! Wo apaw {{language}}.')]) },

    { level: 'Beginner', title: 'Exit on every menu', about: '"0. Exit" on each menu so users can leave at any time.',
      flow: flow('Exit option', [
        M('main', 'Welcome', [['1', 'Offers', 'offers'], ['0', 'Exit', 'bye']]),
        M('offers', 'Today\'s offers', [['1', 'Free delivery', 'delivery'], ['0', 'Exit', 'bye']]),
        E('delivery', 'Free delivery on orders above GHS 200 today.'),
        E('bye', 'Thank you. Goodbye!')]) },

    { level: 'Beginner', title: 'FAQ', about: 'Frequently asked questions with short answers.',
      flow: flow('FAQ', [
        M('faq', 'FAQ', [['1', 'How do I pay?', 'pay'], ['2', 'Delivery time?', 'time'], ['3', 'Refunds?', 'refund']]),
        E('pay', 'Pay with Mobile Money or card.'),
        E('time', 'Delivery takes 1–3 working days.'),
        E('refund', 'Refunds are made within 7 days.')]) },

    { level: 'Beginner', title: 'Two-level menu', about: 'Categories, then items in each category.',
      flow: flow('Menu', [
        M('main', 'Food menu', [['1', 'Rice dishes', 'rice'], ['2', 'Drinks', 'drinks']]),
        M('rice', 'Rice dishes', [['1', 'Jollof – GHS 35', 'jollof'], ['2', 'Waakye – GHS 25', 'waakye'], ['0', 'Back', 'main']]),
        M('drinks', 'Drinks', [['1', 'Sobolo – GHS 8', 'sobolo'], ['0', 'Back', 'main']]),
        E('jollof', 'Jollof ordered. We will call you.'), E('waakye', 'Waakye ordered. We will call you.'),
        E('sobolo', 'Sobolo ordered. We will call you.')]) },

    /* ---------------- Intermediate ---------------- */
    { level: 'Intermediate', title: 'Airtime top-up', about: 'Amount must be between 1 and 500, then confirm.',
      flow: flow('Airtime', [
        Q('amount', 'Enter amount (GHS 1 – 500):', 'amount', 'number', 'confirm', [['amount', 'between', '1,500', 'confirm']], { next: 'bad_amount' }),
        E('bad_amount', 'Amount must be between GHS 1 and 500.'),
        M('confirm', 'Buy GHS {{amount}} airtime for {{phone}}?', [['1', 'Confirm', 'done'], ['2', 'Cancel', 'cancel']]),
        E('done', 'Done! GHS {{amount}} airtime sent to {{phone}}.'),
        E('cancel', 'Cancelled.')]) },

    { level: 'Intermediate', title: 'Data bundles', about: 'Each bundle sets its own price and size before confirming.',
      flow: flow('Data bundles', [
        M('bundles', 'Choose a bundle', [['1', '1GB – GHS 10', 'b1'], ['2', '5GB – GHS 40', 'b5'], ['3', '10GB – GHS 70', 'b10']]),
        M('b1', 'Buy 1GB for GHS 10?', [['1', 'Confirm', 'paid'], ['0', 'Back', 'bundles']], set(['size', '1GB'], ['price', '10'])),
        M('b5', 'Buy 5GB for GHS 40?', [['1', 'Confirm', 'paid'], ['0', 'Back', 'bundles']], set(['size', '5GB'], ['price', '40'])),
        M('b10', 'Buy 10GB for GHS 70?', [['1', 'Confirm', 'paid'], ['0', 'Back', 'bundles']], set(['size', '10GB'], ['price', '70'])),
        E('paid', '{{size}} bundle bought for GHS {{price}}. Enjoy!')]) },

    { level: 'Intermediate', title: 'Registration', about: 'Name, age (18+) and email with checks, then a summary.',
      flow: flow('Registration', [
        Q('name', 'Enter your full name:', 'name', 'text', 'age'),
        Q('age', 'Enter your age:', 'age', 'number', 'email', [['age', '<', '18', 'too_young']]),
        E('too_young', 'Sorry, you must be 18 or older.'),
        Q('email', 'Enter your email:', 'email', 'email', 'confirm'),
        M('confirm', 'Name: {{name}}\nAge: {{age}}\nEmail: {{email}}', [['1', 'Submit', 'done'], ['2', 'Start again', 'name']]),
        E('done', 'Thanks {{name}}, you are registered!')]) },

    { level: 'Intermediate', title: 'PIN check', about: 'A 4-digit PIN; the right PIN opens the account menu.',
      flow: flow('PIN check', [
        Q('pin', 'Enter your 4-digit PIN:', 'pin', 'pin', 'wrong', [['pin', '=', '1234', 'account']]),
        E('wrong', 'Wrong PIN. Please try again later.'),
        M('account', 'My account', [['1', 'Balance', 'balance'], ['2', 'Mini statement', 'statement']]),
        E('balance', 'Your balance is GHS 1,250.00'),
        E('statement', 'Last 3: +200, -50, -35')]) },

    { level: 'Intermediate', title: 'Customer feedback', about: 'Rating 1–5; low ratings get a different reply.',
      flow: flow('Feedback', [
        Q('rate', 'Rate our service from 1 (bad) to 5 (great):', 'rating', 'number', 'bad_rate',
          [['rating', 'one_of', '1,2', 'sorry'], ['rating', 'one_of', '3,4,5', 'thanks']]),
        E('bad_rate', 'Please enter a number from 1 to 5.'),
        Q('sorry', 'Sorry to hear that. What went wrong?', 'comment', 'any', 'noted'),
        E('noted', 'Thank you. A manager will call {{phone}}.'),
        E('thanks', 'Thanks for rating us {{rating}}/5!')]) },

    { level: 'Intermediate', title: 'Appointment booking', about: 'Choose a day and a time, then confirm.',
      flow: flow('Appointments', [
        M('day', 'Choose a day', [['1', 'Monday', 'time'], ['2', 'Wednesday', 'time'], ['3', 'Friday', 'time']], { saveAs: 'day' }),
        M('time', 'Choose a time on {{day}}', [['1', '9:00am', 'confirm'], ['2', '11:00am', 'confirm'], ['3', '2:00pm', 'confirm']], { saveAs: 'time' }),
        M('confirm', 'Book {{day}} at {{time}}?', [['1', 'Confirm', 'booked'], ['2', 'Change', 'day']]),
        E('booked', 'Booked for {{day}} at {{time}}. See you!')]) },

    { level: 'Intermediate', title: 'School fees payment', about: 'Student ID must be 6 digits; amount checked; confirm.',
      flow: flow('School fees', [
        Q('student', 'Enter student ID (6 digits):', 'student', 'number', 'bad_id', [['student', 'len_eq', '6', 'amount']]),
        E('bad_id', 'Student ID must be exactly 6 digits.'),
        Q('amount', 'Amount to pay (GHS):', 'amount', 'number', 'confirm', [['amount', '<=', '0', 'bad_amount']]),
        E('bad_amount', 'Amount must be more than 0.'),
        M('confirm', 'Pay GHS {{amount}} for student {{student}}?', [['1', 'Pay', 'paid'], ['2', 'Cancel', 'cancel']]),
        E('paid', 'Payment received. Receipt sent to {{phone}}.'),
        E('cancel', 'Payment cancelled.')]) },

    { level: 'Intermediate', title: 'Electricity bill', about: 'Meter number length check, amount range and a GHS 1 fee.',
      flow: flow('Bill payment', [
        Q('meter', 'Enter meter number:', 'meter', 'number', 'bad_meter', [['meter', 'len_gte', '8', 'amount']]),
        E('bad_meter', 'Meter number must have at least 8 digits.'),
        Q('amount', 'Amount (GHS 5 – 2000):', 'amount', 'number', 'bad_amount', [['amount', 'between', '5,2000', 'confirm']]),
        E('bad_amount', 'Amount must be between GHS 5 and 2000.'),
        M('confirm', 'Meter {{meter}}\nAmount GHS {{amount}} + fee GHS 1\nTotal GHS {{total}}', [['1', 'Pay', 'paid'], ['2', 'Cancel', 'cancel']], set(['total', '={{amount}} + 1'])),
        E('paid', 'Paid GHS {{total}}. Your token will be sent by SMS.'),
        E('cancel', 'Cancelled.')]) },

    { level: 'Intermediate', title: 'Event tickets', about: 'Ticket price × quantity with a maximum of 10.',
      flow: flow('Tickets', [
        M('type', 'Choose ticket', [['1', 'Regular – GHS 50', 'regular'], ['2', 'VIP – GHS 150', 'vip']]),
        Q('regular', 'How many Regular tickets? (max 10)', 'qty', 'number', 'confirm', [['qty', '>', '10', 'too_many'], ['qty', '<', '1', 'too_many']], set(['ticket', 'Regular'], ['price', '50'])),
        Q('vip', 'How many VIP tickets? (max 10)', 'qty', 'number', 'confirm', [['qty', '>', '10', 'too_many'], ['qty', '<', '1', 'too_many']], set(['ticket', 'VIP'], ['price', '150'])),
        E('too_many', 'You can buy between 1 and 10 tickets.'),
        M('confirm', '{{qty}} x {{ticket}} = GHS {{total}}', [['1', 'Pay', 'paid'], ['2', 'Cancel', 'cancel']], set(['total', '={{price}} * {{qty}}'])),
        E('paid', 'Done! {{qty}} {{ticket}} ticket(s). Codes sent to {{phone}}.'),
        E('cancel', 'Cancelled.')]) },

    { level: 'Intermediate', title: 'Report a fault', about: 'Pick a category, describe it, get a reference.',
      flow: flow('Fault report', [
        M('category', 'What is the problem?', [['1', 'No power', 'describe'], ['2', 'Water leak', 'describe'], ['3', 'Other', 'describe']], { saveAs: 'category' }),
        Q('describe', 'Describe the problem ({{category}}):', 'details', 'any', 'short', [['details', 'len_gte', '5', 'logged']]),
        E('short', 'Please give a little more detail next time (5+ letters).'),
        E('logged', 'Thank you. "{{category}}" reported. We will call {{phone}}.')]) },

    /* ---------------- Advanced ---------------- */
    { level: 'Advanced', title: 'Send mobile money', about: 'Recipient check, amount limits, 1% fee, PIN and a summary.',
      flow: flow('Send money', [
        Q('to', 'Enter recipient number:', 'to', 'phone', 'amount', [['to', '=', '{{phone}}', 'self']]),
        E('self', 'You cannot send money to yourself.'),
        Q('amount', 'Amount (GHS 1 – 1000):', 'amount', 'number', 'limit', [['amount', 'between', '1,1000', 'pin']]),
        E('limit', 'You can send between GHS 1 and 1000.'),
        Q('pin', 'Fee GHS {{fee}}. Total GHS {{total}}.\nEnter PIN to confirm:', 'pin', 'pin', 'wrong_pin', [['pin', '=', '1234', 'sent']],
          set(['fee', '={{amount}} * 0.01'], ['total', '={{amount}} + {{fee}}'])),
        E('wrong_pin', 'Wrong PIN. Transaction cancelled.'),
        E('sent', 'Sent GHS {{amount}} to {{to}}. Fee GHS {{fee}}. Total GHS {{total}}.')]) },

    { level: 'Advanced', title: 'Loan calculator', about: 'Amount, 3/6/12 months, interest and monthly repayment.',
      flow: flow('Loans', [
        Q('amount', 'Loan amount (GHS 100 – 5000):', 'amount', 'number', 'bad_amount', [['amount', 'between', '100,5000', 'months']]),
        E('bad_amount', 'Loans are between GHS 100 and 5000.'),
        Q('months', 'Repay over how many months? (3, 6 or 12)', 'months', 'number', 'bad_months', [['months', 'one_of', '3,6,12', 'offer']]),
        E('bad_months', 'Please choose 3, 6 or 12 months.'),
        M('offer', 'Loan GHS {{amount}} for {{months}} months\nInterest (5%/month): GHS {{interest}}\nPay GHS {{monthly}} per month', [['1', 'Accept', 'approved'], ['2', 'Decline', 'declined']],
          set(['interest', '={{amount}} * 0.05 * {{months}}'], ['monthly', '=({{amount}} + {{interest}}) / {{months}}'])),
        E('approved', 'Approved! GHS {{amount}} will be sent to {{phone}}.'),
        E('declined', 'No problem. Come back any time.')]) },

    { level: 'Advanced', title: 'Car insurance quote', about: 'Young drivers get a higher rate; premium is calculated.',
      flow: flow('Insurance', [
        Q('age', 'Driver\'s age:', 'age', 'number', 'normal', [['age', '<', '18', 'too_young'], ['age', '<', '25', 'young']]),
        E('too_young', 'Drivers must be 18 or older.'),
        Q('young', 'Car value in GHS (young driver rate 8%):', 'value', 'number', 'quote', [], set(['rate', '0.08'])),
        Q('normal', 'Car value in GHS (standard rate 5%):', 'value', 'number', 'quote', [], set(['rate', '0.05'])),
        M('quote', 'Yearly premium: GHS {{premium}}\n(GHS {{value}} x {{rate}})', [['1', 'Buy cover', 'bought'], ['2', 'No thanks', 'bye']], set(['premium', '={{value}} * {{rate}}'])),
        E('bought', 'Covered! Policy details sent to {{phone}}.'),
        E('bye', 'Thank you for asking.')]) },

    { level: 'Advanced', title: 'Savings goal', about: 'Works out how many months to reach a target.',
      flow: flow('Savings', [
        Q('target', 'How much do you want to save? (GHS)', 'target', 'number', 'monthly', [['target', '<=', '0', 'bad']]),
        E('bad', 'Please enter an amount above 0.'),
        Q('monthly', 'How much can you save each month? (GHS)', 'monthly', 'number', 'plan', [['monthly', '<=', '0', 'bad']]),
        M('plan', 'Saving GHS {{monthly}} a month, you reach GHS {{target}} in about {{months}} months.', [['1', 'Start saving', 'started'], ['2', 'Change amount', 'monthly']], set(['months', '={{target}} / {{monthly}}'])),
        E('started', 'Great! We will remind {{phone}} every month.')]) },

    { level: 'Advanced', title: 'Hotel booking', about: 'Room type sets the rate; nights 1–30; total calculated.',
      flow: flow('Hotel', [
        M('room', 'Choose a room', [['1', 'Standard – GHS 300', 'standard'], ['2', 'Deluxe – GHS 550', 'deluxe'], ['3', 'Suite – GHS 900', 'suite']]),
        Q('standard', 'How many nights? (1 – 30)', 'nights', 'number', 'bad_nights', [['nights', 'between', '1,30', 'summary']], set(['room', 'Standard'], ['rate', '300'])),
        Q('deluxe', 'How many nights? (1 – 30)', 'nights', 'number', 'bad_nights', [['nights', 'between', '1,30', 'summary']], set(['room', 'Deluxe'], ['rate', '550'])),
        Q('suite', 'How many nights? (1 – 30)', 'nights', 'number', 'bad_nights', [['nights', 'between', '1,30', 'summary']], set(['room', 'Suite'], ['rate', '900'])),
        E('bad_nights', 'Bookings are for 1 to 30 nights.'),
        M('summary', '{{room}} x {{nights}} night(s)\nTotal GHS {{total}}', [['1', 'Book', 'booked'], ['2', 'Change room', 'room']], set(['total', '={{rate}} * {{nights}}'])),
        E('booked', 'Booked! Pay GHS {{total}} on arrival. Ref sent to {{phone}}.')]) },

    { level: 'Advanced', title: 'Farm inputs order', about: 'Product price × bags, plus delivery fee by region.',
      flow: flow('Farm shop', [
        M('product', 'Choose product', [['1', 'Fertilizer – GHS 280/bag', 'fert'], ['2', 'Maize seed – GHS 120/bag', 'seed']]),
        Q('fert', 'How many bags of fertilizer?', 'bags', 'number', 'region', [['bags', '<', '1', 'bad']], set(['item', 'Fertilizer'], ['price', '280'])),
        Q('seed', 'How many bags of maize seed?', 'bags', 'number', 'region', [['bags', '<', '1', 'bad']], set(['item', 'Maize seed'], ['price', '120'])),
        E('bad', 'Please order at least 1 bag.'),
        M('region', 'Deliver to', [['1', 'Greater Accra – GHS 20', 'accra'], ['2', 'Other regions – GHS 50', 'other']]),
        M('accra', '{{bags}} x {{item}}\nGoods GHS {{goods}} + delivery GHS 20\nTotal GHS {{total}}', [['1', 'Order', 'ordered'], ['0', 'Back', 'region']], set(['goods', '={{price}} * {{bags}}'], ['total', '={{goods}} + 20'])),
        M('other', '{{bags}} x {{item}}\nGoods GHS {{goods}} + delivery GHS 50\nTotal GHS {{total}}', [['1', 'Order', 'ordered'], ['0', 'Back', 'region']], set(['goods', '={{price}} * {{bags}}'], ['total', '={{goods}} + 50'])),
        E('ordered', 'Order placed: GHS {{total}}. We will call {{phone}} to deliver.')]) },

    { level: 'Advanced', title: 'Bank account opening', about: 'Ghana Card format, email, name length and a review step.',
      flow: flow('Open account', [
        Q('name', 'Full name as on your Ghana Card:', 'name', 'text', 'short_name', [['name', 'len_gte', '5', 'card']]),
        E('short_name', 'Please enter your full name.'),
        Q('card', 'Ghana Card number (e.g. GHA-123456789-0):', 'card', 'any', 'bad_card', [['card', 'starts', 'GHA-', 'email']]),
        E('bad_card', 'Ghana Card numbers start with GHA-.'),
        Q('email', 'Your email address:', 'email', 'email', 'type'),
        M('type', 'Account type', [['1', 'Savings', 'review'], ['2', 'Current', 'review']], { saveAs: 'acct' }),
        M('review', '{{name}}\n{{card}}\n{{email}}\n{{acct}} account', [['1', 'Open account', 'opened'], ['2', 'Start again', 'name']]),
        E('opened', 'Welcome {{name}}! Your {{acct}} account will be ready in 24 hours.')]) },

    { level: 'Advanced', title: 'Merchant payment with discount', about: '10% off when paying GHS 100 or more.',
      flow: flow('Pay merchant', [
        Q('merchant', 'Enter merchant ID (5 digits):', 'merchant', 'number', 'bad_merchant', [['merchant', 'len_eq', '5', 'amount']]),
        E('bad_merchant', 'Merchant IDs have 5 digits.'),
        Q('amount', 'Amount to pay (GHS):', 'amount', 'number', 'no_discount', [['amount', '<=', '0', 'bad_amount'], ['amount', '>=', '100', 'discount']]),
        E('bad_amount', 'Amount must be more than 0.'),
        M('discount', 'You get 10% off!\nAmount GHS {{amount}} - GHS {{off}}\nPay GHS {{total}}', [['1', 'Pay', 'paid'], ['2', 'Cancel', 'cancel']], set(['off', '={{amount}} * 0.1'], ['total', '={{amount}} - {{off}}'])),
        M('no_discount', 'Pay GHS {{total}} to merchant {{merchant}}?\n(Spend GHS 100+ for 10% off)', [['1', 'Pay', 'paid'], ['2', 'Cancel', 'cancel']], set(['total', '{{amount}}'])),
        E('paid', 'Paid GHS {{total}} to merchant {{merchant}}.'),
        E('cancel', 'Payment cancelled.')]) },

    { level: 'Advanced', title: 'Bus tickets', about: 'Route sets the fare, 1–10 seats, payment method, total.',
      flow: flow('Bus tickets', [
        M('route', 'Choose route', [['1', 'Accra – Kumasi (GHS 120)', 'r1'], ['2', 'Accra – Takoradi (GHS 95)', 'r2']]),
        Q('r1', 'Seats on Accra – Kumasi? (1 – 10)', 'seats', 'number', 'bad_seats', [['seats', 'between', '1,10', 'pay']], set(['route', 'Accra – Kumasi'], ['fare', '120'])),
        Q('r2', 'Seats on Accra – Takoradi? (1 – 10)', 'seats', 'number', 'bad_seats', [['seats', 'between', '1,10', 'pay']], set(['route', 'Accra – Takoradi'], ['fare', '95'])),
        E('bad_seats', 'You can book 1 to 10 seats.'),
        M('pay', '{{seats}} seat(s), {{route}}\nTotal GHS {{total}}\nPay with', [['1', 'Mobile Money', 'paid'], ['2', 'Card', 'paid']], { saveAs: 'method', ...set(['total', '={{fare}} * {{seats}}']) }),
        E('paid', 'Paid GHS {{total}} by {{method}}. Tickets sent to {{phone}}.')]) },

    { level: 'Advanced', title: 'Support with escalation', about: 'Account number check, urgency and a priority path.',
      flow: flow('Support', [
        M('topic', 'Customer support', [['1', 'Billing', 'account'], ['2', 'Technical', 'account'], ['3', 'Talk to an agent', 'agent']], { saveAs: 'topic' }),
        Q('account', 'Enter your 10-digit account number:', 'account', 'number', 'bad_account', [['account', 'len_eq', '10', 'urgency']]),
        E('bad_account', 'Account numbers have 10 digits. Please dial again.'),
        Q('urgency', 'How urgent is it? 1 = low, 2 = medium, 3 = high', 'urgency', 'number', 'bad_urgency',
          [['urgency', '=', '3', 'priority'], ['urgency', 'one_of', '1,2', 'normal']]),
        E('bad_urgency', 'Please choose 1, 2 or 3.'),
        E('priority', 'Priority ticket for {{topic}} on account {{account}}. An agent will call {{phone}} within 1 hour.'),
        E('normal', 'Ticket created for {{topic}} on account {{account}}. We will reply within 24 hours.'),
        E('agent', 'Please hold… or call 0302 000 000 now.')]) },
  ];
})();
