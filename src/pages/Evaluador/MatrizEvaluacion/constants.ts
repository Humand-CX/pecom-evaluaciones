import { type Dimension, type Person } from './types';

export const DIMENSIONS: Dimension[] = [
  {
    id: 'disciplina',
    name: 'Disciplina Operacional',
    subDimensions: [
      { id: 'seguridad', name: 'Compromiso con la Seguridad' },
      { id: 'peligros', name: 'Identificación de Peligros y Control de Riesgos' },
      { id: 'cultura', name: 'Cultura Segura' },
    ],
  },
  {
    id: 'conocimiento',
    name: 'Conocimiento Técnico',
    subDimensions: [
      { id: 'conocimiento-aplicacion', name: 'Conocimiento y aplicación' },
      { id: 'herramientas', name: 'Manejo de herramientas y equipos' },
    ],
  },
  {
    id: 'actitud',
    name: 'Actitud',
    subDimensions: [
      { id: 'responsabilidad', name: 'Responsabilidad y Compromiso' },
      { id: 'colaboracion', name: 'Colaboración y respeto interpersonal' },
      { id: 'proactividad', name: 'Proactividad y orientación a la mejora' },
    ],
  },
];

export const SUB_DIMENSIONS = DIMENSIONS.flatMap(d => d.subDimensions);

export const SCORE_LABELS: Record<number, string> = {
  1: 'Nocivo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Muy bueno',
};

export const MOCK_PEOPLE: Person[] = [
  { id: 'p1', name: 'Carlos Rodríguez', legajo: '12345' },
  { id: 'p2', name: 'María González', legajo: '12346' },
  { id: 'p3', name: 'Juan Pérez', legajo: '12347' },
  { id: 'p4', name: 'Ana Martínez', legajo: '12348' },
  { id: 'p5', name: 'Roberto Silva', legajo: '12349' },
];
