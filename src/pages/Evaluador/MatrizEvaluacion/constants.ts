import { type Segment } from '../../../types/segment';

import { type Dimension, type Person } from './types';

export const DIMENSIONS: Dimension[] = [
  {
    id: 'disciplina',
    name: 'Disciplina Operacional',
    subDimensions: [
      {
        id: 'seguridad',
        name: 'Compromiso con la Seguridad',
        description:
          'Capacidad de demostrar compromiso genuino con la seguridad en todas las actividades. Evalúa el cumplimiento de normas de seguridad y el uso de equipos de protección.',
      },
      {
        id: 'peligros',
        name: 'Identificación de Peligros y Control de Riesgos',
        description:
          'Habilidad para identificar peligros potenciales y tomar acciones preventivas. Evalúa la proactividad en la detección de riesgos y la propuesta de medidas de control.',
      },
      {
        id: 'cultura',
        name: 'Cultura Segura',
        description:
          'Contribución a la construcción de una cultura de seguridad en el equipo y la organización. Evalúa la promoción de prácticas seguras entre colegas.',
      },
    ],
  },
  {
    id: 'conocimiento',
    name: 'Conocimiento Técnico',
    subDimensions: [
      {
        id: 'conocimiento-aplicacion',
        name: 'Conocimiento y aplicación',
        description:
          'Dominio de los conocimientos técnicos requeridos para el rol y su aplicación práctica en el desempeño de funciones. Evalúa la actualización y profundidad del conocimiento.',
      },
      {
        id: 'herramientas',
        name: 'Manejo de herramientas y equipos',
        description:
          'Competencia en el uso correcto y eficiente de herramientas y equipos necesarios para el trabajo. Evalúa el dominio operativo de los sistemas.',
      },
    ],
  },
  {
    id: 'actitud',
    name: 'Actitud',
    subDimensions: [
      {
        id: 'responsabilidad',
        name: 'Responsabilidad y Compromiso',
        description:
          'Capacidad de asumir responsabilidades y cumplir con compromisos adquiridos. Evalúa la puntualidad, dedicación y cumplimiento de objetivos.',
      },
      {
        id: 'colaboracion',
        name: 'Colaboración y respeto interpersonal',
        description:
          'Disposición a trabajar en equipo y el respeto hacia los demás. Evalúa la comunicación efectiva, empatía y apoyo a colegas.',
      },
      {
        id: 'proactividad',
        name: 'Proactividad y orientación a la mejora',
        description:
          'Iniciativa para mejorar procesos y buscar soluciones innovadoras. Evalúa la capacidad de anticiparse a problemas y proponer mejoras continuas.',
      },
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
  {
    id: 'p1',
    name: 'Carlos Rodríguez',
    legajo: '12345',
    proyecto: 'LAJE',
    area: 'Operaciones',
    departamento: 'Mantenimiento',
    provincia: 'Buenos Aires',
  },
  {
    id: 'p2',
    name: 'María González',
    legajo: '12346',
    proyecto: 'HUB NORTE',
    area: 'Recursos Humanos',
    departamento: 'Selección',
    provincia: 'Córdoba',
  },
  {
    id: 'p3',
    name: 'Juan Pérez',
    legajo: '12347',
    proyecto: 'LAJE',
    area: 'Operaciones',
    departamento: 'Producción',
    provincia: 'Santa Fe',
  },
  {
    id: 'p4',
    name: 'Ana Martínez',
    legajo: '12348',
    proyecto: 'CHIVILCOY',
    area: 'Seguridad',
    departamento: 'HSE',
    provincia: 'Buenos Aires',
  },
  {
    id: 'p5',
    name: 'Roberto Silva',
    legajo: '12349',
    proyecto: 'HUB NORTE',
    area: 'Operaciones',
    departamento: 'Logística',
    provincia: 'Mendoza',
  },
];

export const MOCK_SEGMENTS: Segment[] = [
  { id: 'seg-gerentes', name: 'Gerentes', personIds: ['p1', 'p2'] },
  { id: 'seg-operarios', name: 'Operarios', personIds: ['p3', 'p4', 'p5'] },
  { id: 'seg-rh', name: 'RH', personIds: ['p2'] },
];

export const MOCK_EVALUATORS = [
  { id: 'eval-001', name: 'Luis Martínez' },
  { id: 'eval-002', name: 'Sandra López' },
  { id: 'eval-003', name: 'Diego Torres' },
  { id: 'eval-004', name: 'Patricia Ruiz' },
];
