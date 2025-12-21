/**
 * Content templates for state + type combination pages
 */

export type FilterType = 'hot-springs' | 'warm-springs' | 'swimming-holes';

export interface StateTypeContent {
  intro: string;
  editorial: string;
  faqs: Array<{ question: string; answer: string }>;
}

/**
 * Map filter slug to spring_type enum
 */
export function getSpringTypeFromFilter(filter: FilterType): 'hot' | 'warm' | 'cold' {
  switch (filter) {
    case 'hot-springs':
      return 'hot';
    case 'warm-springs':
      return 'warm';
    case 'swimming-holes':
      return 'cold';
  }
}

/**
 * Get readable label for filter type
 */
export function getFilterLabel(filter: FilterType): string {
  switch (filter) {
    case 'hot-springs':
      return 'Hot Springs';
    case 'warm-springs':
      return 'Warm Springs';
    case 'swimming-holes':
      return 'Swimming Holes';
  }
}

/**
 * Generate page title for state + type combo
 */
export function getStateTypeTitle(stateName: string, filter: FilterType): string {
  const label = getFilterLabel(filter);
  return `${label} in ${stateName}`;
}

/**
 * Generate intro paragraph for state + type combo page
 */
export function getStateTypeIntro(stateName: string, filter: FilterType, count: number): string {

  switch (filter) {
    case 'hot-springs':
      return `Discover ${count} natural hot springs in ${stateName}. From primitive wilderness soaks to resort-style amenities, find geothermal springs with detailed access info, temperature data, and crowd levels. Perfect for year-round soaking adventures.`;

    case 'warm-springs':
      return `Explore ${count} warm springs in ${stateName}. These temperate springs offer comfortable year-round swimming and soaking. Find detailed access information, amenities, and seasonal recommendations for each location.`;

    case 'swimming-holes':
      return `Find ${count} swimming holes in ${stateName}. Discover pristine cold-water pools, waterfalls, and natural swimming areas. Get details on depth, cliff jumping, rope swings, and kid-friendly spots for refreshing summer adventures.`;
  }
}

/**
 * Get all valid filter types
 */
export const FILTER_TYPES: FilterType[] = ['hot-springs', 'warm-springs', 'swimming-holes'];

/**
 * Check if a string is a valid filter type
 */
export function isValidFilterType(filter: string): filter is FilterType {
  return FILTER_TYPES.includes(filter as FilterType);
}

/**
 * Get full content for state + type combo page including editorial and FAQs
 */
export function getStateTypeContent(stateName: string, filter: FilterType, count: number): StateTypeContent {
  const intro = getStateTypeIntro(stateName, filter, count);

  switch (filter) {
    case 'hot-springs':
      return {
        intro,
        editorial: getHotSpringsEditorial(stateName, count),
        faqs: getHotSpringsFaqs(stateName, count),
      };
    case 'warm-springs':
      return {
        intro,
        editorial: getWarmSpringsEditorial(stateName, count),
        faqs: getWarmSpringsFaqs(stateName, count),
      };
    case 'swimming-holes':
      return {
        intro,
        editorial: getSwimmingHolesEditorial(stateName, count),
        faqs: getSwimmingHolesFaqs(stateName, count),
      };
  }
}

// =============================================================================
// Hot Springs Editorial Content
// =============================================================================

function getHotSpringsEditorial(stateName: string, count: number): string {
  return `
    <h2>Exploring Hot Springs in ${stateName}</h2>
    <p>${stateName} offers ${count} natural hot springs ranging from developed resort destinations to remote backcountry pools. These geothermally heated waters emerge from deep underground, carrying minerals that have drawn visitors for centuries seeking relaxation and therapeutic benefits.</p>

    <h3>Types of Hot Spring Experiences</h3>
    <p><strong>Primitive hot springs</strong> in ${stateName} offer the most authentic soaking experience. These undeveloped pools on public lands let you connect with nature in its raw form. Expect minimal facilities—bring everything you need and pack out all waste.</p>

    <p><strong>Resort hot springs</strong> provide comfortable amenities like changing rooms, multiple temperature-controlled pools, lodging, and spa services. These developed facilities are perfect for first-time visitors or those seeking a pampered experience.</p>

    <p><strong>Hybrid destinations</strong> blend natural settings with basic improvements—perhaps stone-lined pools with nearby parking but few other amenities. These offer a middle ground between primitive adventure and resort comfort.</p>

    <h3>Planning Your Visit</h3>
    <p>The best time to visit hot springs in ${stateName} depends on your preferences. Winter offers the classic experience—steaming pools against cold air. Summer visits can be too warm at lower elevations but remain comfortable at mountain springs. Spring and fall offer moderate crowds and pleasant temperatures.</p>

    <p>Always check current conditions before visiting. Seasonal road closures, permit requirements, and water temperatures can vary significantly. Popular springs may require reservations or have capacity limits, especially on weekends.</p>

    <h3>Hot Spring Safety</h3>
    <p>Test water temperature before entering—some natural pools exceed safe soaking temperatures. Limit sessions to 15-20 minutes, stay hydrated, and never soak alone at remote locations. Be aware of wildlife, flash flood risks in canyon settings, and the challenges of transitioning from hot water to cold air in winter.</p>
  `;
}

