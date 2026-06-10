import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Match } from '../../../core/models/match.model';
import { Bracket } from '../bracket/bracket';

interface TeamStanding {
  name: string;
  flagUrl: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
  group: string;
}

interface SimMatch {
  slot: string;
  homeTeam: string;
  awayTeam: string;
}

const STAGE_ORDER = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third Place', 'Final'];

const R32_RULES: Array<{ slot: string; home: string; away: string }> = [
  { slot: 'P73', home: '2A', away: '2B' },
  { slot: 'P74', home: '1E', away: 'T74' },
  { slot: 'P75', home: '1F', away: '2C' },
  { slot: 'P76', home: '1C', away: '2F' },
  { slot: 'P77', home: '1I', away: 'T77' },
  { slot: 'P78', home: '2E', away: '2I' },
  { slot: 'P79', home: '1A', away: 'T79' },
  { slot: 'P80', home: '1L', away: 'T80' },
  { slot: 'P81', home: '1D', away: 'T81' },
  { slot: 'P82', home: '1G', away: 'T82' },
  { slot: 'P83', home: '2K', away: '2L' },
  { slot: 'P84', home: '1H', away: '2J' },
  { slot: 'P85', home: '1B', away: 'T85' },
  { slot: 'P86', home: '1J', away: '2H' },
  { slot: 'P87', home: '1K', away: 'T87' },
  { slot: 'P88', home: '2D', away: '2G' },
];

const GROUP_NAMES = ['A','B','C','D','E','F','G','H','I','J','K','L'];

