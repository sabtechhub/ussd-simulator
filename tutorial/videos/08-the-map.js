/* Video 8: See your menu as a map (simple) */
L.loadFlow(L.shopFlow());
L.intro(8, 'See your menu as a map', 'Boxes and arrows that show how your menu connects.',
  "This is video eight. When a menu grows, it helps to see the whole thing as a picture. The Map shows every screen as a box, with arrows between them.");

L.section('Part 1', 'Open the Map', "We have a shop menu ready. Open the Menu builder.");
L.page('builder');
T.say("At the top right, click Map.");
T.click('#bView button[data-v=map]').sleep(300);
T.click('#bTidy').sleep(300).wait(800);
T.say("Each box is a screen. The green box is where customers start.");
T.move('#bmap .node[data-id=main]', 900);
T.say("The arrows show where each option goes. For example, option two goes to the amount question.");
T.move('#bmap .node[data-id=amount]', 900);
T.say("The Tidy button puts all the boxes in neat rows.");
T.click('#bTidy').sleep(250).wait(700);

L.section('Part 2', 'Change things in the boxes', "You can type straight into the boxes.");
T.say("Click the welcome message, and change it.");
T.click('#bmap .node[data-id=main] .node-msg-in').type('#bmap .node[data-id=main] .node-msg-in', 'Welcome to My Shop. Choose:', { msPerChar: 70 });
T.say("You can change an option's text in the same way.");
T.click(() => document.querySelectorAll('#bmap .node[data-id=main] .nl')[0]).type(() => document.querySelectorAll('#bmap .node[data-id=main] .nl')[0], 'My balance', { msPerChar: 90 });
T.say("And plus Option adds a new option. Let us add, Contact us.");
T.click('#bmap .node[data-id=main] .node-add').sleep(200);
T.type(() => [...document.querySelectorAll('#bmap .node[data-id=main] .nl')].pop(), 'Contact us', { msPerChar: 90 });

L.section('Part 3', 'Move a box', "To move a box, drag it by its top bar.");
T.drag('#bmap .node[data-id=bye] .grip', null, 1100, [40, 120]).wait(800);
T.say("Put the boxes wherever they make sense to you.");

L.section('Part 4', 'Draw an arrow', "Now the best part. Drawing arrows.");
T.say("Every option has a small dot on the right. Contact us has an empty dot, because it goes nowhere yet.");
T.move(() => [...document.querySelectorAll('#bmap .node[data-id=main] .port')].pop(), 900);
T.say("Drag from the dot to an empty space, and let go. A new screen is made, and the arrow is drawn for you.");
T.drag(() => [...document.querySelectorAll('#bmap .node[data-id=main] .port')].pop(), null, 1200, [160, 300]).sleep(300).wait(700);
T.say("Type the message for the new screen.");
T.click('#bmap .node[data-id=new_screen] .node-msg-in').type('#bmap .node[data-id=new_screen] .node-msg-in', 'Call 0302 000 000', { msPerChar: 80 });
T.say("To point an option somewhere else, drag its dot onto another box.");

L.section('Part 5', 'Right-click for more', "Right-click opens a small menu with more choices.");
T.say("Right-click a box to edit it, copy it, or delete it.");
T.rightClick('#bmap .node[data-id=balance] .node-msg-in').sleep(250).wait(2400).key('Escape').wait(300);
T.say("Right-click an empty space to add a new screen right there.");
T.rightClick('#bmap .map-canvas').sleep(250).wait(2200).key('Escape').wait(300);
T.say("And right-click an arrow to remove it. Do not worry about deleting by mistake. You are always asked first.");
T.click('#bTidy').sleep(300).wait(700);

L.section('Part 6', 'Test it', "Let us test our changes.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(800);
T.say("The new welcome message and Contact us are there. Choose 3.", "The new welcome message and Contact us are there. Choose three.");
L.reply('3');
L.ok();

L.outro("Well done. The Map makes it easy to see and change your whole menu. In the next video, we will use ready-made sample menus, and save our work.",
  'Ready-made samples and saving');
