/**
 * Teste simples da função generateCheckInReport
 * Run com: npx ts-node lib/report/generateCheckInReport.test.ts
 */

import { generateCheckInReport } from './generateCheckInReport';

// Mock data
const mockGuests = [
  {
    id: '1',
    fullName: 'Ana Costa',
    category: 'convidado',
    tableNumber: '1',
    checkedInAt: new Date('2024-01-30T14:15:00').toISOString(),
    undoAt: undefined,
  },
  {
    id: '2',
    fullName: 'Carlos Mendes',
    category: 'convidado',
    tableNumber: '2',
    checkedInAt: new Date('2024-01-30T14:20:00').toISOString(),
    undoAt: undefined,
  },
  {
    id: '3',
    fullName: 'Fernanda Rocha',
    category: 'convidado',
    tableNumber: '3',
    checkedInAt: new Date('2024-01-30T14:15:00').toISOString(),
    undoAt: new Date('2024-01-30T14:30:00').toISOString(), // Desfeito
  },
  {
    id: '4',
    fullName: 'João Silva',
    category: 'convidado',
    tableNumber: '4',
    checkedInAt: undefined, // Nunca entrou
    undoAt: undefined,
  },
  {
    id: '5',
    fullName: 'Julia Silva',
    category: 'convidado',
    tableNumber: '5',
    checkedInAt: new Date('2024-01-30T15:10:00').toISOString(),
    undoAt: undefined,
  },
  {
    id: '6',
    fullName: 'Lucas Costa',
    category: 'convidado',
    tableNumber: '6',
    checkedInAt: new Date('2024-01-30T15:15:00').toISOString(),
    undoAt: undefined,
  },
];

const report = generateCheckInReport(mockGuests);

console.log('📊 CHECK-IN REPORT TEST');
console.log('=======================\n');

console.log('✅ SUMMARY:');
console.log(`  Total: ${report.summary.total}`);
console.log(`  Entraram: ${report.summary.checkedIn}`);
console.log(`  Não entraram: ${report.summary.notCheckedIn}`);
console.log(`  Desfeitos: ${report.summary.undone}`);

console.log('\n📈 TIMELINE (by hour):');
report.timeline.forEach(({ hour, count }) => {
  console.log(`  ${hour}: ${count} check-ins`);
});

console.log('\n🧪 ASSERTIONS:');
console.assert(
  report.summary.total === 6,
  `❌ Total deve ser 6, foi ${report.summary.total}`
);
console.assert(
  report.summary.checkedIn === 4,
  `❌ CheckedIn deve ser 4, foi ${report.summary.checkedIn}`
);
console.assert(
  report.summary.notCheckedIn === 1,
  `❌ NotCheckedIn deve ser 1, foi ${report.summary.notCheckedIn}`
);
console.assert(
  report.summary.undone === 1,
  `❌ Undone deve ser 1, foi ${report.summary.undone}`
);
console.assert(
  report.timeline.length === 2,
  `❌ Timeline deve ter 2 horas, teve ${report.timeline.length}`
);

console.log('\n✅ Todos os testes passaram!');