// Official FIFA 2026 third-place lookup table (495 combinations)
// Key: sorted 8 qualifying group letters; Value: group per slot [P74,P77,P79,P80,P81,P82,P85,P87]
const THIRD_PLACE_LOOKUP: Record<string, string[]> = {
  'EFGHIJKL':['F','G','E','K','I','H','J','L'],'DFGHIJKL':['D','F','H','K','I','J','G','L'],
  'DEGHIJKL':['D','G','E','K','I','H','J','L'],'DEFHIJKL':['D','F','E','K','I','H','J','L'],
  'DEFGIJKL':['D','F','E','K','I','J','G','L'],'DEFGHJKL':['D','F','E','K','J','H','G','L'],
  'DEFGHIKL':['D','F','E','K','I','H','G','L'],'DEFGHIJL':['D','F','E','I','J','H','G','L'],
  'DEFGHIJK':['D','F','E','K','J','H','G','I'],'CFGHIJKL':['C','F','H','K','I','J','G','L'],
  'CEGHIJKL':['C','G','E','K','I','H','J','L'],'CEFHIJKL':['C','F','E','K','I','H','J','L'],
  'CEFGIJKL':['C','F','E','K','I','J','G','L'],'CEFGHJKL':['C','F','E','K','J','H','G','L'],
  'CEFGHIKL':['C','F','E','K','I','H','G','L'],'CEFGHIJL':['C','F','E','I','J','H','G','L'],
  'CEFGHIJK':['C','F','E','K','J','H','G','I'],'CDGHIJKL':['C','D','H','K','I','J','G','L'],
  'CDFHIJKL':['D','F','C','K','I','H','J','L'],'CDFGIJKL':['D','F','C','K','I','J','G','L'],
  'CDFGHJKL':['D','F','C','K','J','H','G','L'],'CDFGHIKL':['D','F','C','K','I','H','G','L'],
  'CDFGHIJL':['D','F','C','I','J','H','G','L'],'CDFGHIJK':['D','F','C','K','J','H','G','I'],
  'CDEHIJKL':['C','D','E','K','I','H','J','L'],'CDEGIJKL':['C','D','E','K','I','J','G','L'],
  'CDEGHJKL':['C','D','E','K','J','H','G','L'],'CDEGHIKL':['C','D','E','K','I','H','G','L'],
  'CDEGHIJL':['C','D','E','I','J','H','G','L'],'CDEGHIJK':['C','D','E','K','J','H','G','I'],
  'CDEFIJKL':['D','F','C','K','E','I','J','L'],'CDEFHJKL':['D','F','C','K','E','H','J','L'],
  'CDEFHIKL':['D','F','C','K','I','H','E','L'],'CDEFHIJL':['D','F','C','I','E','H','J','L'],
  'CDEFHIJK':['D','F','C','K','E','H','J','I'],'CDEFGJKL':['D','F','C','K','E','J','G','L'],
  'CDEFGIKL':['D','F','C','K','E','I','G','L'],'CDEFGIJL':['D','F','C','I','E','J','G','L'],
  'CDEFGIJK':['D','F','C','K','E','J','G','I'],'CDEFGHKL':['D','F','C','K','E','H','G','L'],
  'CDEFGHJL':['D','F','C','E','J','H','G','L'],'CDEFGHJK':['D','F','C','K','J','H','G','E'],
  'CDEFGHIL':['D','F','C','I','E','H','G','L'],'CDEFGHIK':['D','F','C','K','E','H','G','I'],
  'CDEFGHIJ':['D','F','C','I','J','H','G','E'],'BFGHIJKL':['F','G','H','K','B','I','J','L'],
  'BEGHIJKL':['B','G','E','K','I','H','J','L'],'BEFHIJKL':['F','H','E','K','B','I','J','L'],
  'BEFGIJKL':['F','G','E','K','B','I','J','L'],'BEFGHJKL':['F','G','E','K','B','H','J','L'],
  'BEFGHIKL':['F','H','E','K','B','I','G','L'],'BEFGHIJL':['F','G','E','I','B','H','J','L'],
  'BEFGHIJK':['F','G','E','K','B','H','J','I'],'BDGHIJKL':['D','G','H','K','B','I','J','L'],
  'BDFHIJKL':['D','F','H','K','B','I','J','L'],'BDFGIJKL':['D','F','I','K','B','J','G','L'],
  'BDFGHJKL':['D','F','H','K','B','J','G','L'],'BDFGHIKL':['D','F','H','K','B','I','G','L'],
  'BDFGHIJL':['D','F','H','I','B','J','G','L'],'BDFGHIJK':['D','F','H','K','B','J','G','I'],
  'BDEHIJKL':['D','H','E','K','B','I','J','L'],'BDEGIJKL':['D','G','E','K','B','I','J','L'],
  'BDEGHJKL':['D','G','E','K','B','H','J','L'],'BDEGHIKL':['D','H','E','K','B','I','G','L'],
  'BDEGHIJL':['D','G','E','I','B','H','J','L'],'BDEGHIJK':['D','G','E','K','B','H','J','I'],
  'BDEFIJKL':['D','F','E','K','B','I','J','L'],'BDEFHJKL':['D','F','E','K','B','H','J','L'],
  'BDEFHIKL':['D','F','E','K','B','H','I','L'],'BDEFHIJL':['D','F','E','I','B','H','J','L'],
  'BDEFHIJK':['D','F','E','K','B','H','J','I'],'BDEFGJKL':['D','F','E','K','B','J','G','L'],
  'BDEFGIKL':['D','F','E','K','B','I','G','L'],'BDEFGIJL':['D','F','E','I','B','J','G','L'],
  'BDEFGIJK':['D','F','E','K','B','J','G','I'],'BDEFGHKL':['D','F','E','K','B','H','G','L'],
  'BDEFGHJL':['D','F','H','E','B','J','G','L'],'BDEFGHJK':['D','F','H','K','B','J','G','E'],
  'BDEFGHIL':['D','F','E','I','B','H','G','L'],'BDEFGHIK':['D','F','E','K','B','H','G','I'],
  'BDEFGHIJ':['D','F','H','I','B','J','G','E'],'BCGHIJKL':['C','G','H','K','B','I','J','L'],
  'BCFHIJKL':['C','F','H','K','B','I','J','L'],'BCFGIJKL':['C','F','I','K','B','J','G','L'],
  'BCFGHJKL':['C','F','H','K','B','J','G','L'],'BCFGHIKL':['C','F','H','K','B','I','G','L'],
  'BCFGHIJL':['C','F','H','I','B','J','G','L'],'BCFGHIJK':['C','F','H','K','B','J','G','I'],
  'BCEHIJKL':['C','H','E','K','B','I','J','L'],'BCEGIJKL':['C','G','E','K','B','I','J','L'],
  'BCEGHJKL':['C','G','E','K','B','H','J','L'],'BCEGHIKL':['C','H','E','K','B','I','G','L'],
  'BCEGHIJL':['C','G','E','I','B','H','J','L'],'BCEGHIJK':['C','G','E','K','B','H','J','I'],
  'BCEFIJKL':['C','F','E','K','B','I','J','L'],'BCEFHJKL':['C','F','E','K','B','H','J','L'],
  'BCEFHIKL':['C','F','E','K','B','H','I','L'],'BCEFHIJL':['C','F','E','I','B','H','J','L'],
  'BCEFHIJK':['C','F','E','K','B','H','J','I'],'BCEFGJKL':['C','F','E','K','B','J','G','L'],
  'BCEFGIKL':['C','F','E','K','B','I','G','L'],'BCEFGIJL':['C','F','E','I','B','J','G','L'],
  'BCEFGIJK':['C','F','E','K','B','J','G','I'],'BCEFGHKL':['C','F','E','K','B','H','G','L'],
  'BCEFGHJL':['C','F','H','E','B','J','G','L'],'BCEFGHJK':['C','F','H','K','B','J','G','E'],
  'BCEFGHIL':['C','F','E','I','B','H','G','L'],'BCEFGHIK':['C','F','E','K','B','H','G','I'],
  'BCEFGHIJ':['C','F','H','I','B','J','G','E'],'BCDHIJKL':['C','D','H','K','B','I','J','L'],
  'BCDGIJKL':['C','D','I','K','B','J','G','L'],'BCDGHJKL':['C','D','H','K','B','J','G','L'],
  'BCDGHIKL':['C','D','H','K','B','I','G','L'],'BCDGHIJL':['C','D','H','I','B','J','G','L'],
  'BCDGHIJK':['C','D','H','K','B','J','G','I'],'BCDFIJKL':['D','F','C','K','B','I','J','L'],
  'BCDFHJKL':['D','F','C','K','B','H','J','L'],'BCDFHIKL':['D','F','C','K','B','H','I','L'],
  'BCDFHIJL':['D','F','C','I','B','H','J','L'],'BCDFHIJK':['D','F','C','K','B','H','J','I'],
  'BCDFGJKL':['D','F','C','K','B','J','G','L'],'BCDFGIKL':['D','F','C','K','B','I','G','L'],
  'BCDFGIJL':['D','F','C','I','B','J','G','L'],'BCDFGIJK':['D','F','C','K','B','J','G','I'],
  'BCDFGHKL':['D','F','C','K','B','H','G','L'],'BCDFGHJL':['D','F','C','J','B','H','G','L'],
  'BCDFGHJK':['C','F','H','K','B','J','G','D'],'BCDFGHIL':['D','F','C','I','B','H','G','L'],
  'BCDFGHIK':['D','F','C','K','B','H','G','I'],'BCDFGHIJ':['C','F','H','I','B','J','G','D'],
  'BCDEIJKL':['C','D','E','K','B','I','J','L'],'BCDEHJKL':['C','D','E','K','B','H','J','L'],
  'BCDEHIKL':['C','D','E','K','B','H','I','L'],'BCDEHIJL':['C','D','E','I','B','H','J','L'],
  'BCDEHIJK':['C','D','E','K','B','H','J','I'],'BCDEGJKL':['C','D','E','K','B','J','G','L'],
  'BCDEGIKL':['C','D','E','K','B','I','G','L'],'BCDEGIJL':['C','D','E','I','B','J','G','L'],
  'BCDEGIJK':['C','D','E','K','B','J','G','I'],'BCDEGHKL':['C','D','E','K','B','H','G','L'],
  'BCDEGHJL':['C','D','H','E','B','J','G','L'],'BCDEGHJK':['C','D','H','K','B','J','G','E'],
  'BCDEGHIL':['C','D','E','I','B','H','G','L'],'BCDEGHIK':['C','D','E','K','B','H','G','I'],
  'BCDEGHIJ':['C','D','H','I','B','J','G','E'],'BCDEFJKL':['D','F','C','K','B','E','J','L'],
  'BCDEFIKL':['D','F','C','K','B','I','E','L'],'BCDEFIJL':['D','F','C','I','B','E','J','L'],
  'BCDEFIJK':['D','F','C','K','B','E','J','I'],'BCDEFHKL':['D','F','C','K','B','H','E','L'],
  'BCDEFHJL':['D','F','C','E','B','H','J','L'],'BCDEFHJK':['D','F','C','K','B','H','J','E'],
  'BCDEFHIL':['D','F','C','I','B','H','E','L'],'BCDEFHIK':['D','F','C','K','B','H','E','I'],
  'BCDEFHIJ':['D','F','C','I','B','H','J','E'],'BCDEFGKL':['D','F','C','K','B','E','G','L'],
  'BCDEFGJL':['D','F','C','E','B','J','G','L'],'BCDEFGJK':['D','F','C','K','B','J','G','E'],
  'BCDEFGIL':['D','F','C','I','B','E','G','L'],'BCDEFGIK':['D','F','C','K','B','E','G','I'],
  'BCDEFGIJ':['D','F','C','I','B','J','G','E'],'BCDEFGHL':['D','F','C','E','B','H','G','L'],
  'BCDEFGHK':['D','F','C','K','B','H','G','E'],'BCDEFGHJ':['C','F','H','E','B','J','G','D'],
  'BCDEFGHI':['D','F','C','I','B','H','G','E'],'AFGHIJKL':['F','G','H','K','I','A','J','L'],
  'AEGHIJKL':['A','G','E','K','I','H','J','L'],'AEFHIJKL':['F','H','E','K','I','A','J','L'],
  'AEFGIJKL':['F','G','E','K','I','A','J','L'],'AEFGHJKL':['F','H','E','K','J','A','G','L'],
  'AEFGHIKL':['F','H','E','K','I','A','G','L'],'AEFGHIJL':['F','H','E','I','J','A','G','L'],
  'AEFGHIJK':['F','H','E','K','J','A','G','I'],'ADGHIJKL':['D','G','H','K','I','A','J','L'],
  'ADFHIJKL':['D','F','H','K','I','A','J','L'],'ADFGIJKL':['D','F','I','K','J','A','G','L'],
  'ADFGHJKL':['D','F','H','K','J','A','G','L'],'ADFGHIKL':['D','F','H','K','I','A','G','L'],
  'ADFGHIJL':['D','F','H','I','J','A','G','L'],'ADFGHIJK':['D','F','H','K','J','A','G','I'],
  'ADEHIJKL':['D','H','E','K','I','A','J','L'],'ADEGIJKL':['D','G','E','K','I','A','J','L'],
  'ADEGHJKL':['D','H','E','K','J','A','G','L'],'ADEGHIKL':['D','H','E','K','I','A','G','L'],
  'ADEGHIJL':['D','H','E','I','J','A','G','L'],'ADEGHIJK':['D','H','E','K','J','A','G','I'],
  'ADEFIJKL':['D','F','E','K','I','A','J','L'],'ADEFHJKL':['D','F','H','K','E','A','J','L'],
  'ADEFHIKL':['D','F','H','K','I','A','E','L'],'ADEFHIJL':['D','F','H','I','E','A','J','L'],
  'ADEFHIJK':['D','F','H','K','E','A','J','I'],'ADEFGJKL':['D','F','E','K','J','A','G','L'],
  'ADEFGIKL':['D','F','E','K','I','A','G','L'],'ADEFGIJL':['D','F','E','I','J','A','G','L'],
  'ADEFGIJK':['D','F','E','K','J','A','G','I'],'ADEFGHKL':['D','F','H','K','E','A','G','L'],
  'ADEFGHJL':['D','F','H','E','J','A','G','L'],'ADEFGHJK':['D','F','H','K','J','A','G','E'],
  'ADEFGHIL':['D','F','H','I','E','A','G','L'],'ADEFGHIK':['D','F','H','K','E','A','G','I'],
  'ADEFGHIJ':['D','F','H','I','J','A','G','E'],'ACGHIJKL':['C','G','H','K','I','A','J','L'],
  'ACFHIJKL':['C','F','H','K','I','A','J','L'],'ACFGIJKL':['C','F','I','K','J','A','G','L'],
  'ACFGHJKL':['C','F','H','K','J','A','G','L'],'ACFGHIKL':['C','F','H','K','I','A','G','L'],
  'ACFGHIJL':['C','F','H','I','J','A','G','L'],'ACFGHIJK':['C','F','H','K','J','A','G','I'],
  'ACEHIJKL':['C','H','E','K','I','A','J','L'],'ACEGIJKL':['C','G','E','K','I','A','J','L'],
  'ACEGHJKL':['C','H','E','K','J','A','G','L'],'ACEGHIKL':['C','H','E','K','I','A','G','L'],
  'ACEGHIJL':['C','H','E','I','J','A','G','L'],'ACEGHIJK':['C','H','E','K','J','A','G','I'],
  'ACEFIJKL':['C','F','E','K','I','A','J','L'],'ACEFHJKL':['C','F','H','K','E','A','J','L'],
  'ACEFHIKL':['C','F','H','K','I','A','E','L'],'ACEFHIJL':['C','F','H','I','E','A','J','L'],
  'ACEFHIJK':['C','F','H','K','E','A','J','I'],'ACEFGJKL':['C','F','E','K','J','A','G','L'],
  'ACEFGIKL':['C','F','E','K','I','A','G','L'],'ACEFGIJL':['C','F','E','I','J','A','G','L'],
  'ACEFGIJK':['C','F','E','K','J','A','G','I'],'ACEFGHKL':['C','F','H','K','E','A','G','L'],
  'ACEFGHJL':['C','F','H','E','J','A','G','L'],'ACEFGHJK':['C','F','H','K','J','A','G','E'],
  'ACEFGHIL':['C','F','H','I','E','A','G','L'],'ACEFGHIK':['C','F','H','K','E','A','G','I'],
  'ACEFGHIJ':['C','F','H','I','J','A','G','E'],'ACDHIJKL':['C','D','H','K','I','A','J','L'],
  'ACDGIJKL':['C','D','I','K','J','A','G','L'],'ACDGHJKL':['C','D','H','K','J','A','G','L'],
  'ACDGHIKL':['C','D','H','K','I','A','G','L'],'ACDGHIJL':['C','D','H','I','J','A','G','L'],
  'ACDGHIJK':['C','D','H','K','J','A','G','I'],'ACDFIJKL':['D','F','C','K','I','A','J','L'],
  'ACDFHJKL':['C','D','H','K','F','A','J','L'],'ACDFHIKL':['C','D','H','K','I','A','F','L'],
  'ACDFHIJL':['C','D','H','I','F','A','J','L'],'ACDFHIJK':['C','D','H','K','F','A','J','I'],
  'ACDFGJKL':['D','F','C','K','J','A','G','L'],'ACDFGIKL':['D','F','C','K','I','A','G','L'],
  'ACDFGIJL':['D','F','C','I','J','A','G','L'],'ACDFGIJK':['D','F','C','K','J','A','G','I'],
  'ACDFGHKL':['C','D','H','K','F','A','G','L'],'ACDFGHJL':['D','F','C','H','J','A','G','L'],
  'ACDFGHJK':['C','F','H','K','J','A','G','D'],'ACDFGHIL':['C','D','H','I','F','A','G','L'],
  'ACDFGHIK':['C','D','H','K','F','A','G','I'],'ACDFGHIJ':['C','F','H','I','J','A','G','D'],
  'ACDEIJKL':['C','D','E','K','I','A','J','L'],'ACDEHJKL':['C','D','H','K','E','A','J','L'],
  'ACDEHIKL':['C','D','H','K','I','A','E','L'],'ACDEHIJL':['C','D','H','I','E','A','J','L'],
  'ACDEHIJK':['C','D','H','K','E','A','J','I'],'ACDEGJKL':['C','D','E','K','J','A','G','L'],
  'ACDEGIKL':['C','D','E','K','I','A','G','L'],'ACDEGIJL':['C','D','E','I','J','A','G','L'],
  'ACDEGIJK':['C','D','E','K','J','A','G','I'],'ACDEGHKL':['C','D','H','K','E','A','G','L'],
  'ACDEGHJL':['C','D','H','E','J','A','G','L'],'ACDEGHJK':['C','D','H','K','J','A','G','E'],
  'ACDEGHIL':['C','D','H','I','E','A','G','L'],'ACDEGHIK':['C','D','H','K','E','A','G','I'],
  'ACDEGHIJ':['C','D','H','I','J','A','G','E'],'ACDEFJKL':['D','F','C','K','E','A','J','L'],
  'ACDEFIKL':['D','F','C','K','I','A','E','L'],'ACDEFIJL':['D','F','C','I','E','A','J','L'],
  'ACDEFIJK':['D','F','C','K','E','A','J','I'],'ACDEFHKL':['C','D','H','K','F','A','E','L'],
  'ACDEFHJL':['C','D','H','E','F','A','J','L'],'ACDEFHJK':['C','F','H','K','E','A','J','D'],
  'ACDEFHIL':['C','D','H','I','F','A','E','L'],'ACDEFHIK':['C','D','H','K','F','A','E','I'],
  'ACDEFHIJ':['C','F','H','I','E','A','J','D'],'ACDEFGKL':['D','F','C','K','E','A','G','L'],
  'ACDEFGJL':['D','F','C','E','J','A','G','L'],'ACDEFGJK':['D','F','C','K','J','A','G','E'],
  'ACDEFGIL':['D','F','C','I','E','A','G','L'],'ACDEFGIK':['D','F','C','K','E','A','G','I'],
  'ACDEFGIJ':['D','F','C','I','J','A','G','E'],'ACDEFGHL':['C','D','H','E','F','A','G','L'],
  'ACDEFGHK':['C','F','H','K','E','A','G','D'],'ACDEFGHJ':['C','F','H','E','J','A','G','D'],
  'ACDEFGHI':['C','F','H','I','E','A','G','D'],'ABGHIJKL':['A','G','H','K','B','I','J','L'],
  'ABFHIJKL':['A','F','H','K','B','I','J','L'],'ABFGIJKL':['F','G','I','K','B','A','J','L'],
  'ABFGHJKL':['F','G','H','K','B','A','J','L'],'ABFGHIKL':['A','F','H','K','B','I','G','L'],
  'ABFGHIJL':['F','G','H','I','B','A','J','L'],'ABFGHIJK':['F','G','H','K','B','A','J','I'],
  'ABEHIJKL':['A','H','E','K','B','I','J','L'],'ABEGIJKL':['A','G','E','K','B','I','J','L'],
  'ABEGHJKL':['A','G','E','K','B','H','J','L'],'ABEGHIKL':['A','H','E','K','B','I','G','L'],
  'ABEGHIJL':['A','G','E','I','B','H','J','L'],'ABEGHIJK':['A','G','E','K','B','H','J','I'],
  'ABEFIJKL':['A','F','E','K','B','I','J','L'],'ABEFHJKL':['F','H','E','K','B','A','J','L'],
  'ABEFHIKL':['F','H','E','K','B','A','I','L'],'ABEFHIJL':['F','H','E','I','B','A','J','L'],
  'ABEFHIJK':['F','H','E','K','B','A','J','I'],'ABEFGJKL':['F','G','E','K','B','A','J','L'],
  'ABEFGIKL':['A','F','E','K','B','I','G','L'],'ABEFGIJL':['F','G','E','I','B','A','J','L'],
  'ABEFGIJK':['F','G','E','K','B','A','J','I'],'ABEFGHKL':['F','H','E','K','B','A','G','L'],
  'ABEFGHJL':['F','G','H','E','B','A','J','L'],'ABEFGHJK':['F','G','H','K','B','A','J','E'],
  'ABEFGHIL':['F','H','E','I','B','A','G','L'],'ABEFGHIK':['F','H','E','K','B','A','G','I'],
  'ABEFGHIJ':['F','G','H','I','B','A','J','E'],'ABDHIJKL':['D','H','I','K','B','A','J','L'],
  'ABDGIJKL':['D','G','I','K','B','A','J','L'],'ABDGHJKL':['D','G','H','K','B','A','J','L'],
  'ABDGHIKL':['D','H','I','K','B','A','G','L'],'ABDGHIJL':['D','G','H','I','B','A','J','L'],
  'ABDGHIJK':['D','G','H','K','B','A','J','I'],'ABDFIJKL':['D','F','I','K','B','A','J','L'],
  'ABDFHJKL':['D','F','H','K','B','A','J','L'],'ABDFHIKL':['D','F','H','K','B','A','I','L'],
  'ABDFHIJL':['D','F','H','I','B','A','J','L'],'ABDFHIJK':['D','F','H','K','B','A','J','I'],
  'ABDFGJKL':['D','G','F','K','B','A','J','L'],'ABDFGIKL':['D','F','I','K','B','A','G','L'],
  'ABDFGIJL':['D','G','F','I','B','A','J','L'],'ABDFGIJK':['D','G','F','K','B','A','J','I'],
  'ABDFGHKL':['D','F','H','K','B','A','G','L'],'ABDFGHJL':['D','F','H','J','B','A','G','L'],
  'ABDFGHJK':['D','F','H','K','B','A','G','J'],'ABDFGHIL':['D','F','H','I','B','A','G','L'],
  'ABDFGHIK':['D','F','H','K','B','A','G','I'],'ABDFGHIJ':['D','F','H','J','B','A','G','I'],
  'ABDEIJKL':['A','D','E','K','B','I','J','L'],'ABDEHJKL':['D','H','E','K','B','A','J','L'],
  'ABDEHIKL':['D','H','E','K','B','A','I','L'],'ABDEHIJL':['D','H','E','I','B','A','J','L'],
  'ABDEHIJK':['D','H','E','K','B','A','J','I'],'ABDEGJKL':['D','G','E','K','B','A','J','L'],
  'ABDEGIKL':['A','D','E','K','B','I','G','L'],'ABDEGIJL':['D','G','E','I','B','A','J','L'],
  'ABDEGIJK':['D','G','E','K','B','A','J','I'],'ABDEGHKL':['D','H','E','K','B','A','G','L'],
  'ABDEGHJL':['D','G','H','E','B','A','J','L'],'ABDEGHJK':['D','G','H','K','B','A','J','E'],
  'ABDEGHIL':['D','H','E','I','B','A','G','L'],'ABDEGHIK':['D','H','E','K','B','A','G','I'],
  'ABDEGHIJ':['D','G','H','I','B','A','J','E'],'ABDEFJKL':['D','F','E','K','B','A','J','L'],
  'ABDEFIKL':['D','F','E','K','B','A','I','L'],'ABDEFIJL':['D','F','E','I','B','A','J','L'],
  'ABDEFIJK':['D','F','E','K','B','A','J','I'],'ABDEFHKL':['D','F','H','K','B','A','E','L'],
  'ABDEFHJL':['D','F','H','E','B','A','J','L'],'ABDEFHJK':['D','F','H','K','B','A','J','E'],
  'ABDEFHIL':['D','F','H','I','B','A','E','L'],'ABDEFHIK':['D','F','H','K','B','A','E','I'],
  'ABDEFHIJ':['D','F','H','I','B','A','J','E'],'ABDEFGKL':['D','F','E','K','B','A','G','L'],
  'ABDEFGJL':['D','F','E','J','B','A','G','L'],'ABDEFGJK':['D','F','E','K','B','A','G','J'],
  'ABDEFGIL':['D','F','E','I','B','A','G','L'],'ABDEFGIK':['D','F','E','K','B','A','G','I'],
  'ABDEFGIJ':['D','F','E','J','B','A','G','I'],'ABDEFGHL':['D','F','H','E','B','A','G','L'],
  'ABDEFGHK':['D','F','H','K','B','A','G','E'],'ABDEFGHJ':['D','F','H','J','B','A','G','E'],
  'ABDEFGHI':['D','F','H','I','B','A','G','E'],'ABCHIJKL':['C','H','I','K','B','A','J','L'],
  'ABCGIJKL':['C','G','I','K','B','A','J','L'],'ABCGHJKL':['C','G','H','K','B','A','J','L'],
  'ABCGHIKL':['C','H','I','K','B','A','G','L'],'ABCGHIJL':['C','G','H','I','B','A','J','L'],
  'ABCGHIJK':['C','G','H','K','B','A','J','I'],'ABCFIJKL':['C','F','I','K','B','A','J','L'],
  'ABCFHJKL':['C','F','H','K','B','A','J','L'],'ABCFHIKL':['C','F','H','K','B','A','I','L'],
  'ABCFHIJL':['C','F','H','I','B','A','J','L'],'ABCFHIJK':['C','F','H','K','B','A','J','I'],
  'ABCFGJKL':['F','G','C','K','B','A','J','L'],'ABCFGIKL':['C','F','I','K','B','A','G','L'],
  'ABCFGIJL':['F','G','C','I','B','A','J','L'],'ABCFGIJK':['F','G','C','K','B','A','J','I'],
  'ABCFGHKL':['C','F','H','K','B','A','G','L'],'ABCFGHJL':['C','F','H','J','B','A','G','L'],
  'ABCFGHJK':['C','F','H','K','B','A','G','J'],'ABCFGHIL':['C','F','H','I','B','A','G','L'],
  'ABCFGHIK':['C','F','H','K','B','A','G','I'],'ABCFGHIJ':['C','F','H','J','B','A','G','I'],
  'ABCEIJKL':['A','C','E','K','B','I','J','L'],'ABCEHJKL':['C','H','E','K','B','A','J','L'],
  'ABCEHIKL':['C','H','E','K','B','A','I','L'],'ABCEHIJL':['C','H','E','I','B','A','J','L'],
  'ABCEHIJK':['C','H','E','K','B','A','J','I'],'ABCEGJKL':['C','G','E','K','B','A','J','L'],
  'ABCEGIKL':['A','C','E','K','B','I','G','L'],'ABCEGIJL':['C','G','E','I','B','A','J','L'],
  'ABCEGIJK':['C','G','E','K','B','A','J','I'],'ABCEGHKL':['C','H','E','K','B','A','G','L'],
  'ABCEGHJL':['C','G','H','E','B','A','J','L'],'ABCEGHJK':['C','G','H','K','B','A','J','E'],
  'ABCEGHIL':['C','H','E','I','B','A','G','L'],'ABCEGHIK':['C','H','E','K','B','A','G','I'],
  'ABCEGHIJ':['C','G','H','I','B','A','J','E'],'ABCEFJKL':['C','F','E','K','B','A','J','L'],
  'ABCEFIKL':['C','F','E','K','B','A','I','L'],'ABCEFIJL':['C','F','E','I','B','A','J','L'],
  'ABCEFIJK':['C','F','E','K','B','A','J','I'],'ABCEFHKL':['C','F','H','K','B','A','E','L'],
  'ABCEFHJL':['C','F','H','E','B','A','J','L'],'ABCEFHJK':['C','F','H','K','B','A','J','E'],
  'ABCEFHIL':['C','F','H','I','B','A','E','L'],'ABCEFHIK':['C','F','H','K','B','A','E','I'],
  'ABCEFHIJ':['C','F','H','I','B','A','J','E'],'ABCEFGKL':['C','F','E','K','B','A','G','L'],
  'ABCEFGJL':['C','F','E','J','B','A','G','L'],'ABCEFGJK':['C','F','E','K','B','A','G','J'],
  'ABCEFGIL':['C','F','E','I','B','A','G','L'],'ABCEFGIK':['C','F','E','K','B','A','G','I'],
  'ABCEFGIJ':['C','F','E','J','B','A','G','I'],'ABCEFGHL':['C','F','H','E','B','A','G','L'],
  'ABCEFGHK':['C','F','H','K','B','A','G','E'],'ABCEFGHJ':['C','F','H','J','B','A','G','E'],
  'ABCEFGHI':['C','F','H','I','B','A','G','E'],'ABCDIJKL':['C','D','I','K','B','A','J','L'],
  'ABCDHJKL':['C','D','H','K','B','A','J','L'],'ABCDHIKL':['C','D','H','K','B','A','I','L'],
  'ABCDHIJL':['C','D','H','I','B','A','J','L'],'ABCDHIJK':['C','D','H','K','B','A','J','I'],
  'ABCDGJKL':['D','G','C','K','B','A','J','L'],'ABCDGIKL':['C','D','I','K','B','A','G','L'],
  'ABCDGIJL':['D','G','C','I','B','A','J','L'],'ABCDGIJK':['D','G','C','K','B','A','J','I'],
  'ABCDGHKL':['C','D','H','K','B','A','G','L'],'ABCDGHJL':['C','D','H','J','B','A','G','L'],
  'ABCDGHJK':['C','D','H','K','B','A','G','J'],'ABCDGHIL':['C','D','H','I','B','A','G','L'],
  'ABCDGHIK':['C','D','H','K','B','A','G','I'],'ABCDGHIJ':['C','D','H','J','B','A','G','I'],
  'ABCDFJKL':['D','F','C','K','B','A','J','L'],'ABCDFIKL':['D','F','C','K','B','A','I','L'],
  'ABCDFIJL':['D','F','C','I','B','A','J','L'],'ABCDFIJK':['D','F','C','K','B','A','J','I'],
  'ABCDFHKL':['C','D','H','K','B','A','F','L'],'ABCDFHJL':['D','F','C','H','B','A','J','L'],
  'ABCDFHJK':['C','F','H','K','B','A','J','D'],'ABCDFHIL':['C','D','H','I','B','A','F','L'],
  'ABCDFHIK':['C','D','H','K','B','A','F','I'],'ABCDFHIJ':['C','F','H','I','B','A','J','D'],
  'ABCDFGKL':['D','F','C','K','B','A','G','L'],'ABCDFGJL':['D','F','C','J','B','A','G','L'],
  'ABCDFGJK':['D','F','C','K','B','A','G','J'],'ABCDFGIL':['D','F','C','I','B','A','G','L'],
  'ABCDFGIK':['D','F','C','K','B','A','G','I'],'ABCDFGIJ':['D','F','C','J','B','A','G','I'],
  'ABCDFGHL':['D','F','C','H','B','A','G','L'],'ABCDFGHK':['C','F','H','K','B','A','G','D'],
  'ABCDFGHJ':['C','F','H','J','B','A','G','D'],'ABCDFGHI':['C','F','H','I','B','A','G','D'],
  'ABCDEJKL':['C','D','E','K','B','A','J','L'],'ABCDEIKL':['C','D','E','K','B','A','I','L'],
  'ABCDEIJL':['C','D','E','I','B','A','J','L'],'ABCDEIJK':['C','D','E','K','B','A','J','I'],
  'ABCDEHKL':['C','D','H','K','B','A','E','L'],'ABCDEHJL':['C','D','H','E','B','A','J','L'],
  'ABCDEHJK':['C','D','H','K','B','A','J','E'],'ABCDEHIL':['C','D','H','I','B','A','E','L'],
  'ABCDEHIK':['C','D','H','K','B','A','E','I'],'ABCDEHIJ':['C','D','H','I','B','A','J','E'],
  'ABCDEGKL':['C','D','E','K','B','A','G','L'],'ABCDEGJL':['C','D','E','J','B','A','G','L'],
  'ABCDEGJK':['C','D','E','K','B','A','G','J'],'ABCDEGIL':['C','D','E','I','B','A','G','L'],
  'ABCDEGIK':['C','D','E','K','B','A','G','I'],'ABCDEGIJ':['C','D','E','J','B','A','G','I'],
  'ABCDEGHL':['C','D','H','E','B','A','G','L'],'ABCDEGHK':['C','D','H','K','B','A','G','E'],
  'ABCDEGHJ':['C','D','H','J','B','A','G','E'],'ABCDEGHI':['C','D','H','I','B','A','G','E'],
  'ABCDEFKL':['D','F','C','K','B','A','E','L'],'ABCDEFJL':['D','F','C','E','B','A','J','L'],
  'ABCDEFJK':['D','F','C','K','B','A','J','E'],'ABCDEFIL':['D','F','C','I','B','A','E','L'],
  'ABCDEFIK':['D','F','C','K','B','A','E','I'],'ABCDEFIJ':['D','F','C','I','B','A','J','E'],
  'ABCDEFHL':['C','D','H','E','B','A','F','L'],'ABCDEFHK':['C','F','H','K','B','A','E','D'],
  'ABCDEFHJ':['C','F','H','E','B','A','J','D'],'ABCDEFHI':['C','F','H','I','B','A','E','D'],
  'ABCDEFGL':['D','F','C','E','B','A','G','L'],'ABCDEFGK':['D','F','C','K','B','A','G','E'],
  'ABCDEFGJ':['D','F','C','J','B','A','G','E'],'ABCDEFGI':['D','F','C','I','B','A','G','E'],
  'ABCDEFGH':['C','F','H','E','B','A','G','D'],
};

