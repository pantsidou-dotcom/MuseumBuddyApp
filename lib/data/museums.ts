import allardPierson from '@/public/images/Eric de Redelijkheid Allard Pierson Museum.jpg';
import amsterdamMuseum from '@/public/images/Amsterdam Museum Rachel Ecclestone_CC_BY_SA 4_0_via Hart Amsterdam.jpg';
import anneFrank from '@/public/images/Anne Frank.jpg';
import eyeFilmmuseum from '@/public/images/Eye Sam Amil.jpg';
import foam from '@/public/images/FOAM Jan-WIllem Doornenbal.jpg';
import hartMuseum from "@/public/images/H'art_Monique Vermeulen.jpg";
import hetSchip from '@/public/images/Het Schip_Marcel Westhoff_MWFF4975 1.jpg';
import hetGrachtenmuseum from '@/public/images/Het grachtenmuseum Thomas Quine.jpg';
import scheepvaartmuseum from '@/public/images/Het scheepsvaartmudeum_Rob Oo.jpg';
import nemo from '@/public/images/NEMO_Randy Connolly.jpg';
import vanGogh from '@/public/images/Van Gogh via Rijksmuseum.jpg';
import straatMuseum from '@/public/images/STRAAT_Frank Kovalchek.jpg';
import nxtMuseumImage from '@/public/images/Nxt Museum_Rob Oo.jpg';
import type { Museum } from '../types';

export const museums: Museum[] = [
  {
    id: 'allard-pierson-amsterdam',
    slug: 'allard-pierson-amsterdam',
    name: 'Allard Pierson Museum',
    city: 'Amsterdam',
    summary: 'Archeologie, boeken en kunstvoorwerpen die verhalen over het leven langs de Middellandse Zee.',
    image: allardPierson,
    badges: ['Kindvriendelijk'],
    websiteUrl: 'https://allardpierson.nl',
  },
  {
    id: 'amsterdam-museum',
    slug: 'amsterdam-museum-amsterdam',
    name: 'Amsterdam Museum',
    city: 'Amsterdam',
    summary: 'Een compacte reis door de geschiedenis van Amsterdam, verteld met objecten, verhalen en design.',
    image: amsterdamMuseum,
    badges: ['Iconisch'],
    websiteUrl: 'https://www.amsterdammuseum.nl',
  },
  {
    id: 'anne-frank-huis',
    slug: 'anne-frank-huis-amsterdam',
    name: 'Anne Frank Huis',
    city: 'Amsterdam',
    summary: 'Bezoek het Achterhuis waar Anne Frank haar dagboek schreef en ontdek haar verhaal.',
    image: anneFrank,
    badges: ['Reserveren verplicht'],
    ticketUrl: 'https://www.annefrank.org/nl/museum/tickets/',
  },
  {
    id: 'eye-filmmuseum',
    slug: 'eye-filmmuseum-amsterdam',
    name: 'Eye Filmmuseum',
    city: 'Amsterdam',
    summary: 'Architectonisch icoon aan het IJ met filmgeschiedenis, installaties en panorama’s.',
    image: eyeFilmmuseum,
    badges: ['Aan het water'],
  },
  {
    id: 'foam',
    slug: 'foam-fotografiemuseum-amsterdam',
    name: 'FOAM Fotografiemuseum',
    city: 'Amsterdam',
    summary: 'Internationale fotografie, vernieuwende makers en inspirerende tentoonstellingen in een grachtenpand.',
    image: foam,
    badges: ['Fotografie'],
  },
  {
    id: 'hart-museum',
    slug: 'hart-museum-amsterdam',
    name: "H'ART Museum",
    city: 'Amsterdam',
    summary: 'Wereldse blockbusters en samenwerkingen met topmusea in een monumentaal pand.',
    image: hartMuseum,
    badges: ['Samenwerkingen'],
  },
  {
    id: 'het-schip',
    slug: 'het-schip-amsterdam',
    name: 'Museum Het Schip',
    city: 'Amsterdam',
    summary: 'Ontdek de Amsterdamse School via rondleidingen door het iconische arbeiderspaleis.',
    image: hetSchip,
    badges: ['Architectuur'],
  },
  {
    id: 'het-grachtenmuseum',
    slug: 'het-grachtenmuseum-amsterdam',
    name: 'Het Grachtenmuseum',
    city: 'Amsterdam',
    summary: 'Interactieve tentoonstelling over 400 jaar grachten en stadsontwikkeling.',
    image: hetGrachtenmuseum,
    badges: ['Interactief'],
  },
  {
    id: 'het-scheepvaartmuseum',
    slug: 'scheepvaartmuseum-amsterdam',
    name: 'Het Scheepvaartmuseum',
    city: 'Amsterdam',
    summary: 'Wereldberoemde scheepsmodellen, kaarten en de replica van VOC-schip Amsterdam.',
    image: scheepvaartmuseum,
    badges: ['Familievriendelijk'],
  },
  {
    id: 'nemo-science',
    slug: 'nemo-science-museum-amsterdam',
    name: 'NEMO Science Museum',
    city: 'Amsterdam',
    summary: 'Hands-on wetenschap voor alle leeftijden met experimenten, workshops en dakterras.',
    image: nemo,
    badges: ['Kindvriendelijk'],
  },
  {
    id: 'van-gogh',
    slug: 'van-gogh-museum-amsterdam',
    name: 'Van Gogh Museum',
    city: 'Amsterdam',
    summary: 'De grootste collectie schilderijen van Vincent van Gogh en zijn tijdgenoten.',
    image: vanGogh,
    badges: ['Topper'],
    ticketUrl: 'https://tickets.vangoghmuseum.com/',
  },
  {
    id: 'nxt-museum',
    slug: 'nxt-museum-amsterdam',
    name: 'Nxt Museum',
    city: 'Amsterdam',
    summary: 'Groot formaat digitale kunst en experimentele installaties over de toekomst.',
    image: nxtMuseumImage,
    badges: ['Digital Art'],
  },
  {
    id: 'straat-museum',
    slug: 'straat-museum-amsterdam',
    name: 'STRAAT Museum',
    city: 'Amsterdam',
    summary: 'Spectaculaire street art in een voormalige scheepsloods op de NDSM-werf.',
    image: straatMuseum,
    badges: ['Street Art'],
  },
];

export const museumsById = museums.reduce<Record<string, Museum>>((acc, museum) => {
  acc[museum.id] = museum;
  return acc;
}, {});
