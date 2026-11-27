/* Video 4: Make your first menu, on the Map */
L.intro(4, 'Make your first menu', 'Build a simple shop menu on the Map, with no code at all.',
  "This is video four. Now you will make your own USSD menu, with no code. We will build a simple menu for a small shop, using the Map.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("Imagine a small shop in Accra. Customers dial a code, and get a menu.");
T.say("Option one, check balance. Option two, opening hours. And zero, exit.");

L.section('Part 2', 'Two ways to build', "Click Menu builder at the top.");
L.page('builder');
L.onMap();
T.say("The Map opens first. It is the easiest way to build, and it is the way we use in these videos. There is also a second way, the List, right next to it.");
T.move('#bView button[data-v=map]', 800).wait(300).move('#bView button[data-v=list]', 600).wait(300).move('#bView button[data-v=map]', 600);
T.say("On the Map, each screen is a box, and arrows show where each option goes. You see your whole menu at once, like a drawing. Do not worry, it is simple. If you can type and drag, you can build a USSD menu.");
T.say("You start with one box, called main. The green Start label means customers see it first.");
T.move(`${L.N('main')} .badge.go`, 900);

L.section('Part 3', 'The welcome message', "First, type the welcome message straight into the box.");
L.msg('main', 'Welcome to My Shop', 85);
T.say("The coloured top of the box shows what kind of screen it is. Blue is a Menu. Orange is a Question. And red is an End screen.");
T.move(`${L.N('main')} .node-typesel`, 800);

L.section('Part 4', 'The first option', "Now, the first option. Type its text in the box: Check balance.");
T.click(L.nodeOptText('main', 0)).type(L.nodeOptText('main', 0), 'Check balance', { msPerChar: 90 });
T.say("See the small dot on the right of the option? It is empty, because the option does not go anywhere yet.");
T.move(L.port('main', 0), 900);
T.say("Drag from the dot to an empty space, and let go. A new box appears, already joined with an arrow.");
L.newScreen('main', L.port('main', 0));
T.say("Type the message for the new box. Then give it a short name: balance.");
L.msg('new_screen', 'Your balance is GHS 25.00', 70);
L.name('new_screen', 'balance');
T.say("It is red, because it is an End screen. The customer reads the message, and the session finishes.");

L.section('Part 5', 'More options', "Now, two more options. Press plus Option in the box.");
T.click(`${L.N('main')} .node-add`).sleep(250);
T.type(L.nodeOptText('main', 1), 'Opening hours', { msPerChar: 90 });
T.say("Drag its dot to an empty space. Type the message, and name it hours.");
L.newScreen('main', L.port('main', 1));
L.msg('new_screen', 'Open Monday to Friday, 8am to 5pm.', 60);
L.name('new_screen', 'hours');
T.say("One more. A way out. Add an option, change its number to zero, and call it Exit.");
T.click(`${L.N('main')} .node-add`).sleep(250);
T.click(L.nodeOptKey('main', 2)).type(L.nodeOptKey('main', 2), '0', { msPerChar: 160 });
T.type(L.nodeOptText('main', 2), 'Exit', { msPerChar: 110 });
L.newScreen('main', L.port('main', 2));
L.msg('new_screen', 'Thank you. Goodbye!', 70);
L.name('new_screen', 'bye');
T.say("Press Tidy up, to put the boxes in neat rows.");
L.tidy();
T.say("Now you can see the whole menu. One start box, with an arrow to each of the three answers.");

L.section('Part 6', 'Fixing and saving', "A few helpful things.");
T.say("Drag a box by its top bar to move it.");
T.drag(`${L.N('bye')} .grip`, null, 1000, [30, 70]).wait(600);
T.say("Right-click a box for more choices, like duplicate or delete. You are always asked before anything is deleted.");
T.rightClick(L.nodeMsg('hours')).sleep(250).wait(2000).key('Escape');
T.say("Your work saves by itself. The green dot next to Save shows it is saved.");
T.move('#saveState', 800);

L.section('Part 7', 'Test it', "Now the best part. Press Test on phone.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(1200);
T.say("There is your menu, on the phone. Choose 2, opening hours.", "There is your menu, on the phone. Choose two, opening hours.");
L.reply('2');
T.say("It works.");
L.ok();

L.outro("Congratulations. You built your first USSD menu on the Map, and tested it. In the next video, we will ask customers to type answers, like their name.",
  'Ask questions');