// R16 pairings from R32 slots
const R16_PAIRINGS: Array<{ slot: string; r32a: string; r32b: string }> = [
  { slot: 'P89', r32a: 'P74', r32b: 'P77' },
  { slot: 'P90', r32a: 'P73', r32b: 'P75' },
  { slot: 'P91', r32a: 'P76', r32b: 'P78' },
  { slot: 'P92', r32a: 'P79', r32b: 'P80' },
  { slot: 'P93', r32a: 'P83', r32b: 'P84' },
  { slot: 'P94', r32a: 'P81', r32b: 'P82' },
  { slot: 'P95', r32a: 'P86', r32b: 'P88' },
  { slot: 'P96', r32a: 'P85', r32b: 'P87' },
];

const BK_FEEDS_INTO: Record<string, string> = {
  'P74':'P89','P77':'P89','P73':'P90','P75':'P90',
  'P83':'P93','P84':'P93','P81':'P94','P82':'P94',
  'P76':'P91','P78':'P91','P79':'P92','P80':'P92',
  'P86':'P95','P88':'P95','P85':'P96','P87':'P96',
  'P89':'P97','P90':'P97','P93':'P98','P94':'P98',
  'P91':'P99','P92':'P99','P95':'P100','P96':'P100',
  'P97':'P101','P98':'P101','P99':'P102','P100':'P102',
  'P101':'P104','P102':'P104',
};

