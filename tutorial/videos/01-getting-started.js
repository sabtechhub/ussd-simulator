/* Video 1: Getting started (for complete beginners) */
L.intro(1, 'Getting started', 'What USSD is, and how to dial your first code.',
  "Hello, and welcome to the SAB-TECH HUB USSD Simulator. This is video one. You do not need to know anything yet. We will go slowly, one step at a time.");

L.section('Part 1', 'What is USSD?', "First, what is USSD?");
T.say("You already know USSD. It is the menu you see when you dial a code like *170# or *713#.", "You already know USSD. It is the menu you see when you dial a code, like star one seven zero hash.");
T.move('.phone .screen', 900);
T.say("Some people call it USSD. Others call it a short code. They mean the same thing.");
T.say("You dial the code. A small menu pops up. You type a number, and press send.");
T.say("It works on every phone, even small phones without internet.");
T.say("That is why so many services use it. For example, buying airtime, checking a bank balance, paying school fees, or giving to church.");

L.section('Part 2', 'Get your own short code', "How do you get your own short code?");
T.say("You buy it from a USSD provider. In Ghana, that includes Nalo, Hubtel, Orchard, Arkesel, and others.");
T.say("The provider gives you the code. But you still need to build the menu that people see when they dial it.");
T.say("That is where this simulator helps. You build your menu here, and test it on your computer, without a real phone and without spending money.");
T.say("When it is ready, you simply copy the code onto your server. We show you how in video ten.");

L.section('Part 3', 'Look around', "Now, let us look around the screen.");
T.say("At the top, there are two pages. Test, and Menu builder.");
T.move('#mainTabs button[data-v=log]', 800).wait(500).move('#mainTabs button[data-v=builder]', 700);
T.say("Test is where you try menus on a phone. Menu builder is where you make your own menu. We will start with Test.");
T.say("On the left are your settings.");
T.move('#setup .card-h h2', 900);
T.say("In the middle is a phone. It works like a real phone.");
T.move('.phone .screen', 900);
T.say("And on the right, you will see every message, like a chat.");
T.move('#tab-log h2', 900);
T.say("Tip. If you are not sure what something is, put your mouse on it. A small help message appears.");
T.hover('#setupBody .q').sleep(500).wait(2500);

L.section('Part 4', 'Three quick settings', "Before we dial, there are three quick settings.");
T.say("Number one. Your USSD provider. This is the company that connects your menu to the phone networks. If you are not sure, choose Hubtel.");
T.click('#provSeg button[data-v=hubtel]');
T.say("Number two. Which menu to test. Choose Demo. It is a small practice menu that is ready to use.");
T.click('#srcSeg button[data-v=demo]');
T.say("Number three. The test phone. This is the pretend customer's phone number and network. You can leave them as they are.");
T.move('#msisdn', 700).wait(500).move('#operator', 600);
T.say("And this is the code to dial. We will use *713#.", "And this is the code to dial. We will use star seven one three hash.");
T.click('#code').type('#code', '*713#', { msPerChar: 160 });
T.say("Now press Done.");
T.click('#setupDone').wait(900);
T.say("The settings fold away into one small line. You can open them again with Change.");
T.move('#setupOpen', 700);

L.section('Part 5', 'Your first dial', "Now, the fun part. Let us dial.");
T.say("Press the green call button.");
L.dial();
T.say("A menu appears, just like on a real phone.");
T.move('#msg', 700);
T.say("Let us check the balance. Option one. Type 1 in the box, then press SEND.", "Let us check the balance. Option one. Type one in the box, then press send.");
L.reply('1');
T.say("We can see the balance. The menu is finished, so press OK.");
L.ok();
T.say("Well done. That was your first USSD session.");

L.section('Part 6', 'A real-life example', "Now let us try a real-life example. Buying airtime.");
T.say("Imagine you are a customer, and you want ten cedis of airtime.");
L.dial();
T.say("Choose option 2, buy airtime.", "Choose option two, buy airtime.");
L.reply('2');
T.say("It asks how much. Type 10, and press SEND.", "It asks how much. Type ten, and press send.");
L.reply('10');
T.say("It asks you to confirm. Type 1 to confirm.", "It asks you to confirm. Type one to confirm.");
L.reply('1');
T.say("Done. In real life, the customer would now get the airtime.");
L.ok();
T.say("Look at the right side. Every step you took is shown there, like a chat. We will learn about it in the next video.");
T.move('#tab-log h2', 800);

L.section('Part 7', 'A first look at the Map', "Before we finish, a quick look at where you will build your own menu. The Map.");
L.loadFlow(L.shopFlow());
L.page('builder');
L.onMap();
L.tidy();
T.say("This is a menu just like the one we used, drawn as a picture. Each box is one screen on the phone.");
T.move(L.N('main'), 900);
T.say("The arrows show where each option goes. Option one goes to the balance. Option two asks for the amount.");
T.move(L.N('balance'), 800).wait(300).move(L.N('amount'), 800);
T.say("To build, you just type in the boxes, and drag a dot to draw an arrow. No code at all. It is simple, and you will do it yourself in video four.");
T.click('#bFull').sleep(500).wait(2000).click('#bFull').sleep(400);
L.page('log');

L.outro("Great job. You now know what USSD is, and you dialed your first code. In the next video, we will look at the chat on the right, step by step. And soon, you will build your own menu on the Map.",
  'What happens when you dial');
