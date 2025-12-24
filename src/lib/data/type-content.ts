/**
 * SEO content for national type landing pages
 */

export type TypePageSlug = 'hot-springs' | 'swimming-holes' | 'warm-springs';
export type SpringType = 'hot' | 'cold' | 'warm';

export interface TypeContent {
  title: string;
  h1: string;
  intro: string;
  metaDescription: string;
  editorial: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const TYPE_CONTENT: Record<TypePageSlug, TypeContent> = {
  'hot-springs': {
    title: 'Hot Springs Across America - Natural Thermal Pools',
    h1: 'Hot Springs Across America',
    intro:
      'Discover natural hot springs throughout the United States. From primitive wilderness soaks in Idaho to luxury resort spas in Colorado, explore thousands of geothermal pools perfect for relaxation and healing. Browse hot springs by state, find nearby thermal pools, or plan your next soaking adventure.',
    metaDescription:
      'Explore natural hot springs across America. Find geothermal pools from primitive wilderness soaks to luxury resort spas. Browse hot springs by state.',
    editorial: `
      <h2>The Ultimate Hot Springs Guide for America</h2>
      <p>The United States is blessed with thousands of natural hot springs, concentrated primarily in the volcanic West but scattered across the continent from Alaska to Arkansas. These geothermally heated pools have been treasured for millennia, offering therapeutic warmth, stunning natural settings, and a connection to the Earth's raw power. Whether you're seeking a backcountry adventure or a pampered resort experience, there's a hot spring waiting for you.</p>

      <h3>Hot Spring Geology and Distribution</h3>
      <p>Hot springs form where geothermal activity heats groundwater, which then rises to the surface. The western United States, sitting along the Pacific Ring of Fire, contains the highest concentration of hot springs in North America. Idaho leads the nation with over 340 documented hot springs, followed by California, Nevada, Oregon, and Montana. But hot springs exist beyond the West—Arkansas Hot Springs National Park, Virginia's Warm Springs, and Alaska's remote thermal pools all offer unique soaking experiences.</p>

      <p>Water temperatures vary from warm (just above ambient) to scalding (180°F+). The ideal soaking temperature for most people is 100-104°F, though many enjoy hotter pools in winter months. Mineral content varies widely—some springs contain sulfur (creating that characteristic "rotten egg" smell), others are rich in silica, lithium, or radon. These minerals give each spring its unique character and purported therapeutic properties.</p>

      <h3>Types of Hot Spring Experiences</h3>
      <p><strong>Primitive hot springs</strong> represent the most authentic experience. These undeveloped pools are typically found on public lands managed by the Forest Service or Bureau of Land Management. Access ranges from roadside soaks to multi-day backpacking trips. Popular primitive destinations include Goldbug Hot Springs in Idaho (a 2-mile hike with stunning mountain views), Conundrum Hot Springs in Colorado (an 8.5-mile alpine trek), and Sykes Hot Springs in California (accessible via the Big Sur backcountry).</p>

      <p><strong>Developed resort hot springs</strong> offer amenities like changing rooms, multiple pools at varying temperatures, spa services, and lodging. These range from rustic mountain lodges to luxury wellness retreats. Notable destinations include Strawberry Park Hot Springs near Steamboat Springs, Colorado (clothing optional after dark), Chena Hot Springs in Alaska (soak while watching the Northern Lights), and Breitenbush Hot Springs in Oregon (a retreat center in old-growth forest).</p>

      <p><strong>Historic bathhouse towns</strong> like Hot Springs, Arkansas, and Glenwood Springs, Colorado, blend natural thermal water with century-old architecture and modern amenities. These towns grew up around hot springs in the late 1800s and early 1900s, when "taking the waters" was considered essential medicine.</p>

      <h3>Health and Safety Considerations</h3>
      <p>Hot springs offer genuine relaxation and stress relief, and many visitors report therapeutic benefits for muscle pain, arthritis, and skin conditions. However, approach health claims with appropriate skepticism—while soaking in warm, mineral-rich water feels wonderful, scientific evidence for specific medical benefits varies.</p>

      <p>Safety is paramount. Test water temperature before entering—scalding pools can cause serious burns. Limit soaks to 15-20 minutes to avoid overheating, especially at high altitudes where the air is thin. Stay hydrated by drinking water before, during, and after soaking. Avoid submerging your head to reduce the risk of amoebic infections (rare but serious). Pregnant women, people with heart conditions, and those with open wounds should consult a doctor before hot spring visits.</p>

      <h3>Hot Spring Etiquette</h3>
      <p>Respecting hot spring etiquette ensures these natural treasures remain accessible and enjoyable for all. Shower before entering when facilities are available. Keep voices low—many visitors come for peace and tranquility. Never bring glass, soap, shampoo, or other contaminants into natural pools. Pack out all trash at primitive locations. Respect clothing-optional customs where they exist, and be aware that some springs have designated nude or clothed times.</p>

      <p>At primitive springs, practice Leave No Trace principles rigorously. Stay on established trails, camp at least 200 feet from the spring, and use existing fire rings if you must have a fire. Never build new rock structures or alter the natural features of pools. The most beloved springs remain pristine because visitors treat them with reverence.</p>

      <h3>Planning Your Hot Spring Trip</h3>
      <p>The best time to visit hot springs depends on your preferences. Winter and fall offer the classic hot spring experience—soaking in steaming water while snow falls or cool air bites. Summer can be too hot for some springs, though high-altitude and shaded pools remain comfortable. Spring brings wildflowers and rushing creeks but can mean muddy trails and swollen river crossings.</p>

      <p>For primitive springs, research road and trail conditions before you go. Many require high-clearance 4WD vehicles or become inaccessible in winter. Check for seasonal closures, permits, or regulations. Bring a headlamp for night soaking (the best time to see stars), extra water for drinking, towels, and appropriate footwear for hiking. For resort springs, reservations may be required, especially on weekends and holidays.</p>
    `,
    faqs: [
      {
        question: 'How many hot springs are there in the United States?',
        answer:
          'There are thousands of hot springs across the United States, with the highest concentration in the western states. Idaho alone has over 340 documented hot springs. Our database includes hot springs from all 50 states, ranging from primitive wilderness soaks to developed resort destinations.',
      },
      {
        question: 'Which states have the most hot springs?',
        answer:
          'Idaho leads with the most hot springs, followed by California, Nevada, Oregon, Montana, Wyoming, Colorado, and New Mexico. These states sit along the Pacific Ring of Fire, where volcanic and geothermal activity creates natural thermal pools. Alaska also has numerous hot springs, many in remote wilderness areas.',
      },
      {
        question: 'Are hot springs safe to soak in?',
        answer:
          'Most natural hot springs are safe when proper precautions are taken. Always test water temperature before entering (ideal is 100-104°F), limit soaks to 15-20 minutes, stay hydrated, and avoid submerging your head. Avoid springs with visible algae blooms or warning signs. Pregnant women and those with heart conditions should consult a doctor first.',
      },
      {
        question: 'What should I bring to a hot spring?',
        answer:
          'Essential items include: a swimsuit (unless visiting clothing-optional springs), drinking water to stay hydrated, a towel, sandals or water shoes, and sunscreen. For primitive springs, bring a headlamp for night visits, pack out bags for trash, and appropriate hiking gear if the spring requires a trail approach.',
      },
      {
        question: 'Do I need to pay to visit hot springs?',
        answer:
          'Many primitive hot springs on public lands are free to visit, though some require parking passes or permits. Developed resort hot springs typically charge admission fees ranging from $10-50 per person for day use. Some historic bathhouses charge per session. Check individual listings for current fee information.',
      },
      {
        question: 'What is the best season to visit hot springs?',
        answer:
          'Winter and fall are ideal for hot spring soaking when air temperatures are cool and the contrast between hot water and cold air is most dramatic. Summer can be too hot for some springs, though high-altitude locations remain comfortable. Spring offers fewer crowds and wildflowers, but trail conditions may be muddy.',
      },
      {
        question: 'Are hot springs clothing optional?',
        answer:
          'Clothing policies vary by location. Many primitive springs have unofficial clothing-optional traditions, while others require swimsuits. Some resort springs designate specific clothing-optional hours or areas. Check individual listings and posted signs. Always respect local customs and other visitors.',
      },
    ],
  },

  'swimming-holes': {
    title: 'Swimming Holes Across America - Natural Swimming Spots',
    h1: 'Swimming Holes Across America',
    intro:
      'Find the best natural swimming holes throughout the United States. Discover spring-fed pools with crystal-clear water, river swimming spots with rope swings, and waterfall basins perfect for cliff jumping. Browse swimming holes by state or search for natural swimming spots near you.',
    metaDescription:
      'Find the best swimming holes across America. Discover natural swim holes, spring-fed pools, and waterfall basins. Browse swimming spots by state.',
    editorial: `
      <h2>Your Complete Guide to Natural Swimming Holes</h2>
      <p>America's natural swimming holes offer some of the most refreshing and memorable aquatic experiences in the country. Unlike chlorinated pools or crowded beaches, these spring-fed pools, river basins, and mountain streams provide crystal-clear water, natural beauty, and often a sense of adventure. From the limestone springs of Texas and Florida to the canyon pools of the Southwest and mountain streams of Appalachia, natural swimming holes deliver summer magic that man-made facilities simply can't replicate.</p>

      <h3>Types of Natural Swimming Holes</h3>
      <p><strong>Spring-fed swimming holes</strong> offer the clearest water you'll find anywhere, often with visibility of 20 feet or more. These pools are fed by underground aquifers that maintain consistent cool temperatures year-round, typically between 68-72°F. Texas Hill Country and Florida are legendary for their spring-fed swimming holes. Jacob's Well near Wimberley, Texas, features an artesian spring with a 140-foot-deep opening. Florida's Ichetucknee Springs and Wakulla Springs offer pristine swimming and snorkeling in waters so clear you can see every detail of the sandy bottom.</p>

      <p><strong>River swimming holes</strong> form where flowing water slows and deepens, creating calm pools perfect for swimming. Look for pools downstream of rapids, behind natural dams, or where rivers widen and meander. Popular river swimming holes include Barton Springs Pool in Austin, Texas (fed by underground springs within a dam-formed pool), Bull Creek's natural pools north of Austin, and North Carolina's Sliding Rock—a natural water slide that flows year-round.</p>

      <p><strong>Waterfall basins</strong> combine the drama of falling water with swimming pools below. The churning water creates natural aeration and often spectacular scenery. Many waterfall swimming holes also feature ledges and cliffs for jumping. Havasu Falls in the Grand Canyon (accessible only by 10-mile hike or helicopter) is perhaps the most photographed swimming hole in America. McCloud River Falls in California offers three distinct waterfall pools, and Tennessee's Cummins Falls features both cascades and deep swimming holes.</p>

      <p><strong>Canyon pools and desert oases</strong> are found throughout the Southwest, where intermittent streams carve through rock to create temporary and permanent swimming holes. These spots are spectacular but require awareness of flash flood dangers. Popular destinations include Fossil Creek in Arizona (permit required), Havasu Creek's travertine pools, and the countless slot canyons of southern Utah.</p>

      <h3>Swimming Hole Safety</h3>
      <p>Natural swimming holes require more caution and awareness than controlled swimming environments. Water conditions change with seasons, weather, and flow rates. What was safe in summer may be dangerous in spring. Always scout pools before entering—check depth, current strength, and underwater obstacles like rocks or submerged logs.</p>

      <p>Never dive headfirst into natural water on your first visit. Water levels change, and what was deep enough last year may be shallow now. Jump feet-first initially, and only dive after you've thoroughly explored depth and bottom conditions. Be especially cautious around waterfalls, where hydraulics can create dangerous currents.</p>

      <p>Flash floods pose a real danger in canyon and desert swimming holes, especially during monsoon season (July-September in the Southwest). Check weather forecasts not just for your location but for the entire watershed upstream. If you see debris in trees above the waterline or hear rumbling, get to high ground immediately. Muddy or rising water is an evacuation signal.</p>

      <p>Cold water shock is a risk even in summer. Spring-fed pools often maintain temperatures in the 60s and 70s year-round. Enter slowly to let your body adjust, and be aware that even strong swimmers can struggle in unexpectedly cold water. Wear a wetsuit for extended swimming sessions in cold-water pools.</p>

      <h3>Finding and Accessing Swimming Holes</h3>
      <p>The best swimming holes are often local secrets, passed down through generations or discovered through careful exploration. Our database helps you find documented swimming holes, but respect access and etiquette. Many swimming holes are on private property with permissive access—landowners allow visitors as long as they're respectful. Abusing this privilege (leaving trash, trespassing beyond designated areas, or causing disturbances) can result in permanent closures.</p>

      <p>Some popular swimming holes now require permits or have restricted hours to manage crowds and protect resources. Fossil Creek in Arizona, Hamilton Pool in Texas, and many Oregon swimming holes have implemented permit systems. Plan ahead, check current regulations, and expect crowds at well-known spots during summer weekends.</p>

      <h3>Leave No Trace at Swimming Holes</h3>
      <p>The pristine beauty of swimming holes depends entirely on visitor stewardship. Pack out everything you bring in, including food scraps, cigarette butts, and any trash you find. Avoid using sunscreen, lotions, or insect repellent before swimming, as these contaminate water and harm aquatic life. If you must use sun protection, choose reef-safe, mineral-based products.</p>

      <p>Stay on established trails to prevent erosion. Trampled vegetation and eroded banks are visible signs of overuse. Never carve initials, move rocks to build dams or pools, or otherwise alter natural features. Even small changes can impact water flow, aquatic habitat, and the experience of future visitors.</p>

      <p>Respect wildlife and aquatic ecosystems. Don't harass fish, turtles, or other creatures. Avoid swimming during spawning seasons if the area is known for sensitive species. Some swimming holes are home to endangered salamanders, fish, or other species—your presence should leave no lasting impact.</p>

      <h3>Seasonal Considerations</h3>
      <p>Summer is peak season for swimming holes, when water temperatures are most comfortable and days are long. But this is also when crowds are largest. Visit on weekday mornings for a more peaceful experience. Spring offers fuller waterfalls and lush vegetation but colder water and potentially dangerous high flows. Fall brings beautiful foliage and fewer people, though water temperatures begin to drop. Some die-hard swimmers visit year-round, especially at warmer spring-fed pools in the South.</p>
    `,
    faqs: [
      {
        question: 'Where can I find swimming holes in the United States?',
        answer:
          'Natural swimming holes are found throughout the United States, with concentrations in Texas Hill Country, Florida, the Southwest, Appalachia, California, Oregon, and the Pacific Northwest. Our database includes spring-fed pools, river swimming spots, waterfall basins, and canyon pools across all 50 states.',
      },
      {
        question: 'Are swimming holes safe for kids?',
        answer:
          'Many swimming holes are family-friendly, but safety varies by location. Look for shallow, calm pools with easy access and good visibility. Always supervise children closely at natural swimming holes. Avoid locations with strong currents, deep water, or cliff jumping unless children are experienced swimmers under direct supervision.',
      },
      {
        question: 'What is the clearest swimming hole in America?',
        answer:
          'Spring-fed swimming holes in Texas and Florida are renowned for exceptional clarity, often with 20+ feet of visibility. Notable examples include Jacob\'s Well (Texas), Barton Springs (Texas), Ichetucknee Springs (Florida), and Wakulla Springs (Florida). The constant flow of fresh spring water maintains pristine conditions.',
      },
      {
        question: 'Do I need a permit to visit swimming holes?',
        answer:
          'Some popular swimming holes now require permits to manage crowds and protect resources. Examples include Fossil Creek (Arizona), Hamilton Pool (Texas), and many Oregon swimming holes. Most swimming holes on public lands are free and don\'t require permits, but always check current regulations before visiting.',
      },
      {
        question: 'When is the best time to visit swimming holes?',
        answer:
          'Summer offers the warmest water and best swimming conditions, though crowds are largest. Visit weekday mornings for fewer people. Spring brings fuller waterfalls but colder water. Fall offers beautiful foliage and fewer visitors. Some spring-fed pools in the South maintain comfortable temperatures year-round.',
      },
      {
        question: 'What should I bring to a swimming hole?',
        answer:
          'Essential items include: water shoes for rocky bottoms, a dry bag for valuables, reef-safe sunscreen, snacks, drinking water, and a trash bag to pack out waste. For cliff jumping spots, wear secure swimwear. Bring a wetsuit for cold-water swimming and a first aid kit for remote locations.',
      },
      {
        question: 'Are there swimming holes with cliff jumping?',
        answer:
          'Many swimming holes feature natural cliffs ranging from 5 to 50+ feet. Popular cliff jumping destinations include Jacob\'s Well (Texas), Blue Hole (New Mexico), Havasu Falls (Arizona), and countless river pools throughout the country. Always check depth before jumping—jump feet-first your first time, never dive headfirst.',
      },
    ],
  },

  'warm-springs': {
    title: 'Warm Springs Across America - Comfortable Year-Round Soaking',
    h1: 'Warm Springs Across America',
    intro:
      'Explore natural warm springs throughout the United States. With comfortable temperatures between 70-99°F, warm springs offer year-round soaking without the intensity of hot springs or the chill of cold swimming holes. Discover warm springs perfect for extended relaxation sessions and family soaking.',
    metaDescription:
      'Find warm springs across America with comfortable 70-99°F temperatures. Perfect for year-round soaking and family relaxation. Browse warm springs by state.',
    editorial: `
      <h2>The Perfect Middle Ground: America's Warm Springs</h2>
      <p>Warm springs occupy the sweet spot between scalding hot springs and bracing cold swimming holes. With temperatures typically ranging from 70-99°F, these temperate thermal pools offer comfortable soaking year-round without the intensity that limits time in hotter pools. Whether you're introducing children to natural springs, seeking extended relaxation sessions, or simply prefer moderate temperatures, warm springs provide an ideal natural bathing experience.</p>

      <h3>What Makes Warm Springs Special</h3>
      <p>Warm springs form through several geological processes. Some are geothermally heated but cooler than classic hot springs, emerging at comfortable temperatures naturally. Others result from mixing—where hot spring water combines with cold streams or groundwater to create temperate pools. Still others are simply unusually warm groundwater emerging from deep aquifers where geothermal gradients raise water temperature without full-scale volcanic heating.</p>

      <p>The key advantage of warm springs is extended soaking time. While hot springs (100°F+) typically require 15-20 minute sessions to avoid overheating, warm springs allow hour-long soaks without discomfort. This makes them ideal for social soaking, reading, stargazing, or simply prolonged relaxation. The moderate temperature is also gentler on the cardiovascular system, making warm springs accessible to more people, including those who find hot springs uncomfortably intense.</p>

      <h3>Notable Warm Spring Destinations</h3>
      <p><strong>Virginia's Warm Springs</strong> are among the most historic thermal pools in America. The town of Warm Springs, Virginia, has been a destination since the 1700s. The bathhouses here feature water naturally emerging at 96°F—warm enough for therapeutic benefits, cool enough for extended soaking. George Washington, Thomas Jefferson, and other Founding Fathers visited these springs, and the historic octagonal bathhouses still operate today.</p>

      <p><strong>Warm Springs in Idaho</strong> are numerous, often formed where hot spring water mixes with river water. Burgdorf Hot Springs, for example, offers pools at various temperatures including comfortable warm pools perfect for families. Many of Idaho's warm springs are accessible via Forest Service roads and short hikes, making them excellent introductions to primitive spring soaking.</p>

      <p><strong>Georgia's Warm Springs</strong> achieved fame as Franklin D. Roosevelt's retreat. He visited regularly for hydrotherapy to treat polio's effects, eventually establishing the Little White House there. The springs maintain a constant 88°F temperature and were believed to have therapeutic properties for paralysis. While the historic pools are now closed, the site remains a fascinating piece of American history.</p>

      <p><strong>Arizona and New Mexico warm springs</strong> often exist along rivers and creeks where geothermal activity warms water to moderate temperatures. These are popular year-round, as the warm water feels refreshing in summer heat but comfortable in winter. Verde Hot Springs in Arizona and various Gila River warm springs in New Mexico exemplify this type.</p>

      <h3>Family-Friendly Soaking</h3>
      <p>Warm springs are generally more suitable for families with children than hotter thermal pools. The moderate temperature reduces risks of burns or overheating, and children can play and swim rather than simply soak. When visiting warm springs with kids, still take appropriate precautions: test water temperature first, supervise closely, ensure children stay hydrated, and limit initial soaking time while they adjust to the experience.</p>

      <p>Many warm springs also feature adjacent cool pools or streams where children can alternate between warm soaking and cool swimming—a healthy practice that improves circulation and makes the experience more dynamic and engaging for young swimmers.</p>

      <h3>Health and Therapeutic Benefits</h3>
      <p>Warm springs offer many of the therapeutic benefits of hotter thermal pools but in a more accessible package. The buoyancy and warmth aid muscle relaxation, improve circulation, and provide gentle resistance for movement and exercise. Physical therapists sometimes recommend warm water exercise for rehabilitation, as the temperature is warm enough to relax muscles but cool enough to allow sustained activity.</p>

      <p>The mineral content of warm springs varies as widely as hot springs, from silica-rich to sulfurous to alkaline. Some warm springs have been used therapeutically for centuries, though modern science offers mixed evidence for specific health claims. What's undeniable is the relaxation and stress relief of soaking in warm natural water surrounded by beautiful landscapes.</p>

      <h3>Year-Round Access and Seasonal Considerations</h3>
      <p>Warm springs truly shine during shoulder seasons—spring and fall—when the water temperature provides perfect contrast to cool air without the extreme differential of hot springs in winter. They're also excellent summer destinations, especially in mountainous regions where air temperatures moderate. In winter, warm springs in mild climates remain accessible and comfortable, though in very cold conditions you may wish the water were hotter.</p>

      <p>Because warm springs are comfortable for extended periods, they're ideal for social gatherings, bringing friends and family together for unhurried relaxation. The moderate temperature facilitates conversation and shared experience rather than brief, intense heat exposure. This social aspect has made warm springs community gathering places throughout history.</p>

      <h3>Etiquette and Conservation</h3>
      <p>The same etiquette that applies to hot springs and swimming holes applies to warm springs: shower before entering when facilities are available, avoid glass and contaminants, pack out all trash, keep voices moderate, and respect other visitors' desire for tranquility. Because warm springs allow longer soaking times, be mindful of sharing space—don't monopolize small pools, and be aware that new arrivals may want to join.</p>

      <p>Many warm springs are on private property with permissive public access. Respect this privilege absolutely. Landowners who allow public access to warm springs on their property do so out of generosity. Any abuse—trespassing beyond designated areas, leaving trash, or disturbing neighbors—can result in permanent closure. Treat private-access warm springs with extra care and gratitude.</p>

      <h3>Finding Your Perfect Warm Spring</h3>
      <p>Warm springs offer something for everyone: families seeking gentle introduction to natural springs, heat-sensitive soakers who find hot springs overwhelming, swimmers who want to alternate warm soaking with cool swimming, and anyone seeking extended relaxation in comfortable natural water. Browse our database by state to find warm springs near you or along your travel route, and discover this perfect middle ground in America's diverse natural bathing experiences.</p>
    `,
    faqs: [
      {
        question: 'What temperature are warm springs?',
        answer:
          'Warm springs typically range from 70-99°F—warmer than ambient water temperature but cooler than classic hot springs (100°F+). This moderate temperature allows for extended soaking sessions and is generally more comfortable for families and heat-sensitive individuals.',
      },
      {
        question: 'Where can I find warm springs in the United States?',
        answer:
          'Warm springs are found throughout the country, with notable concentrations in Virginia, Idaho, Georgia, Arizona, and New Mexico. They often form where geothermal activity is moderate or where hot spring water mixes with cooler groundwater or streams. Browse our state-by-state listings to find warm springs near you.',
      },
      {
        question: 'Are warm springs better than hot springs?',
        answer:
          'Neither is objectively better—it depends on your preferences. Warm springs (70-99°F) allow longer soaking times and are gentler on the cardiovascular system, making them ideal for families and extended relaxation. Hot springs (100°F+) provide more intense heat therapy and are preferred in cold weather. Many visitors enjoy both types.',
      },
      {
        question: 'Can kids safely visit warm springs?',
        answer:
          'Yes, warm springs are generally more suitable for children than hotter thermal pools. The moderate temperature reduces overheating risks while still providing warm water enjoyment. Always supervise children, test water temperature first, ensure they stay hydrated, and limit initial soaking time while they adjust.',
      },
      {
        question: 'How long can I soak in a warm spring?',
        answer:
          'Warm springs allow much longer soaking times than hot springs—often an hour or more depending on individual comfort. The moderate temperature (70-99°F) doesn\'t stress the cardiovascular system the way 100°F+ water does. Still, stay hydrated and exit if you feel lightheaded or overheated.',
      },
      {
        question: 'Do warm springs have health benefits?',
        answer:
          'Warm springs offer relaxation, muscle tension relief, improved circulation, and gentle buoyancy for movement and exercise. The therapeutic properties depend partly on mineral content, which varies by location. While used historically for healing, approach specific health claims with skepticism and consult a doctor for medical conditions.',
      },
      {
        question: 'What\'s the best season to visit warm springs?',
        answer:
          'Warm springs are truly year-round destinations. Spring and fall offer ideal contrast between warm water and cool air. Summer visits are refreshing, especially in mountainous areas. Winter soaking is comfortable in mild climates, though you may prefer hotter springs in very cold conditions. Their moderate temperature makes them versatile across seasons.',
      },
    ],
  },
};

/**
 * Map type slug to spring_type database value
 */
export function getSpringTypeFromSlug(slug: TypePageSlug): SpringType {
  const mapping: Record<TypePageSlug, SpringType> = {
    'hot-springs': 'hot',
    'swimming-holes': 'cold',
    'warm-springs': 'warm',
  };
  return mapping[slug];
}

/**
 * Get cities that are best for a specific spring type
 * Reuses the logic from near-me-content for consistency
 */
export function getCitiesForType<T extends { state: string }>(slug: TypePageSlug, allCities: T[]): T[] {
  // Hot spring-focused states
  const hotSpringStates = ['CA', 'CO', 'ID', 'NV', 'OR', 'MT', 'WY', 'UT', 'AZ', 'NM', 'AK', 'WA', 'AR'];
  // Swimming hole-focused states (includes eastern states)
  const swimmingHoleStates = ['CA', 'TX', 'AZ', 'NC', 'TN', 'VA', 'OR', 'WA', 'UT', 'CO', 'FL'];
  // Warm springs are more geographically diverse
  const warmSpringStates = ['VA', 'ID', 'GA', 'AZ', 'NM', 'CA', 'OR', 'CO', 'MT'];

  if (slug === 'hot-springs') {
    return allCities.filter((c) => hotSpringStates.includes(c.state));
  }
  if (slug === 'swimming-holes') {
    return allCities.filter((c) => swimmingHoleStates.includes(c.state));
  }
  if (slug === 'warm-springs') {
    return allCities.filter((c) => warmSpringStates.includes(c.state));
  }
  return allCities;
}