@Component({
  selector: 'app-world-cup-hub',
  standalone: true,
  imports: [Bracket],
  template: `
    <div class="hub">
      <div class="hub-header">
        <h1 class="hub-title">Mundial 2026</h1>
        <p class="hub-sub">USA · Canadá · México</p>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'grupos'" (click)="activeTab.set('grupos')">Grupos</button>
        <button class="tab" [class.active]="activeTab() === 'calendario'" (click)="activeTab.set('calendario')">Calendario</button>
        <button class="tab" [class.active]="activeTab() === 'bracket'" (click)="activeTab.set('bracket')">Eliminatorias</button>
        <button class="tab" [class.active]="activeTab() === 'simulador'" (click)="activeTab.set('simulador')">Simulador</button>
      </div>

      <div class="tab-content">

        <!-- =================== GRUPOS =================== -->
        @if (activeTab() === 'grupos') {
          @if (loading()) {
            <div class="loading">Cargando grupos...</div>
          } @else if (groupTables().length === 0) {
            <div class="empty">No hay datos de grupos cargados aún.</div>
          } @else {
            <div class="groups-grid">
              @for (group of groupTables(); track group.name) {
                <div class="group-table">
                  <div class="group-title">Grupo {{ group.name }}</div>
                  <table class="standings-table">
                    <thead>
                      <tr>
                        <th class="col-pos">#</th>
                        <th class="col-team">Equipo</th>
                        <th class="col-num" title="Puntos">Pts</th>
                        <th class="col-num" title="Jugados">J</th>
                        <th class="col-num" title="Ganados">G</th>
                        <th class="col-num" title="Empatados">E</th>
                        <th class="col-num" title="Perdidos">P</th>
                        <th class="col-num" title="Diferencia de goles">DG</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (team of group.teams; track team.name; let i = $index) {
                        <tr [class.qualified]="i < 2">
                          <td class="col-pos">{{ i + 1 }}</td>
                          <td class="col-team">
                            @if (team.flagUrl) {
                              <img [src]="team.flagUrl" [alt]="team.name" class="flag">
                            }
                            <span class="team-name">{{ team.name }}</span>
                          </td>
                          <td class="col-num pts">{{ team.pts }}</td>
                          <td class="col-num">{{ team.p }}</td>
                          <td class="col-num">{{ team.w }}</td>
                          <td class="col-num">{{ team.d }}</td>
                          <td class="col-num">{{ team.l }}</td>
                          <td class="col-num" [class.pos-gd]="team.gf - team.ga > 0" [class.neg-gd]="team.gf - team.ga < 0">
                            {{ team.gf - team.ga > 0 ? '+' : '' }}{{ team.gf - team.ga }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            @if (thirdPlaceStandings().length > 0) {
              <div class="third-section">
                <h2 class="third-title">Mejores Terceros</h2>
                <p class="third-sub">Los 8 mejores de {{ thirdPlaceStandings().length }} equipos terceros clasifican a la Ronda de 32</p>
                <table class="standings-table third-table">
                  <thead>
                    <tr>
                      <th class="col-pos">#</th>
                      <th class="col-team">Equipo</th>
                      <th class="col-grp">Grp</th>
                      <th class="col-num">Pts</th>
                      <th class="col-num">J</th>
                      <th class="col-num">G</th>
                      <th class="col-num">E</th>
                      <th class="col-num">P</th>
                      <th class="col-num">DG</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (team of thirdPlaceStandings(); track team.name; let i = $index) {
                      <tr [class.third-qualifies]="i < 8">
                        <td class="col-pos">{{ i + 1 }}</td>
                        <td class="col-team">
                          @if (team.flagUrl) { <img [src]="team.flagUrl" [alt]="team.name" class="flag"> }
                          <span class="team-name">{{ team.name }}</span>
                        </td>
                        <td class="col-grp">{{ team.group }}</td>
                        <td class="col-num pts">{{ team.pts }}</td>
                        <td class="col-num">{{ team.p }}</td>
                        <td class="col-num">{{ team.w }}</td>
                        <td class="col-num">{{ team.d }}</td>
                        <td class="col-num">{{ team.l }}</td>
                        <td class="col-num" [class.pos-gd]="team.gf - team.ga > 0" [class.neg-gd]="team.gf - team.ga < 0">
                          {{ team.gf - team.ga > 0 ? '+' : '' }}{{ team.gf - team.ga }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        }

        <!-- =================== CALENDARIO =================== -->
        @if (activeTab() === 'calendario') {
          @if (loading()) {
            <div class="loading">Cargando calendario...</div>
          } @else {
            <div class="stage-filter">
              @for (stage of availableStages(); track stage) {
                <button class="stage-btn"
                  [class.active]="selectedStage() === stage"
                  (click)="selectedStage.set(stage)">
                  {{ stage }}
                </button>
              }
            </div>

            @if (calendarByDate().length === 0) {
              <div class="empty">No hay partidos para la fase seleccionada.</div>
            } @else {
              @for (dateGroup of calendarByDate(); track dateGroup[0]) {
                <div class="cal-day">
                  <div class="cal-date-heading">{{ formatDateKey(dateGroup[0]) }}</div>
                  @for (match of dateGroup[1]; track match.id) {
                    <div class="cal-match" [class.finished]="match.status === 'Finished'" [class.live]="match.status === 'InProgress'">
                      <div class="cal-time">
                        @if (match.status === 'InProgress') {
                          <span class="live-dot"></span>
                          <span class="live-min">{{ match.minute ?? '?' }}'</span>
                        } @else {
                          {{ formatArgTime(match.kickoffUtc) }}
                        }
                      </div>
                      <div class="cal-teams">
                        <div class="cal-team home">
                          @if (match.homeFlagUrl) { <img [src]="match.homeFlagUrl" class="flag"> }
                          <span [class.winner]="match.status === 'Finished' && match.homeGoals > match.awayGoals">{{ match.homeTeam }}</span>
                        </div>
                        <div class="cal-score">
                          @if (match.status !== 'Scheduled') {
                            <span>{{ match.homeGoals }} - {{ match.awayGoals }}</span>
                          } @else {
                            <span class="vs">vs</span>
                          }
                        </div>
                        <div class="cal-team away">
                          <span [class.winner]="match.status === 'Finished' && match.awayGoals > match.homeGoals">{{ match.awayTeam }}</span>
                          @if (match.awayFlagUrl) { <img [src]="match.awayFlagUrl" class="flag"> }
                        </div>
                      </div>
                      @if (match.groupName) {
                        <div class="cal-group">Grupo {{ match.groupName }}</div>
                      }
                    </div>
                  }
                </div>
              }
            }
          }
        }

        <!-- =================== BRACKET =================== -->
        @if (activeTab() === 'bracket') {
          <app-bracket />
        }

        <!-- =================== SIMULADOR =================== -->
        @if (activeTab() === 'simulador') {
          <div class="sim-section">
            <div class="sim-header">
              <h2 class="sim-title">Simulador de Eliminatorias</h2>
              <p class="sim-sub">Elegí los clasificados de cada grupo y simulá todos los cruces hasta la final.</p>
            </div>

            <div class="sim-step">
              <div class="sim-step-label">1 · Posiciones de cada grupo</div>
              <div class="sim-groups-grid">
                @for (gname of groupNames; track gname) {
                  <div class="sim-group-card">
                    <div class="sim-group-name">Grupo {{ gname }}</div>
                    @for (pos of [0,1,2,3]; track pos) {
                      <div class="sim-team-slot">
                        <span class="sim-pos-label">{{ pos + 1 }}°</span>
                        <select class="sim-select"
                          [value]="simPositions()[gname]?.[pos] ?? ''"
                          (change)="setSimPosition(gname, pos, $any($event.target).value)">
                          <option value="">— elegir —</option>
                          @for (team of getGroupTeamsForPos(gname, pos); track team.name) {
                            <option [value]="team.name">{{ team.name }}</option>
                          }
                        </select>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="sim-step">
              <div class="sim-step-label">2 · Grupos de los mejores terceros</div>
              <p class="sim-sub" style="margin-bottom:12px">Seleccioná los 8 grupos cuyos terceros clasificaron al Playoff. El orden de cruces se calcula automáticamente.</p>
              <div class="sim-thirds-groups">
                @for (g of groupNames; track g) {
                  <button class="sim-third-group-btn"
                    [class.selected]="simThirdGroups().includes(g)"
                    [disabled]="!simThirdGroups().includes(g) && simThirdGroups().length >= 8"
                    (click)="toggleThirdGroup(g)">
                    Grupo {{ g }}
                    @if (getThirdTeamName(g)) {
                      <span class="sim-third-btn-team">{{ getThirdTeamName(g) }}</span>
                    }
                  </button>
                }
              </div>
              @if (simThirdGroups().length === 8) {
                <div class="sim-thirds-assignments">
                  @for (entry of thirdSlotAssignments(); track entry.slot) {
                    <div class="sim-third-assign-row">
                      <span class="sim-third-slot">{{ entry.slot }}</span>
                      <span class="sim-third-assign-team">
                        {{ entry.group ? 'Grupo ' + entry.group + (getThirdTeamName(entry.group) ? ' · ' + getThirdTeamName(entry.group) : '') : '—' }}
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <p class="sim-thirds-status">{{ simThirdGroups().length }}/8 grupos seleccionados</p>
              }
            </div>

            <div class="sim-step">
              <div class="sim-step-label">3 · Bracket eliminatorio</div>
              <p class="sim-sub" style="margin-bottom:16px">Clic en un equipo para seleccionar ganador y avanzar en el bracket.</p>
              <div class="bk-wrap">

                <!-- ══ LEFT HALF ══ -->
                <div class="bk-half bk-left">
                  <!-- Col 0: R32 team names -->
                  <div class="bk-col bk-teams-col">
                    @for (slot of ['P74','P77','P73','P75','P83','P84','P81','P82']; track slot) {
                      <div class="bk-r32e">
                        <div class="bk-r32m">
                          <div class="bk-team" [class.bk-w]="bkIsW(slot,bkGet(slot).homeTeam)" [class.bk-l]="bkIsL(slot,bkGet(slot).homeTeam)" (click)="bkClickTeam(slot,bkGet(slot).homeTeam)">{{bkGet(slot).homeTeam||'—'}}</div>
                          <div class="bk-team" [class.bk-w]="bkIsW(slot,bkGet(slot).awayTeam)" [class.bk-l]="bkIsL(slot,bkGet(slot).awayTeam)" (click)="bkClickTeam(slot,bkGet(slot).awayTeam)">{{bkGet(slot).awayTeam||'—'}}</div>
                        </div>
                      </div>
                    }
                  </div>
                  <!-- Col 1: R32 winners -->
                  <div class="bk-col">
                    @for (pair of [['P74','P77'],['P73','P75'],['P83','P84'],['P81','P82']]; track pair[0]) {
                      <div class="bk-pair">
                        @for (s of pair; track s) {
                          <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                        }
                      </div>
                    }
                  </div>
                  <!-- Col 2: R16 winners -->
                  <div class="bk-col">
                    @for (pair of [['P89','P90'],['P93','P94']]; track pair[0]) {
                      <div class="bk-pair">
                        @for (s of pair; track s) {
                          <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                        }
                      </div>
                    }
                  </div>
                  <!-- Col 3: QF winners -->
                  <div class="bk-col">
                    <div class="bk-pair">
                      @for (s of ['P97','P98']; track s) {
                        <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                      }
                    </div>
                  </div>
                  <!-- Col 4: SF winner -->
                  <div class="bk-col bk-sf-col">
                    <div class="bk-entry">
                      <div class="bk-box bk-sf-box">{{bkWin('P101')||'P101'}}</div>
                    </div>
                  </div>
                </div>

                <!-- ══ CENTER ══ -->
                <div class="bk-center">
                  <div class="bk-trophy-area">
                    <div class="bk-trophy-icon">🏆</div>
                    <div class="bk-champ-label">CAMPEÓN</div>
                    @if (bkWin('P104')) {
                      <div class="bk-champ-name">{{bkWin('P104')}}</div>
                    }
                  </div>
                  <div class="bk-final-row">
                    <div class="bk-final-sf" [class.bk-adv]="bkIsAdv('P101')" [class.bk-elim]="bkIsElim('P101')" (click)="bkAdvance('P101')">{{bkWin('P101')||'P101'}}</div>
                    <div class="bk-final-vs">FINAL<br>P104</div>
                    <div class="bk-final-sf" [class.bk-adv]="bkIsAdv('P102')" [class.bk-elim]="bkIsElim('P102')" (click)="bkAdvance('P102')">{{bkWin('P102')||'P102'}}</div>
                  </div>
                  <div class="bk-third-area">
                    <div class="bk-third-lbl">3° Lugar · P103</div>
                    <div class="bk-third-row">
                      <span>{{bkGet('P103').homeTeam||'—'}}</span>
                      <span class="bk-third-vs">vs</span>
                      <span>{{bkGet('P103').awayTeam||'—'}}</span>
                    </div>
                    @if (bkWin('P103')) { <div class="bk-third-winner">3° {{bkWin('P103')}}</div> }
                  </div>
                </div>

                <!-- ══ RIGHT HALF ══ -->
                <div class="bk-half bk-right">
                  <!-- Col 0: SF winner (right) -->
                  <div class="bk-col bk-sf-col">
                    <div class="bk-entry">
                      <div class="bk-box bk-sf-box">{{bkWin('P102')||'P102'}}</div>
                    </div>
                  </div>
                  <!-- Col 1: QF winners (right) -->
                  <div class="bk-col">
                    <div class="bk-pair">
                      @for (s of ['P99','P100']; track s) {
                        <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                      }
                    </div>
                  </div>
                  <!-- Col 2: R16 winners (right) -->
                  <div class="bk-col">
                    @for (pair of [['P91','P92'],['P95','P96']]; track pair[0]) {
                      <div class="bk-pair">
                        @for (s of pair; track s) {
                          <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                        }
                      </div>
                    }
                  </div>
                  <!-- Col 3: R32 winners (right) -->
                  <div class="bk-col">
                    @for (pair of [['P76','P78'],['P79','P80'],['P86','P88'],['P85','P87']]; track pair[0]) {
                      <div class="bk-pair">
                        @for (s of pair; track s) {
                          <div class="bk-entry"><div class="bk-box" [class.bk-adv]="bkIsAdv(s)" [class.bk-elim]="bkIsElim(s)" (click)="bkAdvance(s)">{{bkWin(s)||s}}</div></div>
                        }
                      </div>
                    }
                  </div>
                  <!-- Col 4: R32 team names (right) -->
                  <div class="bk-col bk-teams-col">
                    @for (slot of ['P76','P78','P79','P80','P86','P88','P85','P87']; track slot) {
                      <div class="bk-r32e">
                        <div class="bk-r32m">
                          <div class="bk-team" [class.bk-w]="bkIsW(slot,bkGet(slot).homeTeam)" [class.bk-l]="bkIsL(slot,bkGet(slot).homeTeam)" (click)="bkClickTeam(slot,bkGet(slot).homeTeam)">{{bkGet(slot).homeTeam||'—'}}</div>
                          <div class="bk-team" [class.bk-w]="bkIsW(slot,bkGet(slot).awayTeam)" [class.bk-l]="bkIsL(slot,bkGet(slot).awayTeam)" (click)="bkClickTeam(slot,bkGet(slot).awayTeam)">{{bkGet(slot).awayTeam||'—'}}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div><!-- end bk-right -->

              </div><!-- end bk-wrap -->
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .hub { max-width: 1100px; margin: 0 auto; padding: 32px 24px; color: white; }

    .hub-header { margin-bottom: 32px; }
    .hub-title { font-size: 2.4rem; color: white; }
    .hub-sub { font-size: .9rem; color: rgba(255,255,255,.4); letter-spacing: .1em; text-transform: uppercase; margin-top: 4px; }

    .tabs { display: flex; gap: 4px; border-bottom: 2px solid rgba(255,255,255,.08); margin-bottom: 32px; flex-wrap: wrap; }
    .tab {
      background: none; border: none; color: rgba(255,255,255,.5);
      padding: 10px 20px; font-size: .95rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .06em; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: color .15s, border-color .15s;
      font-family: 'Barlow Condensed', sans-serif;
    }
    .tab:hover { color: white; }
    .tab.active { color: #C5E000; border-bottom-color: #C5E000; }

    .tab-content { min-height: 400px; }
    .loading { text-align: center; color: rgba(255,255,255,.45); padding: 60px 0; }
    .empty { text-align: center; color: rgba(255,255,255,.4); padding: 40px 0; }

    /* Group tables */
    .groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .group-table { background: #14141E; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; overflow: hidden; }
    .group-title { background: rgba(212,0,26,.12); padding: 10px 16px; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: #D4001A; border-bottom: 1px solid rgba(212,0,26,.2); }
    .standings-table { width: 100%; border-collapse: collapse; }
    .standings-table th { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.3); padding: 6px 8px; text-align: center; border-bottom: 1px solid rgba(255,255,255,.05); }
    .standings-table th.col-team { text-align: left; }
    .standings-table td { padding: 7px 8px; font-size: .82rem; border-bottom: 1px solid rgba(255,255,255,.04); }
    .standings-table tr:last-child td { border-bottom: none; }
    .standings-table tr.qualified td { background: rgba(197,224,0,.03); }
    .col-pos { width: 24px; text-align: center; color: rgba(255,255,255,.3); font-size: .78rem; }
    .col-num { text-align: center; width: 28px; color: rgba(255,255,255,.65); }
    .col-num.pts { font-weight: 700; color: white; }
    .col-grp { text-align: center; width: 32px; font-size: .78rem; color: rgba(255,255,255,.5); font-weight: 700; }
    .col-team { display: flex; align-items: center; gap: 7px; }
    .team-name { font-size: .82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
    .flag { width: 20px; height: 13px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
    .pos-gd { color: #4caf50 !important; }
    .neg-gd { color: #e53935 !important; }

    .third-section { margin-top: 36px; }
    .third-title { font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.7); margin-bottom: 6px; }
    .third-sub { font-size: .8rem; color: rgba(255,255,255,.35); margin-bottom: 14px; }
    .third-table { background: #14141E; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; overflow: hidden; }
    .third-table tr.third-qualifies td { background: rgba(197,224,0,.03); }

    /* Stage filter */
    .stage-filter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .stage-btn { padding: 6px 14px; background: #14141E; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; color: rgba(255,255,255,.5); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .15s; }
    .stage-btn:hover { border-color: rgba(255,255,255,.25); color: white; }
    .stage-btn.active { background: rgba(212,0,26,.15); border-color: rgba(212,0,26,.4); color: #ff5a6e; }

    /* Calendar */
    .cal-day { margin-bottom: 28px; }
    .cal-date-heading { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.35); margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,.06); }
    .cal-match { display: flex; align-items: center; gap: 12px; background: #14141E; border: 1px solid rgba(255,255,255,.06); border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; transition: border-color .15s; }
    .cal-match:hover { border-color: rgba(255,255,255,.12); }
    .cal-match.finished { border-color: rgba(255,255,255,.08); }
    .cal-match.live { border-color: rgba(212,0,26,.35); animation: livePulse 2s infinite; }
    @keyframes livePulse { 0%,100% { border-color: rgba(212,0,26,.35); } 50% { border-color: rgba(212,0,26,.6); } }
    .cal-time { min-width: 44px; font-size: .78rem; color: rgba(255,255,255,.4); display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #D4001A; animation: dot 1s infinite; flex-shrink: 0; }
    @keyframes dot { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
    .live-min { font-size: .75rem; color: #D4001A; font-weight: 700; }
    .cal-teams { display: flex; align-items: center; gap: 8px; flex: 1; }
    .cal-team { display: flex; align-items: center; gap: 6px; flex: 1; font-size: .85rem; }
    .cal-team.home { justify-content: flex-end; text-align: right; }
    .cal-team.away { justify-content: flex-start; }
    .cal-team .winner { font-weight: 700; color: #C5E000; }
    .cal-score { min-width: 48px; text-align: center; font-size: .9rem; font-weight: 700; color: white; flex-shrink: 0; }
    .cal-score .vs { color: rgba(255,255,255,.25); font-size: .78rem; }
    .cal-group { font-size: .65rem; color: rgba(255,255,255,.2); flex-shrink: 0; }

    /* Simulator */
    .sim-section { padding-top: 8px; }
    .sim-header { margin-bottom: 28px; }
    .sim-title { font-size: 1.4rem; font-weight: 700; }
    .sim-sub { font-size: .85rem; color: rgba(255,255,255,.4); margin-top: 6px; }
    .sim-step { margin-bottom: 36px; }
    .sim-step-label { font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: #C5E000; margin-bottom: 16px; border-bottom: 1px solid rgba(197,224,0,.15); padding-bottom: 8px; }
    .sim-groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .sim-group-card { background: #14141E; border: 1px solid rgba(255,255,255,.07); border-radius: 10px; padding: 12px; }
    .sim-group-name { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: #D4001A; margin-bottom: 10px; }
    .sim-team-slot { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .sim-pos-label { font-size: .7rem; color: rgba(255,255,255,.35); width: 16px; flex-shrink: 0; }
    .sim-select { flex: 1; background: #0A0A14; border: 1px solid rgba(255,255,255,.1); color: white; padding: 4px 6px; border-radius: 5px; font-size: .78rem; outline: none; min-width: 0; }
    .sim-select:focus { border-color: rgba(197,224,0,.4); }
    .sim-thirds-groups { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .sim-third-group-btn { padding: 7px 14px; background: #14141E; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; color: rgba(255,255,255,.55); font-size: .82rem; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .sim-third-group-btn:hover:not(:disabled) { border-color: rgba(197,224,0,.4); color: #C5E000; }
    .sim-third-group-btn.selected { background: rgba(197,224,0,.12); border-color: rgba(197,224,0,.5); color: #C5E000; }
    .sim-third-group-btn:disabled { opacity: .35; cursor: not-allowed; }
    .sim-third-btn-team { font-size: .68rem; font-weight: 400; color: rgba(255,255,255,.4); }
    .sim-third-group-btn.selected .sim-third-btn-team { color: rgba(197,224,0,.6); }
    .sim-thirds-assignments { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; margin-top: 12px; }
    .sim-third-assign-row { display: flex; align-items: center; gap: 10px; background: #14141E; border: 1px solid rgba(197,224,0,.12); border-radius: 7px; padding: 7px 12px; }
    .sim-third-slot { font-size: .72rem; font-weight: 800; color: #C5E000; min-width: 32px; }
    .sim-third-assign-team { font-size: .8rem; color: rgba(255,255,255,.7); }
    .sim-thirds-status { font-size: .82rem; color: rgba(255,255,255,.35); margin-top: 8px; }

    /* Bracket tree */
    .bk-wrap { display:flex; align-items:stretch; gap:8px; overflow-x:auto; padding:16px 8px; min-height:640px; background:#090912; border-radius:12px; border:1px solid rgba(255,255,255,.05); }
    .bk-half { display:flex; align-items:stretch; flex:1; gap:8px; min-width:0; }
    .bk-col { display:flex; flex-direction:column; flex:1; min-width:66px; max-width:100px; }
    .bk-teams-col { min-width:86px; max-width:108px; }
    .bk-sf-col { max-width:82px; }
    .bk-pair { flex:1; display:flex; flex-direction:column; position:relative; }
    .bk-entry { flex:1; display:flex; align-items:center; position:relative; padding:3px 0; }
    .bk-r32e { flex:1; display:flex; align-items:center; position:relative; padding:2px 0; }
    .bk-r32m { width:100%; display:flex; flex-direction:column; gap:2px; }
    .bk-box { width:100%; padding:5px 7px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:6px; font-size:.7rem; font-weight:600; color:rgba(255,255,255,.55); cursor:pointer; transition:all .15s; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; user-select:none; }
    .bk-box:hover { background:rgba(255,255,255,.1); color:white; }
    .bk-box.bk-adv { background:rgba(197,224,0,.13); border-color:rgba(197,224,0,.45); color:#C5E000; font-weight:700; }
    .bk-box.bk-elim { background:transparent; border-color:rgba(255,255,255,.04); color:rgba(255,255,255,.18); text-decoration:line-through; }
    .bk-sf-box { font-size:.75rem; font-weight:700; }
    .bk-team { padding:4px 5px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:4px; font-size:.63rem; font-weight:600; color:rgba(255,255,255,.55); cursor:pointer; transition:all .12s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; user-select:none; }
    .bk-team:hover { background:rgba(255,255,255,.09); color:white; }
    .bk-team.bk-w { background:rgba(197,224,0,.1); border-color:rgba(197,224,0,.3); color:#C5E000; }
    .bk-team.bk-l { color:rgba(255,255,255,.18); background:transparent; text-decoration:line-through; }
    /* Left connectors → */
    .bk-left .bk-pair::after { content:''; position:absolute; right:-8px; top:25%; height:50%; width:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    .bk-left .bk-entry::after { content:''; position:absolute; right:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    .bk-left .bk-r32e::after { content:''; position:absolute; right:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    /* Right connectors ← */
    .bk-right .bk-pair::before { content:''; position:absolute; left:-8px; top:25%; height:50%; width:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    .bk-right .bk-entry::before { content:''; position:absolute; left:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    .bk-right .bk-r32e::before { content:''; position:absolute; left:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.2); pointer-events:none; }
    /* Center */
    .bk-center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; min-width:144px; max-width:164px; padding:0 4px; }
    .bk-trophy-area { text-align:center; }
    .bk-trophy-icon { font-size:2.6rem; line-height:1; }
    .bk-champ-label { font-size:.58rem; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.3); margin-top:6px; }
    .bk-champ-name { font-size:.85rem; font-weight:800; color:#C5E000; margin-top:4px; }
    .bk-final-row { display:flex; align-items:center; gap:6px; width:100%; }
    .bk-final-sf { flex:1; padding:5px 6px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:6px; font-size:.68rem; font-weight:600; color:rgba(255,255,255,.5); cursor:pointer; transition:all .15s; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .bk-final-sf:hover { background:rgba(255,255,255,.1); color:white; }
    .bk-final-sf.bk-adv { background:rgba(197,224,0,.13); border-color:rgba(197,224,0,.45); color:#C5E000; }
    .bk-final-sf.bk-elim { color:rgba(255,255,255,.18); }
    .bk-final-vs { font-size:.56rem; font-weight:800; text-transform:uppercase; color:rgba(255,255,255,.22); text-align:center; white-space:nowrap; flex-shrink:0; }
    .bk-third-area { text-align:center; }
    .bk-third-lbl { font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.22); margin-bottom:5px; }
    .bk-third-row { display:flex; align-items:center; gap:4px; justify-content:center; font-size:.63rem; color:rgba(255,255,255,.38); }
    .bk-third-vs { font-size:.52rem; color:rgba(255,255,255,.18); }
    .bk-third-winner { font-size:.7rem; color:rgba(255,255,255,.5); margin-top:5px; }
  `]
})
export class WorldCupHub implements OnInit {
  private readonly api = inject(ApiService);

