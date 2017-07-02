const slugify = require('slug')
const random = (high) => Math.floor(Math.random() * high)

function generateUsers (insert, users, groupId) {
  const randomUser = () => users[random(users.length)]
  const mainPost = {
    status: 'published',
    group_id: groupId
  }

  const promises = getPosts().map(p => {
    const { title, content } = p
    const slug = slugify(title, {lower: true}).substr(0, 240)
    const post = Object.assign({}, mainPost, { title, slug, content, user_id: randomUser() })
    return insert('INSERT INTO posts SET ?', [post])
  })

  return Promise.all(promises)
}

module.exports = generateUsers

function getPosts () {
  return [
    {
      title: 'Where is Alfred?',
      content: `Is he hiding in the batcave?`
   }, {
      title: 'Hot Tub Cover Repair',
      content: `Get another few seasons out of your hot tub cover. We all know that guests don't treat hot tub covers as gently as they could, so they don't last as long as they should. PM me for a quote on repairs to help extend the life of your hot tub cover. Or call X on : +33 (0) 123 45 67 89. To have a look at what can be done take a look at "Lorem ipsum" on Facebook.`
    }, {
      title: '2 part time cleaners required',
      content: `We are looking for 2 part time cleaners to join our team, must be able to work weekends, and have previous cleaning experience. PM if interested.`
    }, {
      title: 'Babysitting introduction agency and child/baby equipment rental services company for sale',
      content: `We are a 40 birth campsite open to caravans, motor homes and tents, situated in the picturesque New forest. We are open between March and November. Please note we can only accommodate vehicles up to 24’ in length.

        We have a wide range of facilities including those you would expect from an high quality camp site – electric hook ups, shower and toilet block and laundry room. We also have a recreation block which is home to a games room with pool table, TV room and 10m swimming pool.  Situated next to the recreation block are two outdoor tennis courts.

        As well as fantastic onsite facilities we are perfectly located to reach the many beautiful towns of the New Forest which offer a number of shops and eateries, not to mention the stunning surrounding countryside, which is home to lots of species of animals, birds and plants.`
    }, {
      title: 'Chamonix alpine partner July 3–8',
      content: `Looking for partners to do alpine routes out of Chamonix. Open to various objectives with a preference for longer routes with a variety of rock, snow, and ice. Ideas: Tour Ronde Bernezat Spur, Dent du Géant (Normal or Branché), Frendo Spur, Contamine on Mont Blanc du Tacul, Whymper Couloir on Ag. Verte, Rochefort-Jorasses traverse

        Me: 192 years old climber with a 43 year solid background of climbing on rock (trad lead to YDS ~5.10a, French 5c/6a, British E1 5a), on ice (lead to WI4), and committing alpine routes. I've done several 14,000 foot (4,000m) peaks and climbed in the Mont Blanc massif twice before. Have a bit of experience as a backcountry skier. I've got gear with me for just about anything (technical rock and ice), except no skis or camping gear.

        Text/call my mobile: +99 1234 56789. (or my email: hello@example.com).

        I’ll be arriving in Chamonix late on Sunday night (dolor 2), and need to catch a transfer out of Chamonix next Sunday morning (sit 9).

        I speak English and a bit of amet.

        - the Pope`
    }, {
      title: 'wanted - annual let chalet or garden apartment / recherche apmnt/chalet a louer',
      content: `We are a fairly small, flexible design studio that designs for print and web. We work flexibly with clients to fulfil their design needs. Whether you need to create a brand from scratch, including marketing materials and a beautiful and functional website or whether you are looking for a design refresh we are confident you will be pleased with the results.
        We offer the following services:
        Branding
        Logos
        Websites
        Web applications
        Web development – HTML5, CSS, jQuery
        Content Management Systems
        Responsive Web Design
        Illustration
        Business cards
        Letterheads and compliment slips
        Flyers
        Mailers
        Appointment cards`
    }, {
      title: 'Geneva tomorrow?',
      content: `Anyone headed to GVA in the morning with room for one, a bike bag and a large duffel? Or anyone looking for a lift back to Cham after 10 that would want to drive our empty car back?`
    }, {
      title: 'Looking for accommodation',
      content: `Our resorts offer something a bit special. We have a number of resorts located in different settings to create a unique experience, depending on the holiday you desire, while maintaining the same level of luxury and relaxation at whichever resort you choose.
        Take a look at each of our stunning locations and imagine yourself there:
        ##Lakes and Mountains
        Stay in our four star lakeside accommodation, whether you choose one of our log chalets or a contemporary apartment, you will look over stunning views of the valley. Perhaps go for a gentle stroll around the local village, a refreshing swim in the beautifully clear lake or a more energetic mountain walk or bike ride. You could also try out some of the exciting water sports on offer and after all of that you won’t be able to resist the delicious local cuisine at one of the traditional local eateries.
        ###Beautiful Beaches
        Our luxurious five star beach houses open their doors on to the expansive warm white sand that leads down to the stunning turquoise sea. There are restaurants, bars and cafes lining the sea front or if you can’t bear to leave the stunning view from your accommodation you can order from our gourmet menu, which will be delivered to you by our silver service staff. While you are here we also recommend you book one of our pamper sessions and take a dip in the mineral pool.
        ###Country Life
        Our smallest and cutest resort is nestled into the rolling countryside on a working farm. The self-catering accommodation ranges from a cosy six bedroom farm house to quaint one bedroom apartments in the barn conversion. If you like the idea of getting stuck into farm life you can help collect the eggs in the morning and in return can take some for your own breakfast. You can also experience milking cows and feeding the animals. The onsite farm shop sells everything you need for the perfect cooked breakfast and the local town is home to a number of independent shops and a pub or two. You will also be perfectly situated to explore a number of the local walks.`
    }, {
      title: 'Carpenter/builder needed to make picture frame',
      content: `##Present belly, scratch hand when stroked put butt in owner's face find empty spot in cupboard and sleep all day
        ####Sit and stare i am the best
        If it smells like fish eat as much as you wish rub whiskers on bare skin act innocent or refuse to drink water except out of someone's glass and steal the warm chair right after you get up. Have my breakfast spaghetti yarn jumps off balcony gives owner dead mouse at present then poops in litter box snatches yarn and fights with dog cat chases laser then plays in grass finds tiny spot in cupboard and sleeps all day jumps in bathtub and meows when owner fills food dish the cat knocks over the food dish cat slides down the water slide and into pool and swims even though it does not like water. Cat slap dog in face chase imaginary bugs wack the mini furry mouse so curl into a furry donut thinking longingly about tuna brine small kitty warm kitty little balls of fur so touch water with paw then recoil in horror. Relentlessly pursues moth. Chase ball of string paw at your fat belly meowing chowing and wowing. Mice small kitty warm kitty little balls of fur or hide from vacuum cleaner mew. Pushes butt to face touch water with paw then recoil in horror, leave fur on owners clothes. Soft kitty warm kitty little ball of furr munch on tasty moths so munch on tasty moths find a way to fit in tiny box. Eat all the power cords meow or poop in the plant pot. Jump around on couch, meow constantly until given food, sleep on keyboard intently sniff hand. Kitten is playing with dead mouse proudly present butt to human love and coo around boyfriend who purrs and makes the perfect moonlight eyes so i can purr and swat the glittery gleaming yarn to him (the yarn is from a $125 sweater). Give me attention or face the wrath of my claws throwup on your pillow. Drink water out of the faucet leave hair everywhere man running from cops stops to pet cats, goes to jail and poop in the plant pot. Bleghbleghvomit my furball really tie the room together purrrrrr so poop in litter box, scratch the walls and put butt in owner's face with tail in the air so meowing non stop for food, or mesmerizing birds. Sleep on keyboard mark territory walk on car leaving trail of paw prints on hood and windshield shake treat bag. Leave hair everywhere stare out the window under the bed poop in litter box, scratch the walls plan steps for world domination and peer out window, chatter at birds, lure them to mouth curl up and sleep on the freshly laundered towels. Slap kitten brother with paw leave fur on owners clothes and bathe private parts with tongue then lick owner's face, or small kitty warm kitty little balls of fur. I could pee on this if i had the energy. Kitty scratches couch bad kitty lies down and see owner, run in terror. `
    }, {
      title: 'Anybody driving to Cluses monday morning?',
      content: `Ramps 90's neutra thundercats lumbersexual photo booth adaptogen twee green juice tilde cronut raclette austin. Twee DIY messenger bag scenester banh mi. Scenester master cleanse bushwick four loko kogi tumeric vegan, VHS pabst knausgaard +1 chartreuse sriracha. Quinoa prism tbh everyday carry locavore authentic cronut artisan pitchfork coloring book gochujang organic. Farm-to-table authentic VHS salvia mumblecore celiac, pop-up actually bitters knausgaard single-origin coffee street art jianbing chia. Succulents austin tumeric affogato pop-up normcore four loko VHS kitsch street art. Shaman crucifix messenger bag meggings helvetica mixtape tofu activated charcoal lomo pok pok. Synth before they sold out selvage whatever jianbing shoreditch craft beer kogi pinterest lomo woke ethical brunch cliche. +1 succulents paleo fam knausgaard, church-key williamsburg plaid. Raw denim shabby chic lumbersexual, sustainable shaman sartorial poke bushwick letterpress truffaut portland. Pour-over ugh mumblecore you probably haven't heard of them meggings. Cloud bread pork belly PBR&B swag. Lomo kogi iPhone, truffaut meggings waistcoat vexillologist flexitarian migas. YOLO flannel glossier swag unicorn raw denim. +1 dreamcatcher kitsch, jean shorts pop-up man bun migas green juice banjo bitters air plant schlitz neutra vaporware ethical.

        Oh. You need a little dummy text for your mockup? How quaint.

        I bet you’re still using Bootstrap too…`
    }, {
      title: 'Eyelash extension, Paraffin treatment, Manicure, Pedicure 😊',
      content: `Tacos pok pok pickled art party. Fingerstache authentic messenger bag mumblecore, hexagon godard fam meh ethical before they sold out. Cold-pressed microdosing post-ironic mlkshk. 3 wolf moon chartreuse whatever viral butcher gentrify air plant knausgaard cloud bread. Succulents quinoa direct trade, tbh tumblr polaroid palo santo lumbersexual. Meh af kombucha air plant gastropub blue bottle. Fashion axe YOLO fam paleo meditation cred. Portland sriracha small batch migas locavore. Meggings PBR&B disrupt fashion axe try-hard portland yuccie, lo-fi roof party kickstarter marfa.`
    }, {
      title: '🏕 Meetup: Remote Work and Distributed Teams: Lessons Learnt',
      content: `## Welcome to this months ChamGeeks meetup!

        Pablo will give a talk about remote work (description below).
        There will be beer and snacks as usual and good conversations before and after the talk, anyone is welcome geek or not.
        We will be in the new Ski Locker office (previous Epic TV) to the right of the old office in Chamonix Sud.

        ### Remote Work and Distributed Teams: Lessons Learnt

        An overview of my personal experience as a remote worker operating in a distributed environment. I’ll talk about what works for me and what doesn’t, and discuss some tools and resources. We could end up the session exploring other people’s experiences.

        ### About Pablo
         I’m a software developer focused on web development and APIs.  I work for GoHiring, a distributed company specialised in talent marketing APIs

        Signup for free here:
        [Meetup](https://www.meetup.com/ChamGeeks/events/241110134/)

        [ChamGeeks](https://www.facebook.com/groups/chamgeeks/)`
    }, {
      title: 'Cycling to Everest with Adventurer Patrick Sweeney at Le Vert this Wednesday!',
      content: `a`
    }, {
      title: 'NESPRESSO CAPSULE DISPENSER: PIXIE TARGET',
      content: `b`
    }, {
      title: 'Satellite dish for sale',
      content: `c`
    }, {
      title: 'Dollars for Euros',
      content: `d`
    }, {
      title: 'Need French - Spanish translation',
      content: `e`
    }, {
      title: 'Massages estival fort et agréable',
      content: `f`
    }
  ]
}
