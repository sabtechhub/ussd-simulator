/* Video 8: More Map tricks */
L.loadFlow(L.shopFlow());
L.intro(8, 'More Map tricks', 'Move, join, change and tidy your boxes like a pro.',
  "This is video eight. You have been building on the Map. Now let us learn some handy tricks, to change a menu quickly.");

L.section('Part 1', 'A bigger menu', "We have a shop menu ready. Open the Menu builder.");
L.page('builder');
L.onMap();
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
L.newScreen('main', L.lastPort('main'));
T.say("Type the message for the new screen, and give it a name.");
L.msg('new_screen', 'Call 0302 000 000', 80);
L.name('new_screen', 'contact');
T.say("To point an option somewhere else, drag its dot onto another box. Here, we point Exit to the contact box, just to show how.");
L.focusNode('main');
T.drag(L.port('main', 2), L.nodeMsg('contact'), 1200).sleep(300).wait(800);
T.say("Changed our mind? Drag the dot back to the goodbye box.");
T.drag(L.port('main', 2), L.nodeMsg('bye'), 1200).sleep(300).wait(600);
T.say("And click the settings button on any box, to see all of its settings beside the map.");
L.settings('amount');
T.wait(1500);
L.closeSettings();

L.section('Part 5', 'Right-click for more', "Right-click opens a small menu with more choices.");
T.say("Right-click a box to edit it, copy it, or delete it.");
T.rightClick('#bmap .node[data-id=balance] .node-msg-in').sleep(250).wait(2400).key('Escape').wait(300);
T.say("Right-click an empty space to add a new screen right there.");
T.rightClick('#bmap .map-canvas').sleep(250).wait(2200).key('Escape').wait(300);
T.say("And right-click an arrow to remove it. Do not worry about deleting by mistake. You are always asked first.");
T.say("Need more room? Press the full screen button, to give the map the whole window. Press it again, or Escape, to go back.");
T.click('#bFull').sleep(500).wait(1800).click('#bFull').sleep(400);
T.click('#bTidy').sleep(300).wait(700);

L.section('Part 6', 'Test it', "Let us test our changes.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(800);
T.say("The new welcome message and Contact us are there. Choose 3.", "The new welcome message and Contact us are there. Choose three.");
L.reply('3');
L.ok();

L.outro("Well done. The Map makes it easy to see and change your whole menu. In the next video, we will use ready-made sample menus, and save our work.",
  'Ready-made samples and saving');