  readonly activeTab = signal<'grupos' | 'calendario' | 'bracket' | 'simulador'>('grupos');
  readonly fixture = signal<Match[]>([]);
  readonly loading = signal(true);
  readonly selectedStage = signal('Group Stage');

  readonly groupNames = GROUP_NAMES;

  // ---- Group standings ----
  readonly groupTables = computed(() => {
    const groupMatches = this.fixture().filter(m => m.stage === 'Group Stage');
    const tables: Record<string, Record<string, TeamStanding>> = {};

    const ensure = (g: string, name: string, flag: string) => {
      tables[g] ??= {};
      tables[g][name] ??= { name, flagUrl: flag, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, group: g };
    };

    for (const m of groupMatches) {
      const g = m.groupName ?? '?';
      ensure(g, m.homeTeam, m.homeFlagUrl ?? '');
      ensure(g, m.awayTeam, m.awayFlagUrl ?? '');

      if (m.status === 'Finished') {
        const home = tables[g][m.homeTeam];
        const away = tables[g][m.awayTeam];
        home.p++; away.p++;
        home.gf += m.homeGoals; home.ga += m.awayGoals;
        away.gf += m.awayGoals; away.ga += m.homeGoals;
        if (m.homeGoals > m.awayGoals) { home.w++; away.l++; home.pts += 3; }
        else if (m.homeGoals < m.awayGoals) { away.w++; home.l++; away.pts += 3; }
        else { home.d++; away.d++; home.pts++; away.pts++; }
      }
    }

    return Object.entries(tables)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, teamsMap]) => ({
        name,
        teams: Object.values(teamsMap).sort((a, b) =>
          b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
        )
      }));
  });

  readonly thirdPlaceStandings = computed((): TeamStanding[] => {
    const tables = this.groupTables();
    const thirds = tables.filter(g => g.teams.length >= 3).map(g => g.teams[2]);
    if (thirds.length === 0) return [];
    return [...thirds].sort((a, b) =>
      b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
    );
  });

  // ---- Calendar ----
  readonly availableStages = computed(() => {
    const inFixture = new Set(this.fixture().map(m => m.stage));
    return STAGE_ORDER.filter(s => inFixture.has(s));
  });

  readonly calendarByDate = computed(() => {
    const stage = this.selectedStage();
    const matches = this.fixture().filter(m => m.stage === stage);
    const groups: Record<string, Match[]> = {};
    for (const m of matches) {
      const key = this.toArgDateStr(m.kickoffUtc);
      (groups[key] ??= []).push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  });

  // ---- Simulator state ----
  readonly simPositions = signal<Record<string, string[]>>({});
  readonly simThirdGroups = signal<string[]>([]);

  readonly thirdSlotAssignments = computed((): Array<{ slot: string; group: string }> => {
    const selected = this.simThirdGroups();
    if (selected.length !== 8) return [];
    const key = [...selected].sort().join('');
    const slotNames = ['P74','P77','P79','P80','P81','P82','P85','P87'];
    const groups = THIRD_PLACE_LOOKUP[key];
    if (!groups) return slotNames.map(slot => ({ slot, group: '' }));
    return slotNames.map((slot, i) => ({ slot, group: groups[i] }));
  });
  readonly simWinners = signal<Record<string, string>>({});

  private readonly groupTeamsCache = computed(() => {
    const cache: Record<string, Array<{ name: string }>> = {};
    for (const m of this.fixture().filter(f => f.stage === 'Group Stage')) {
      const g = m.groupName ?? '?';
      cache[g] ??= [];
      if (!cache[g].some(t => t.name === m.homeTeam)) cache[g].push({ name: m.homeTeam });
      if (!cache[g].some(t => t.name === m.awayTeam)) cache[g].push({ name: m.awayTeam });
    }
    return cache;
  });

  getGroupTeamsForPos(group: string, pos: number): Array<{ name: string }> {
    const allTeams = this.groupTeamsCache()[group] ?? [];
    const selected = this.simPositions()[group] ?? [];
    return allTeams.filter(t => {
      const idx = selected.indexOf(t.name);
      return idx === -1 || idx === pos;
    });
  }

  getGroupTeams(group: string) {
    return this.groupTeamsCache()[group] ?? [];
  }

  getThirdTeamName(group: string): string {
    return this.simPositions()[group]?.[2] ?? '';
  }

  setSimPosition(group: string, pos: number, team: string) {
    this.simPositions.update(prev => {
      const arr = [...(prev[group] ?? ['','','',''])];
      arr[pos] = team;
      return { ...prev, [group]: arr };
    });
  }

  toggleThirdGroup(g: string) {
    this.simThirdGroups.update(prev => {
      if (prev.includes(g)) return prev.filter(x => x !== g);
      if (prev.length >= 8) return prev;
      return [...prev, g];
    });
  }

  readonly simR32 = computed((): SimMatch[] => {
    const pos = this.simPositions();
    const thirdSlots = this.thirdSlotAssignments();

    const get = (key: string): string => {
      if (key.startsWith('T')) {
        const slot = 'P' + key.slice(1);
        const group = thirdSlots.find(e => e.slot === slot)?.group;
        if (!group) return '';
        return pos[group]?.[2] ?? '';
      }
      const rank = key[0] === '1' ? 0 : 1;
      const group = key[1];
      return pos[group]?.[rank] ?? '';
    };

    return R32_RULES.map(rule => ({
      slot: rule.slot,
      homeTeam: get(rule.home),
      awayTeam: get(rule.away),
    }));
  });

  readonly bracketRounds = computed(() => {
    const w = this.simWinners();
    const r32 = this.simR32();

    const wOf = (slot: string): string => {
      const match = [...r32, ...this.r16Matches(w, r32), ...this.qfMatches(w, r32), ...this.sfMatches(w, r32)]
        .find(m => m.slot === slot);
      if (!match) return w[slot] ?? '';
      const winner = w[slot];
      if (winner === match.homeTeam || winner === match.awayTeam) return winner;
      return '';
    };

    const r16 = this.r16Matches(w, r32);
    const qf = this.qfMatches(w, r32);
    const sf = this.sfMatches(w, r32);

    const sf1 = sf[0];
    const sf2 = sf[1];
    const sf1Winner = this.validWinner(w, sf1);
    const sf2Winner = this.validWinner(w, sf2);
    const sf1Loser = sf1Winner && sf1 ? (sf1Winner === sf1.homeTeam ? sf1.awayTeam : sf1.homeTeam) : '';
    const sf2Loser = sf2Winner && sf2 ? (sf2Winner === sf2.homeTeam ? sf2.awayTeam : sf2.homeTeam) : '';

    const finalMatches: SimMatch[] = [
      { slot: 'P104', homeTeam: sf1Winner, awayTeam: sf2Winner },
      { slot: 'P103', homeTeam: sf1Loser,  awayTeam: sf2Loser },
    ];

    return [
      { name: 'Ronda de 32', key: 'r32', matches: r32 },
      { name: 'Ronda de 16', key: 'r16', matches: r16 },
      { name: 'Cuartos', key: 'qf', matches: qf },
      { name: 'Semifinal', key: 'sf', matches: sf },
      { name: 'Final / 3°', key: 'final', matches: finalMatches },
    ];
  });

  readonly bkAllMatches = computed((): Map<string, SimMatch> => {
    const w = this.simWinners();
    const r32 = this.simR32();
    const r16 = this.r16Matches(w, r32);
    const qf = this.qfMatches(w, r32);
    const sf = this.sfMatches(w, r32);
    const sf1 = sf[0]; const sf2 = sf[1];
    const sf1w = this.validWinner(w, sf1);
    const sf2w = this.validWinner(w, sf2);
    const sf1l = sf1w && sf1 ? (sf1w === sf1.homeTeam ? sf1.awayTeam : sf1.homeTeam) : '';
    const sf2l = sf2w && sf2 ? (sf2w === sf2.homeTeam ? sf2.awayTeam : sf2.homeTeam) : '';
    const all: SimMatch[] = [...r32, ...r16, ...qf, ...sf,
      { slot: 'P104', homeTeam: sf1w, awayTeam: sf2w },
      { slot: 'P103', homeTeam: sf1l, awayTeam: sf2l }];
    return new Map(all.map(m => [m.slot, m]));
  });

  bkGet(slot: string): SimMatch {
    return this.bkAllMatches().get(slot) ?? { slot, homeTeam: '', awayTeam: '' };
  }

  bkWin(slot: string): string {
    const m = this.bkGet(slot);
    return this.getWinner(slot, m.homeTeam, m.awayTeam);
  }

  bkAdvance(slot: string) {
    const to = BK_FEEDS_INTO[slot];
    const winner = this.bkWin(slot);
    if (!to || !winner) return;
    const m = this.bkGet(to);
    this.selectWinner(to, winner, winner === m.homeTeam ? m.awayTeam : m.homeTeam);
  }

  bkIsAdv(slot: string): boolean {
    const to = BK_FEEDS_INTO[slot];
    if (!to || !this.bkWin(slot)) return false;
    return this.bkWin(to) === this.bkWin(slot);
  }

  bkIsElim(slot: string): boolean {
    const to = BK_FEEDS_INTO[slot];
    if (!to || !this.bkWin(slot)) return false;
    const nw = this.bkWin(to);
    return !!nw && nw !== this.bkWin(slot);
  }

  bkClickTeam(matchSlot: string, team: string) {
    if (!team) return;
    const m = this.bkGet(matchSlot);
    const other = team === m.homeTeam ? m.awayTeam : m.homeTeam;
    this.selectWinner(matchSlot, team, other);
  }

  bkIsW(matchSlot: string, team: string): boolean { return !!team && this.bkWin(matchSlot) === team; }
  bkIsL(matchSlot: string, team: string): boolean {
    const w = this.bkWin(matchSlot);
    return !!w && !!team && w !== team;
  }

  private r16Matches(w: Record<string, string>, r32: SimMatch[]): SimMatch[] {
    const wOf = (slot: string) => this.validWinnerFromList(w, slot, r32) ?? '';
    return R16_PAIRINGS.map(p => ({
      slot: p.slot,
      homeTeam: wOf(p.r32a),
      awayTeam: wOf(p.r32b),
    }));
  }

  private qfMatches(w: Record<string, string>, r32: SimMatch[]): SimMatch[] {
    const r16 = this.r16Matches(w, r32);
    const wOf = (slot: string) => this.validWinnerFromList(w, slot, r16) ?? '';
    return [
      { slot: 'P97',  homeTeam: wOf('P89'), awayTeam: wOf('P90') },
      { slot: 'P98',  homeTeam: wOf('P93'), awayTeam: wOf('P94') },
      { slot: 'P99',  homeTeam: wOf('P91'), awayTeam: wOf('P92') },
      { slot: 'P100', homeTeam: wOf('P95'), awayTeam: wOf('P96') },
    ];
  }

  private sfMatches(w: Record<string, string>, r32: SimMatch[]): SimMatch[] {
    const qf = this.qfMatches(w, r32);
    const wOf = (slot: string) => this.validWinnerFromList(w, slot, qf) ?? '';
    return [
      { slot: 'P101', homeTeam: wOf('P97'),  awayTeam: wOf('P98') },
      { slot: 'P102', homeTeam: wOf('P99'),  awayTeam: wOf('P100') },
    ];
  }

  private validWinner(w: Record<string, string>, match: SimMatch | undefined): string {
    if (!match) return '';
    const winner = w[match.slot];
    if (winner === match.homeTeam || winner === match.awayTeam) return winner;
    return '';
  }

  private validWinnerFromList(w: Record<string, string>, slot: string, list: SimMatch[]): string {
    const match = list.find(m => m.slot === slot);
    return match ? this.validWinner(w, match) : '';
  }

  getWinner(slot: string, homeTeam: string, awayTeam: string): string {
    const w = this.simWinners()[slot];
    if (w === homeTeam || w === awayTeam) return w;
    return '';
  }

  selectWinner(slot: string, winner: string, loser: string) {
    this.simWinners.update(prev => {
      const current = prev[slot];
      if (current === winner) {
        const updated = { ...prev };
        delete updated[slot];
        return updated;
      }
      return { ...prev, [slot]: winner };
    });
  }

  ngOnInit() {
    this.api.getFixture().subscribe({
      next: matches => { this.fixture.set(matches); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private toArgDateStr(iso: string): string {
    const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }

  formatArgTime(iso: string): string {
    const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  formatDateKey(key: string): string {
    const [year, month, day] = key.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]} ${day} ${months[month - 1]} ${year}`;
  }
}
