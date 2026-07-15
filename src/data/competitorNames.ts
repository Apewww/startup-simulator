export const PREFIXES: string[] = [
  'Nex', 'Velt', 'Omni', 'Pulse', 'Zen',
  'Apex', 'Cort', 'Strat', 'Flux', 'Elev',
  'Prism', 'Titan', 'Vort', 'Bright', 'Nova',
  'Arca', 'Sprint', 'Dyna', 'Pivot', 'Radi',
  'Synth', 'Matri', 'Core', 'Quant', 'Astr',
  'Fusion', 'Orbit', 'Verti', 'Lumen', 'Cloud',
  'Alpha', 'Blue', 'Cyber', 'Deep', 'Echo',
  'Fast', 'Grid', 'Hyper', 'Iron', 'Jet',
  'Keen', 'Logic', 'Mega', 'Next', 'Open',
  'Poly', 'Quad', 'Rapid', 'Solar', 'Tera',
];

export const SUFFIXES: string[] = [
  'ara', 'rix', 'Core', 'Wave', 'Lab',
  'ify', 'AI', 'os', 'ion', 'ara',
  'IQ', 'Grid', 'exa', 'Path', 'Forge',
  'Tech', 'Soft', 'Net', 'X', 'Hub',
  'Mind', 'Bridge', 'Leap', 'Flow', 'Arc',
  'Lynk', 'Pulse', 'Nest', 'Edge', 'Dex',
  'Byte', 'Gate', 'Node', 'Sync', 'Dash',
  'Craft', 'Span', 'Nova', 'Hive', 'Vault',
];

let prefixIdx = 0;
let suffixIdx = 0;
let comboCounter = 0;

export function generateUniqueName(usedNames: Set<string>): string {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = PREFIXES[prefixIdx % PREFIXES.length];
    const s = SUFFIXES[suffixIdx % SUFFIXES.length];
    prefixIdx++;
    if (prefixIdx % PREFIXES.length === 0) suffixIdx++;

    const name = p + s;
    if (!usedNames.has(name)) return name;
  }

  comboCounter++;
  return `Startup${comboCounter}`;
}

export function resetNameGenerator(): void {
  prefixIdx = 0;
  suffixIdx = 0;
  comboCounter = 0;
}
