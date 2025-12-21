/**
 * SEO content for "near me" landing pages
 */

export type NearMePageType = 'hot-springs' | 'swimming-holes' | 'natural-springs';

export interface NearMeContent {
  title: string;
  h1: string;
  intro: string;
  metaDescription: string;
  editorial: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const NEAR_ME_CONTENT: Record<NearMePageType, NearMeContent> = {
  'hot-springs': {
    title: 'Hot Springs Near Me - Find Natural Hot Springs',
    h1: 'Hot Springs Near Me',
    intro:
      'Discover natural hot springs near your location. From primitive wilderness pools hidden in remote canyons to developed resort spas with full amenities, find the perfect thermal soak for your next adventure. Use your location to see hot springs closest to you, or browse by city and state.',
    metaDescription:
      'Find hot springs near your location. Discover natural hot springs for soaking, from primitive wilderness pools to resort spas. Get directions to hot springs closest to you.',
    editorial: `
      <h2>The Complete Guide to Finding Hot Springs</h2>
      <p>Natural hot springs are scattered across the American landscape, from the geothermal wonderlands of the Pacific Northwest to the desert oases of the Southwest. These geothermally heated pools have been used for relaxation and healing for thousands of years, and today they remain some of the most sought-after outdoor destinations in the country.</p>

      <h3>Types of Hot Springs Experiences</h3>
      <p><strong>Primitive hot springs</strong> offer the most authentic experience—natural pools in wilderness settings where you can soak under the stars with minimal development. These are often found on public lands managed by the Forest Service or BLM, and they're typically free to visit. Popular primitive springs include Goldbug Hot Springs in Idaho, Conundrum Hot Springs in Colorado, and Sykes Hot Springs in California.</p>

      <p><strong>Developed resort springs</strong> provide amenities like changing rooms, multiple pools at different temperatures, lodging, and spa services. These range from rustic mountain lodges to luxury destinations. Notable resort springs include Strawberry Park in Colorado, Dunton Hot Springs in Colorado, and Breitenbush Hot Springs in Oregon.</p>

      <h3>Hot Springs Etiquette</h3>
      <p>Whether visiting a primitive or developed spring, following proper etiquette ensures everyone has an enjoyable experience. Always shower before entering the water when facilities are available. Keep voices at conversational levels—many visitors come for peace and quiet. Pack out all trash at primitive locations, and respect clothing-optional customs where they exist. Never bring glass containers, soap, or alcohol to natural springs.</p>

      <h3>Health Benefits of Hot Springs</h3>
      <p>Hot springs have been valued for their therapeutic properties throughout human history. The mineral-rich waters may help relieve muscle tension, improve circulation, and promote relaxation. Many springs contain silica, sulfur, calcium, and other minerals absorbed through the skin during soaking. While scientific studies on specific health claims vary, the stress-relieving benefits of immersion in warm water are well-documented.</p>
    `,
    faqs: [
      {
        question: 'How do I find hot springs near me?',
        answer:
          'Enable location services on this page to see hot springs closest to your current location. You can also browse by city or state to find hot springs in areas you plan to visit. Our database includes over 2,900 natural springs across America.',
      },
      {
        question: 'Are there free hot springs near me?',
        answer:
          'Many natural hot springs are free to visit, especially primitive springs on public lands. Use our filters to find free hot springs in your area. Developed resort springs typically charge admission fees ranging from $10-50 per person.',
      },
      {
        question: 'What should I bring to a hot spring?',
        answer:
          'Essential items include: a swimsuit (unless visiting clothing-optional springs), water to stay hydrated, a towel, sandals for walking on hot surfaces, and sunscreen. For primitive springs, bring a headlamp if visiting at night and pack out all trash.',
      },
      {
        question: 'Are hot springs safe to soak in?',
        answer:
          'Most natural hot springs are safe when proper precautions are taken. Check water temperature before entering (ideal is 100-104°F), limit soaks to 15-20 minutes, stay hydrated, and avoid submerging your head. Pregnant women and those with heart conditions should consult a doctor first.',
      },
      {
        question: 'When is the best time to visit hot springs?',
        answer:
          'Winter and fall are ideal seasons for hot spring soaking when air temperatures are cooler. Early morning or weekday visits typically mean fewer crowds. Summer can be too hot for some springs, though high-altitude and shaded springs remain comfortable year-round.',
      },
    ],
  },

  'swimming-holes': {
    title: 'Swimming Holes Near Me - Find Natural Swimming Spots',
    h1: 'Swimming Holes Near Me',
    intro:
      'Find the best natural swimming holes near your location. Discover hidden swimming spots with crystal-clear water, cliff jumping, waterfalls, and rope swings. Whether you seek a secluded canyon pool or a popular river beach, explore swimming holes closest to you.',
    metaDescription:
      'Find swimming holes near your location. Discover natural swimming spots with crystal-clear water, cliff jumping, and waterfalls. Explore swimming holes closest to you.',
    editorial: `
      <h2>Your Guide to Natural Swimming Holes</h2>
      <p>Swimming holes offer a refreshing escape from crowded public pools and beaches. These natural swimming spots—fed by springs, rivers, and mountain streams—provide some of the most memorable swimming experiences in America. From rope swings over crystal-clear pools to cliff jumps into deep canyon waters, swimming holes deliver adventure that man-made facilities simply can't match.</p>

      <h3>Types of Swimming Holes</h3>
      <p><strong>Spring-fed pools</strong> offer the clearest water, often with visibility of 20 feet or more. The constant flow of fresh spring water keeps these pools cool even in summer heat. Texas Hill Country and Florida are famous for their spring-fed swimming holes.</p>

      <p><strong>River pools</strong> form where creeks and rivers slow down, creating calm pools perfect for swimming. Look for pools downstream of rapids or where the river widens. Popular examples include Sliding Rock in North Carolina and Bull Creek in Austin, Texas.</p>

      <p><strong>Waterfall basins</strong> combine the thrill of a natural water feature with a swimming pool below. The churning water at the base creates natural aeration, and many waterfall pools feature ledges for jumping. Havasu Falls in Arizona and McCloud River Falls in California are legendary destinations.</p>

      <h3>Swimming Hole Safety</h3>
      <p>Natural swimming holes require more caution than controlled environments. Always scout the water before entering—check depth, currents, and underwater obstacles. Never dive headfirst into natural water on your first visit. Be aware of flash flood risks in canyon settings, especially during monsoon season. Swim with a buddy, and let someone know your plans if visiting remote locations.</p>

      <h3>Leave No Trace</h3>
      <p>The best swimming holes remain pristine because visitors respect them. Pack out everything you bring in, including food scraps and cigarette butts. Avoid using soap, sunscreen, or lotions that can contaminate the water. Stay on established trails to prevent erosion, and never carve or mark rocks and trees.</p>
    `,
    faqs: [
      {
        question: 'How do I find swimming holes near me?',
        answer:
          'Enable location on this page to discover swimming holes closest to you. Our database includes natural swimming spots across America, from mountain streams and river pools to spring-fed cenotes and waterfall basins. Browse by city or state for trip planning.',
      },
      {
        question: 'Are swimming holes safe?',
        answer:
          'Natural swimming holes carry inherent risks including cold water shock, underwater hazards, and currents. Always check water depth before jumping, never swim alone, and be aware of flash flood risks in canyons. Check recent conditions as water levels and hazards change seasonally.',
      },
      {
        question: 'What should I bring to a swimming hole?',
        answer:
          'Pack water shoes for rocky bottoms, a dry bag for valuables, sunscreen, snacks, and plenty of water. Bring a trash bag to pack out waste. For cliff jumping spots, wear secure swimwear and consider water socks for traction.',
      },
      {
        question: 'Are there swimming holes with cliff jumping near me?',
        answer:
          'Many swimming holes feature natural cliffs for jumping. Use our filters to find spots with cliff jumping. Always check water depth first—jump feet-first your first time, and never dive headfirst into natural water. Heights vary from 5 to 50+ feet at different locations.',
      },
      {
        question: 'When is the best time to visit swimming holes?',
        answer:
          'Summer is peak season for swimming holes when water temperatures are warmest. Spring offers fuller waterfalls but colder water. Visit on weekday mornings for fewer crowds. Check seasonal closures and water levels before visiting—some spots dry up in late summer.',
      },
    ],
  },

  'natural-springs': {
    title: 'Natural Springs Near Me - Hot Springs & Swimming Holes',
    h1: 'Natural Springs Near Me',
    intro:
      'Explore natural springs near your location. From steaming hot springs perfect for winter soaking to refreshing cold springs ideal for summer swimming, discover the full spectrum of natural water experiences. Find primitive wilderness springs or developed resort destinations near you.',
    metaDescription:
      'Find natural springs near your location. From hot springs for winter soaking to cool swimming holes for summer. Discover natural water spots closest to you.',
    editorial: `
      <h2>Exploring America's Natural Springs</h2>
      <p>The United States is home to thousands of natural springs, from the volcanic hot springs of the Pacific Ring of Fire to the limestone-filtered cold springs of Florida and Texas. These geological treasures offer year-round recreation and have been gathering places for humans since prehistoric times. Whether you're seeking therapeutic warmth or refreshing coolness, there's a natural spring waiting to be discovered.</p>

      <h3>Understanding Spring Temperatures</h3>
      <p><strong>Hot springs (100°F+)</strong> are geothermally heated, drawing warmth from magma deep beneath the Earth's surface. The western United States has the highest concentration of hot springs due to volcanic activity along the Pacific Plate. Idaho, California, Nevada, Oregon, and Colorado lead the nation in hot spring density.</p>

      <p><strong>Warm springs (70-99°F)</strong> offer comfortable temperatures year-round without the intensity of hot springs. These are often found where geothermal activity is moderate or where cold and hot springs mix. They're perfect for extended soaking sessions.</p>

      <p><strong>Cold springs (under 70°F)</strong> are fed by aquifers and snowmelt, emerging at consistent cool temperatures regardless of air temperature. Florida's famous springs maintain around 72°F year-round, while mountain springs can be near freezing. Cold springs offer excellent swimming in summer months.</p>

      <h3>Finding the Right Spring for You</h3>
      <p>Consider what experience you're seeking. For relaxation and therapeutic benefits, hot springs are ideal, especially in cooler months. For exercise and refreshment during summer, cold springs and swimming holes provide relief from the heat. For a unique experience, seek out springs with special features—travertine terraces, cave formations, or underwater visibility for snorkeling.</p>

      <h3>Planning Your Visit</h3>
      <p>Research current conditions before visiting any natural spring. Water levels, temperatures, and access can change seasonally. Popular springs may require reservations or have limited parking. For primitive springs, check road conditions and bring appropriate supplies. Many of the best springs require hiking—from short walks to multi-mile backcountry treks—so plan accordingly.</p>
    `,
    faqs: [
      {
        question: 'What types of natural springs can I find near me?',
        answer:
          'Natural springs range from hot springs (100°F+) for therapeutic soaking, to warm springs (70-99°F) comfortable year-round, to cold springs (under 70°F) perfect for summer swimming. Use our temperature filters to find exactly what you seek.',
      },
      {
        question: 'What is the difference between hot springs and swimming holes?',
        answer:
          'Hot springs are geothermally heated, typically 100°F or warmer, and are best for soaking and relaxation. Swimming holes are unheated natural pools—spring-fed, river pools, or waterfall basins—ideal for swimming and cooling off in warm weather.',
      },
      {
        question: 'Are natural springs on public or private land?',
        answer:
          'Natural springs exist on both public and private land. Many primitive springs are on National Forest or BLM land and are free to visit. Resort springs are privately operated with admission fees. We indicate access type for each spring in our database.',
      },
      {
        question: 'How do I know if a natural spring is safe?',
        answer:
          'Check recent visitor reports for current conditions. For hot springs, test water temperature before entering. For swimming holes, check water depth and current strength. Avoid springs with warning signs, algae blooms, or sulfurous odors that seem unusual.',
      },
      {
        question: 'Can I camp near natural springs?',
        answer:
          'Many primitive springs on public land allow dispersed camping nearby. Developed resort springs often have campgrounds or lodging. Check our listings for camping availability and always follow Leave No Trace principles to protect these natural resources.',
      },
    ],
  },
};

/**
 * Get cities that are best for a specific spring type
 */
export function getCitiesForSpringType<T extends { state: string }>(
  type: NearMePageType,
  allCities: T[]
): T[] {
  // Hot spring-focused states
  const hotSpringStates = ['CA', 'CO', 'ID', 'NV', 'OR', 'MT', 'WY', 'UT', 'AZ', 'NM', 'AK', 'WA', 'AR'];
  // Swimming hole-focused states (includes eastern states)
  const swimmingHoleStates = ['CA', 'TX', 'AZ', 'NC', 'TN', 'VA', 'OR', 'WA', 'UT', 'CO'];

  if (type === 'hot-springs') {
    return allCities.filter((c) => hotSpringStates.includes(c.state));
  }
  if (type === 'swimming-holes') {
    return allCities.filter((c) => swimmingHoleStates.includes(c.state));
  }
  // natural-springs: return all
  return allCities;
}
