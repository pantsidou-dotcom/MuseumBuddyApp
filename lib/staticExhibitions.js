import museumNames from './museumNames.js';
import museumImages from './museumImages.js';
import museumImageCredits from './museumImageCredits.js';
import museumTicketUrls from './museumTicketUrls.js';
import { getStaticMuseumBySlug } from './staticMuseums.js';

function createMuseumForSlug(slug) {
  if (!slug) {
    return null;
  }

  const staticMuseum = getStaticMuseumBySlug(slug);

  if (staticMuseum) {
    const {
      id,
      naam,
      stad,
      provincie,
      gratis_toegankelijk,
      ticket_affiliate_url,
      website_url,
      afbeelding_url,
      image_url,
    } = staticMuseum;

    return {
      id,
      slug,
      naam,
      stad,
      provincie,
      gratis_toegankelijk: Boolean(gratis_toegankelijk),
      ticket_affiliate_url: ticket_affiliate_url || null,
      website_url: website_url || null,
      afbeelding_url: afbeelding_url || museumImages[slug] || null,
      image_url: image_url || museumImages[slug] || null,
      imageCredit: museumImageCredits[slug] || null,
    };
  }

  return {
    id: slug,
    slug,
    naam: museumNames[slug] || slug,
    stad: 'Amsterdam',
    provincie: 'Noord-Holland',
    gratis_toegankelijk: false,
    ticket_affiliate_url: museumTicketUrls[slug] || null,
    website_url: null,
    afbeelding_url: museumImages[slug] || null,
    image_url: museumImages[slug] || null,
    imageCredit: museumImageCredits[slug] || null,
  };
}

