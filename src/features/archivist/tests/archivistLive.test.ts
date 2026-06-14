import { describe, it, expect } from 'vitest';
import { buildArchivistRuntimeSummary } from '../archivistLive';
import { ArchivistLiveContext } from '../archivist.types';
import { PlayerAccount } from '../../../types';

describe('buildArchivistRuntimeSummary', () => {
  it('should generate summary for empty data', () => {
    const context: ArchivistLiveContext = {
      events: [],
      missions: [],
      marketItems: [],
      documents: [],
      grimoireCategories: [],
      players: [],
      bestiary: [],
      flora: []
    };

    const summary = buildArchivistRuntimeSummary(context);

    expect(summary).toContain('Mercado cargado: 0 items.');
    expect(summary).toContain('Eventos activos: 0.');
    expect(summary).toContain('Misiones visibles: 0.');
    expect(summary).toContain('Bestiario: 0 entradas.');
    expect(summary).toContain('Flora: 0 entradas.');
    expect(summary).toContain('Magias: 0 estilos.');
    expect(summary).not.toContain('Items mas caros ahora:');
    expect(summary).not.toContain('Items mas baratos ahora:');
    expect(summary).not.toContain('Eventos activos por nombre:');
    expect(summary).not.toContain('Misiones abiertas por nombre:');
    expect(summary).not.toContain('Magias destacadas:');
    expect(summary).not.toContain('Documentos cargados:');
  });

  it('should generate summary for basic data', () => {
    const context: ArchivistLiveContext = {
      events: [{ id: '1', title: 'Event 1', status: 'active', description: '', requirements: '', rewards: '' } as any],
      missions: [{ id: '1', title: 'Mission 1', visible: true, status: 'active', description: '', instructions: '', rewardGold: 10, maxParticipants: 5, difficulty: 'D', type: 'combate' } as any],
      marketItems: [
        { id: '1', name: 'Item 1', price: 100, rarity: 'common', description: '', category: 'equipment', ability: '' } as any,
        { id: '2', name: 'Item 2', price: 200, rarity: 'rare', description: '', category: 'equipment', ability: '' } as any
      ],
      documents: [{ id: '1', title: 'Doc 1', type: 'lore', category: '', tags: [], source: '', content: '', summary: '', visible: true } as any],
      grimoireCategories: [
        { id: '1', title: 'Cat 1', styles: [{ id: '1', title: 'Style 1', description: '', levels: {} }] }
      ],
      players: [
        { id: '1', username: 'Player 1', gold: 50, isAdmin: false, isBanned: false, createdAt: '', stats: { health: 100, mana: 50, attack: 10, defense: 5 } } as any,
        { id: '2', username: 'Player 2', gold: 500, isAdmin: true, isBanned: false, createdAt: '', stats: { health: 200, mana: 100, attack: 20, defense: 10 } } as any
      ],
      bestiary: [{ id: '1', name: 'Beast 1', category: '', type: '', generalData: '', threatLevel: '', domestication: '', usage: '', originPlace: '', foundAt: '', description: '', ability: '', rarity: 'common', imageUrl: '' } as any],
      flora: [{ id: '1', name: 'Plant 1', category: '', type: '', generalData: '', properties: '', usage: '', originPlace: '', foundAt: '', description: '', rarity: 'common', imageUrl: '' } as any]
    };

    const summary = buildArchivistRuntimeSummary(context);

    expect(summary).toContain('Mercado cargado: 2 items.');
    expect(summary).toContain('Eventos activos: 1.');
    expect(summary).toContain('Misiones visibles: 1.');
    expect(summary).toContain('Bestiario: 1 entradas.');
    expect(summary).toContain('Flora: 1 entradas.');
    expect(summary).toContain('Magias: 1 estilos.');
    expect(summary).toContain('Items mas caros ahora: Item 2 (200 oro, rare) | Item 1 (100 oro, common)');
    expect(summary).toContain('Items mas baratos ahora: Item 1 (100 oro) | Item 2 (200 oro)');
    expect(summary).toContain('Eventos activos por nombre: Event 1');
    expect(summary).toContain('Misiones abiertas por nombre: Mission 1');
    expect(summary).toContain('Magias destacadas: Style 1 [Cat 1]');
    expect(summary).toContain('Documentos cargados: Doc 1');
    expect(summary).not.toContain('Ranking de mayores fortunas');
  });

  it('should include admin data when requested', () => {
    // We create many players to test the poorestPlayers logic which requires players.length > richestPlayers.length (15)
    const players: any[] = [];
    for (let i = 0; i < 20; i++) {
      players.push({
        id: `p${i}`, username: `Player ${i}`, gold: i * 10, isAdmin: false, isBanned: false, createdAt: ''
      });
    }

    const context: ArchivistLiveContext = {
      events: [],
      missions: [],
      marketItems: [],
      documents: [],
      grimoireCategories: [],
      players: players as PlayerAccount[],
      bestiary: [],
      flora: []
    };

    const summary = buildArchivistRuntimeSummary(context, { includeAdminData: true });

    expect(summary).toContain('Ranking de mayores fortunas (Staff): Player 19: 190 oro');
    expect(summary).toContain('Ranking de menores fortunas (Staff): Player 0: 0 oro');
    expect(summary).toContain('Total de jugadores en el reino: 20.');
    expect(summary).toContain('Lista de jugadores (muestra de 50): Player 0 | Player 1 | Player 2');
  });

  it('should not include closed missions or hidden missions', () => {
     const context: ArchivistLiveContext = {
      events: [],
      missions: [
        { id: '1', title: 'Open Public', visible: true, status: 'active', description: '', instructions: '', rewardGold: 10, maxParticipants: 5, difficulty: 'D', type: 'combate' } as any,
        { id: '2', title: 'Closed Public', visible: true, status: 'closed', description: '', instructions: '', rewardGold: 10, maxParticipants: 5, difficulty: 'D', type: 'combate' } as any,
        { id: '3', title: 'Open Hidden', visible: false, status: 'active', description: '', instructions: '', rewardGold: 10, maxParticipants: 5, difficulty: 'D', type: 'combate' } as any,
      ],
      marketItems: [],
      documents: [],
      grimoireCategories: [],
      players: [],
      bestiary: [],
      flora: []
    };

    const summary = buildArchivistRuntimeSummary(context);
    expect(summary).toContain('Misiones visibles: 2.');
    expect(summary).toContain('Misiones abiertas por nombre: Open Public');
    expect(summary).not.toContain('Closed Public');
    expect(summary).not.toContain('Open Hidden');
  });
});
