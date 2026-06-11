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
