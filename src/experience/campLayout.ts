import { checkpoints } from '../data/expedition'

export type CampSetup = { id: string; route: number; tents: number; tentDepth: number; tentColor: string; prayer: boolean; seed: number }

// Terrain shelves and scene dressing share the same checkpoint coordinates.
export const arrivalCamps = [
  { id: 'about', tents: 1, tentDepth: 13, tentColor: '#b5a07a', prayer: false, seed: 5, forward: 8, right: 4.1, height: 3.05, width: 1.1, clothHeight: .72, color: '#bf8955', taper: .2, cache: false },
  { id: 'camp-one', tents: 2, tentDepth: 11, tentColor: '#b88a50', prayer: true, seed: 11, forward: 9, right: 4.3, height: 3.2, width: .86, clothHeight: .92, color: '#b16b52', taper: .12, cache: false },
  { id: 'camp-two', tents: 1, tentDepth: 15, tentColor: '#a58e65', prayer: false, seed: 22, forward: 7.5, right: 4.1, height: 2.9, width: 1.05, clothHeight: .63, color: '#bf965c', taper: .55, cache: true },
  { id: 'high-camp', tents: 0, tentDepth: 14, tentColor: '#a58e65', prayer: false, seed: 33, forward: 6.2, right: 3.2, height: 4.1, width: .7, clothHeight: .44, color: '#af7255', taper: .45, cache: false },
].map(camp => ({ ...camp, route: checkpoints.find(checkpoint => checkpoint.id === camp.id)!.route }))