function getHotSpringsFaqs(stateName: string, count: number): Array<{ question: string; answer: string }> {
  return [
    {
      question: `How many hot springs are in ${stateName}?`,
      answer: `${stateName} has ${count} documented hot springs in our database, ranging from primitive backcountry pools to developed resort destinations. The actual number may be higher as some springs remain undocumented or on private property.`,
    },
    {
      question: `Are hot springs in ${stateName} free to visit?`,
      answer: `Many hot springs in ${stateName} on public lands (Forest Service, BLM) are free. Developed resort springs typically charge admission fees ranging from $10-50 per person. Some popular free springs may require parking passes or permits.`,
    },
    {
      question: `What should I bring to hot springs in ${stateName}?`,
      answer: `Essential items include: swimsuit (unless visiting clothing-optional springs), drinking water, towel, sandals for hot surfaces, and sunscreen. For primitive springs, also bring a trash bag, first aid kit, headlamp for night soaking, and appropriate footwear for hiking.`,
    },
    {
      question: `When is the best time to visit hot springs in ${stateName}?`,
      answer: `Winter and fall offer the best hot spring experience when cool air contrasts with warm water. Spring is good but may have muddy trails. Summer can be uncomfortably hot at lower elevations, though mountain springs remain pleasant.`,
    },
    {
      question: `Are there clothing-optional hot springs in ${stateName}?`,
      answer: `Some hot springs in ${stateName} have clothing-optional customs, particularly at remote primitive locations. Developed resorts typically require swimwear unless specifically designated otherwise. Check individual listings for current policies.`,
    },
  ];
}

// =============================================================================
// Warm Springs Editorial Content
// =============================================================================

function getWarmSpringsEditorial(stateName: string, count: number): string {
  return `
    <h2>Warm Springs in ${stateName}</h2>
    <p>${stateName} features ${count} natural warm springs with temperatures between 70-99°F—warmer than ambient but cooler than traditional hot springs. These temperate pools offer comfortable year-round soaking without the intensity of hotter thermal waters.</p>

    <h3>The Appeal of Warm Springs</h3>
    <p>Warm springs occupy a sweet spot for many visitors. The moderate temperature allows for extended soaking sessions—often an hour or more—without the cardiovascular stress of hotter pools. This makes them ideal for families with children, heat-sensitive individuals, or anyone seeking prolonged relaxation.</p>

    <p>The gentle warmth is therapeutic without being intense. Many visitors find warm springs more versatile across seasons—refreshing in summer heat, comfortable in spring and fall, and still warm enough for pleasant winter soaking in mild climates.</p>

    <h3>Finding Warm Springs</h3>
    <p>Warm springs in ${stateName} form through several processes: geothermal heating at moderate levels, mixing of hot spring water with cooler streams, or groundwater emerging from depths where geothermal gradients raise temperatures naturally. Each warm spring has unique mineral content and character.</p>

    <p>Some warm springs are well-developed with facilities, while others remain primitive. Temperature can vary seasonally as source mixing ratios change with rainfall and snowmelt. What's warm in summer might feel cooler in spring when cold water inflow increases.</p>

    <h3>Visiting Tips</h3>
    <p>Warm springs are excellent for longer visits—pack a picnic, bring a book, or plan to spend several hours. The comfortable temperature supports conversation and social soaking better than hot springs where visitors must limit exposure time. Many warm springs welcome families and make great introductions to natural spring soaking.</p>
  `;
}

