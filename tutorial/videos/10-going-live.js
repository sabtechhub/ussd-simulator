/* Video 10: Put your menu live (simple) */
L.loadFlow(L.shopFlow());
L.intro(10, 'Put your menu live', 'Get the code, put it online, and connect Hubtel or Nalo.',
  "This is video ten. Your menu works in the simulator. Now let us make it work for real customers, on real phones.");

L.section('Part 1', 'The big picture', "Here is the big picture. Four steps.");
T.say("One. Get the code for your menu, from the simulator.");
T.say("Two. Put that code on a website.");
T.say("Three. Test it with the simulator.");
T.say("Four. Tell Hubtel or Nalo where it is.");
T.say("If you have a developer, you can share this video with them. They will do steps two and four in a few minutes.");

L.section('Step 1', 'Get the code', "Step one. Get the code.");
L.page('builder');
L.onMap();
L.tidy();
T.say("First, look over your menu on the Map one last time. Follow the arrows, and check that every option goes somewhere.");
T.move(L.N('main'), 800).wait(300).move(L.N('balance'), 600).wait(300).move(L.N('amount'), 600).wait(300).move(L.N('bye'), 600);
T.say("An empty dot means an option goes nowhere. And a box with a red warning needs fixing. Our menu is fine.");
T.say("Then press, Get PHP code.");
T.click('#bGen').sleep(400).wait(900);
T.say("The simulator writes the code for you. PHP is a language that almost every website host understands.");
T.scroll('#sampleCode', 700, 2600).wait(400).scroll('#sampleCode', 0, 1200);
T.say("At the top, choose your provider. Hubtel, or Nalo.");
T.click('#sampleSeg button[data-v=hubtel]').sleep(250).wait(600);
T.say("Then press, Download dot P H P. This saves the code as a file on your computer.", "Then press, download dot P H P. This saves the code as a file on your computer.");
T.move('#downloadCode', 800).wait(800);
T.click('#closeSample').sleep(250);

L.section('Step 2', 'Put it online', "Step two. Put the file on a website.");
T.say("You need web hosting that supports PHP. Most hosting in Ghana does, for example the cheap hosting that comes with a website.");
T.say("Upload the file to your website. You can name it, ussd dot P H P.", "Upload the file to your website. You can name it, U S S D dot P H P.");
T.say("Now the file has an address, like, your website, slash ussd dot P H P. Write this address down.", "Now the file has an address, like, your website, slash U S S D dot P H P. Write this address down.");

L.section('Step 3', 'Test it', "Step three. Test the live file with the simulator.");
L.page('log');
T.say("Press Change. Choose, My server. Paste the address. Then press Check. Here we use a practice address.");
T.click('#setupOpen').sleep(200).click('#srcSeg button[data-v=url]').sleep(200);
T.click('#endpoint').type('#endpoint', 'http://localhost:8090/mock.php', { msPerChar: 55 });
T.click('#checkBtn').until(() => /Works|Could not|error|format/.test(document.querySelector('#srcNote').textContent)).sleep(200).wait(900);
T.say("Works. Your menu is online. Try it once on the phone.");
T.click('#setupDone').sleep(200);
L.dial();
L.reply('1');
L.ok();

L.section('Step 4', 'Connect your provider', "Step four. Connect your provider.");
T.say("If you do not have a short code yet, buy one from a USSD provider, like Nalo, Hubtel, Orchard, or Arkesel.");
T.say("Then it is simple. Build your menu here, copy the code onto your server, and give your provider the address.");
T.say("Log in to your provider's account. Open your USSD service, or short code.");
T.say("Find the box called callback URL, or service URL. Paste your address there, and save.");
T.say("That is it. Now, when anyone dials your code on a real phone, they will see your menu.");
T.say("Dial it on your own phone first. If something is wrong, test the same steps here in the simulator, to find the problem.");

L.outro("Congratulations. Your USSD menu is live. In the next two videos, we will build two complete real-life examples, from start to finish.",
  'Use case: school fees payment');
