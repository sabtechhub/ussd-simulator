/* Video 4: Make your first menu (simple) */
L.intro(4, 'Make your first menu', 'Build a simple shop menu, with no code at all.',
  "This is video four. Now you will make your own USSD menu. No code is needed. We will build a simple menu for a small shop.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("Imagine a small shop in Accra. Customers dial a code, and get a menu.");
T.say("Option one, check balance. Option two, opening hours. And zero, exit.");
T.say("Let us build exactly that.");

L.section('Part 2', 'Open the Menu builder', "Click Menu builder at the top.");
L.page('builder');
T.say("You start with one empty screen, called main. It has a green Start label. This is the first screen customers see.");
T.move('.scr[data-id=main] .badge.go', 900);
T.say("Every screen is one of three kinds. A Menu shows choices. A Question asks the customer to type something. And End shows a last message, and finishes.");
T.move('.scr[data-id=main] .sh select', 800);

L.section('Part 3', 'The welcome message', "First, give your service a name, and write a welcome message.");
T.click('#screens .two input').type('#screens .two input', 'My Shop', { msPerChar: 120 });
T.click('.scr[data-id=main] textarea').type('.scr[data-id=main] textarea', 'Welcome to My Shop', { msPerChar: 90 });
T.say("This message will show at the top of the menu.");

L.section('Part 4', 'The first option', "Now, the first option.");
T.say("Press, is the number the customer types. It is already 1.", "Press, is the number the customer types. It is already one.");
T.move(L.opt('main', 0, 0), 800);
T.say("Option, is the text they see. Type, Check balance.");
T.click(L.opt('main', 0, 1)).type(L.opt('main', 0, 1), 'Check balance', { msPerChar: 90 });
T.say("Goes to screen, means: where does this option lead? Choose, New screen. It makes the next screen for you.");
T.pick(L.optSel('main', 0), '__new__').sleep(250).wait(800);
T.say("A new screen appears. Type the message the customer will see.");
T.type('.scr[data-id=new_screen] textarea', 'Your balance is GHS 25.00', { msPerChar: 70 });
T.say("Give the screen a short name, so you can find it. Type, balance.");
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'balance', { msPerChar: 130, change: true }).sleep(250);

L.section('Part 5', 'More options', "Now, two more options. Same steps.");
T.say("Press plus Option. Type, Opening hours. Then choose New screen.");
T.click(L.btn('.scr[data-id=main]', 'Option')).sleep(200);
T.type(L.opt('main', 1, 1), 'Opening hours', { msPerChar: 90 });
T.pick(L.optSel('main', 1), '__new__').sleep(250);
T.type('.scr[data-id=new_screen] textarea', 'Open Monday to Friday, 8am to 5pm.', { msPerChar: 60 });
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'hours', { msPerChar: 130, change: true }).sleep(250);
T.say("Always give customers a way out. Add one more option, with the number zero, called Exit.");
T.click(L.btn('.scr[data-id=main]', 'Option')).sleep(200);
T.click(L.opt('main', 2, 0)).type(L.opt('main', 2, 0), '0', { msPerChar: 160 });
T.type(L.opt('main', 2, 1), 'Exit', { msPerChar: 110 });
T.pick(L.optSel('main', 2), '__new__').sleep(250);
T.type('.scr[data-id=new_screen] textarea', 'Thank you. Goodbye!', { msPerChar: 70 });
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'bye', { msPerChar: 130, change: true }).sleep(250);
T.say("That is our whole menu. Three options, each going to its own screen.");

L.section('Part 6', 'Mistakes and saving', "The builder also helps you avoid mistakes.");
T.say("If an option does not go anywhere, you will see a red warning. It tells you what to fix.");
T.click(L.btn('.scr[data-id=main]', 'Option')).sleep(200).wait(500);
T.move('.scr[data-id=main] .warn', 800);
T.say("We do not need this option, so press its cross to remove it.");
T.click(() => { const r = document.querySelectorAll('.scr[data-id=main] .opt-row:not(.col-h)'); return r[r.length - 1].querySelector('button'); }).sleep(200);
T.say("Your work saves by itself while you type. The green dot next to Save shows it is saved.");
T.move('#saveState', 800).click('#bSave').sleep(200).wait(1500);

L.section('Part 7', 'Test it', "Now the best part. Test your menu.");
T.say("Press Test on phone.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(1200);
T.say("There is your menu, on the phone. Choose 2, opening hours.", "There is your menu, on the phone. Choose two, opening hours.");
L.reply('2');
T.say("It works.");
L.ok();

L.outro("Congratulations. You made your first USSD menu, and tested it. In the next video, we will ask customers to type answers, like their name.",
  'Ask questions');
