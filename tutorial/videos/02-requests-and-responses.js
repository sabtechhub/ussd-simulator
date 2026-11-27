/* Video 2: What happens when you dial (simple) */
L.setupFolded(true);
L.intro(2, 'What happens when you dial', 'The chat on the right, in simple words.',
  "This is video two. We will look at what happens behind the scenes when someone dials. Do not worry, we will keep it simple.");

L.section('Part 1', 'A simple picture', "Here is a simple picture of how USSD works.");
T.say("A customer dials your code on their phone.");
T.say("The phone network passes the message to your USSD provider, like Hubtel or Nalo.");
T.say("Your provider sends it to your computer program. People call this program a server.");
T.say("The server decides what menu to show, and sends an answer back. The answer appears on the customer's phone.");
T.say("So it is like a chat. The phone asks, and the server answers. Again and again, until the end.");

L.section('Part 2', 'Watch the chat', "Let us watch this chat happen.");
T.say("Press the green call button.");
L.dial();
T.say("Look at the right side. Two messages appeared.");
T.say("The blue one is what the phone sent. Here, it is the code we dialed.");
T.move('#logs .entry.req .bubble', 900);
T.say("The grey one is what came back. That is the menu we see on the phone.");
T.move('#logs .entry.res .bubble', 900);
T.say("Now type 1, and press SEND.", "Now type one, and press send.");
L.reply('1');
L.ok();
T.say("Two more messages appeared. The phone sent 1, and the server answered with the balance.", "Two more messages appeared. The phone sent one, and the server answered with the balance.");
T.move(() => [...document.querySelectorAll('#logs .entry.req .bubble')].pop(), 900);
T.say("Read the chat from top to bottom, and you can see everything that happened.");

L.section('Part 3', 'Look inside a message', "Now let us look inside a message. Just a quick look.");
T.say("Under each message, there is a small word, Details. Click it.");
T.click(() => document.querySelector('#logs .entry.req details summary')).sleep(200);
T.scroll('#logs', () => 0, 600);
T.say("This is what the message really looks like. It is a list of names and values.");
T.say("You do not need to learn all of it. Just remember three things.");
T.say("Mobile, is the customer's phone number.");
T.say("Message, is what the customer typed.");
T.say("And SessionId, is a code that stays the same for the whole call. It helps the server know it is the same customer.", "And session I D, is a code that stays the same for the whole call. It helps the server know it is the same customer.");
T.say("The answer has a message too. That is the text the customer sees. And a type, that says if the menu continues, or ends.");
T.click(() => document.querySelector('#logs .entry.res details summary')).sleep(200).wait(1500);

L.section('Part 4', 'Hubtel and Nalo', "Hubtel and Nalo are two popular USSD providers.");
T.say("They do the same job. They just write their messages a little differently.");
T.say("To see Nalo's way, press Change, choose Nalo, and press Done.");
T.click('#setupOpen').sleep(200).click('#provSeg button[data-v=nalo]').wait(500).click('#setupDone').wait(500);
T.click('#clearLog').wait(400);
L.dial();
T.click(() => document.querySelector('#logs .entry.req details summary')).sleep(200).wait(800);
T.say("Same idea, different names. If you use Nalo, choose Nalo. If you use Hubtel, choose Hubtel. That is all you need to remember.");
L.reply('0');
L.ok();
T.run(() => { document.querySelector('#setupOpen').click(); document.querySelector('#provSeg button[data-v=hubtel]').click(); document.querySelector('#setupDone').click(); });

L.section('Part 5', 'Useful buttons', "Three useful buttons at the top of the chat.");
T.say("Clear, empties the chat, so you can start fresh.");
T.move('#clearLog', 700);
T.say("Copy all, copies the whole chat. Use it to send a problem to a friend or a developer.");
T.move('#copyAll', 700);
T.say("And Sample code, shows the code for a ready-made server. You will only need it if you write your own server.");
T.move('#viewSample', 700);

L.outro("Well done. You now understand what happens when someone dials: the phone and the server chat with each other. In the next video, you will learn how to test your own server.",
  'Test your own server');
