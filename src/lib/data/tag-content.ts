/**
 * SEO content for tag-based filtering pages
 */

export type TagSlug = 'free' | 'clothing-optional' | 'primitive' | 'resort' | 'drive-up';

export interface TagContent {
  title: string;
  h1: string;
  intro: string;
  metaDescription: string;
  editorial: string;
  faqs: Array<{ question: string; answer: string }>;
  dbFilter: {
    field: string;
    value: string | string[];
    operator?: 'eq' | 'in';
  };
}

export const TAG_CONTENT: Record<TagSlug, TagContent> = {
  free: {
    title: 'Free Hot Springs & Swimming Holes - No Entry Fees',
    h1: 'Free Hot Springs & Swimming Holes',
    intro:
      'Discover natural hot springs and swimming holes that are completely free to visit. These public springs on Forest Service and BLM land offer stunning natural beauty without admission fees. From primitive wilderness pools to roadside soaks, find free springs across America.',
    metaDescription:
      'Find free hot springs and swimming holes with no entry fees. Public springs on Forest Service and BLM land across America. Discover free natural soaking spots near you.',
    editorial: `
      <h2>Your Guide to Free Natural Springs</h2>
      <p>Thousands of natural hot springs and swimming holes across America are completely free to visit. Located primarily on public lands managed by the US Forest Service and Bureau of Land Management, these springs offer pristine soaking experiences without admission fees or commercial development. From remote backcountry pools requiring hours of hiking to convenient roadside springs, free options exist for every ability level.</p>

      <h3>Why So Many Springs Are Free</h3>
      <p>The majority of free hot springs exist on federal public lands, designated for recreational use by all Americans. The Forest Service and BLM manage millions of acres containing geothermal features, and their mandate includes providing free recreational access. These agencies maintain minimal infrastructure—perhaps a parking area and trail—but leave the springs in their natural state. This preserves the wilderness character while keeping them accessible to the public.</p>

      <p>Some free springs exist on state parks or county lands where swimming and soaking are permitted activities. Others are on private land where landowners have granted public access, often with the understanding that visitors will respect the property and practice Leave No Trace principles.</p>

      <h3>What to Expect at Free Springs</h3>
      <p><strong>Primitive conditions:</strong> Free springs rarely have amenities like changing rooms, toilets, or trash service. Come prepared with everything you need and pack out all waste. The lack of development is precisely what makes these springs special—you experience nature on its own terms.</p>

      <p><strong>Variable access:</strong> Some free springs are roadside attractions with parking lots. Others require hiking, sometimes on unmaintained trails. Research access conditions before visiting, especially in winter when forest roads may be impassable.</p>

      <p><strong>Clothing-optional culture:</strong> Many free springs have unofficial clothing-optional customs. While not universal, it's common enough that you should be prepared to encounter nude soakers at primitive locations. Respect local customs and practice the etiquette that's established at each spring.</p>

      <h3>Responsible Use of Free Springs</h3>
      <p>Free doesn't mean consequence-free. These springs remain accessible because visitors respect them. Pack out all trash—every wrapper, bottle, and cigarette butt. Don't bring glass containers to natural pools. Keep voices down and respect others seeking solitude. Never camp directly adjacent to springs; move at least 200 feet away to protect water quality and riparian areas.</p>

      <p>Soap, shampoo, and lotions contaminate spring water. Rinse off before entering when possible, and never wash or bathe in the springs themselves. The minerals and microorganisms that make hot springs unique are delicate ecosystems easily damaged by chemical contamination.</p>

      <h3>Finding Free Springs</h3>
      <p>The best free springs often aren't heavily advertised. Local knowledge matters—ask at Forest Service ranger stations or outdoor shops in areas known for hot springs. Online communities share information, but respect requests to keep certain springs low-profile to prevent overuse. Our database includes hundreds of documented free springs, with access information, difficulty levels, and recent conditions to help you plan your visit.</p>
    `,
    faqs: [
      {
        question: 'Why are some hot springs free?',
        answer:
          'Most free hot springs are located on federal public lands (US Forest Service or BLM) managed for recreational use by all Americans. These springs have minimal or no development, exist in natural settings, and are funded by taxpayer dollars rather than admission fees.',
      },
      {
        question: 'Are free hot springs safe to use?',
        answer:
          'Free springs can be safe when proper precautions are taken. Check water temperature before entering, test pool depth, be aware of seasonal hazards like flash floods or wildlife, and research current conditions. The lack of lifeguards or staff means you\'re responsible for your own safety.',
      },
      {
        question: 'What should I bring to a free hot spring?',
        answer:
          'Pack everything you need: swimsuit (or not, depending on local customs), towel, water for hydration, headlamp if visiting at night, and trash bags to pack out all waste. Free springs rarely have toilets or trash service, so come prepared to leave no trace.',
      },
      {
        question: 'Can I camp at free hot springs?',
        answer:
          'Many free springs on Forest Service or BLM land allow dispersed camping nearby. Camp at least 200 feet from water sources to protect water quality and riparian areas. Check local regulations—some popular springs have designated camping areas or seasonal closures.',
      },
      {
        question: 'Are free springs less maintained than paid ones?',
        answer:
          'Yes, free springs typically have minimal to no maintenance, infrastructure, or amenities. This primitive character is what attracts many visitors—you experience nature in its raw state. Paid resort springs offer developed pools, changing rooms, and staff but lack the wilderness setting.',
      },
    ],
    dbFilter: {
      field: 'fee_type',
      value: 'free',
      operator: 'eq',
    },
  },

  'clothing-optional': {
    title: 'Clothing-Optional Hot Springs & Swimming Holes',
    h1: 'Clothing-Optional Hot Springs',
    intro:
      'Find clothing-optional hot springs and swimming holes where naturist soaking is welcome. From officially designated clothing-optional resorts to primitive springs with long-standing naturist traditions, discover places where you can soak naturally in pristine wilderness settings.',
    metaDescription:
      'Discover clothing-optional hot springs where naturist soaking is welcome. Find officially designated and unofficial clothing-optional springs across America.',
    editorial: `
      <h2>The Naturist Hot Spring Experience</h2>
      <p>Clothing-optional hot springs represent a significant subset of America's soaking culture, where the tradition of bathing au naturel in natural waters connects with ancient customs practiced worldwide. From officially designated naturist resorts to primitive backcountry springs with unofficial clothing-optional customs, these locations offer opportunities to experience hot springs in the most natural way possible.</p>

      <h3>Types of Clothing-Optional Springs</h3>
      <p><strong>Official clothing-optional resorts:</strong> Some developed hot spring resorts designate certain pools or time periods as clothing-optional. These locations have clear policies, typically require membership or day fees, and enforce rules of conduct. Examples include Harbin Hot Springs (currently closed), Saline Valley Hot Springs, and various private resorts throughout California, Colorado, and Oregon. These offer the comfort of official sanction and established etiquette.</p>

      <p><strong>Unofficial clothing-optional primitive springs:</strong> Many backcountry hot springs on public lands have evolved unofficial clothing-optional customs over decades. While not legally designated as such, local custom and practice have established these as places where nude soaking is the norm. Visitors should respect established customs at each location—if you arrive to find nude soakers, that's the local culture.</p>

      <p><strong>Mixed-use springs:</strong> Some springs accommodate both clothed and unclothed bathers, with different pools or time periods for different preferences. Communication and mutual respect are key at these locations. When in doubt, observe what others are doing or politely ask about local customs.</p>

      <h3>Etiquette at Clothing-Optional Springs</h3>
      <p>Respect for others is paramount at clothing-optional locations. Observe local customs—if nude bathing is the norm, don't be the only person in a swimsuit making others uncomfortable. Conversely, if mixed bathing is common, respect those who choose to remain clothed. Never photograph others without explicit permission; many naturists choose these locations specifically for privacy.</p>

      <p>Maintain appropriate behavior at all times. Clothing-optional does not mean anything goes—these are family-friendly spaces where nudity is non-sexual. Offensive behavior, ogling, or sexual conduct is completely unacceptable and will get you asked to leave (or arrested at official facilities). The naturist philosophy centers on body acceptance and connection with nature, not exhibitionism or voyeurism.</p>

      <p>Bring a towel to sit on, both for hygiene and courtesy. Keep voices down and respect the peaceful atmosphere. If you're new to naturist bathing, know that the initial awkwardness fades quickly—most people report feeling more comfortable nude after just a few minutes.</p>

      <h3>Legal Considerations</h3>
      <p>Nudity laws vary by state and jurisdiction. On federal lands, nudity is generally allowed unless specifically prohibited by local regulation. However, what's tolerated at remote backcountry springs may not be legal at roadside locations. Research local rules before visiting, and be aware that unofficial customs don't provide legal protection. When in doubt, bring a swimsuit as backup.</p>

      <h3>First-Time Visitors</h3>
      <p>If you're new to clothing-optional springs, start with officially designated locations where the rules are clear and everyone is there for the same reason. Visit during off-peak hours to ease into the experience. Remember that no one is required to be nude—it's simply an option. Many first-timers start clothed and become more comfortable over time. The naturist community is generally welcoming and understands that everyone starts somewhere.</p>
    `,
    faqs: [
      {
        question: 'Are clothing-optional hot springs legal?',
        answer:
          'Legality varies by location. Official clothing-optional resorts operate legally with permits. Unofficial clothing-optional customs at primitive springs on public lands exist in a gray area—nudity may be tolerated through custom even where not explicitly legal. Research specific locations before visiting.',
      },
      {
        question: 'What is the etiquette at clothing-optional springs?',
        answer:
          'Respect local customs—if nudity is the norm, don\'t be the only clothed person. Never photograph others without permission. Maintain appropriate non-sexual behavior. Bring a towel to sit on. Keep voices conversational. First-timers should observe quietly and follow the lead of regular visitors.',
      },
      {
        question: 'Are clothing-optional springs safe for women?',
        answer:
          'Official clothing-optional facilities enforce strict codes of conduct and are generally very safe. Primitive springs rely on self-policing by the naturist community. Visit during daytime hours, consider going with friends, and trust your instincts. Inappropriate behavior should be reported to authorities.',
      },
      {
        question: 'What is the difference between "clothing-optional" and "nude required"?',
        answer:
          'Clothing-optional means nudity is permitted but not required—you can wear a swimsuit if preferred. Nude-required facilities (rare in the US) mandate nudity in certain areas, typically for hygiene reasons. Most American springs are clothing-optional, allowing personal choice.',
      },
      {
        question: 'Can families visit clothing-optional hot springs?',
        answer:
          'Many clothing-optional springs welcome families, operating as non-sexual, body-positive environments. Official resorts often have family-friendly policies. However, parents should research specific locations and use judgment about whether the environment suits their family values and children\'s maturity.',
      },
    ],
    dbFilter: {
      field: 'clothing_optional',
      value: ['yes', 'unofficial'],
      operator: 'in',
    },
  },

  primitive: {
    title: 'Primitive Hot Springs & Swimming Holes - Wilderness Soaking',
    h1: 'Primitive Hot Springs & Swimming Holes',
    intro:
      'Experience natural hot springs and swimming holes in their most authentic form. Primitive springs offer undeveloped wilderness soaking with minimal human impact—no changing rooms, no concrete pools, just pristine natural waters. Find remote backcountry springs and roadside gems preserved in their natural state.',
    metaDescription:
      'Find primitive hot springs in wilderness settings. Undeveloped natural pools, backcountry soaking, and pristine springs with minimal human impact across America.',
    editorial: `
      <h2>The Primitive Hot Spring Experience</h2>
      <p>Primitive hot springs represent the purest form of natural soaking—thermal waters emerging exactly as nature created them, often in remote wilderness settings far from roads and development. These springs may be simple pools lined with stones by previous visitors, natural rock formations holding crystal-clear water, or unmarked seeps you must search to find. What they lack in amenities they more than compensate for in authenticity, solitude, and connection to wild places.</p>

      <h3>What Makes a Spring "Primitive"</h3>
      <p><strong>No commercial development:</strong> Primitive springs have little to no man-made infrastructure. You won't find changing rooms, paved parking lots, entrance gates, or gift shops. The parking area might be a pullout on a forest road. The trail might be unofficial, marked only by footprints. The pools themselves are natural formations, perhaps enhanced with a few strategically placed rocks but fundamentally unchanged from their natural state.</p>

      <p><strong>Self-reliant access:</strong> Reaching primitive springs often requires navigation skills, physical fitness, and wilderness knowledge. Some involve multi-mile hikes on unmarked trails, river crossings, or bushwhacking. Winter access may require snowshoes or skis. You're responsible for your own safety—there are no lifeguards, no cell service, no nearby help if things go wrong.</p>

      <p><strong>Natural water management:</strong> Primitive springs rely on natural hydrology rather than pumps and pipes. Water temperature varies with seasonal flow rates and groundwater temperatures. Pool depth changes with rainfall. Some springs dry up in late summer or become dangerously flooded in spring runoff. You experience the springs as dynamic natural systems, not controlled commodities.</p>

      <h3>Accessing Primitive Springs</h3>
      <p>Research is essential before visiting primitive springs. Many exist on federal lands (Forest Service or BLM) where access is legal but not necessarily easy. Obtain current trail conditions, seasonal road closures, and permit requirements from local ranger stations. Topographic maps, GPS coordinates, and trip reports from recent visitors are invaluable—many primitive springs aren't marked on standard maps.</p>

      <p>Consider the hike's difficulty honestly. "Short walk" might mean 0.2 miles on a smooth path or 2 miles on steep, rocky trail. "Difficult hike" could involve route-finding, exposure, or stream crossings that become dangerous in high water. Start with easier springs and work up to challenging backcountry destinations as your skills and fitness improve.</p>

      <p>Winter access to primitive springs offers unique rewards—soaking in steaming pools while snow falls around you is magical. But winter conditions require additional skills and equipment. Snow obscures trails, making navigation difficult. Roads may be closed or require 4WD and chains. Hypothermia becomes a real risk when transitioning from hot water to freezing air. Plan accordingly.</p>

      <h3>Primitive Spring Culture</h3>
      <p>A special culture exists around primitive hot springs, based on Leave No Trace ethics and respect for both nature and other visitors. Pack out all trash, including toilet paper and food scraps. Don't build new pools or dam streams—leave stones and landscape undisturbed. Avoid bathing with soap even biodegradable types, as all soap affects water chemistry and aquatic life.</p>

      <p>Many primitive springs have evolved clothing-optional customs, especially remote backcountry locations. This isn't universal, but it's common enough that you should be prepared. The isolation and primitive character seem to encourage naturist bathing among many visitors.</p>

      <p>Solitude is highly valued at primitive springs. If you arrive to find others soaking, ask permission before joining them in the pool. Keep groups small—large parties overwhelm the intimate character of these places. Consider visiting on weekdays or shoulder seasons when fewer people travel backcountry.</p>

      <h3>Best Primitive Springs Regions</h3>
      <p>Idaho's Sawtooth Wilderness and Salmon River region contain dozens of primitive springs, many requiring substantial hikes. California's Eastern Sierra and Inyo National Forest host numerous primitive springs from roadside to backcountry. Colorado's San Juan Mountains hide spectacular high-altitude springs accessible to backpackers. Oregon's Cascade Range features primitive springs near hot waterfalls and mountain streams. Wyoming's Yellowstone backcountry includes thermal features outside the developed park areas, though regulations prohibit bathing in many.</p>
    `,
    faqs: [
      {
        question: 'What is a primitive hot spring?',
        answer:
          'A primitive hot spring is an undeveloped natural thermal pool with minimal human infrastructure. These springs lack commercial amenities like changing rooms or paved parking, exist in natural settings (often wilderness areas), and require self-reliant access. Water flows naturally without pumps or pipes.',
      },
      {
        question: 'How do I find primitive hot springs?',
        answer:
          'Research online databases, consult Forest Service rangers, read trip reports, and study topographic maps. Many primitive springs aren\'t marked on standard maps. GPS coordinates, recent visitor reports, and local knowledge are essential. Always check current access conditions before visiting.',
      },
      {
        question: 'What should I bring to a primitive hot spring?',
        answer:
          'Pack for wilderness self-sufficiency: water, snacks, first aid, headlamp, towel, sturdy footwear, and weather-appropriate clothing. Bring trash bags to pack out all waste. For remote springs, carry navigation tools (map, compass, GPS), emergency shelter, and communication devices like satellite messengers.',
      },
      {
        question: 'Are primitive springs safe?',
        answer:
          'Primitive springs carry inherent risks: no lifeguards, no cell service, possible wildlife encounters, and changeable water temperatures. Safety depends on your preparation, skills, and judgment. Check water temperature before entering, never soak alone in remote locations, and inform others of your plans.',
      },
      {
        question: 'When is the best time to visit primitive springs?',
        answer:
          'Fall and early winter offer ideal soaking temperatures with fewer crowds. Spring brings high water levels and beautiful wildflowers but trails may be muddy or impassable. Summer sees peak visitation and some springs become too warm. Winter offers magical snow-soaking but requires advanced skills and equipment.',
      },
    ],
    dbFilter: {
      field: 'experience_type',
      value: 'primitive',
      operator: 'eq',
    },
  },

  resort: {
    title: 'Hot Spring Resorts - Developed Springs with Amenities',
    h1: 'Hot Spring Resorts',
    intro:
      'Discover developed hot spring resorts offering comfort and amenities alongside natural thermal waters. These commercial springs feature multiple pools at different temperatures, changing facilities, lodging, and spa services. Perfect for first-time hot spring visitors or anyone seeking a pampered soaking experience.',
    metaDescription:
      'Find hot spring resorts with pools, lodging, and amenities. Developed commercial springs offering comfort and spa services alongside natural thermal waters.',
    editorial: `
      <h2>The Hot Spring Resort Experience</h2>
      <p>Hot spring resorts bridge the gap between primitive wilderness soaking and modern spa luxury, channeling natural thermal waters into developed pool systems complete with amenities and services. These commercial operations range from rustic mountain lodges with basic pools to elaborate destination resorts with luxury accommodations, multiple pools, spa treatments, and fine dining. Resort springs make the therapeutic benefits of natural hot springs accessible to everyone, regardless of physical ability or wilderness experience.</p>

      <h3>What Defines a Resort Spring</h3>
      <p><strong>Developed infrastructure:</strong> Resort springs feature constructed pool systems fed by natural thermal sources. Engineers control water temperature through mixing systems, combining hot source water with cooler streams or well water. Multiple pools at different temperatures accommodate varied preferences—scorching hot for dedicated soakers, moderate for long sessions, and cool plunge pools for contrast therapy. Filtration systems maintain water clarity, though many resorts emphasize their use of natural flow-through systems rather than heavy chemical treatment.</p>

      <p><strong>Amenities and services:</strong> Changing rooms with showers and lockers, towel service, and restrooms are standard. Many resorts include lodging from tent sites to luxury suites. Restaurants serve meals to day visitors and overnight guests. Spa services like massage therapy complement the soaking experience. Some resorts offer yoga classes, meditation spaces, and wellness programs built around the thermal waters.</p>

      <p><strong>Commercial operation:</strong> Resort springs charge admission fees ranging from $10 to $100+ per person for day use, with additional charges for overnight stays and spa services. This commercial model funds maintenance, staffing, and improvements while providing livelihoods for local communities. Many resort springs have operated for decades or even a century, representing significant local businesses and cultural institutions.</p>

      <h3>Types of Resort Springs</h3>
      <p><strong>Historic resort springs:</strong> The oldest American hot spring resorts date to the 1800s, when taking the waters was fashionable medical treatment. Properties like Glenwood Hot Springs in Colorado, Hot Springs in Arkansas, and various California resorts maintain historic buildings and old-world charm. These locations blend heritage architecture with modern amenities, offering soaking experiences connected to American history.</p>

      <p><strong>Rustic lodge resorts:</strong> Mountain and wilderness resorts emphasize natural settings over luxury. Think log buildings, simple pools, and focus on the hot springs themselves rather than elaborate spa services. These appeal to visitors seeking some amenity but primarily interested in the natural thermal waters. Examples include many Oregon and Idaho resorts in forest settings.</p>

      <p><strong>Luxury destination resorts:</strong> High-end hot spring resorts offer five-star accommodations, gourmet dining, professional spa services, and meticulously designed pool environments. These properties target wellness tourism and spa resort markets, using natural hot springs as their unique selling point. Pricing reflects luxury positioning, with rates comparable to top conventional resorts.</p>

      <p><strong>Day-use facilities:</strong> Some resort springs operate primarily as day-use attractions without lodging. These provide changing rooms, multiple pools, and perhaps a snack bar, focusing on accessible local recreation rather than destination travel. Many are municipally owned or operate as community non-profits.</p>

      <h3>Planning Your Resort Spring Visit</h3>
      <p>Make reservations well in advance, especially for popular resorts during peak seasons. Many limit daily visitors to prevent overcrowding, and lodging at desirable properties books months ahead. Ask about pool temperatures and soaking protocols—some resorts maintain specific quiet hours or have clothing-optional pools and times.</p>

      <p>Understand the fee structure before visiting. Day use fees, overnight lodging, spa services, and meals all add up. Some resorts offer packages that bundle services at better value. Ask about towel rental, locker fees, and other potential charges. Many resorts offer multi-visit passes or memberships for locals.</p>

      <p>Check policies on children, alcohol, and pool rules. Some resorts welcome families with kids, while others cater to adults seeking quiet relaxation. Pool etiquette varies—most prohibit running, diving, and loud behavior, but specific rules on food, drinks, and photography differ. Respect posted rules to ensure everyone enjoys the experience.</p>

      <h3>Resort Springs vs. Primitive Springs</h3>
      <p>The choice between resort and primitive springs depends on what you value in a hot spring experience. Resorts offer comfort, accessibility, and convenience—no hiking required, no navigation skills needed, amenities to enhance your visit. You trade solitude and wilderness character for ease and services. Primitive springs deliver authentic natural experiences and connection to wild places, but demand self-reliance, physical fitness, and tolerance for basic conditions.</p>

      <p>Many hot spring enthusiasts enjoy both types. Start at resort springs to discover whether you enjoy hot spring soaking, then venture to primitive locations as your interest and skills grow. Or appreciate resort springs as places to bring family members or friends who aren't wilderness enthusiasts, while saving solo primitive spring trips for personal adventures.</p>
    `,
    faqs: [
      {
        question: 'What amenities do hot spring resorts typically offer?',
        answer:
          'Most resort springs include changing rooms with showers and lockers, multiple pools at different temperatures, towel service, and restrooms. Many also offer lodging, restaurants, spa services like massage, and wellness programs. Luxury resorts add features like fine dining, fitness centers, and upscale accommodations.',
      },
      {
        question: 'How much do hot spring resorts cost?',
        answer:
          'Day-use admission typically ranges from $10-50 per person, varying by location and amenity level. Lodging adds $100-500+ per night depending on room quality. Spa services cost extra. Total costs for an overnight visit including meals and spa can easily exceed $300-500 per person at luxury properties.',
      },
      {
        question: 'Do I need reservations for hot spring resorts?',
        answer:
          'Reservations are highly recommended and required at many resorts, especially for lodging. Popular resorts limit daily visitors to prevent overcrowding, so day-use reservations may also be necessary. Book weeks or months in advance for peak seasons, weekends, and holidays.',
      },
      {
        question: 'Are resort hot springs naturally heated?',
        answer:
          'Yes, resort springs use naturally heated geothermal water, though they typically mix it with cooler water to achieve safe temperatures. The natural thermal source distinguishes resort springs from conventional heated pools. Most resorts emphasize their use of authentic geothermal water as a key attraction.',
      },
      {
        question: 'What should I wear at a hot spring resort?',
        answer:
          'Most resorts require standard swimwear (suits for women, trunks for men). Some resorts have designated clothing-optional pools or hours—check policies before visiting. Bring water shoes for hot decks, a cover-up for walking between pools, and a towel unless the resort provides them.',
      },
    ],
    dbFilter: {
      field: 'experience_type',
      value: 'resort',
      operator: 'eq',
    },
  },

  'drive-up': {
    title: 'Drive-Up Hot Springs & Swimming Holes - Easy Access',
    h1: 'Drive-Up Hot Springs & Swimming Holes',
    intro:
      'Find hot springs and swimming holes accessible without hiking. These drive-up springs offer easy access for all abilities—park your car and walk just steps to natural thermal pools. Perfect for families, seniors, or anyone seeking the hot spring experience without the trek.',
    metaDescription:
      'Discover drive-up hot springs with easy access, no hiking required. Park and walk to natural thermal pools. Accessible springs for families and all abilities.',
    editorial: `
      <h2>Easy-Access Natural Springs</h2>
      <p>Drive-up hot springs and swimming holes make natural water experiences accessible to everyone, regardless of physical ability or hiking endurance. These springs are located within short walking distance—usually under 100 yards—from parking areas, requiring no significant elevation gain or difficult terrain. The easy access doesn't diminish the quality of the experience; many drive-up springs rival their backcountry cousins in beauty, water quality, and thermal character.</p>

      <h3>What Qualifies as Drive-Up Access</h3>
      <p><strong>Proximity to parking:</strong> True drive-up springs sit within easy walking distance of vehicle parking. This might be a dedicated parking lot at a resort spring, a highway pullout near a riverside pool, or a forest road terminus where the spring is visible from your car. The key is minimal walking required—typically less than 5 minutes and under 100 yards on relatively flat terrain.</p>

      <p><strong>Accessible terrain:</strong> The path from parking to spring should be manageable for most visitors. This doesn't necessarily mean paved or ADA-compliant, but the route shouldn't require scrambling over boulders, crossing streams, or navigating steep slopes. Some drive-up springs have improved trails or even paved walkways; others simply have short, well-worn paths on fairly level ground.</p>

      <p><strong>Road access:</strong> The parking area itself must be accessible by standard vehicles during the typical visiting season. Some drive-up springs are roadside along paved highways. Others require driving on maintained forest roads passable by regular cars (not just 4WD). Seasonal access matters—a spring might be drive-up in summer but require snowmobiles in winter.</p>

      <h3>Types of Drive-Up Springs</h3>
      <p><strong>Resort springs:</strong> Nearly all commercial hot spring resorts qualify as drive-up access. Park in their lots and walk to pools through developed pathways. These offer the ultimate in accessibility, often with ADA-compliant facilities, paved surfaces, and railings for support. They're ideal for individuals with mobility challenges, families with young children, or anyone preferring easy access.</p>

      <p><strong>Roadside primitive springs:</strong> Numerous primitive hot springs happen to be located right next to roads. These offer the authentic primitive experience without the hike—natural pools, minimal development, wilderness character, but reached in under a minute from your car. Examples include many springs along forest roads in Idaho, California, and Oregon. These represent the best of both worlds for some visitors: authentic wilderness soaking with easy access.</p>

      <p><strong>Park and recreation area springs:</strong> Some springs within state and county parks are drive-up accessible. These often have decent parking facilities, maybe restrooms, but maintain a natural character. They're managed for public recreation but haven't been developed into commercial operations. Access may require park entrance fees.</p>

      <p><strong>River access swimming holes:</strong> Many swimming holes are located at river access points designed for boating and fishing. Drive to the boat ramp or fishing access, and the swimming hole is steps away. These typically have good parking and basic facilities since they serve multiple recreational uses.</p>

      <h3>Advantages of Drive-Up Springs</h3>
      <p>The accessibility is obvious, but drive-up springs offer other benefits. They're perfect for day trips—soak for a few hours and return home without committing to wilderness camping. You can bring luxuries that would be impractical on a hike: coolers with drinks and food, multiple towels, changes of clothing, chairs, umbrellas. Parents can bring everything needed for young children without the challenge of packing it all on their backs.</p>

      <p>Drive-up springs accommodate people at different fitness levels. Your group might include elderly parents, young children, and friends who aren't wilderness enthusiasts. Drive-up access means everyone can participate. This inclusivity expands who can enjoy hot springs, democratizing an experience sometimes perceived as only for the young and fit.</p>

      <p>For first-time hot spring visitors, drive-up access reduces barriers and unknowns. You can try the experience without committing to a long hike into unfamiliar territory. If you discover hot spring soaking isn't for you, you've invested an hour rather than a whole day. For many people, accessible first experiences at drive-up springs lead to later adventures at more remote locations.</p>

      <h3>Considerations and Trade-offs</h3>
      <p>Easy access means crowds. Popular drive-up springs can be packed on weekends and holidays, especially those near urban areas or along tourist routes. Early morning or weekday visits help avoid crowds, but expect company at most drive-up locations during peak seasons. The solitude of backcountry springs is rarely found at drive-up locations.</p>

      <p>Some drive-up springs suffer from overuse. Litter, graffiti, and degraded conditions plague popular easy-access springs. When thousands of visitors pour through annually, and some percentage don't practice Leave No Trace ethics, the impacts accumulate. Not all drive-up springs face these issues—many are well-maintained by users or management agencies—but it's more common at easy-access locations than remote backcountry springs.</p>

      <p>Respect the local character and customs at drive-up primitive springs. Just because a spring is easy to reach doesn't mean it's a party destination. Keep noise down, pack out trash, and follow established etiquette. The ease of access makes these springs vulnerable to abuse, so visitor responsibility is crucial to keeping them open and accessible.</p>
    `,
    faqs: [
      {
        question: 'What is a drive-up hot spring?',
        answer:
          'A drive-up hot spring is accessible within a short walk (typically under 100 yards) from vehicle parking, requiring no significant hiking, elevation gain, or difficult terrain. These springs are reachable by most visitors regardless of physical fitness level.',
      },
      {
        question: 'Are drive-up springs less crowded than resort springs?',
        answer:
          'It depends. Popular drive-up primitive springs can be very crowded on weekends, especially those near cities or on tourist routes. However, many drive-up springs are less known and offer relative solitude. Resort springs control crowds through reservations and fees.',
      },
      {
        question: 'Do drive-up springs have facilities?',
        answer:
          'Facilities vary widely. Resort springs have full amenities (restrooms, changing rooms, parking lots). Primitive roadside springs typically have minimal facilities—maybe a pullout parking area, rarely restrooms. Plan to be self-sufficient at primitive drive-up springs.',
      },
      {
        question: 'Are drive-up springs good for families with kids?',
        answer:
          'Yes, drive-up access is ideal for families. No hiking means you can bring everything needed for children—snacks, extra towels, toys. Choose springs with gentle entry, known safe temperatures, and appropriate conditions for children. Resort springs often have family-friendly policies and amenities.',
      },
      {
        question: 'When is the best time to visit drive-up springs?',
        answer:
          'Visit weekday mornings for the smallest crowds at popular drive-up springs. Early morning or late afternoon also tends to be quieter than midday. Off-season visits (spring and fall for hot springs, winter for swimming holes) mean fewer visitors but check access and water conditions.',
      },
    ],
    dbFilter: {
      field: 'access_difficulty',
      value: 'drive_up',
      operator: 'eq',
    },
  },
};

/**
 * Valid tag slugs for route generation
 */
export const VALID_TAG_SLUGS: TagSlug[] = ['free', 'clothing-optional', 'primitive', 'resort', 'drive-up'];

/**
 * Get tag content by slug with type safety
 */
export function getTagContent(tag: string): TagContent | null {
  if (!VALID_TAG_SLUGS.includes(tag as TagSlug)) {
    return null;
  }
  return TAG_CONTENT[tag as TagSlug];
}