function getWarmSpringsFaqs(stateName: string, count: number): Array<{ question: string; answer: string }> {
  return [
    {
      question: `What temperature are warm springs in ${stateName}?`,
      answer: `Warm springs in ${stateName} typically range from 70-99°F (21-37°C). This is warmer than ambient water but cooler than hot springs (100°F+). The moderate temperature allows for longer, more comfortable soaking sessions.`,
    },
    {
      question: `How many warm springs are in ${stateName}?`,
      answer: `${stateName} has ${count} documented warm springs. These temperate natural pools offer comfortable year-round soaking at moderate temperatures between hot springs and cold swimming holes.`,
    },
    {
      question: `Are warm springs good for kids?`,
      answer: `Yes, warm springs are often ideal for families. The moderate temperature (70-99°F) reduces overheating risks while still providing warm water enjoyment. Always supervise children, test temperature first, and start with shorter soaking sessions.`,
    },
    {
      question: `How long can I soak in a warm spring?`,
      answer: `Warm springs allow much longer soaking times than hot springs—often an hour or more. The moderate temperature doesn't stress the cardiovascular system like 100°F+ water. Stay hydrated and exit if you feel lightheaded.`,
    },
    {
      question: `What's the difference between warm springs and hot springs?`,
      answer: `Warm springs have water temperatures of 70-99°F, while hot springs are 100°F and above. Warm springs allow longer soaking sessions and are gentler on the body. Hot springs provide more intense heat therapy but require shorter visits.`,
    },
  ];
}

// =============================================================================
// Swimming Holes Editorial Content
// =============================================================================

function getSwimmingHolesEditorial(stateName: string, count: number): string {
  return `
    <h2>Natural Swimming Holes in ${stateName}</h2>
    <p>${stateName} is home to ${count} natural swimming holes—spring-fed pools, river basins, and waterfall plunges that offer refreshing alternatives to chlorinated pools. These pristine natural swimming spots range from easy roadside access to remote wilderness destinations.</p>

    <h3>Types of Swimming Holes</h3>
    <p><strong>Spring-fed pools</strong> offer the clearest water, often with visibility of 20 feet or more. Fed by underground aquifers, these pools maintain consistent cool temperatures year-round, typically 68-72°F. The constant fresh water flow keeps conditions pristine.</p>

    <p><strong>River swimming holes</strong> form where flowing water slows and deepens into calm pools perfect for swimming. Look for spots downstream of rapids, behind natural dams, or where rivers widen. Water temperature varies seasonally with snowmelt and rainfall.</p>

    <p><strong>Waterfall basins</strong> combine dramatic scenery with swimming. Many feature cliff jumping opportunities, though you should always check depth before jumping and never dive headfirst into unknown water.</p>

    <h3>Swimming Hole Safety</h3>
    <p>Natural swimming holes require more caution than controlled environments. Water conditions change with weather—what was safe yesterday might be dangerous today. Always check depth before jumping, watch for underwater obstacles, and be aware of currents especially near waterfalls.</p>

    <p>Cold water shock is real even in summer. Spring-fed pools can be surprisingly cold. Enter gradually to let your body adjust. Supervise children closely and consider life jackets for non-swimmers.</p>

    <h3>Protecting Swimming Holes</h3>
    <p>The pristine beauty of swimming holes depends on visitor stewardship. Pack out all trash, avoid sunscreen and lotions that contaminate water, stay on established trails, and never alter natural features. Many swimming holes have closed due to overuse and abuse—respect these places so future visitors can enjoy them.</p>
  `;
}

function getSwimmingHolesFaqs(stateName: string, count: number): Array<{ question: string; answer: string }> {
  return [
    {
      question: `How many swimming holes are in ${stateName}?`,
      answer: `${stateName} has ${count} documented natural swimming holes including spring-fed pools, river swimming spots, and waterfall basins. Many more exist but remain local secrets or on private property.`,
    },
    {
      question: `Are swimming holes in ${stateName} safe?`,
      answer: `Safety varies by location and conditions. Always check water depth before jumping, watch for currents and underwater hazards, and be aware of flash flood risks in canyon settings. Supervise children closely and never swim alone at remote locations.`,
    },
    {
      question: `When is the best time to visit swimming holes in ${stateName}?`,
      answer: `Summer offers the warmest water temperatures and most comfortable swimming. Spring brings higher water levels and cooler temperatures. Visit on weekday mornings to avoid crowds at popular spots.`,
    },
    {
      question: `What should I bring to a swimming hole?`,
      answer: `Essentials include: water shoes for rocky bottoms, reef-safe sunscreen, drinking water, snacks, a trash bag to pack out waste, and a dry bag for valuables. For cliff jumping spots, wear secure swimwear.`,
    },
    {
      question: `Are there swimming holes with cliff jumping in ${stateName}?`,
      answer: `Many swimming holes in ${stateName} feature natural cliffs for jumping. Always check depth before jumping—jump feet-first on your first attempt, never dive headfirst. Heights and safety conditions vary significantly between locations.`,
    },
  ];
}