const STATIC_EXHIBITIONS_SOURCE = [
  { id: 'ap-not-my-soul', museumSlug: 'allard-pierson-amsterdam', titel: 'Not My Soul', bron_url: 'https://www.allardpierson.nl/en/whats-on', description: 'Exhibition about slavery, freedom and the legal and human dimensions of unfreedom.', start_datum: '2025-11-21', eind_datum: '2026-05-24' },
  { id: 'ap-set-design-in-three-acts', museumSlug: 'allard-pierson-amsterdam', titel: 'Set Design in Three Acts', bron_url: 'https://www.allardpierson.nl/en/calendar/set-design-in-three-acts', description: 'Exhibition that symbolically unites museum, living room and studio and explores scenography across past and present.', start_datum: '2025-10-30', eind_datum: '2026-04-06' },
  { id: 'ap-geozone', museumSlug: 'allard-pierson-amsterdam', titel: 'GeoZone', bron_url: 'https://www.allardpierson.nl/en/whats-on', description: 'Current presentation that zooms in on geography, cartography and how people understand the world.' },
  { id: 'ap-permanent-exhibition', museumSlug: 'allard-pierson-amsterdam', titel: 'Permanent exhibition', bron_url: 'https://www.allardpierson.nl/en/whats-on', description: 'Core presentation with archaeology, special collections and cultural history from the Allard Pierson collection.' },

  { id: 'am-koopman-met-tattoo', museumSlug: 'amsterdam-museum-amsterdam', titel: 'Koopman met tattoo', bron_url: 'https://www.amsterdammuseum.nl/en/exhibition/koopman-met-tattoo/243269', description: 'Shows the earliest known tattoo in Western European painting and connects it to tattoo culture through objects from the Henk Schiffmacher collection.', start_datum: '2025-11-24', eind_datum: '2026-08-30' },
  { id: 'am-amsterdam-in-motion', museumSlug: 'amsterdam-museum-amsterdam', titel: 'Amsterdam in Motion', bron_url: 'https://www.amsterdammuseum.nl/en/exhibition/amsterdam-in-motion/228607', description: 'Continuous multimedia presentation with a large scale model of Amsterdam and interactive stories about the city’s development.' },
  { id: 'am-huis-willet-holthuysen', museumSlug: 'amsterdam-museum-amsterdam', titel: 'Huis Willet-Holthuysen', bron_url: 'https://www.amsterdammuseum.nl/en/exhibition/huis-willet-holthuysen/9511', description: 'Continuous presentation of the canal house, period rooms, collection, garden and changing contemporary maker intervention.' },

  { id: 'afh-story-of-anne', museumSlug: 'anne-frank-huis-amsterdam', titel: 'The Anne Frank House: story of Anne, the Secret Annex and the diary', bron_url: 'https://www.annefrank.org/en/museum/inside-museum/', description: 'Permanent museum presentation about Anne Frank, the people in hiding, the Secret Annex and the diary through quotes, objects, photos and video.' },
  { id: 'bw-happiness-project', museumSlug: 'body-worlds-amsterdam', titel: 'BODY WORLDS: The Happiness Project', bron_url: 'https://www.bodyworlds.nl/en/tickets/', description: 'Permanent body exhibition with real plastinated human bodies and a focus on happiness, health and the human body.' },
  { id: 'eye-what-is-film', museumSlug: 'eye-filmmuseum-amsterdam', titel: 'What is Film?', bron_url: 'https://www.eyefilm.nl/en/exhibitions', description: 'Permanent exhibition that explains film through images, sound, editing, technology and viewer experience.' },

  { id: 'foam-hajar-benjida', museumSlug: 'foam-fotografiemuseum-amsterdam', titel: 'Hajar Benjida: Atlanta Made Us Famous', bron_url: 'https://www.foam.org/events/hajar-benjida', description: 'Photography exhibition about Atlanta’s hip-hop culture, image-making and the role of women within that scene.', start_datum: '2025-11-14', eind_datum: '2026-03-25' },
  { id: 'foam-jasmijn-vermeeren', museumSlug: 'foam-fotografiemuseum-amsterdam', titel: 'Jasmijn Vermeeren: You Don’t Look Sick', bron_url: 'https://www.foam.org/events/jasmijn-vermeeren-you-don-t-look-sick', description: 'Photographic work about invisible illness and how health is perceived and judged by others.', start_datum: '2025-12-05', eind_datum: '2026-05-25' },
  { id: 'foam-julia-kochetova', museumSlug: 'foam-fotografiemuseum-amsterdam', titel: 'Julia Kochetova: War is Personal', bron_url: 'https://www.foam.org/events/julia-kochetova', description: 'Personal photography project on the human impact of war and how conflict shapes individual lives.', start_datum: '2026-03-06', eind_datum: '2026-05-25' },
  { id: 'foam-verena-blok', museumSlug: 'foam-fotografiemuseum-amsterdam', titel: 'Verena Blok: Love Shit', bron_url: 'https://www.foam.org/events/verena-blok-love-shit', description: 'Photography project about reproduction, womanhood, bodily autonomy and the politics of intimacy.', start_datum: '2026-03-06', eind_datum: '2026-05-25' },

  { id: 'gm-bijna-gesloopt', museumSlug: 'het-grachtenmuseum-amsterdam', titel: 'Amsterdam, bijna gesloopt', bron_url: 'https://grachten.museum/en/', description: 'Tells the story of how plans once threatened the canal belt and how citizens fought to preserve historic Amsterdam.', eind_datum: '2026-06-28' },
  { id: 'gm-animalia-amsterdam', museumSlug: 'het-grachtenmuseum-amsterdam', titel: 'Animalia Amsterdam: Dierportretten', bron_url: 'https://grachten.museum/en/', description: 'Mini exhibition of animal portraits that brings Amsterdam pets and their personalities into view.', eind_datum: '2026-06-28' },
  { id: 'gm-spiegelvloer', museumSlug: 'het-grachtenmuseum-amsterdam', titel: 'Spiegelvloer', bron_url: 'https://grachten.museum/en/', description: 'Spatial installation with a mirrored floor that changes how visitors experience the historic interior.', eind_datum: '2026-06-28' },
  { id: 'gm-amsterdamse-grachten', museumSlug: 'het-grachtenmuseum-amsterdam', titel: 'De Amsterdamse grachten', bron_url: 'https://grachten.museum/en/', description: 'Permanent exhibition on the origins, design and social history of Amsterdam’s canal belt.' },

  { id: 'sm-oceanista', museumSlug: 'scheepvaartmuseum-amsterdam', titel: 'Oceanista: Fashion & Sea', bron_url: 'https://www.hetscheepvaartmuseum.nl/en/whats-on/exhibitions/', description: 'Temporary exhibition about how the sea has influenced fashion, style and maritime imagination.', eind_datum: '2026-04-12' },
  { id: 'sm-amsterdam-port-city', museumSlug: 'scheepvaartmuseum-amsterdam', titel: 'Amsterdam Port City', bron_url: 'https://www.hetscheepvaartmuseum.nl/en/whats-on/exhibitions/', description: 'Presentation on Amsterdam as a port city and how shipping shaped the city’s growth and identity.' },
  { id: 'sm-republic-at-sea', museumSlug: 'scheepvaartmuseum-amsterdam', titel: 'Republic at Sea', bron_url: 'https://www.hetscheepvaartmuseum.nl/en/whats-on/exhibitions/', description: 'Presentation about the Dutch Republic as a maritime power and the role of seafaring in its history.' },
  { id: 'sm-shadows-on-the-atlantic', museumSlug: 'scheepvaartmuseum-amsterdam', titel: 'Shadows on the Atlantic', bron_url: 'https://www.hetscheepvaartmuseum.nl/en/whats-on/exhibitions/', description: 'Permanent exhibition about the Atlantic world, colonial trade and the history of slavery.' },

  { id: 'hm-designed-world', museumSlug: 'huis-marseille-amsterdam', titel: 'Designed World Through the Eyes of Tata Ronkholz (1940–1997)', bron_url: 'https://www.huismarseille.nl/en/exhibitions/', description: 'Survey of Tata Ronkholz’s photographs of designed environments, facades and everyday structures.', start_datum: '2026-02-14', eind_datum: '2026-06-21' },
  { id: 'hm-body-as-resistance', museumSlug: 'huis-marseille-amsterdam', titel: 'Yumna Al-Arashi: Body as Resistance', bron_url: 'https://www.huismarseille.nl/en/exhibitions/', description: 'Photography on the body as a site of memory, resistance, feminism and lived political experience.', start_datum: '2026-02-14', eind_datum: '2026-06-21' },

  { id: 'hart-american-identities', museumSlug: 'hart-museum-amsterdam', titel: 'American Identities: David Levinthal & Chicano Prints', bron_url: 'https://www.hartmuseum.nl/en/exhibitions/american-identities/', description: 'Pairs David Levinthal’s American Myth & Memory photographs with Chicano prints to explore identity, myth and power in the US.', start_datum: '2026-02-13', eind_datum: '2026-09-06' },
  { id: 'hart-jan-dibbets', museumSlug: 'hart-museum-amsterdam', titel: 'Jan Dibbets 1966–1976: Toward Another Photography', bron_url: 'https://www.hartmuseum.nl/en/exhibitions/jan-dibbets-toward-another-photography/', description: 'Focuses on Jan Dibbets’ experimental photography and conceptual work from a decisive decade.', start_datum: '2026-01-23', eind_datum: '2026-04-05' },

  { id: 'jm-eden-and-golden-rule', museumSlug: 'joods-museum-amsterdam', titel: 'Eden and the Golden Rule', bron_url: 'https://jck.nl/en/agenda/eden-and-golden-rule', description: 'Permanent AR-based family presentation in the Jewish Museum Junior exploring values, rules and coexistence.' },
  { id: 'jm-what-does-it-mean', museumSlug: 'joods-museum-amsterdam', titel: 'What does it mean to be Jewish?', bron_url: 'https://jck.nl/en/agenda/what-does-it-mean-to-be-jewish', description: 'Permanent exhibition that introduces Jewish culture, religion, history and everyday life in an accessible way.' },

  { id: 'kattenkabinet-collection', museumSlug: 'kattenkabinet-amsterdam', titel: 'KattenKabinet collection', bron_url: 'https://kattenkabinet.nl/en/', description: 'Museum collection devoted to cats in art, with paintings, drawings, sculpture and historic interiors.' },

  { id: 'micropia-magnified', museumSlug: 'micropia-museum-amsterdam', titel: 'MAGNIFIED', bron_url: 'https://www.artis.nl/en/artis-micropia/daily-schedule/magnified', description: 'Exhibition about microscopy and how technology lets us see the invisible microbial world.', start_datum: '2025-03-14' },
  { id: 'micropia-artis-micropia', museumSlug: 'micropia-museum-amsterdam', titel: 'ARTIS-Micropia', bron_url: 'https://www.artis.nl/en/artis-micropia/what-is-artis-micropia', description: 'Permanent museum presentation about microbes, invisible life and their role in our bodies and the world.' },

  { id: 'moco-dreams', museumSlug: 'moco-museum-amsterdam', titel: 'Dreams – Andrés Reisinger', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Dreamlike contemporary installation work by Andrés Reisinger, blending design, digital art and fantasy.', start_datum: '2024-10-08' },
  { id: 'moco-planet-positive-disruption', museumSlug: 'moco-museum-amsterdam', titel: 'Planet Positive Disruption – Frankey', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Street- and installation-based works by Frankey about playful urban interventions and positive disruption.', start_datum: '2024-12-12' },
  { id: 'moco-robbie-williams', museumSlug: 'moco-museum-amsterdam', titel: 'Robbie Williams: Pride and Self-Prejudice', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Robbie Williams’ art project about self-image, vulnerability and self-deprecating humour.', start_datum: '2024-03-08' },
  { id: 'moco-symphony-of-nature', museumSlug: 'moco-museum-amsterdam', titel: 'The Symphony of Nature – Six N. Five', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Digital artworks by Six N. Five imagining poetic, futuristic natural worlds.', start_datum: '2023-09-28' },
  { id: 'moco-banksy-laugh-now', museumSlug: 'moco-museum-amsterdam', titel: 'Banksy: Laugh Now', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Permanent Banksy exhibition with iconic works about consumerism, power and social critique.' },
  { id: 'moco-contemporary-masters', museumSlug: 'moco-museum-amsterdam', titel: 'Contemporary Masters', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Permanent selection of influential contemporary artists and works that shaped today’s art scene.' },
  { id: 'moco-digital-immersive-studio-irma', museumSlug: 'moco-museum-amsterdam', titel: 'Digital & Immersive Art – Studio Irma', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Immersive digital environments by Studio Irma centered on colour, optimism and sensory experience.' },
  { id: 'moco-modern-masters', museumSlug: 'moco-museum-amsterdam', titel: 'Modern Masters', bron_url: 'https://www.mocomuseum.com/exhibitions/amsterdam/', description: 'Permanent presentation of modern masters whose work influenced later contemporary art.' },

  { id: 'rembrandthuis-masterclass', museumSlug: 'rembrandthuis-amsterdam', titel: 'Rembrandt’s Masterclass', bron_url: 'https://www.rembrandthuis.nl/en/exhibition/rembrandts-masterclass/', description: 'Explains how Rembrandt learned, taught and refined his techniques, with a focus on workshop practice and artistic skill.', start_datum: '2026-01-30', eind_datum: '2026-05-25' },
  { id: 'rembrandthuis-warmoes-zamble', museumSlug: 'rembrandthuis-amsterdam', titel: 'Warmoes Biënnale: Iriée Zamblé', bron_url: 'https://www.rembrandthuis.nl/en/exhibition/warmoes-biennale-iriee-zamble/', description: 'Contemporary project in the Warmoesstraat context by Iriée Zamblé, connected to place, memory and identity.', start_datum: '2026-03-07', eind_datum: '2026-05-03' },

  { id: 'hetschip-unseen-talent', museumSlug: 'het-schip-amsterdam', titel: 'Unseen Talent: Women of the Amsterdam School', bron_url: 'https://www.hetschip.nl/en/exhibition/unseen-talent-women-of-the-amsterdam-school', description: 'Restores the visibility of women linked to the Amsterdam School and their overlooked talent and contribution.', start_datum: '2025-09-26', eind_datum: '2026-06-28' },
  { id: 'vanloon-canal-house', museumSlug: 'museum-van-loon-amsterdam', titel: 'Canal house, collection, garden and coach house', bron_url: 'https://www.museumvanloon.nl/en', description: 'Current visitor presentation of a historic canal house with interiors, family collection, garden and coach house.' },

  { id: 'nemo-elementa', museumSlug: 'nemo-science-museum-amsterdam', titel: 'Elementa', bron_url: 'https://www.e-nemo.nl/en/', description: 'Exhibition about atoms, molecules and the building blocks of the universe.' },
  { id: 'nemo-fenomena', museumSlug: 'nemo-science-museum-amsterdam', titel: 'Fenomena', bron_url: 'https://www.e-nemo.nl/en/', description: 'Hands-on exhibition about everyday physical phenomena and how the world around us works.' },
  { id: 'nemo-humania', museumSlug: 'nemo-science-museum-amsterdam', titel: 'Humania', bron_url: 'https://www.e-nemo.nl/en/', description: 'Interactive exhibition about the human body, mind, identity and behaviour.' },
  { id: 'nemo-rooftop-square', museumSlug: 'nemo-science-museum-amsterdam', titel: 'Rooftop Square', bron_url: 'https://www.e-nemo.nl/en/', description: 'Outdoor presentation on the roof about climate, energy, city life and sustainable urban choices.' },
  { id: 'nemo-technium', museumSlug: 'nemo-science-museum-amsterdam', titel: 'Technium', bron_url: 'https://www.e-nemo.nl/en/', description: 'Interactive exhibition about technology in daily life and the systems behind ordinary objects.' },

  { id: 'nxt-still-processing', museumSlug: 'nxt-museum-amsterdam', titel: 'Still Processing', bron_url: 'https://nxtmuseum.com/exhibition/still-processing/', description: 'Immersive exhibition about how humans and technology process data, images, light and meaning.', start_datum: '2025-02-07', eind_datum: '2026-06-30' },

  { id: 'opsolder-warmoes-siwani', museumSlug: 'ons-lieve-heer-op-solder-amsterdam', titel: 'Warmoes Biënnale: Buhlebezwe Siwani', bron_url: 'https://opsolder.nl/en/agenda/', description: 'Current Biennale presentation by Buhlebezwe Siwani in dialogue with the museum’s layered religious history.', start_datum: '2026-03-07', eind_datum: '2026-05-03' },
  { id: 'opsolder-museum-route', museumSlug: 'ons-lieve-heer-op-solder-amsterdam', titel: 'Museum Our Lord in the Attic', bron_url: 'https://opsolder.nl/en/museum-our-lord-in-the-attic/', description: 'Permanent museum route through a 17th-century canal house culminating in the hidden church in the attic.' },

  { id: 'rijksmuseum-asian-pavilion', museumSlug: 'rijksmuseum-amsterdam', titel: 'Asian Pavilion', bron_url: 'https://www.rijksmuseum.nl/en/whats-on/exhibitions/asian-pavilion', description: 'Rotating presentation in the Asian Pavilion with new stories and highlights from the museum’s Asian art collection.', eind_datum: '2026-04-13' },
  { id: 'rijksmuseum-fake', museumSlug: 'rijksmuseum-amsterdam', titel: 'FAKE!', bron_url: 'https://www.rijksmuseum.nl/en/whats-on/exhibitions/fake', description: 'Examines manipulated and forged photography and how images have been altered since the nineteenth century.', start_datum: '2026-02-06', eind_datum: '2026-05-25' },
  { id: 'rijksmuseum-metamorphoses', museumSlug: 'rijksmuseum-amsterdam', titel: 'Metamorphoses', bron_url: 'https://www.rijksmuseum.nl/en/whats-on/exhibitions/metamorphoses', description: 'Shows how Ovid’s stories of transformation inspired artists through the centuries, with more than 80 masterpieces.', start_datum: '2026-02-06', eind_datum: '2026-05-25' },
  { id: 'rijksmuseum-operation-night-watch', museumSlug: 'rijksmuseum-amsterdam', titel: 'Operation Night Watch', bron_url: 'https://www.rijksmuseum.nl/en/whats-on/exhibitions/operation-night-watch', description: 'Live public research and restoration project focused on Rembrandt’s The Night Watch.' },

  { id: 'straat-collection', museumSlug: 'straat-museum-amsterdam', titel: 'STRAAT collection', bron_url: 'https://straatmuseum.com/en/about-straat', description: 'Current museum presentation with more than 180 large-scale street art and graffiti works by over 170 artists.' },

  { id: 'stedelijk-ivna-esajas', museumSlug: 'stedelijk-museum-amsterdam', titel: 'ABN AMRO Art Award: Ivna Esajas – Wayward Lines', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Current Art Award presentation featuring Ivna Esajas’ work and drawing-based visual world.', start_datum: '2026-03-07' },
  { id: 'stedelijk-consent', museumSlug: 'stedelijk-museum-amsterdam', titel: 'Consent not to be a single being', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Group exhibition on collectivity, interdependence and alternative ways of being together.', start_datum: '2026-03-07', eind_datum: '2026-06-07' },
  { id: 'stedelijk-danh-vo', museumSlug: 'stedelijk-museum-amsterdam', titel: 'Danh Vo: πνεῦμα (Ἔλισσα)', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Presentation by Danh Vo that connects spirituality, history and material culture in an installation format.', start_datum: '2026-02-14', eind_datum: '2026-08-02' },
  { id: 'stedelijk-erwin-olaf-freedom', museumSlug: 'stedelijk-museum-amsterdam', titel: 'Erwin Olaf: Freedom', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Large exhibition around Erwin Olaf’s work and ideas of freedom, identity and image-making.', start_datum: '2025-10-11', eind_datum: '2026-04-06' },
  { id: 'stedelijk-in-situ-farida-sedoc', museumSlug: 'stedelijk-museum-amsterdam', titel: 'In Situ #2: Farida Sedoc – Social Capital', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Site-specific project by Farida Sedoc about solidarity, social ties and urban belonging.', start_datum: '2025-11-09', eind_datum: '2026-07-02' },
  { id: 'stedelijk-collection-display', museumSlug: 'stedelijk-museum-amsterdam', titel: 'Collection Display', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Current selection from the Stedelijk collection spanning modern and contemporary art and design from 1870 to today.' },
  { id: 'stedelijk-experimental-jetset', museumSlug: 'stedelijk-museum-amsterdam', titel: 'Experimental Jetset: Circuits', bron_url: 'https://www.stedelijk.nl/en/whats-on', description: 'Ongoing display about graphic design collective Experimental Jetset and their visual language.' },

  { id: 'vangogh-ode-to-printmaking', museumSlug: 'van-gogh-museum-amsterdam', titel: 'An Ode to Printmaking', bron_url: 'https://www.vangoghmuseum.nl/en/visit/whats-on', description: 'Shows printmaking, graphic works and the role of prints in Van Gogh’s artistic world and inspiration.', eind_datum: '2026-05-17' },
  { id: 'vangogh-yellow-beyond', museumSlug: 'van-gogh-museum-amsterdam', titel: 'Yellow. Beyond Van Gogh’s Colour', bron_url: 'https://www.vangoghmuseum.nl/en/visit/whats-on', description: 'Explores Van Gogh’s expressive use of yellow and how colour shaped the emotional power of his work.', start_datum: '2026-02-13', eind_datum: '2026-05-17' },
  { id: 'vangogh-masterpieces', museumSlug: 'van-gogh-museum-amsterdam', titel: 'Van Gogh’s Masterpieces', bron_url: 'https://www.vangoghmuseum.nl/en/visit/whats-on', description: 'The museum’s core presentation with major works by Vincent van Gogh in permanent display.' },

  { id: 'wereldmuseum-made-in-china', museumSlug: 'wereldmuseum-amsterdam', titel: 'Made in China', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions/made-in-china', description: 'Explores the many meanings of “Made in China” and what Chinese production and design mean globally today.', eind_datum: '2026-08-30' },
  { id: 'wereldmuseum-unfinished-pasts', museumSlug: 'wereldmuseum-amsterdam', titel: 'Unfinished Pasts: Return, keep, or...?', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions/unfinished-pasts', description: 'Current exhibition about restitution debates and the future of objects acquired in colonial contexts.', start_datum: '2025-05-09' },
  { id: 'wereldmuseum-colonial-inheritance', museumSlug: 'wereldmuseum-amsterdam', titel: 'Our Colonial Inheritance', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions/our-colonial-inheritance', description: 'Permanent exhibition about Dutch colonial history and its impact on the present.' },
  { id: 'wereldmuseum-our-story', museumSlug: 'wereldmuseum-amsterdam', titel: 'Our Story', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions', description: 'Permanent presentation that introduces the museum, its objects and the people and stories behind them.' },
  { id: 'wereldmuseum-raad-van-de-raaf', museumSlug: 'wereldmuseum-amsterdam', titel: 'Raad van de Raaf', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions', description: 'Permanent family-oriented presentation that invites visitors to look, question and discover through objects and stories.' },
  { id: 'wereldmuseum-things-that-matter', museumSlug: 'wereldmuseum-amsterdam', titel: 'Things That Matter', bron_url: 'https://amsterdam.wereldmuseum.nl/en/whats-on/exhibitions', description: 'Permanent exhibition about meaningful objects and the stories, values and memories attached to them.' },

  { id: 'woonbootmuseum-hendrika-maria', museumSlug: 'woonbootmuseum-amsterdam', titel: 'Houseboat Museum “Hendrika Maria”', bron_url: 'https://houseboatmuseum.nl/', description: 'Permanent museum houseboat that shows what living on Amsterdam’s canals is like and how houseboat life developed.' },
];

const STATIC_EXHIBITIONS = STATIC_EXHIBITIONS_SOURCE.map((entry) => {
  const museum = createMuseumForSlug(entry.museumSlug);
  const fallbackTitle = museumNames[entry.museumSlug] || museum?.naam || entry.titel;

  return {
    id: entry.id,
    titel: entry.titel || fallbackTitle,
    start_datum: entry.start_datum || null,
    eind_datum: entry.eind_datum || null,
    beschrijving: entry.beschrijving || entry.description || null,
    omschrijving: entry.description || entry.beschrijving || null,
    description: entry.description || entry.beschrijving || null,
    gratis: null,
    free: null,
    kosteloos: null,
    freeEntry: null,
    isFree: null,
    is_free: null,
    ticket_affiliate_url: museumTicketUrls[entry.museumSlug] || null,
    ticket_url: entry.ticket_url || museum?.website_url || null,
    bron_url: entry.bron_url || entry.ticket_url || museum?.website_url || null,
    afbeelding_url: entry.afbeelding_url || museum?.afbeelding_url || null,
    image_url: entry.image_url || museum?.image_url || null,
    museum,
  };
});

export function getStaticExhibitions() {
  return STATIC_EXHIBITIONS.map((exhibition) => ({
    ...exhibition,
    museum: exhibition.museum ? { ...exhibition.museum } : null,
  }));
}

export function getStaticExhibitionsForMuseumSlug(slug) {
  if (!slug) return [];
  const normalized = String(slug).toLowerCase();
  return getStaticExhibitions().filter((exhibition) => exhibition?.museum?.slug === normalized);
}

export default STATIC_EXHIBITIONS;
