/**
 * Fish Card copy — descriptions and facts per species
 */
const FISH_CARD_DATA = {
  sardine: {
    description: 'Tiny silver bullets that travel in shimmering schools, turning the shallows into living rivers of light.',
    facts: [
      'A single school can hold millions of fish, all moving as one.',
      'Sardines filter plankton through their gill rakers — they never stop eating.',
    ],
  },
  shrimp: {
    description: 'Reef cleaners with twitching antennae, picking parasites off fish and keeping coral neighborhoods healthy.',
    facts: [
      'Cleaner shrimp dance to signal “free spa” to passing fish.',
      'Many species can snap their claws fast enough to stun prey with a cavitation bubble.',
    ],
  },
  clownfish: {
    description: 'Bold orange residents of stinging anemones, immune to venom thanks to a mucus coat that fools their host.',
    facts: [
      'All clownfish are born male; the dominant fish becomes female.',
      'They communicate with pops and chirps by snapping their jaws.',
    ],
  },
  shell: {
    description: 'A spiral fortress of calcium, home to a slow-moving mollusk that grazes algae and shapes sandy seafloors.',
    facts: [
      'Queen conchs can live 30+ years and are vital to Caribbean reef health.',
      'The glossy pink lip of the shell inspired centuries of island art.',
    ],
  },
  crab: {
    description: 'A borrowed shell on its back and ten busy legs — the reef’s mobile architect of sand and scavenging.',
    facts: [
      'Hermit crabs line up by size to swap shells in peaceful “vacancy chains.”',
      'They smell shells with their antennae to find the perfect fit.',
    ],
  },
  jelly: {
    description: 'A drifting bell of gelatin, pulsing through open water with no brain, no heart — only grace and sting.',
    facts: [
      'Moon jellies are 95% water and harmless to most swimmers.',
      'They drift with currents but pulse to stay near the surface.',
    ],
  },
  seal: {
    description: 'Whiskered acrobats of the kelp forest, curious enough to follow divers and nap on sunny rocks.',
    facts: [
      'Harbor seals can dive 500 m and hold their breath for 30 minutes.',
      'Each seal’s spot pattern is unique, like a fingerprint.',
    ],
  },
  turtle: {
    description: 'Ancient voyagers with paddle flippers, crossing oceans to nest on the same beaches their mothers used.',
    facts: [
      'Green sea turtles can navigate using Earth’s magnetic field.',
      'They cry “tears” on land to flush excess salt from glands near their eyes.',
    ],
  },
  dolphin: {
    description: 'Intelligent swimmers that hunt in pods, using clicks and whistles to map the reef in sound.',
    facts: [
      'Dolphins sleep with half their brain awake so they can surface to breathe.',
      'They’ve been seen helping injured pod mates reach the surface.',
    ],
  },
  octopus: {
    description: 'Eight arms, three hearts, and a mind like liquid — the reef’s master of camouflage and escape.',
    facts: [
      'Octopuses taste with suckers on every arm.',
      'They can squeeze through any opening wider than their beak.',
    ],
  },
  lobster: {
    description: 'Armored bottom-dwellers with powerful claws, patrolling rocky crevices under moonlit hunts.',
    facts: [
      'Lobsters can live over 50 years and keep growing if they molt successfully.',
      'They walk forward slowly but rocket backward by flipping their tail.',
    ],
  },
  ray: {
    description: 'A round, spiny balloon of the reef — pufferfish inflate with water when threatened and hide toxins in their flesh.',
    facts: [
      'Pufferfish toxins are among the most potent in the ocean.',
      'Some species create circular “crop circles” in sand to attract mates.',
    ],
  },
  eel: {
    description: 'A serpent of the reef cracks, gaping jaws lined with teeth, waiting in shadow for night feeding.',
    facts: [
      'Morays have a second set of jaws in their throat that lunges forward to swallow prey.',
      'They often hunt cooperatively with reef fish that flush out hidden prey.',
    ],
  },
  shark: {
    description: 'Sleek reef patrollers with electro-sensing pores, keeping fish populations balanced through fear and focus.',
    facts: [
      'Reef sharks can detect a heartbeat’s electrical field from centimeters away.',
      'They replace teeth throughout life — one shark may use thousands.',
    ],
  },
  angler: {
    description: 'A living lantern in the black, waving a bioluminescent lure to draw prey into tooth-lined darkness.',
    facts: [
      'Only females have the glowing lure; males are tiny parasites that fuse to females.',
      'Anglerfish swallow prey whole — their stomachs expand like balloons.',
    ],
  },
  squid: {
    description: 'Jet-propelled hunters of the twilight zone, with arms lined in suckers and eyes the size of dinner plates.',
    facts: [
      'Giant squid remain elusive; most footage comes from deep cameras, not divers.',
      'They communicate by flashing patterns across their skin chromatophores.',
    ],
  },
  whale: {
    description: 'The largest animal ever known, filtering tons of krill through baleen plates in gentle, open-ocean glides.',
    facts: [
      'A blue whale’s heart is the size of a small car.',
      'Their calls can travel hundreds of kilometers underwater.',
    ],
  },
  viperfish: {
    description: 'Needle teeth and a belly light — a deep-sea ambush predator built for crushing pressure and eternal night.',
    facts: [
      'Viperfish fangs are so long they fold flat against the roof of the mouth.',
      'They migrate upward at night to feed in shallower water, then sink at dawn.',
    ],
  },
  blobfish: {
    description: 'A gelatinous deep dweller that looks like a melting face at surface pressure but is firm and normal in the abyss.',
    facts: [
      'Blobfish lack swim bladders; their flesh is slightly less dense than water.',
      'They were voted “world’s ugliest animal” — unfairly, out of their habitat.',
    ],
  },
  coelacanth: {
    description: 'A “living fossil” thought extinct for millions of years until one was netted off Africa in 1938.',
    facts: [
      'Coelacanths have lobed fins that move like four-legged limbs.',
      'They bear live young and can live nearly a century in deep caves.',
    ],
  },
  vampire: {
    description: 'Neither vampire nor true squid — a deep drifter that turns its cape-like arms inside out when threatened.',
    facts: [
      'Vampire squid eat marine snow: dead plankton and debris sinking from above.',
      'They produce bioluminescent mucus clouds instead of ink.',
    ],
  },
  leviathan: {
    description: 'Legend speaks of a shadow longer than a sub — a phantom of the hadal zone few divers claim to have seen.',
    facts: [
      'No official record exists; abyssal gigantism makes such tales tempting.',
      'If real, it would patrol trenches where pressure crushes ordinary subs.',
    ],
  },
  anchovy: {
    description: 'Slender silver streaks of the surface — baitfish that fuel entire food webs from seabirds to tuna.',
    facts: [
      'Anchovies filter plankton with fine gill rakers and rarely stop feeding.',
      'They school so tightly that predators often swallow dozens in one gulp.',
    ],
  },
  silverside: {
    description: 'A flashing lateral stripe cuts through midwater schools, marking fish built for speed and sudden turns.',
    facts: [
      'Silversides spawn on moonlit nights, leaving eggs stuck to seagrass blades.',
      'Their reflective stripe breaks up their outline when predators attack from below.',
    ],
  },
  damselfish: {
    description: 'Feisty reef gardeners that farm algae patches and chase intruders many times their size.',
    facts: [
      'Male damselfish guard eggs on rocks and fan them with their fins for oxygen.',
      'Some species change color dramatically when defending territory.',
    ],
  },
  parrotfish: {
    description: 'Beaked grazers that crunch coral, excrete white sand, and sleep in mucus cocoons at night.',
    facts: [
      'A single parrotfish can produce hundreds of pounds of sand each year.',
      'Their fused teeth form a parrot-like beak strong enough to scrape algae off rock.',
    ],
  },
  butterflyfish: {
    description: 'Disc-shaped jewels of the reef, gliding in pairs with bold bars and eyespots that confuse predators.',
    facts: [
      'Many butterflyfish mate for life and swim side by side through the same territory.',
      'Their false eyespots near the tail draw attacks away from the real head.',
    ],
  },
  blenny: {
    description: 'A curious perch-and-dart character of rocky crevices, with expressive eyes and endless personality.',
    facts: [
      'Blennies lack swim bladders and rest on the bottom instead of hovering midwater.',
      'Some species leap between tide pools at low tide using stiff fins like legs.',
    ],
  },
  goby: {
    description: 'Tiny bottom specialists — some shrimp’s best friend, some reef’s busiest burrow digger.',
    facts: [
      'Pistol shrimp and gobies share burrows; the shrimp digs while the goby stands watch.',
      'Gobies are among the most diverse fish families, with over 2,000 species worldwide.',
    ],
  },
  seahorse: {
    description: 'An upright drifter anchored by a prehensile tail, gliding through seagrass like a chess piece come alive.',
    facts: [
      'Males carry eggs in a brood pouch and give birth to hundreds of tiny seahorses.',
      'They have no teeth and suck prey through a tube-like snout with lightning speed.',
    ],
  },
  pipefish: {
    description: 'Straight-backed cousins of seahorses, camouflaged as drifting blades of seagrass or coral.',
    facts: [
      'Like seahorses, male pipefish brood eggs on their belly or tail.',
      'Their armor-like body rings make them stiff swimmers — they rely on tiny fin beats.',
    ],
  },
  starfish: {
    description: 'Five-armed slow movers with tube feet and a stomach that can evert to digest prey outside their body.',
    facts: [
      'Sea stars can regenerate lost arms — some species need only a fragment to regrow.',
      'They move using hundreds of water-filled tube feet powered by a simple hydraulic system.',
    ],
  },
  urchin: {
    description: 'A spiny sphere of purple and black, grazing algae and turning rock into a bristling fortress.',
    facts: [
      'Sea urchins have a chewing structure called Aristotle’s lantern with five teeth.',
      'Their spines are movable and used for walking, defense, and wedging into crevices.',
    ],
  },
  anemone: {
    description: 'A flower of tentacles on the reef, waving stinging cells that trap plankton and welcome clownfish guests.',
    facts: [
      'Anemones can walk slowly on their basal disc when they need a better spot.',
      'Their stinging cells fire harpoons faster than almost any known biological motion.',
    ],
  },
  pistolshrimp: {
    description: 'A burrow-dwelling snapper whose claw creates a cavitation bubble louder than a gunshot.',
    facts: [
      'The collapsing bubble briefly reaches temperatures hotter than the sun’s surface — in miniature.',
      'Pistol shrimp often pair with watchful gobies that signal danger with tail flicks.',
    ],
  },
  bluetang: {
    description: 'Electric blue surgeonfish that dash through coral canyons, flashing yellow tails like warning flags.',
    facts: [
      'A sharp spine at the tail base can cut predators and careless divers.',
      'Juveniles are bright yellow; they shift to blue as they mature.',
    ],
  },
  yellowtail: {
    description: 'A sleek reef snapper with a golden stripe and forked tail built for quick escapes into the blue.',
    facts: [
      'Yellowtail snappers often follow larger fish to snatch scraps from feeding frenzies.',
      'They spawn in large aggregations near reef edges on outgoing tides.',
    ],
  },
  sergeant: {
    description: 'Bold black-and-yellow bars mark this territorial fish, patrolling shallows like a striped sentinel.',
    facts: [
      'Sergeant majors aggressively guard purple egg patches glued to rocks.',
      'Juveniles sometimes clean parasites off larger fish at “cleaning stations.”',
    ],
  },
  mullet: {
    description: 'Silvery grazers of sandy flats, leaping from the water in sudden silver arcs at the slightest alarm.',
    facts: [
      'Mullet feed on algae and detritus with specialized gill rakers and a muscular stomach.',
      'Their leaps may help them escape predators or shake off parasites.',
    ],
  },
  sanddollar: {
    description: 'Flat, flower-patterned discs buried in sand — living relatives of sea urchins with a calmer lifestyle.',
    facts: [
      'Live sand dollars are covered in tiny spines that move them through sediment.',
      'They feed on organic particles trapped in sand using a groove of tube feet.',
    ],
  },
  cucumber: {
    description: 'A soft-bodied recycler of the seafloor, swallowing sand and returning it cleaner than it found it.',
    facts: [
      'Some sea cucumbers expel sticky threads to entangle predators.',
      'Others can eject their internal organs to distract attackers, then regrow them.',
    ],
  },
  fireworm: {
    description: 'A bristling ribbon of orange and white, crawling coral at night with venomous hairs that sting bare skin.',
    facts: [
      'Fireworms have white bristles that break off and inject toxins when touched.',
      'They hunt small invertebrates and scavenge dead tissue on the reef.',
    ],
  },
  lionfish: {
    description: 'Striped spines and sweeping fins — a venomous showpiece that hunts at dusk with surprising speed.',
    facts: [
      'Lionfish venom is delivered through hollow dorsal spines, not fangs.',
      'Invasive Atlantic populations have few predators and devastate native reef fish.',
    ],
  },
  stingray: {
    description: 'A flat wing gliding over sand, eyes on top and mouth below, hiding beneath a veil of sediment.',
    facts: [
      'Southern stingrays detect buried clams with electroreceptors on their underside.',
      'Their barbed tail is used in defense, not hunting.',
    ],
  },
  manta: {
    description: 'Oceanic wingspans wider than a car, looping through plankton blooms with mouths wide open.',
    facts: [
      'Manta rays have the largest brain of any fish studied relative to body size.',
      'Individual mantas can be identified by unique spot patterns on their belly.',
    ],
  },
  barracuda: {
    description: 'A silver torpedo with a saw-toothed grin, hanging motionless in the blue before explosive strikes.',
    facts: [
      'Great barracudas can sprint over 35 mph in short bursts.',
      'Their teeth are razor-sharp and angled backward to trap struggling prey.',
    ],
  },
  grouper: {
    description: 'A heavy-jawed ambusher of reef ledges, swallowing prey whole with a vacuum-gulp of water.',
    facts: [
      'Nassau groupers gather in huge spawning aggregations at the same sites each year.',
      'They often team up with moray eels, flushing prey from holes the eel cannot enter.',
    ],
  },
  snapper: {
    description: 'Crimson reef hunters with sharp canine teeth, schooling by day and feeding hard at dusk.',
    facts: [
      'Red snappers can live 50+ years and grow slowly — making them vulnerable to overfishing.',
      'Young snappers hide in seagrass nurseries before moving to deeper reef.',
    ],
  },
  triggerfish: {
    description: 'Picasso-painted armor with a locked dorsal spine — a reef bulldozer that bites chunks from coral.',
    facts: [
      'Triggerfish wedge themselves into crevices by locking their first dorsal spine upright.',
      'They fiercely guard nest craters dug in sand, even chasing divers away.',
    ],
  },
  boxfish: {
    description: 'A swimming jewel box of hexagonal plates, paddling with tiny fins and oozing toxin when stressed.',
    facts: [
      'Boxfish skin contains ostracitoxin — powerful enough to kill nearby fish in an enclosed space.',
      'Their rigid body limits speed but makes them hard for predators to bite.',
    ],
  },
  nautilus: {
    description: 'A living spiral fossil, jetting through deep reef slopes with tentacles and a pinhole camera eye.',
    facts: [
      'Nautiluses adjust buoyancy by flooding or emptying chambers in their shell with gas and fluid.',
      'They have survived roughly unchanged for hundreds of millions of years.',
    ],
  },
  cuttlefish: {
    description: 'Chameleons of the sea — pulsating patterns ripple across skin as they hunt with two feeding tentacles.',
    facts: [
      'Cuttlefish have W-shaped pupils and excellent color vision despite being colorblind in the usual sense.',
      'Their cuttlebone helps control buoyancy and was once used to make casting molds.',
    ],
  },
  sealion: {
    description: 'Barking acrobats of rocky coasts, twisting through kelp with front flippers and playful curiosity.',
    facts: [
      'Sea lions can rotate their hind flippers forward to walk on land.',
      'They use whiskers to detect fish movement in dark or murky water.',
    ],
  },
  manatee: {
    description: 'Gentle grazers of seagrass meadows, surfacing to breathe with paddle tails and whiskered lips.',
    facts: [
      'Manatees eat up to 10% of their body weight in plants every day.',
      'Their closest living relatives on land are elephants.',
    ],
  },
  dugong: {
    description: 'A shy sirenian of warm shallows, trailing through seagrass beds with a fluked tail and tusks.',
    facts: [
      'Dugongs are the only strictly marine herbivorous mammals.',
      'They inspired mermaid legends among sailors who glimpsed them from afar.',
    ],
  },
  seakrait: {
    description: 'Banded serpents of the reef, venomous yet often docile, surfacing to breathe between coral hunts.',
    facts: [
      'Sea kraits return to land to lay eggs, unlike fully marine sea snakes.',
      'Their venom is potent, but they rarely bite unless grabbed or stepped on.',
    ],
  },
  bonnethead: {
    description: 'The smallest hammerhead, with a shovel-shaped head perfect for pinning crabs and shrimp on sand.',
    facts: [
      'Bonnetheads are the only sharks known to eat large amounts of seagrass — partly on purpose.',
      'Their wide-set eyes give better binocular vision for scanning the seafloor.',
    ],
  },
  nurseshark: {
    description: 'A sluggish bottom shark that rests stacked in caves by day and sucks prey from holes at night.',
    facts: [
      'Nurse sharks can pump water over their gills while lying still on the bottom.',
      'They grow new teeth in rows and can crush shellfish with powerful jaws.',
    ],
  },
  wolfeel: {
    description: 'Not a true eel but a wolf in eel’s clothing — a thick, toothy lurker of cold rocky dens.',
    facts: [
      'Wolf eels mate for life and often share the same crevice for years.',
      'Despite fierce looks, they are generally calm unless provoked in their den.',
    ],
  },
  sunfish: {
    description: 'A drifting disc with tall fins and a tiny mouth — the world’s heaviest bony fish, basking at the surface.',
    facts: [
      'Ocean sunfish can weigh over 2,000 kg and eat mainly jellyfish.',
      'They sunbathe to warm up after deep, cold dives.',
    ],
  },
  flyingfish: {
    description: 'Winged escape artists that burst from the water and glide on enlarged pectoral fins above the waves.',
    facts: [
      'Flying fish can stay airborne for over 200 meters by beating their tail in the water.',
      'They fly to evade tuna, dolphins, and birds hunting from above and below.',
    ],
  },
  eagleray: {
    description: 'A spotted kite with a whip-like tail, soaring over sand flats in graceful, birdlike wingbeats.',
    facts: [
      'Spotted eagle rays crush clams and oysters with pavement-like teeth plates.',
      'They sometimes leap completely out of the water — no one knows exactly why.',
    ],
  },
  thresher: {
    description: 'A shark whose tail is half its body — whipped through bait balls like a living bullwhip.',
    facts: [
      'Thresher sharks use their tail to stun sardines and mackerel before eating them.',
      'Their enormous tail fin can be as long as the rest of the body combined.',
    ],
  },
  hammerhead: {
    description: 'A T-shaped head packed with sensors, sweeping the seafloor for stingrays hidden in sand.',
    facts: [
      'Hammerheads spread electroreceptors across their wide head for pinpoint prey detection.',
      'Scalloped hammerheads form enormous schools during migrations.',
    ],
  },
  whaleshark: {
    description: 'Gentle giants patterned in stars, filter-feeding plankton with a mouth wide enough to swallow a person — but they don’t.',
    facts: [
      'Whale sharks have unique spot patterns — like fingerprints for identification.',
      'They can dive over 1,900 m deep despite feeding near the surface.',
    ],
  },
  tigershark: {
    description: 'Striped scavengers of the open blue, eating almost anything — from sea turtles to license plates.',
    facts: [
      'Tiger shark stripes fade with age but juveniles are boldly marked.',
      'Their serrated teeth can slice through shells, bone, and thick hide.',
    ],
  },
  oarfish: {
    description: 'A silver ribbon with a crimson crest, rarely seen alive — the serpent behind many sea monster tales.',
    facts: [
      'Oarfish can exceed 8 meters, making them the longest bony fish known.',
      'They swim vertically, using their dorsal fin in a rippling wave.',
    ],
  },
  gulper: {
    description: 'A black eel with a hinged jaw and a stomach like a parachute, built to swallow prey bigger than itself.',
    facts: [
      'Gulper eels have tiny eyes and huge mouths adapted for scarce deep-sea meals.',
      'Their tail tip glows red — possibly a lure in the darkness.',
    ],
  },
  dragonfish: {
    description: 'A jet-black hunter with a chin barbel of light, stalking the midnight zone with invisible red beams.',
    facts: [
      'Black dragonfish can produce red light that most deep-sea prey cannot see.',
      'Their young are long and threadlike; adults look almost like a different species.',
    ],
  },
  fangtooth: {
    description: 'Possibly the fish with the largest teeth relative to body size — a face full of needles in the abyss.',
    facts: [
      'Fangtooth jaws are so large they cannot fully close their mouth.',
      'Despite the horror-movie look, they are only a few inches long.',
    ],
  },
  atolla: {
    description: 'A deep crimson jelly crowned with trailing tentacles — a living alarm bell of the midnight ocean.',
    facts: [
      'Atolla jellies flash a burglar-alarm display when attacked to attract bigger predators.',
      'They are bioluminescent but rarely seen by humans except on deep cameras.',
    ],
  },
  dumbo: {
    description: 'A pale octopus with ear-like fins, fluttering through the abyss like a cartoon ghost.',
    facts: [
      'Dumbo octopuses live deeper than almost any other octopus — over 4,000 m down.',
      'They hover above the bottom and pounce on worms and crustaceans.',
    ],
  },
  goblin: {
    description: 'A pink-skinned deep shark with a slingshot jaw that shoots forward to snatch squid in the dark.',
    facts: [
      'Goblin sharks are living fossils — lineage dates back over 100 million years.',
      'Their rosy color comes from blood vessels visible through semi-transparent skin.',
    ],
  },
  frilled: {
    description: 'An eel-like shark with six gill slits and needle teeth, coiling through cold deep water like a living ribbon.',
    facts: [
      'Frilled sharks capture prey by bending their body and striking like a snake.',
      'They are called “living fossils” and bear live young.',
    ],
  },
  sixgill: {
    description: 'A broad-headed giant of the deep shelf, cruising slowly with ancient eyes and six gill openings per side.',
    facts: [
      'Sixgill sharks can exceed 4 meters and hunt seals and other sharks.',
      'They rise from the depths at night — a pattern called diel vertical migration.',
    ],
  },
  barreleye: {
    description: 'A transparent-domed head with tubular green eyes that rotate upward to spot silhouettes above.',
    facts: [
      'Barreleye fish were once thought to have fixed eyes — the dome was mistaken for the whole head.',
      'Their eyes point upward to spot jellyfish silhouettes against faint surface light.',
    ],
  },
  hatchetfish: {
    description: 'Silver blades with bellies full of light, hiding their shadow from predators below in the twilight sea.',
    facts: [
      'Hatchetfish use bioluminescent counter-illumination to match downwelling light.',
      'Their flattened body is built for hovering in the open water column.',
    ],
  },
  loosejaw: {
    description: 'A stoplight in the deep — red searchlight under the jaw and a hinged mouth gaping wider than its head.',
    facts: [
      'Stoplight loosejaws are among the few deep fish that can see red light.',
      'They hunt with a red chin spotlight invisible to most prey.',
    ],
  },
  deeplobster: {
    description: 'Long-armed crustaceans of the abyssal plain, scavenging falls of dead whales and lost surface debris.',
    facts: [
      'Deep-sea lobsters often have enlarged claws for competing over scarce carrion.',
      'Some species are blind and rely on smell to find food in total darkness.',
    ],
  },
  lanternfish: {
    description: 'The most abundant fish on Earth by mass — tiny lights dotting the deep in layers every night.',
    facts: [
      'Lanternfish rise by the billions each night to feed near the surface.',
      'Their bioluminescent organs may signal mates or confuse predators.',
    ],
  },
  spermwhale: {
    description: 'The deepest-diving mammal, clicking through black canyons to hunt giant squid with sonar and jaw.',
    facts: [
      'Sperm whales can dive over 2,000 m and hold their breath for more than an hour.',
      'The spermaceti organ in their head may help with echolocation or buoyancy.',
    ],
  },
  orca: {
    description: 'Apex predators in black and white, hunting in coordinated pods with dialects of calls passed through generations.',
    facts: [
      'Orcas are actually the largest dolphins, not true whales.',
      'Different pods specialize in fish or seals and teach hunting tricks to their young.',
    ],
  },
  humpback: {
    description: 'Acrobats of the open ocean, breaching with long flippers and singing complex songs that change every year.',
    facts: [
      'Humpback songs can last 20 minutes and be heard kilometers away.',
      'Their flippers have bumps that improve hydrodynamic efficiency — inspiring turbine design.',
    ],
  },
  narwhal: {
    description: 'The unicorn of the Arctic — a spiraled tusk that is actually an elongated tooth packed with nerve endings.',
    facts: [
      'Most narwhal tusks spiral left; they can grow over 3 meters long.',
      'Tusks may help sense salinity and temperature, not just joust for mates.',
    ],
  },
  beluga: {
    description: 'White whales of icy estuaries, chirping and whistling so expressively they are called “canaries of the sea.”',
    facts: [
      'Belugas can move their melons (foreheads) to focus echolocation clicks.',
      'They molt each summer, rubbing on gravel to shed old skin.',
    ],
  },
  colossal: {
    description: 'Even larger and more massive than giant squid, with hooks on its tentacles and eyes like dinner plates.',
    facts: [
      'Colossal squid have the largest eyes of any animal — up to 27 cm across.',
      'Their arms bear rotating hooks as well as suckers for gripping prey.',
    ],
  },
  gpo: {
    description: 'The giant Pacific octopus — eight arms spanning meters, solving puzzles and vanishing into rocky lairs.',
    facts: [
      'GPOs can weigh over 50 kg and live only 3–5 years, dying after breeding.',
      'They are among the smartest invertebrates, learning mazes and opening jars.',
    ],
  },
  megamouth: {
    description: 'A rare filter-feeding shark discovered only in 1976, glowing around the mouth to lure plankton in the deep.',
    facts: [
      'Fewer than 100 megamouth specimens have ever been documented worldwide.',
      'They swim with mouths open, straining krill and jellyfish with gill rakers.',
    ],
  },
  greenland: {
    description: 'The slowest shark alive, patrolling icy depths for centuries with flesh toxic enough to intoxicate sled dogs.',
    facts: [
      'Greenland sharks may live 400+ years — the longest-lived vertebrate known.',
      'Their flesh contains TMAO; it must be fermented to be eaten safely in Iceland.',
    ],
  },
  isopod: {
    description: 'A pill bug scaled up to dinner-plate size, scavenging the abyssal floor with armored segments.',
    facts: [
      'Giant isopods can go years without eating when food is scarce.',
      'They are related to woodlice — crustaceans that conquered the deep.',
    ],
  },
  spidercrab: {
    description: 'Leg spans wider than a human is tall, crawling slowly over Pacific vents and slopes like a living tripod.',
    facts: [
      'Japanese spider crabs are the largest arthropods alive by leg span.',
      'They attach sponges and kelp to their shell for camouflage.',
    ],
  },
  yeticrab: {
    description: 'Hairy claws wave in hydrothermal vent flow, farming bacteria on their bristles for food in toxic warmth.',
    facts: [
      'Yeti crabs were discovered in 2005 near Pacific vents at 2,200 m depth.',
      'They “dance” in vent fluids to bathe their bacterial gardens in nutrients.',
    ],
  },
  stygiomedusa: {
    description: 'A vast dark bell trailing four ribbon arms tens of meters long — a phantom jelly of the midnight sea.',
    facts: [
      'Stygiomedusa has been spotted below 2,000 m with arms over 10 meters long.',
      'It is one of the largest jelly types but almost never seen intact.',
    ],
  },
  snailfish: {
    description: 'Soft, translucent pioneers of the deepest trenches — holding the record for deepest fish ever filmed.',
    facts: [
      'Mariana snailfish survive over 8,000 m deep, where pressure crushes most fish.',
      'Their gelatinous bodies lack scales and are less dense than water at depth.',
    ],
  },
  glasssponge: {
    description: 'Frail-looking lattices of glass silica that outlast their appearance — reefs of crystal on deep seamounts.',
    facts: [
      'Glass sponges build skeletons from silica fibers stronger than some man-made glass.',
      'Some species live centuries and filter bacteria from deep currents.',
    ],
  },
  tubeworm: {
    description: 'Red-plumed giants of hydrothermal vents, living without mouths on symbiotic bacteria inside their bodies.',
    facts: [
      'Giant tube worms have no digestive tract — bacteria in their tissues make food from vent chemicals.',
      'Their plumes are gills packed with hemoglobin that binds toxic hydrogen sulfide.',
    ],
  },
  swallower: {
    description: 'A black deep fish with a distensible stomach, swallowing prey several times its own size whole.',
    facts: [
      'Black swallowers have been found with fish bulging inside them still being digested.',
      'They live where meals are rare, so eating once can last for weeks.',
    ],
  },
  tripod: {
    description: 'A fish that stands on fin-tip stilts on the muddy abyssal plain, waiting motionless for drifting prey.',
    facts: [
      'Tripod fish perch on elongated pelvic and caudal fins up to a meter above the bottom.',
      'They face into the current so food flows toward their mouths.',
    ],
  },
  kraken: {
    description: 'Sailors’ nightmare given form — tentacles wide enough to shadow a sub, dragging legends from the ink-dark deep.',
    facts: [
      'The kraken myth likely grew from sightings of giant and colossal squid.',
      'In Deep Spot lore, it is said to stir when whale falls rain from above.',
    ],
  },
  wyrm: {
    description: 'A serpentine shadow of the hadal trenches, scaled in bronze and rumor, older than any chart that names it.',
    facts: [
      'Hadal wyrms exist only in the deepest game waters — no specimen has been catalogued.',
      'Divers who photograph one and return are rare; most only see the wake.',
    ],
  },
};

function getFishCardInfo(creatureType) {
  const extra = FISH_CARD_DATA[creatureType.id] || {
    description: 'A mysterious denizen of the deep, still being studied by oceanographers.',
    facts: ['Sightings are rare.', 'More data needed from brave divers.'],
  };
  return {
    ...creatureType,
    ...extra,
  };
}
