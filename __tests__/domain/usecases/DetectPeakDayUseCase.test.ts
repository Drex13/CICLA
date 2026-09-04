// __tests__/domain/usecases/DetectPeakDayUseCase.test.ts

import { DetectPeakDayUseCase } from '@domain/usecases/DetectPeakDayUseCase';
import { buildTestCycleDays } from '../../helpers/factories';

const useCase = new DetectPeakDayUseCase();

describe('DetectPeakDayUseCase', () => {
  it('STM-005: egg_white → egg_white → sticky ⇒ Peak Day = último egg_white', () => {
    const days = buildTestCycleDays([
      { dayNumber: 10, mucusType: 'egg_white' },
      { dayNumber: 11, mucusType: 'egg_white' },
      { dayNumber: 12, mucusType: 'sticky' },
    ]);
    const result = useCase.execute({ daysInCycle: days });
    expect(result.peakDayNumber).toBe(11);
    expect(result.source).toBe('mucus');
  });

  it('la marca manual isPeakDay tiene prioridad sobre la detección por moco', () => {
    const days = buildTestCycleDays([
      { dayNumber: 10, mucusType: 'egg_white' },
      { dayNumber: 11, mucusType: 'egg_white', isPeakDay: true },
      { dayNumber: 12, mucusType: 'watery' }, // no hubo descenso todavía
      { dayNumber: 13, mucusType: 'watery' },
    ]);
    const result = useCase.execute({ daysInCycle: days });
    expect(result.peakDayNumber).toBe(11);
    expect(result.source).toBe('manual');
  });

  it('watery también cuenta como moco de pico', () => {
    const days = buildTestCycleDays([
      { dayNumber: 9, mucusType: 'creamy' },
      { dayNumber: 10, mucusType: 'watery' },
      { dayNumber: 11, mucusType: 'creamy' },
    ]);
    const result = useCase.execute({ daysInCycle: days });
    expect(result.peakDayNumber).toBe(10);
  });

  it('si el último día sigue en moco de pico, aún no hay Peak confirmable', () => {
    const days = buildTestCycleDays([
      { dayNumber: 10, mucusType: 'watery' },
      { dayNumber: 11, mucusType: 'egg_white' },
    ]);
    const result = useCase.execute({ daysInCycle: days });
    expect(result.peakDayNumber).toBeNull();
    expect(result.source).toBeNull();
  });

  it('sin moco de pico en el ciclo ⇒ null', () => {
    const days = buildTestCycleDays([
      { dayNumber: 1, mucusType: 'none' },
      { dayNumber: 2, mucusType: 'sticky' },
      { dayNumber: 3, mucusType: 'creamy' },
      { dayNumber: 4, mucusType: 'sticky' },
    ]);
    const result = useCase.execute({ daysInCycle: days });
    expect(result.peakDayNumber).toBeNull();
  });
});
